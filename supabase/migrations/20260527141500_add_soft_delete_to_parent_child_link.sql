-- Migration: Add Soft Delete to Parent Child Link & Enable Parent Edits on Child Profiles
-- Date: 2026-05-27 UTC

BEGIN;

-- 1. Add is_active column to public.parent_child_link if not already present
ALTER TABLE public.parent_child_link
ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;

-- 2. Backfill existing rows to ensure they are active
UPDATE public.parent_child_link
SET is_active = true
WHERE is_active IS FALSE OR is_active IS NULL;

-- 3. Ensure UPDATE RLS policy on public.parent_child_link exists
DROP POLICY IF EXISTS parent_child_update_by_parent ON public.parent_child_link;
CREATE POLICY parent_child_update_by_parent
  ON public.parent_child_link
  FOR UPDATE
  TO authenticated
  USING (
    parent_user_id = auth.uid()
    AND EXISTS (SELECT 1 FROM public.profile p WHERE p.user_id = auth.uid() AND p.role = 'parent')
  )
  WITH CHECK (
    parent_user_id = auth.uid()
    AND EXISTS (SELECT 1 FROM public.profile c WHERE c.user_id = child_user_id AND c.role = 'kid')
  );

-- 4. Enable parent to UPDATE a child's profile only if there is an active approved link between them
DROP POLICY IF EXISTS profile_update_by_parent ON public.profile;
CREATE POLICY profile_update_by_parent
  ON public.profile
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.parent_child_link pcl
      WHERE pcl.parent_user_id = auth.uid()
        AND pcl.child_user_id = public.profile.user_id
        AND pcl.is_active IS TRUE
        AND pcl.is_approved IS TRUE
        AND pcl.deleted_at IS NULL
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.parent_child_link pcl
      WHERE pcl.parent_user_id = auth.uid()
        AND pcl.child_user_id = public.profile.user_id
        AND pcl.is_active IS TRUE
        AND pcl.is_approved IS TRUE
        AND pcl.deleted_at IS NULL
    )
  );

COMMIT;

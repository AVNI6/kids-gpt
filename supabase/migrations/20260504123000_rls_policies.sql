-- RLS migration: enable Row Level Security and add policies for profile, parent_child_link, and kid_permissions
-- Run this as a new migration in Supabase (or paste into the SQL editor).

BEGIN;

-- 1) Profiles
ALTER TABLE IF EXISTS public.profile ENABLE ROW LEVEL SECURITY;

-- Remove existing policies if present (idempotent for re-applying)
DROP POLICY IF EXISTS profile_select_own ON public.profile;
DROP POLICY IF EXISTS profile_update_own ON public.profile;
DROP POLICY IF EXISTS profile_select_by_parent ON public.profile;

-- Owners can SELECT their own profile
CREATE POLICY profile_select_own
  ON public.profile
  FOR SELECT
  USING (auth.uid() = user_id);

-- Owners can UPDATE their own profile
CREATE POLICY profile_update_own
  ON public.profile
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Parents can SELECT their linked kids' profiles (requires approved link)
CREATE POLICY profile_select_by_parent
  ON public.profile
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.parent_child_link pcl
      WHERE pcl.parent_user_id = auth.uid()
        AND pcl.child_user_id = public.profile.user_id
        AND pcl.is_approved IS TRUE
        AND pcl.deleted_at IS NULL
    )
  );

-- 2) parent_child_link
ALTER TABLE IF EXISTS public.parent_child_link ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS parent_child_select_self ON public.parent_child_link;
DROP POLICY IF EXISTS parent_child_insert_by_parent ON public.parent_child_link;
DROP POLICY IF EXISTS parent_child_update_by_parent ON public.parent_child_link;

-- Users can SELECT links where they are parent or child
CREATE POLICY parent_child_select_self
  ON public.parent_child_link
  FOR SELECT
  USING (parent_user_id = auth.uid() OR child_user_id = auth.uid());

-- Only parents may INSERT links and parent_user_id must be the authenticated user; child must be a kid
CREATE POLICY parent_child_insert_by_parent
  ON public.parent_child_link
  FOR INSERT
  WITH CHECK (
    parent_user_id = auth.uid()
    AND EXISTS (SELECT 1 FROM public.profile p WHERE p.user_id = auth.uid() AND p.role = 'parent')
    AND EXISTS (SELECT 1 FROM public.profile c WHERE c.user_id = child_user_id AND c.role = 'kid')
  );

-- Only parents may UPDATE links where they are the parent_user_id
CREATE POLICY parent_child_update_by_parent
  ON public.parent_child_link
  FOR UPDATE
  USING (
    parent_user_id = auth.uid()
    AND EXISTS (SELECT 1 FROM public.profile p WHERE p.user_id = auth.uid() AND p.role = 'parent')
  )
  WITH CHECK (
    parent_user_id = auth.uid()
    AND EXISTS (SELECT 1 FROM public.profile c WHERE c.user_id = child_user_id AND c.role = 'kid')
  );

-- 3) kid_permissions
ALTER TABLE IF EXISTS public.kid_permissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS kid_permissions_select_own_or_parent ON public.kid_permissions;
DROP POLICY IF EXISTS kid_permissions_insert_by_parent ON public.kid_permissions;
DROP POLICY IF EXISTS kid_permissions_update_by_parent ON public.kid_permissions;

-- Kids can SELECT their own permissions; parents can SELECT permissions for their linked kids
CREATE POLICY kid_permissions_select_own_or_parent
  ON public.kid_permissions
  FOR SELECT
  USING (
    kid_user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.parent_child_link pcl
      WHERE pcl.parent_user_id = auth.uid()
        AND pcl.child_user_id = public.kid_permissions.kid_user_id
        AND pcl.is_approved IS TRUE
        AND pcl.deleted_at IS NULL
    )
  );

-- Only parents may INSERT permissions for kids they are linked to
CREATE POLICY kid_permissions_insert_by_parent
  ON public.kid_permissions
  FOR INSERT
  WITH CHECK (
    granted_by_user_id = auth.uid()
    AND EXISTS (SELECT 1 FROM public.profile p WHERE p.user_id = auth.uid() AND p.role = 'parent')
    AND EXISTS (
      SELECT 1 FROM public.parent_child_link pcl
      WHERE pcl.parent_user_id = auth.uid()
        AND pcl.child_user_id = kid_user_id
        AND pcl.is_approved IS TRUE
        AND pcl.deleted_at IS NULL
    )
  );

-- Only the granting parent may UPDATE the permission rows they created, and they must still be the grantor
CREATE POLICY kid_permissions_update_by_parent
  ON public.kid_permissions
  FOR UPDATE
  USING (
    granted_by_user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.parent_child_link pcl
      WHERE pcl.parent_user_id = auth.uid()
        AND pcl.child_user_id = public.kid_permissions.kid_user_id
        AND pcl.is_approved IS TRUE
        AND pcl.deleted_at IS NULL
    )
  )
  WITH CHECK (
    granted_by_user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.parent_child_link pcl
      WHERE pcl.parent_user_id = auth.uid()
        AND pcl.child_user_id = kid_user_id
        AND pcl.is_approved IS TRUE
        AND pcl.deleted_at IS NULL
    )
  );

COMMIT;

-- Verification helpers (run manually in SQL editor):
-- SELECT set_config('jwt.claims.sub', 'PARENT_UUID', true);
-- SELECT set_config('jwt.claims.sub', 'CHILD_UUID', true);

-- As parent: list linked kids' profiles
-- SELECT * FROM public.profile p WHERE EXISTS (SELECT 1 FROM public.parent_child_link pcl WHERE pcl.parent_user_id = auth.uid() AND pcl.child_user_id = p.user_id AND pcl.is_approved IS TRUE);

-- As kid: read own permissions
-- SELECT * FROM public.kid_permissions WHERE kid_user_id = auth.uid();

-- As parent: insert a permission for linked kid (should succeed)
-- INSERT INTO public.kid_permissions (default_id, kid_user_id, granted_by_user_id, is_allowed) VALUES (NULL, 'CHILD_UUID', auth.uid(), true);

-- As child: attempt to insert a permission (should be denied)
-- INSERT INTO public.kid_permissions (default_id, kid_user_id, granted_by_user_id, is_allowed) VALUES (NULL, auth.uid(), auth.uid(), true);

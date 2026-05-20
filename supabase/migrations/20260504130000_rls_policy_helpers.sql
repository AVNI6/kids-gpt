-- RLS helper migration: allow policy checks to inspect profile roles without being blocked by profile RLS

BEGIN;

CREATE OR REPLACE FUNCTION public.has_profile_role(target_user_id uuid, target_role public.user_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profile p
    WHERE p.user_id = target_user_id
      AND p.role = target_role
      AND p.deleted_at IS NULL
  );
$$;

COMMENT ON FUNCTION public.has_profile_role(uuid, public.user_role)
  IS 'Security-definer helper for RLS policies that need to verify a user profile role without being blocked by profile RLS.';

DROP POLICY IF EXISTS parent_child_insert_by_parent ON public.parent_child_link;
DROP POLICY IF EXISTS parent_child_update_by_parent ON public.parent_child_link;

CREATE POLICY parent_child_insert_by_parent
  ON public.parent_child_link
  FOR INSERT
  WITH CHECK (
    parent_user_id = auth.uid()
    AND public.has_profile_role(auth.uid(), 'parent')
    AND public.has_profile_role(child_user_id, 'kid')
  );

CREATE POLICY parent_child_update_by_parent
  ON public.parent_child_link
  FOR UPDATE
  USING (
    parent_user_id = auth.uid()
    AND public.has_profile_role(auth.uid(), 'parent')
  )
  WITH CHECK (
    parent_user_id = auth.uid()
    AND public.has_profile_role(child_user_id, 'kid')
  );

COMMIT;

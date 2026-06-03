-- Migration: Fix Classroom Join and Member SELECT policy
-- Date: 2026-06-03 11:00:00 UTC

BEGIN;

-- Helper to check if a user is a member (PENDING or APPROVED) of a classroom (bypasses RLS)
CREATE OR REPLACE FUNCTION public.is_classroom_member(p_classroom_id uuid, p_user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.classroom_members
    WHERE classroom_id = p_classroom_id
      AND student_user_id = p_user_id
      AND status IN ('PENDING', 'APPROVED')
  );
$$;

-- Security definer RPC to securely check class code and return basic classroom info without general select access
CREATE OR REPLACE FUNCTION public.get_classroom_by_code(p_code varchar)
RETURNS TABLE (
  id uuid,
  name varchar,
  teacher_user_id uuid
)
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT c.id, c.name, c.teacher_user_id
  FROM public.classrooms c
  WHERE upper(trim(c.class_code)) = upper(trim(p_code))
    AND c.is_active = true
    AND c.deleted_at IS NULL;
END;
$$;

-- Recreate classrooms SELECT policy to allow both approved and pending members
DROP POLICY IF EXISTS classrooms_select ON public.classrooms;
CREATE POLICY classrooms_select ON public.classrooms
  FOR SELECT
  TO authenticated
  USING (
    teacher_user_id = (SELECT auth.uid())
    OR public.is_classroom_member(id, (SELECT auth.uid()))
  );

COMMIT;

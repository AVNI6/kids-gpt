-- Migration: Fix RLS Infinite Recursion on Classrooms and Members
-- Date: 2026-06-03 10:00:00 UTC

BEGIN;

-- =========================================================================
-- 1. SECURITY DEFINER HELPER FUNCTIONS
-- =========================================================================

-- Checks if a user is the teacher of a classroom (bypasses RLS)
CREATE OR REPLACE FUNCTION public.is_classroom_teacher(p_classroom_id uuid, p_user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.classrooms
    WHERE id = p_classroom_id
      AND teacher_user_id = p_user_id
      AND deleted_at IS NULL
  );
$$;

-- Checks if a user is an approved student of a classroom (bypasses RLS)
CREATE OR REPLACE FUNCTION public.is_classroom_student(p_classroom_id uuid, p_user_id uuid)
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
      AND status = 'APPROVED'
  );
$$;

-- Checks if a student is approved in any classroom owned by a teacher (bypasses RLS)
CREATE OR REPLACE FUNCTION public.is_approved_classroom_student_of_teacher(p_student_id uuid, p_teacher_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.classroom_members cm
    JOIN public.classrooms c ON cm.classroom_id = c.id
    WHERE c.teacher_user_id = p_teacher_id
      AND cm.student_user_id = p_student_id
      AND cm.status = 'APPROVED'
      AND c.deleted_at IS NULL
  );
$$;

-- =========================================================================
-- 2. RE-CREATE RLS POLICIES WITH SECURITY DEFINER HELPERS
-- =========================================================================

-- Recreate classrooms SELECT policy
DROP POLICY IF EXISTS classrooms_select ON public.classrooms;
CREATE POLICY classrooms_select ON public.classrooms
  FOR SELECT
  TO authenticated
  USING (
    teacher_user_id = (SELECT auth.uid())
    OR public.is_classroom_student(id, (SELECT auth.uid()))
  );

-- Recreate classroom_members SELECT policy
DROP POLICY IF EXISTS members_select ON public.classroom_members;
CREATE POLICY members_select ON public.classroom_members
  FOR SELECT
  TO authenticated
  USING (
    student_user_id = (SELECT auth.uid())
    OR public.is_classroom_teacher(classroom_id, (SELECT auth.uid()))
  );

-- Recreate profile_select_by_classroom_teacher policy
DROP POLICY IF EXISTS profile_select_by_classroom_teacher ON public.profile;
CREATE POLICY profile_select_by_classroom_teacher ON public.profile
  FOR SELECT
  TO authenticated
  USING (
    public.is_approved_classroom_student_of_teacher(user_id, (SELECT auth.uid()))
  );

COMMIT;

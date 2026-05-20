-- Migration: Enable rewards RLS, add policies, and optimize RLS policies with (SELECT auth.uid()) subqueries
-- Date: 2026-05-20 17:30:00 UTC

BEGIN;

-- =========================================================
-- 1. REWARDS TABLE RLS
-- =========================================================

-- Enable RLS on rewards
ALTER TABLE public.rewards ENABLE ROW LEVEL SECURITY;

-- Drop existing rewards policies to ensure clean creation
DROP POLICY IF EXISTS rewards_select_own ON public.rewards;
DROP POLICY IF EXISTS rewards_insert_own ON public.rewards;
DROP POLICY IF EXISTS rewards_select_by_parent ON public.rewards;
DROP POLICY IF EXISTS rewards_select_by_teacher ON public.rewards;

-- Policy: Authenticated users can SELECT their own rewards
CREATE POLICY rewards_select_own
  ON public.rewards
  FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

-- Policy: Authenticated users can INSERT their own rewards
CREATE POLICY rewards_insert_own
  ON public.rewards
  FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);

-- Policy: Parents can SELECT rewards of their linked children
CREATE POLICY rewards_select_by_parent
  ON public.rewards
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.parent_child_link pcl
      WHERE pcl.parent_user_id = (SELECT auth.uid())
        AND pcl.child_user_id = public.rewards.user_id
        AND pcl.is_approved IS TRUE
        AND pcl.deleted_at IS NULL
    )
  );

-- Policy: Teachers can SELECT rewards of their linked students
CREATE POLICY rewards_select_by_teacher
  ON public.rewards
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.teacher_student_links tsl
      WHERE tsl.teacher_user_id = (SELECT auth.uid())
        AND tsl.student_user_id = public.rewards.user_id
    )
  );


-- =========================================================
-- 2. PROFILE TABLE RLS OPTIMIZATION
-- =========================================================

-- Drop legacy policies
DROP POLICY IF EXISTS profile_select_own ON public.profile;
DROP POLICY IF EXISTS profile_update_own ON public.profile;
DROP POLICY IF EXISTS profile_select_by_parent ON public.profile;
DROP POLICY IF EXISTS profile_select_by_teacher ON public.profile;

-- Policy: SELECT own profile (optimized)
CREATE POLICY profile_select_own
  ON public.profile
  FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

-- Policy: UPDATE own profile (optimized)
CREATE POLICY profile_update_own
  ON public.profile
  FOR UPDATE
  TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

-- Policy: Parents can SELECT linked kids' profiles (optimized)
CREATE POLICY profile_select_by_parent
  ON public.profile
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.parent_child_link pcl
      WHERE pcl.parent_user_id = (SELECT auth.uid())
        AND pcl.child_user_id = public.profile.user_id
        AND pcl.is_approved IS TRUE
        AND pcl.deleted_at IS NULL
    )
  );

-- Policy: Teachers can SELECT linked students' profiles (new)
CREATE POLICY profile_select_by_teacher
  ON public.profile
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.teacher_student_links tsl
      WHERE tsl.teacher_user_id = (SELECT auth.uid())
        AND tsl.student_user_id = public.profile.user_id
    )
  );


-- =========================================================
-- 3. TEACHER STUDENT LINKS RLS OPTIMIZATION
-- =========================================================

-- Drop legacy policies
DROP POLICY IF EXISTS "Teachers can read their student links" ON public.teacher_student_links;
DROP POLICY IF EXISTS "Students can read their teacher links" ON public.teacher_student_links;

-- Policy: Teachers can read their student links (optimized)
CREATE POLICY "Teachers can read their student links"
  ON public.teacher_student_links
  FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = teacher_user_id);

-- Policy: Students can read their teacher links (optimized)
CREATE POLICY "Students can read their teacher links"
  ON public.teacher_student_links
  FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = student_user_id);

COMMIT;

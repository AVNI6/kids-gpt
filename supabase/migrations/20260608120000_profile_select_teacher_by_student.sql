-- Migration: Allow approved classroom students to view their classroom teacher's profile details
-- Date: 2026-06-08
-- Path: supabase/migrations/20260608120000_profile_select_teacher_by_student.sql

BEGIN;

DROP POLICY IF EXISTS profile_select_teacher_by_student ON public.profile;

CREATE POLICY profile_select_teacher_by_student
ON public.profile
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.classroom_members cm
    JOIN public.classrooms c ON cm.classroom_id = c.id
    WHERE c.teacher_user_id = public.profile.user_id
      AND cm.student_user_id = auth.uid()
      AND cm.status = 'APPROVED'
      AND c.deleted_at IS NULL
  )
);

COMMIT;

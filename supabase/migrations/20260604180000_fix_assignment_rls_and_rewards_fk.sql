-- Migration: Fix assignment_submissions UPDATE RLS and rewards source_id FK violation
-- Date: 2026-06-04 18:00:00 UTC
--
-- Bug 1: submissions_update WITH CHECK clause evaluates on the POST-update row.
--   Setting score = gradedScore means the new row has score IS NOT NULL, which
--   fails the WITH CHECK (score IS NULL) condition. We split USING and WITH CHECK
--   so the student can set any score value as long as the row CURRENTLY has score IS NULL.
--
-- Bug 2: No migration change needed for the FK — the fix is in gradeAssignment()
--   TypeScript code (source_id must be null for assignment-based rewards, not
--   submission.assignment_id which references the assignments table, not activity_settings).

BEGIN;

-- Fix submissions_update RLS policy:
-- USING  = can only target rows where score IS NULL (kid) or teacher grades any
-- WITH CHECK = kid can write any score value; teacher can write anything
DROP POLICY IF EXISTS submissions_update ON public.assignment_submissions;
CREATE POLICY submissions_update ON public.assignment_submissions
  FOR UPDATE
  TO authenticated
  USING (
    -- Student can update their own ungraded submission (score IS NULL)
    (student_user_id = (SELECT auth.uid()) AND score IS NULL)
    -- Teacher can update any submission in their assignment
    OR public.is_assignment_classroom_teacher(assignment_id, (SELECT auth.uid()))
  )
  WITH CHECK (
    -- Student can write any score value to their own submission
    student_user_id = (SELECT auth.uid())
    -- Teacher can write anything
    OR public.is_assignment_classroom_teacher(assignment_id, (SELECT auth.uid()))
  );

COMMIT;

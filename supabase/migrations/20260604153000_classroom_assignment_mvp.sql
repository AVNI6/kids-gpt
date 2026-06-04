-- Migration: Classroom Assignment System MVP Schema Extension
-- Date: 2026-06-04 15:30:00 UTC

BEGIN;

-- 1. Add configurations to assignments table
ALTER TABLE public.assignments
  ADD COLUMN IF NOT EXISTS activity_type varchar,
  ADD COLUMN IF NOT EXISTS topic text,
  ADD COLUMN IF NOT EXISTS difficulty varchar,
  ADD COLUMN IF NOT EXISTS question_count integer DEFAULT 3 NOT NULL;

-- Add check constraint for supported MVP auto-graded activity types
ALTER TABLE public.assignments
  DROP CONSTRAINT IF EXISTS chk_assignments_activity_type,
  ADD CONSTRAINT chk_assignments_activity_type
  CHECK (activity_type IN ('quizzes', 'flashcards', 'math-challenges', 'word-scrambles'));

-- 2. Add assignment relation to rewards table
ALTER TABLE public.rewards
  ADD COLUMN IF NOT EXISTS assignment_id uuid REFERENCES public.assignments(id) ON DELETE SET NULL;

-- Create index on assignment_id for fast lookup during verification and analytics
CREATE INDEX IF NOT EXISTS idx_rewards_assignment_id
  ON public.rewards(assignment_id);

-- 3. Update get_teacher_classroom_workspace to return configuration columns
CREATE OR REPLACE FUNCTION public.get_teacher_classroom_workspace(p_classroom_id uuid)
RETURNS jsonb
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
DECLARE
  v_teacher_id uuid;
  v_classroom jsonb;
  v_assignments jsonb;
  v_resources jsonb;
  v_announcements jsonb;
  v_students jsonb;
BEGIN
  v_teacher_id := auth.uid();

  -- Double check teacher owns the classroom
  IF NOT EXISTS (
    SELECT 1 FROM public.classrooms
    WHERE id = p_classroom_id
      AND teacher_user_id = v_teacher_id
      AND deleted_at IS NULL
  ) THEN
    RAISE EXCEPTION 'Unauthorized: User is not the owner of this classroom';
  END IF;

  -- 1. Classroom Metadata
  SELECT to_jsonb(c) INTO v_classroom
  FROM public.classrooms c
  WHERE c.id = p_classroom_id;

  -- 2. Classroom Assignments
  SELECT coalesce(json_agg(a), '[]'::json) INTO v_assignments
  FROM (
    SELECT 
      id, title, description, subject, total_points, due_date, status, published_at, closed_at, created_at, activity_type, topic, difficulty, question_count,
      (SELECT count(*)::int FROM public.classroom_members cm JOIN public.profile p ON cm.student_user_id = p.user_id WHERE cm.classroom_id = p_classroom_id AND cm.status = 'APPROVED' AND p.deleted_at IS NULL) as total_students,
      (SELECT count(*)::int FROM public.assignment_submissions WHERE assignment_id = assignments.id AND submitted_at IS NOT NULL AND deleted_at IS NULL) as submissions_count,
      (SELECT coalesce(avg(score), 0)::numeric(5,2) FROM public.assignment_submissions WHERE assignment_id = assignments.id AND submitted_at IS NOT NULL AND deleted_at IS NULL) as average_score
    FROM public.assignments
    WHERE classroom_id = p_classroom_id
      AND deleted_at IS NULL
    ORDER BY created_at DESC
  ) a;

  -- 3. Classroom Resources
  SELECT coalesce(json_agg(r), '[]'::json) INTO v_resources
  FROM (
    SELECT id, title, description, resource_type, resource_url, storage_path, created_at
    FROM public.classroom_resources
    WHERE classroom_id = p_classroom_id
      AND deleted_at IS NULL
    ORDER BY created_at DESC
  ) r;

  -- 4. Classroom Announcements
  SELECT coalesce(json_agg(an), '[]'::json) INTO v_announcements
  FROM (
    SELECT id, title, message, created_at
    FROM public.announcements
    WHERE classroom_id = p_classroom_id
      AND deleted_at IS NULL
    ORDER BY created_at DESC
  ) an;

  -- 5. Approved Students list (join profile data safely)
  SELECT coalesce(json_agg(s), '[]'::json) INTO v_students
  FROM (
    SELECT 
      p.user_id,
      p.first_name,
      p.last_name,
      p.avatar_url,
      p.total_experience_points,
      p.current_streak,
      cm.joined_at,
      cm.status
    FROM public.classroom_members cm
    JOIN public.profile p ON cm.student_user_id = p.user_id
    WHERE cm.classroom_id = p_classroom_id
      AND cm.status = 'APPROVED'
      AND p.deleted_at IS NULL
    ORDER BY p.first_name ASC, p.last_name ASC
  ) s;

  RETURN jsonb_build_object(
    'classroom', v_classroom,
    'assignments', v_assignments,
    'resources', v_resources,
    'announcements', v_announcements,
    'students', v_students
  );
END;
$$ LANGUAGE plpgsql;

-- 4. Update get_student_classroom_workspace to return configuration columns
CREATE OR REPLACE FUNCTION public.get_student_classroom_workspace(p_classroom_id uuid)
RETURNS jsonb
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
DECLARE
  v_student_id uuid;
  v_assignments jsonb;
  v_resources jsonb;
  v_announcements jsonb;
BEGIN
  v_student_id := auth.uid();

  -- Verify student is approved member of the classroom
  IF NOT public.is_classroom_student(p_classroom_id, v_student_id) THEN
    RAISE EXCEPTION 'Unauthorized: User is not an approved member of this classroom';
  END IF;

  -- 1. Classroom Assignments (Published only) merged with student submission if exists
  SELECT coalesce(json_agg(a), '[]'::json) INTO v_assignments
  FROM (
    SELECT 
      a.id, 
      a.title, 
      a.description, 
      a.subject, 
      a.total_points, 
      a.due_date, 
      a.status,
      a.published_at,
      a.closed_at,
      a.activity_type,
      a.topic,
      a.difficulty,
      a.question_count,
      s.id as submission_id,
      s.submission_type,
      s.submission_text,
      s.submission_url,
      s.submitted_at,
      s.score,
      s.feedback,
      s.graded_at
    FROM public.assignments a
    LEFT JOIN public.assignment_submissions s 
      ON a.id = s.assignment_id 
      AND s.student_user_id = v_student_id
      AND s.deleted_at IS NULL
    WHERE a.classroom_id = p_classroom_id
      AND a.status = 'PUBLISHED'
      AND a.deleted_at IS NULL
    ORDER BY a.due_date ASC, a.created_at DESC
  ) a;

  -- 2. Classroom Resources (Active only)
  SELECT coalesce(json_agg(r), '[]'::json) INTO v_resources
  FROM (
    SELECT id, title, description, resource_type, resource_url, storage_path, created_at
    FROM public.classroom_resources
    WHERE classroom_id = p_classroom_id
      AND deleted_at IS NULL
    ORDER BY created_at DESC
  ) r;

  -- 3. Classroom Announcements (Active only)
  SELECT coalesce(json_agg(an), '[]'::json) INTO v_announcements
  FROM (
    SELECT id, title, message, created_at
    FROM public.announcements
    WHERE classroom_id = p_classroom_id
      AND deleted_at IS NULL
    ORDER BY created_at DESC
  ) an;

  RETURN jsonb_build_object(
    'assignments', v_assignments,
    'resources', v_resources,
    'announcements', v_announcements
  );
END;
$$ LANGUAGE plpgsql;

COMMIT;

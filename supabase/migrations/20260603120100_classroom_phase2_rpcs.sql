-- Migration: Classroom System Phase 2 RPC Functions
-- Date: 2026-06-03 12:01:00 UTC

BEGIN;

-- =========================================================================
-- 1. get_teacher_classroom_workspace(p_classroom_id uuid)
-- =========================================================================
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
    SELECT id, title, description, subject, total_points, due_date, status, published_at, closed_at, created_at
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
      cm.approved_at
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

-- =========================================================================
-- 2. get_teacher_assignment_overview(p_assignment_id uuid)
-- =========================================================================
CREATE OR REPLACE FUNCTION public.get_teacher_assignment_overview(p_assignment_id uuid)
RETURNS jsonb
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
DECLARE
  v_teacher_id uuid;
  v_assignment jsonb;
  v_submitted_count int;
  v_graded_count int;
  v_pending_count int;
  v_submissions jsonb;
BEGIN
  v_teacher_id := auth.uid();

  -- Verify ownership of the parent classroom
  IF NOT EXISTS (
    SELECT 1 FROM public.assignments a
    JOIN public.classrooms c ON a.classroom_id = c.id
    WHERE a.id = p_assignment_id
      AND c.teacher_user_id = v_teacher_id
      AND a.deleted_at IS NULL
      AND c.deleted_at IS NULL
  ) THEN
    RAISE EXCEPTION 'Unauthorized: User is not the owner of this assignment classroom';
  END IF;

  -- 1. Assignment Info
  SELECT to_jsonb(a) INTO v_assignment
  FROM public.assignments a
  WHERE a.id = p_assignment_id;

  -- 2. Submission Metrics
  SELECT count(*)::int INTO v_submitted_count
  FROM public.assignment_submissions
  WHERE assignment_id = p_assignment_id
    AND deleted_at IS NULL;

  SELECT count(*)::int INTO v_graded_count
  FROM public.assignment_submissions
  WHERE assignment_id = p_assignment_id
    AND score IS NOT NULL
    AND deleted_at IS NULL;

  SELECT count(*)::int INTO v_pending_count
  FROM public.assignment_submissions
  WHERE assignment_id = p_assignment_id
    AND score IS NULL
    AND deleted_at IS NULL;

  -- 3. Detail Submissions List (with student basic info)
  SELECT coalesce(json_agg(sub), '[]'::json) INTO v_submissions
  FROM (
    SELECT 
      s.id,
      s.student_user_id,
      s.submission_type,
      s.submission_text,
      s.submission_url,
      s.submitted_at,
      s.score,
      s.feedback,
      s.graded_at,
      s.graded_by,
      p.first_name,
      p.last_name,
      p.avatar_url
    FROM public.assignment_submissions s
    JOIN public.profile p ON s.student_user_id = p.user_id
    WHERE s.assignment_id = p_assignment_id
      AND s.deleted_at IS NULL
    ORDER BY s.submitted_at DESC
  ) sub;

  RETURN jsonb_build_object(
    'assignment', v_assignment,
    'submitted_count', v_submitted_count,
    'graded_count', v_graded_count,
    'pending_count', v_pending_count,
    'submissions', v_submissions
  );
END;
$$ LANGUAGE plpgsql;

-- =========================================================================
-- 3. get_student_classroom_workspace(p_classroom_id uuid)
-- =========================================================================
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

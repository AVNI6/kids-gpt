-- Migration: Add get_teacher_dashboard_analytics RPC
-- Date: 2026-06-10 15:46:00

CREATE OR REPLACE FUNCTION public.get_teacher_dashboard_analytics()
RETURNS jsonb
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_teacher_id uuid;
  v_published_assignments_count int;
  v_pending_grading_count int;
  v_resources_uploaded_count int;
  v_announcements_posted_count int;
  v_assignments_classroom_ids jsonb;
  v_resources_classroom_ids jsonb;
  v_announcements_classroom_ids jsonb;
  v_active_students_today_count int;
  v_assignments_submitted_today_count int;
  v_assignments_graded_today_count int;
  v_announcements_posted_today_count int;
  v_one_day_ago timestamp;
BEGIN
  v_teacher_id := auth.uid();
  
  -- Double-verification of role
  IF NOT public.has_profile_role(v_teacher_id, 'teacher') THEN
    RAISE EXCEPTION 'Unauthorized: User is not a teacher';
  END IF;

  v_one_day_ago := now() - interval '24 hours';

  -- 1. Fetch overall counts
  SELECT count(*)::int INTO v_published_assignments_count
  FROM public.assignments
  WHERE teacher_user_id = v_teacher_id AND status = 'PUBLISHED' AND deleted_at IS NULL;

  SELECT count(*)::int INTO v_pending_grading_count
  FROM public.assignment_submissions s
  JOIN public.assignments a ON s.assignment_id = a.id
  WHERE a.teacher_user_id = v_teacher_id AND s.score IS NULL AND s.deleted_at IS NULL AND a.deleted_at IS NULL;

  SELECT count(*)::int INTO v_resources_uploaded_count
  FROM public.classroom_resources
  WHERE teacher_user_id = v_teacher_id AND deleted_at IS NULL;

  SELECT count(*)::int INTO v_announcements_posted_count
  FROM public.announcements
  WHERE teacher_user_id = v_teacher_id AND deleted_at IS NULL;

  -- 2. Fetch classroom groupings mapping
  SELECT coalesce(jsonb_agg(classroom_id), '[]'::jsonb) INTO v_assignments_classroom_ids
  FROM public.assignments
  WHERE teacher_user_id = v_teacher_id AND status = 'PUBLISHED' AND deleted_at IS NULL;

  SELECT coalesce(jsonb_agg(classroom_id), '[]'::jsonb) INTO v_resources_classroom_ids
  FROM public.classroom_resources
  WHERE teacher_user_id = v_teacher_id AND deleted_at IS NULL;

  SELECT coalesce(jsonb_agg(classroom_id), '[]'::jsonb) INTO v_announcements_classroom_ids
  FROM public.announcements
  WHERE teacher_user_id = v_teacher_id AND deleted_at IS NULL;

  -- 3. Today's Snapshot metrics (last 24 hours)
  SELECT count(DISTINCT ae.actor_user_id)::int INTO v_active_students_today_count
  FROM public.activity_events ae
  JOIN public.classroom_members cm ON ae.actor_user_id = cm.student_user_id
  JOIN public.classrooms c ON cm.classroom_id = c.id
  WHERE c.teacher_user_id = v_teacher_id
    AND cm.status = 'APPROVED'
    AND ae.actor_role = 'kid'
    AND ae.created_at >= v_one_day_ago;

  SELECT count(*)::int INTO v_assignments_submitted_today_count
  FROM public.assignment_submissions s
  JOIN public.assignments a ON s.assignment_id = a.id
  WHERE a.teacher_user_id = v_teacher_id AND s.submitted_at >= v_one_day_ago AND s.deleted_at IS NULL AND a.deleted_at IS NULL;

  SELECT count(*)::int INTO v_assignments_graded_today_count
  FROM public.assignment_submissions s
  JOIN public.assignments a ON s.assignment_id = a.id
  WHERE a.teacher_user_id = v_teacher_id AND s.graded_at >= v_one_day_ago AND s.deleted_at IS NULL AND a.deleted_at IS NULL;

  SELECT count(*)::int INTO v_announcements_posted_today_count
  FROM public.announcements
  WHERE teacher_user_id = v_teacher_id AND created_at >= v_one_day_ago AND deleted_at IS NULL;

  RETURN jsonb_build_object(
    'published_assignments_count', v_published_assignments_count,
    'pending_grading_count', v_pending_grading_count,
    'resources_uploaded_count', v_resources_uploaded_count,
    'announcements_posted_count', v_announcements_posted_count,
    'assignments_classroom_ids', v_assignments_classroom_ids,
    'resources_classroom_ids', v_resources_classroom_ids,
    'announcements_classroom_ids', v_announcements_classroom_ids,
    'active_students_today_count', v_active_students_today_count,
    'assignments_submitted_today_count', v_assignments_submitted_today_count,
    'assignments_graded_today_count', v_assignments_graded_today_count,
    'announcements_posted_today_count', v_announcements_posted_today_count
  );
END;
$$;

-- Migration: Phase 3 Assignment Lifecycle Hardening
-- Date: 2026-06-11 17:00:00 UTC

BEGIN;

-- =========================================================================
-- 1. DEDUPLICATE & SECURE SCHEMA CONSTRAINTS
-- =========================================================================

-- Deduplicate assignment submissions (keep only the latest submitted_at per assignment-student combination)
UPDATE public.assignment_submissions
SET deleted_at = now()
WHERE id IN (
  SELECT id
  FROM (
    SELECT id, ROW_NUMBER() OVER (PARTITION BY assignment_id, student_user_id ORDER BY submitted_at DESC) as rn
    FROM public.assignment_submissions
    WHERE deleted_at IS NULL
  ) t
  WHERE t.rn > 1
);

-- Unique index to guarantee single active student submission per assignment
CREATE UNIQUE INDEX IF NOT EXISTS uq_assignment_student_submission
  ON public.assignment_submissions(assignment_id, student_user_id)
  WHERE deleted_at IS NULL;

-- Check constraint to ensure positive assignment points
ALTER TABLE public.assignments DROP CONSTRAINT IF EXISTS chk_assignments_points;
ALTER TABLE public.assignments ADD CONSTRAINT chk_assignments_points CHECK (total_points > 0);


-- =========================================================================
-- 2. CASCADING DELETION AND XP REVERSION TRIGGERS
-- =========================================================================

CREATE OR REPLACE FUNCTION public.handle_assignment_soft_delete_cascade()
RETURNS trigger AS $$
BEGIN
  -- 1. Soft-delete submissions cascade (assignment deleted_at goes NULL -> TIMESTAMP)
  UPDATE public.assignment_submissions 
  SET deleted_at = n.deleted_at
  FROM new_table n
  JOIN old_table o ON n.id = o.id
  WHERE public.assignment_submissions.assignment_id = n.id 
    AND n.deleted_at IS NOT NULL 
    AND o.deleted_at IS NULL 
    AND public.assignment_submissions.deleted_at IS NULL;

  -- 2. Soft-delete corresponding rewards (assignment deleted_at goes NULL -> TIMESTAMP)
  UPDATE public.rewards
  SET deleted_at = n.deleted_at
  FROM new_table n
  JOIN old_table o ON n.id = o.id
  WHERE public.rewards.assignment_id = n.id
    AND n.deleted_at IS NOT NULL
    AND o.deleted_at IS NULL
    AND public.rewards.deleted_at IS NULL;

  -- 3. Decrement student profiles by the amount of soft-deleted rewards
  UPDATE public.profile p
  SET total_experience_points = COALESCE(p.total_experience_points, 0) - r_sub.total_deleted_xp
  FROM (
    SELECT r.user_id, SUM(COALESCE(r.rewards_amount, 0)) as total_deleted_xp
    FROM public.rewards r
    JOIN new_table n ON r.assignment_id = n.id
    JOIN old_table o ON n.id = o.id
    WHERE n.deleted_at IS NOT NULL
      AND o.deleted_at IS NULL
      AND r.deleted_at = n.deleted_at
    GROUP BY r.user_id
  ) r_sub
  WHERE p.user_id = r_sub.user_id;

  -- 4. Restore submissions cascade (assignment deleted_at goes TIMESTAMP -> NULL)
  UPDATE public.assignment_submissions 
  SET deleted_at = NULL
  FROM new_table n
  JOIN old_table o ON n.id = o.id
  WHERE public.assignment_submissions.assignment_id = n.id 
    AND n.deleted_at IS NULL 
    AND o.deleted_at IS NOT NULL 
    AND public.assignment_submissions.deleted_at = o.deleted_at;

  -- 5. Re-increment student profiles for restored rewards
  UPDATE public.profile p
  SET total_experience_points = COALESCE(p.total_experience_points, 0) + r_sub.total_restored_xp
  FROM (
    SELECT r.user_id, SUM(COALESCE(r.rewards_amount, 0)) as total_restored_xp
    FROM public.rewards r
    JOIN new_table n ON r.assignment_id = n.id
    JOIN old_table o ON n.id = o.id
    WHERE n.deleted_at IS NULL
      AND o.deleted_at IS NOT NULL
      AND r.deleted_at = o.deleted_at
    GROUP BY r.user_id
  ) r_sub
  WHERE p.user_id = r_sub.user_id;

  -- 6. Restore corresponding rewards (assignment deleted_at goes TIMESTAMP -> NULL)
  UPDATE public.rewards
  SET deleted_at = NULL
  FROM new_table n
  JOIN old_table o ON n.id = o.id
  WHERE public.rewards.assignment_id = n.id
    AND n.deleted_at IS NULL
    AND o.deleted_at IS NOT NULL
    AND public.rewards.deleted_at = o.deleted_at;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;


-- =========================================================================
-- 3. HARDEN & UPDATE WORKFLOW RPC FUNCTIONS
-- =========================================================================

-- Task 2: Idempotent publish_assignment with parent alerts
DROP FUNCTION IF EXISTS public.publish_assignment(uuid);
CREATE OR REPLACE FUNCTION public.publish_assignment(
  p_teacher_id uuid,
  p_assignment_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_classroom_id uuid;
  v_title varchar;
  v_status varchar;
  v_student_record RECORD;
BEGIN
  -- 1. Fetch assignment details
  SELECT classroom_id, title, status INTO v_classroom_id, v_title, v_status
  FROM public.assignments
  WHERE id = p_assignment_id AND deleted_at IS NULL;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Assignment not found';
  END IF;

  -- Idempotency protection
  IF v_status = 'PUBLISHED' THEN
    RETURN jsonb_build_object('success', true, 'classroom_id', v_classroom_id);
  END IF;

  IF v_status != 'DRAFT' THEN
    RAISE EXCEPTION 'Only draft assignments can be published';
  END IF;

  -- 2. Update status
  UPDATE public.assignments
  SET status = 'PUBLISHED',
      published_at = now(),
      updated_at = now()
  WHERE id = p_assignment_id;

  -- 3. Insert activity event (Correct naming: ASSIGNMENT_PUBLISHED)
  INSERT INTO public.activity_events (
    actor_user_id,
    actor_role,
    target_user_id,
    target_type,
    event_type,
    source_type,
    source_id,
    metadata
  ) VALUES (
    p_teacher_id,
    'teacher',
    NULL,
    'classroom',
    'ASSIGNMENT_PUBLISHED',
    'assignments',
    p_assignment_id,
    jsonb_build_object('title', v_title, 'classroom_id', v_classroom_id)
  );

  -- 4. Notify students & linked parents
  FOR v_student_record IN
    SELECT student_user_id
    FROM public.classroom_members
    WHERE classroom_id = v_classroom_id AND status = 'APPROVED'
  LOOP
    -- Kid Notification
    INSERT INTO public.notifications (
      recipient_user_id,
      recipient_role,
      type,
      title,
      message,
      source_type,
      source_id,
      metadata
    ) VALUES (
      v_student_record.student_user_id,
      'kid',
      'ASSIGNMENT_PUBLISHED',
      'New Assignment Available',
      'Your teacher published a new assignment: "' || v_title || '".',
      'assignments',
      p_assignment_id,
      jsonb_build_object('classroom_id', v_classroom_id)
    );

    -- Parent Notification
    INSERT INTO public.parent_notifications (
      parent_id,
      child_id,
      type,
      title,
      message,
      metadata
    )
    SELECT parent_user_id, child_user_id, 'assignment_published', 'New Assignment Available', 
           'A new classroom assignment "' || v_title || '" has been published for your child.',
           jsonb_build_object('classroom_id', v_classroom_id, 'assignment_id', p_assignment_id)
    FROM public.parent_child_link
    WHERE child_user_id = v_student_record.student_user_id
      AND is_approved = true
      AND is_active = true
      AND deleted_at IS NULL;
  END LOOP;

  RETURN jsonb_build_object('success', true, 'classroom_id', v_classroom_id);
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;


-- Task 5 & 6: Deduplicated and secure submit_student_assignment
DROP FUNCTION IF EXISTS public.submit_student_assignment(uuid, numeric);
CREATE OR REPLACE FUNCTION public.submit_student_assignment(
  p_student_id uuid,
  p_assignment_id uuid,
  p_submission_type varchar,
  p_submission_text text,
  p_submission_url varchar
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_title varchar;
  v_classroom_id uuid;
  v_teacher_user_id uuid;
  v_status varchar;
  v_submission_id uuid;
  v_current_score integer;
  v_kid_name varchar;
BEGIN
  -- Verify assignment is active
  SELECT title, classroom_id, teacher_user_id, status
  INTO v_title, v_classroom_id, v_teacher_user_id, v_status
  FROM public.assignments
  WHERE id = p_assignment_id AND deleted_at IS NULL;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Assignment not found or is no longer active';
  END IF;

  IF v_status != 'PUBLISHED' THEN
    RAISE EXCEPTION 'This assignment is not open for submissions';
  END IF;

  -- 1. Check for existing active student submission
  SELECT id, score INTO v_submission_id, v_current_score
  FROM public.assignment_submissions
  WHERE assignment_id = p_assignment_id 
    AND student_user_id = p_student_id
    AND deleted_at IS NULL;

  IF FOUND THEN
    IF v_current_score IS NOT NULL THEN
      RAISE EXCEPTION 'Graded assignments cannot be resubmitted';
    END IF;

    -- Update existing submission instead of duplicating
    UPDATE public.assignment_submissions
    SET submission_type = p_submission_type::public.submission_type,
        submission_text = p_submission_text,
        submission_url = p_submission_url,
        submitted_at = now(),
        updated_at = now()
    WHERE id = v_submission_id;
  ELSE
    -- Insert new submission
    INSERT INTO public.assignment_submissions (
      assignment_id,
      student_user_id,
      submission_type,
      submission_text,
      submission_url,
      submitted_at
    ) VALUES (
      p_assignment_id,
      p_student_id,
      p_submission_type::public.submission_type,
      p_submission_text,
      p_submission_url,
      now()
    )
    RETURNING id INTO v_submission_id;
  END IF;

  -- 2. Log event
  INSERT INTO public.activity_events (
    actor_user_id,
    actor_role,
    target_user_id,
    target_type,
    event_type,
    source_type,
    source_id,
    metadata
  ) VALUES (
    p_student_id,
    'kid',
    v_teacher_user_id,
    'classroom',
    'ASSIGNMENT_SUBMITTED',
    'assignment_submissions',
    v_submission_id,
    jsonb_build_object('assignment_id', p_assignment_id, 'title', v_title, 'classroom_id', v_classroom_id)
  );

  -- 3. Fetch student name
  SELECT first_name || ' ' || last_name INTO v_kid_name
  FROM public.profile
  WHERE user_id = p_student_id;
  v_kid_name := COALESCE(trim(v_kid_name), 'A student');

  -- 4. Notify teacher
  INSERT INTO public.notifications (
    recipient_user_id,
    recipient_role,
    type,
    title,
    message,
    source_type,
    source_id,
    metadata
  ) VALUES (
    v_teacher_user_id,
    'teacher',
    'ASSIGNMENT_SUBMITTED',
    'Assignment Submitted',
    v_kid_name || ' submitted assignment: "' || v_title || '".',
    'assignment_submissions',
    v_submission_id,
    jsonb_build_object('classroom_id', v_classroom_id)
  );

  -- 5. Notify parent
  INSERT INTO public.parent_notifications (
    parent_id,
    child_id,
    type,
    title,
    message,
    metadata
  )
  SELECT parent_user_id, child_user_id, 'assignment_submitted', 'Assignment Submitted', 
         'Your child submitted assignment: "' || v_title || '".',
         jsonb_build_object('classroom_id', v_classroom_id, 'assignment_id', p_assignment_id, 'submission_id', v_submission_id)
  FROM public.parent_child_link
  WHERE child_user_id = p_student_id
    AND is_approved = true
    AND is_active = true
    AND deleted_at IS NULL;

  RETURN jsonb_build_object('success', true, 'submission_id', v_submission_id, 'classroom_id', v_classroom_id);
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;


-- Task 7: Secured grade_student_submission verifying classroom ownership and notifying parent
CREATE OR REPLACE FUNCTION public.grade_student_submission(
  p_teacher_id uuid,
  p_submission_id uuid,
  p_score numeric,
  p_feedback text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_assignment_id uuid;
  v_student_user_id uuid;
  v_current_score numeric;
  v_title varchar;
  v_total_points numeric;
  v_classroom_id uuid;
  v_activity_type varchar;
  v_score_percent integer;
  v_existing_reward_id uuid;
  v_existing_reward_amount numeric;
  v_xp_delta numeric;
BEGIN
  -- 1. Fetch submission details
  SELECT assignment_id, student_user_id, score
  INTO v_assignment_id, v_student_user_id, v_current_score
  FROM public.assignment_submissions
  WHERE id = p_submission_id AND deleted_at IS NULL;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Submission not found';
  END IF;

  -- 2. Fetch assignment
  SELECT title, total_points, classroom_id, activity_type
  INTO v_title, v_total_points, v_classroom_id, v_activity_type
  FROM public.assignments
  WHERE id = v_assignment_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Assignment not found';
  END IF;

  -- SECURE: Verify that the grader is the owner of the classroom
  IF NOT EXISTS (
    SELECT 1 FROM public.classrooms
    WHERE id = v_classroom_id AND teacher_user_id = p_teacher_id AND deleted_at IS NULL
  ) THEN
    RAISE EXCEPTION 'Unauthorized: User is not the teacher of this classroom';
  END IF;

  IF v_activity_type IS NOT NULL AND v_activity_type != '' THEN
    RAISE EXCEPTION 'Auto-graded assignments cannot be graded manually';
  END IF;

  IF p_score < 0 OR p_score > v_total_points THEN
    RAISE EXCEPTION 'Score must be between 0 and %', v_total_points;
  END IF;

  v_score_percent := round((p_score / v_total_points) * 100);

  -- 3. Update grading
  UPDATE public.assignment_submissions
  SET score = p_score,
      feedback = trim(p_feedback),
      graded_at = now(),
      graded_by = p_teacher_id,
      updated_at = now()
  WHERE id = p_submission_id;

  -- 4. Log event
  INSERT INTO public.activity_events (
    actor_user_id,
    actor_role,
    target_user_id,
    target_type,
    event_type,
    source_type,
    source_id,
    metadata
  ) VALUES (
    p_teacher_id,
    'teacher',
    v_student_user_id,
    'classroom',
    'ASSIGNMENT_GRADED',
    'assignment_submissions',
    p_submission_id,
    jsonb_build_object('score', p_score, 'total_points', v_total_points, 'title', v_title, 'classroom_id', v_classroom_id)
  );

  -- 5. Notify kid
  INSERT INTO public.notifications (
    recipient_user_id,
    recipient_role,
    type,
    title,
    message,
    source_type,
    source_id,
    metadata
  ) VALUES (
    v_student_user_id,
    'kid',
    'ASSIGNMENT_GRADED',
    'Assignment Graded',
    'Your assignment "' || v_title || '" has been graded. Score: ' || v_score_percent || '%',
    'assignment_submissions',
    p_submission_id,
    jsonb_build_object('classroom_id', v_classroom_id)
  );

  -- 6. Notify parent
  INSERT INTO public.parent_notifications (
    parent_id,
    child_id,
    type,
    title,
    message,
    metadata
  )
  SELECT parent_user_id, child_user_id, 'assignment_graded', 'Assignment Graded', 
         'Your child''s assignment "' || v_title || '" has been graded. Score: ' || v_score_percent || '%',
         jsonb_build_object('classroom_id', v_classroom_id, 'assignment_id', v_assignment_id, 'submission_id', p_submission_id)
  FROM public.parent_child_link
  WHERE child_user_id = v_student_user_id
    AND is_approved = true
    AND is_active = true
    AND deleted_at IS NULL;

  -- 7. Award XP
  SELECT id, rewards_amount INTO v_existing_reward_id, v_existing_reward_amount
  FROM public.rewards
  WHERE user_id = v_student_user_id
    AND source_type = 'assignment'
    AND assignment_id = v_assignment_id
    AND deleted_at IS NULL;

  v_xp_delta := p_score;

  IF v_existing_reward_id IS NOT NULL THEN
    v_xp_delta := p_score - COALESCE(v_existing_reward_amount, 0);

    UPDATE public.rewards
    SET rewards_amount = p_score,
        description = 'Earned XP for Assignment: "' || v_title || '" (Score: ' || v_score_percent || '%)',
        score = v_score_percent,
        updated_at = now()
    WHERE id = v_existing_reward_id;
  ELSE
    INSERT INTO public.rewards (
      user_id,
      rewards_amount,
      source_type,
      source_id,
      assignment_id,
      description,
      score
    ) VALUES (
      v_student_user_id,
      p_score,
      'assignment',
      NULL,
      v_assignment_id,
      'Earned XP for Assignment: "' || v_title || '" (Score: ' || v_score_percent || '%)',
      v_score_percent
    );
  END IF;

  -- Atomic update kid profile total XP
  UPDATE public.profile
  SET total_experience_points = COALESCE(total_experience_points, 0) + v_xp_delta,
      updated_at = now()
  WHERE user_id = v_student_user_id;

  RETURN jsonb_build_object('success', true, 'classroom_id', v_classroom_id);
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;


-- Task 3: Create transaction-safe auto-graded activity submission RPC
CREATE OR REPLACE FUNCTION public.submit_activity_assignment(
  p_student_id uuid,
  p_assignment_id uuid,
  p_percentage integer,
  p_timezone text DEFAULT 'Asia/Kolkata'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_title varchar;
  v_subject varchar;
  v_classroom_id uuid;
  v_teacher_user_id uuid;
  v_status varchar;
  v_total_points integer;
  v_activity_type varchar;
  v_due_date timestamp WITH TIME ZONE;
  v_graded_score integer;
  v_submission_id uuid;
  v_submission_score integer;
  v_existing_reward_id uuid;
  v_activity_title varchar;
  v_activity_setting_id uuid;
  v_last_reward_date timestamp WITH TIME ZONE;
  v_current_streak integer;
  v_longest_streak integer;
  v_profile_xp integer;
  v_updated_current_streak integer;
  v_updated_longest_streak integer;
  v_today_date date;
  v_last_reward_date_local date;
  v_desc text;
  v_kid_name varchar;
BEGIN
  -- 1. Fetch assignment details
  SELECT title, classroom_id, teacher_user_id, status, total_points, activity_type, due_date, subject
  INTO v_title, v_classroom_id, v_teacher_user_id, v_status, v_total_points, v_activity_type, v_due_date, v_subject
  FROM public.assignments
  WHERE id = p_assignment_id AND deleted_at IS NULL;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Assignment not found';
  END IF;

  IF v_status != 'PUBLISHED' THEN
    RAISE EXCEPTION 'This assignment is not open for completions';
  END IF;

  IF v_due_date IS NOT NULL AND v_due_date < now() THEN
    RAISE EXCEPTION 'This assignment is past its due date';
  END IF;

  -- 2. Verify approved student membership
  IF NOT EXISTS (
    SELECT 1 FROM public.classroom_members
    WHERE classroom_id = v_classroom_id 
      AND student_user_id = p_student_id 
      AND status = 'APPROVED'
  ) THEN
    RAISE EXCEPTION 'User is not an approved member of this classroom';
  END IF;

  -- 3. Check if already completed
  SELECT id, score INTO v_submission_id, v_submission_score
  FROM public.assignment_submissions
  WHERE assignment_id = p_assignment_id 
    AND student_user_id = p_student_id
    AND deleted_at IS NULL;

  IF v_submission_id IS NOT NULL AND v_submission_score IS NOT NULL THEN
    RAISE EXCEPTION 'This assignment has already been completed';
  END IF;

  v_graded_score := round(v_total_points * (p_percentage::numeric / 100.0));

  -- 4. Insert or update submission
  IF v_submission_id IS NOT NULL THEN
    UPDATE public.assignment_submissions
    SET score = v_graded_score,
        submitted_at = now(),
        submission_text = 'Completed activity',
        updated_at = now()
    WHERE id = v_submission_id;
  ELSE
    INSERT INTO public.assignment_submissions (
      assignment_id,
      student_user_id,
      submission_type,
      submission_text,
      score,
      submitted_at
    ) VALUES (
      p_assignment_id,
      p_student_id,
      'TEXT',
      'Completed activity',
      v_graded_score,
      now()
    )
    RETURNING id INTO v_submission_id;
  END IF;

  -- 5. Handle Reward (idempotency check)
  SELECT id INTO v_existing_reward_id
  FROM public.rewards
  WHERE user_id = p_student_id
    AND source_type = 'assignment'
    AND assignment_id = p_assignment_id
    AND deleted_at IS NULL;

  IF v_existing_reward_id IS NULL THEN
    -- Fetch corresponding activity setting
    SELECT id, title INTO v_activity_setting_id, v_activity_title
    FROM public.activity_settings
    WHERE slug = v_activity_type;

    v_desc := 'Completed ' || COALESCE(v_activity_title, 'Activity') || E'\n' ||
              'for Assignment: ' || v_title || E'\n' ||
              '[[' || COALESCE(v_subject, 'General') || E']]\n' ||
              '(Score: ' || p_percentage || '%)';

    -- Fetch last reward date to calculate streak
    SELECT created_at INTO v_last_reward_date
    FROM public.rewards
    WHERE user_id = p_student_id
      AND deleted_at IS NULL
    ORDER BY created_at DESC
    LIMIT 1;

    -- Insert reward
    INSERT INTO public.rewards (
      user_id,
      rewards_amount,
      source_id,
      source_type,
      assignment_id,
      description,
      score
    ) VALUES (
      p_student_id,
      v_graded_score,
      v_activity_setting_id,
      'assignment',
      p_assignment_id,
      v_desc,
      p_percentage
    );

    -- Fetch profile details for streak calculation
    SELECT total_experience_points, current_streak, longest_streak
    INTO v_profile_xp, v_current_streak, v_longest_streak
    FROM public.profile
    WHERE user_id = p_student_id;

    v_today_date := timezone(p_timezone, now())::date;
    IF v_last_reward_date IS NULL THEN
      v_updated_current_streak := 1;
    ELSE
      v_last_reward_date_local := timezone(p_timezone, v_last_reward_date)::date;
      IF v_today_date = v_last_reward_date_local THEN
        v_updated_current_streak := COALESCE(v_current_streak, 1);
      ELSIF v_today_date = v_last_reward_date_local + 1 THEN
        v_updated_current_streak := COALESCE(v_current_streak, 0) + 1;
      ELSE
        v_updated_current_streak := 1;
      END IF;
    END IF;
    
    IF v_updated_current_streak > COALESCE(v_longest_streak, 0) THEN
      v_updated_longest_streak := v_updated_current_streak;
    ELSE
      v_updated_longest_streak := COALESCE(v_longest_streak, 0);
    END IF;

    -- Update profile XP and streaks
    UPDATE public.profile
    SET total_experience_points = COALESCE(total_experience_points, 0) + v_graded_score,
        current_streak = v_updated_current_streak,
        longest_streak = v_updated_longest_streak,
        updated_at = now()
    WHERE user_id = p_student_id;
  END IF;

  -- 6. Insert activity event
  INSERT INTO public.activity_events (
    actor_user_id,
    actor_role,
    target_user_id,
    target_type,
    event_type,
    source_type,
    source_id,
    metadata
  ) VALUES (
    p_student_id,
    'kid',
    v_teacher_user_id,
    'classroom',
    'ASSIGNMENT_SUBMITTED',
    'assignment_submissions',
    v_submission_id,
    jsonb_build_object('assignment_id', p_assignment_id, 'title', v_title, 'classroom_id', v_classroom_id, 'score', v_graded_score)
  );

  -- 7. Fetch student name
  SELECT first_name || ' ' || last_name INTO v_kid_name
  FROM public.profile
  WHERE user_id = p_student_id;
  v_kid_name := COALESCE(trim(v_kid_name), 'A student');

  -- Notify teacher
  INSERT INTO public.notifications (
    recipient_user_id,
    recipient_role,
    type,
    title,
    message,
    source_type,
    source_id,
    metadata
  ) VALUES (
    v_teacher_user_id,
    'teacher',
    'ASSIGNMENT_COMPLETED',
    'Assignment Completed',
    v_kid_name || ' completed assignment "' || v_title || '". Score: ' || p_percentage || '%',
    'assignments',
    p_assignment_id,
    jsonb_build_object('classroom_id', v_classroom_id)
  );

  -- Notify parent
  INSERT INTO public.parent_notifications (
    parent_id,
    child_id,
    type,
    title,
    message,
    metadata
  )
  SELECT parent_user_id, child_user_id, 'quiz_completed', 'Assignment Completed', 
         v_kid_name || ' completed Assignment: "' || v_title || '" (Score: ' || p_percentage || '%)',
         jsonb_build_object('classroom_id', v_classroom_id, 'assignment_id', p_assignment_id)
  FROM public.parent_child_link
  WHERE child_user_id = p_student_id
    AND is_approved = true
    AND is_active = true
    AND deleted_at IS NULL;

  RETURN jsonb_build_object('success', true, 'classroom_id', v_classroom_id);
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;


-- Task 5: Timezone-aware get_teacher_dashboard_analytics RPC
DROP FUNCTION IF EXISTS public.get_teacher_dashboard_analytics();
CREATE OR REPLACE FUNCTION public.get_teacher_dashboard_analytics(p_timezone text DEFAULT 'Asia/Kolkata')
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
  v_start_of_today timestamp;
BEGIN
  v_teacher_id := auth.uid();
  
  -- Verify teacher role
  IF NOT public.has_profile_role(v_teacher_id, 'teacher') THEN
    RAISE EXCEPTION 'Unauthorized: User is not a teacher';
  END IF;

  -- Calculate start of current calendar day in local timezone
  v_start_of_today := timezone(p_timezone, now())::date::timestamp;

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

  -- 3. Today's snapshot metrics (since start of current calendar day in local timezone)
  SELECT count(DISTINCT ae.actor_user_id)::int INTO v_active_students_today_count
  FROM public.activity_events ae
  JOIN public.classroom_members cm ON ae.actor_user_id = cm.student_user_id
  JOIN public.classrooms c ON cm.classroom_id = c.id
  WHERE c.teacher_user_id = v_teacher_id
    AND cm.status = 'APPROVED'
    AND ae.actor_role = 'kid'
    AND ae.created_at >= v_start_of_today;

  SELECT count(*)::int INTO v_assignments_submitted_today_count
  FROM public.assignment_submissions s
  JOIN public.assignments a ON s.assignment_id = a.id
  WHERE a.teacher_user_id = v_teacher_id AND s.submitted_at >= v_start_of_today AND s.deleted_at IS NULL AND a.deleted_at IS NULL;

  SELECT count(*)::int INTO v_assignments_graded_today_count
  FROM public.assignment_submissions s
  JOIN public.assignments a ON s.assignment_id = a.id
  WHERE a.teacher_user_id = v_teacher_id AND s.graded_at >= v_start_of_today AND s.deleted_at IS NULL AND a.deleted_at IS NULL;

  SELECT count(*)::int INTO v_announcements_posted_today_count
  FROM public.announcements
  WHERE teacher_user_id = v_teacher_id AND created_at >= v_start_of_today AND deleted_at IS NULL;

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


-- Task 9: Update get_child_comprehensive_data to return classroom assignment details to parents
CREATE OR REPLACE FUNCTION public.get_child_comprehensive_data(
  p_parent_id uuid,
  p_child_id uuid,
  p_timezone text DEFAULT 'Asia/Kolkata'
)
RETURNS jsonb
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_profile jsonb;
  v_link jsonb;
  v_rewards jsonb;
  v_safety_alerts jsonb;
  v_daily_usage jsonb;
  v_chat_sessions jsonb;
  v_screen_time_seconds int;
  v_today date;
  v_classrooms jsonb;
BEGIN
  -- Security checks
  IF p_parent_id IS NULL OR p_parent_id <> auth.uid() THEN
    RAISE EXCEPTION 'Unauthorized: Caller identity mismatch';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.parent_child_link
    WHERE parent_user_id = p_parent_id
      AND child_user_id = p_child_id
      AND is_approved = true
      AND is_active = true
      AND deleted_at IS NULL
  ) THEN
    RAISE EXCEPTION 'Access Denied: Parent is not connected to this child';
  END IF;

  -- 1. Fetch child profile statistics
  SELECT jsonb_build_object(
    'total_experience_points', coalesce(total_experience_points, 0),
    'current_streak', coalesce(current_streak, 0),
    'longest_streak', coalesce(longest_streak, 0)
  ) INTO v_profile
  FROM public.profile
  WHERE user_id = p_child_id AND deleted_at IS NULL;

  -- 2. Fetch parental limits
  SELECT jsonb_build_object(
    'daily_limit_minutes', coalesce(daily_limit_minutes, 60),
    'is_screen_time_limit_enabled', coalesce(is_screen_time_limit_enabled, false)
  ) INTO v_link
  FROM public.parent_child_link
  WHERE parent_user_id = p_parent_id
    AND child_user_id = p_child_id
    AND is_approved = true
    AND deleted_at IS NULL;

  -- 3. Fetch rewards history
  SELECT coalesce(jsonb_agg(r), '[]'::jsonb) INTO v_rewards
  FROM (
    SELECT
      r.id,
      r.rewards_amount,
      r.description,
      r.created_at,
      r.updated_at,
      r.source_type,
      r.score,
      CASE
        WHEN act.id IS NOT NULL THEN jsonb_build_object(
          'id', act.id,
          'slug', act.slug,
          'title', act.title,
          'minutes', act.minutes
        )
        ELSE NULL
      END as activity_settings
    FROM public.rewards r
    LEFT JOIN public.activity_settings act ON r.source_id = act.id
    WHERE r.user_id = p_child_id
    ORDER BY r.updated_at DESC, r.created_at DESC
  ) r;

  -- 4. Fetch safety alerts
  SELECT coalesce(jsonb_agg(sa), '[]'::jsonb) INTO v_safety_alerts
  FROM (
    SELECT id, resolved
    FROM public.safety_alerts
    WHERE user_id = p_child_id AND deleted_at IS NULL
  ) sa;

  -- 5. Fetch daily usage
  SELECT coalesce(jsonb_agg(du), '[]'::jsonb) INTO v_daily_usage
  FROM (
    SELECT messages_sent, usage_date
    FROM public.daily_usage_tracking
    WHERE user_id = p_child_id AND deleted_at IS NULL
    ORDER BY usage_date DESC
  ) du;

  -- 6. Fetch chat sessions
  SELECT coalesce(jsonb_agg(cs), '[]'::jsonb) INTO v_chat_sessions
  FROM (
    SELECT id, title, created_at
    FROM public.chat_sessions
    WHERE user_id = p_child_id AND deleted_at IS NULL
    ORDER BY created_at DESC
  ) cs;

  -- 7. Fetch active screen time
  v_today := timezone(p_timezone, now())::date;
  SELECT coalesce(total_seconds, 0) INTO v_screen_time_seconds
  FROM public.daily_screen_time_usage
  WHERE child_id = p_child_id AND usage_date = v_today;

  IF v_screen_time_seconds IS NULL THEN
    v_screen_time_seconds := 0;
  END IF;

  -- 8. Fetch classroom membership & assignment status summary
  SELECT coalesce(jsonb_agg(cm_sum), '[]'::jsonb) INTO v_classrooms
  FROM (
    SELECT 
      c.id as classroom_id,
      c.name as classroom_name,
      c.subject as subject,
      c.grade as grade_level,
      tp.first_name as teacher_first_name,
      tp.last_name as teacher_last_name,
      tu.email as teacher_email,
      (
        SELECT count(*)::int 
        FROM public.assignments a
        LEFT JOIN public.assignment_submissions s ON a.id = s.assignment_id AND s.student_user_id = p_child_id AND s.deleted_at IS NULL
        WHERE a.classroom_id = c.id 
          AND a.status = 'PUBLISHED' 
          AND a.deleted_at IS NULL
          AND s.id IS NULL
      ) as pending_assignments_count,
      (
        SELECT count(*)::int 
        FROM public.assignments a
        JOIN public.assignment_submissions s ON a.id = s.assignment_id AND s.student_user_id = p_child_id AND s.deleted_at IS NULL
        WHERE a.classroom_id = c.id 
          AND a.status = 'PUBLISHED' 
          AND a.deleted_at IS NULL
          AND s.submitted_at IS NOT NULL
      ) as completed_assignments_count
    FROM public.classroom_members cm
    JOIN public.classrooms c ON cm.classroom_id = c.id
    LEFT JOIN public.profile tp ON c.teacher_user_id = tp.user_id AND tp.deleted_at IS NULL
    LEFT JOIN auth.users tu ON c.teacher_user_id = tu.id
    WHERE cm.student_user_id = p_child_id
      AND cm.status = 'APPROVED'
      AND c.deleted_at IS NULL
  ) cm_sum;

  RETURN jsonb_build_object(
    'profile', v_profile,
    'link', v_link,
    'rewards', v_rewards,
    'safety_alerts', v_safety_alerts,
    'daily_usage', v_daily_usage,
    'chat_sessions', v_chat_sessions,
    'today_screen_time_seconds', v_screen_time_seconds,
    'classrooms', v_classrooms
  );
END;
$$;

COMMIT;

-- Migration: Update submit_activity_assignment RPC to return reward_id and submission_id
-- Date: 2026-06-17 12:03:00 UTC
--
-- PURPOSE:
--   The current RPC returns: { success, classroom_id }
--   We add `reward_id` and `submission_id` so the TypeScript server action can
--   link the activity_reviews record without any extra queries.
--
-- CHANGE:
--   - Line 822: RETURN jsonb_build_object('success', true, 'classroom_id', v_classroom_id)
--   + becomes:  RETURN jsonb_build_object('success', true, 'classroom_id', v_classroom_id,
--                                          'reward_id', v_existing_reward_id, 'submission_id', v_submission_id)
--
-- NOTE: v_existing_reward_id is populated when an existing reward is found (idempotency path)
--   or remains NULL if the reward was freshly inserted in this call (because the INSERT
--   in the original code does not RETURNING). We add a RETURNING clause to the INSERT.

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
  v_new_reward_id uuid;
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

    -- Insert reward — capture new id
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
    )
    RETURNING id INTO v_new_reward_id;

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

  -- Return success with all IDs needed for activity_reviews linkage
  RETURN jsonb_build_object(
    'success',       true,
    'classroom_id',  v_classroom_id,
    'submission_id', v_submission_id,
    'reward_id',     COALESCE(v_new_reward_id, v_existing_reward_id)
  );
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

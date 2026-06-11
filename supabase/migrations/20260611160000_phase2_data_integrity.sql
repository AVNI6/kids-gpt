BEGIN;

-- =========================================================================
-- 1. DATABASE CONSTRAINTS & INDEXES
-- =========================================================================

-- Task 2: Active Screen Session Unique Constraint
CREATE UNIQUE INDEX IF NOT EXISTS uq_active_screen_session
ON public.screen_time_sessions(child_id)
WHERE status = 'ACTIVE';

-- Task 3: Subscription Data Integrity Constraint
ALTER TABLE public.subscriptions 
ADD CONSTRAINT uq_subscription_user_id UNIQUE (user_id);

-- Task 4: Rewards Non-Negative Check Constraint
ALTER TABLE public.rewards 
ADD CONSTRAINT check_rewards_amount_non_negative CHECK (rewards_amount >= 0);

-- Task 5: Teacher-Student Link Unique Constraint Index
CREATE UNIQUE INDEX IF NOT EXISTS uq_teacher_student_links 
ON public.teacher_student_links(teacher_user_id, student_user_id);


-- =========================================================================
-- 2. STATEMENT-LEVEL CASCADING TRIGGERS (Task 7)
-- =========================================================================

-- Redefine Classroom Soft Delete Cascade Trigger Function
CREATE OR REPLACE FUNCTION public.handle_classroom_soft_delete_cascade()
RETURNS trigger AS $$
BEGIN
  -- Soft-delete cascade (classroom deleted_at goes NULL -> TIMESTAMP)
  UPDATE public.assignments 
  SET deleted_at = n.deleted_at
  FROM new_table n
  JOIN old_table o ON n.id = o.id
  WHERE public.assignments.classroom_id = n.id 
    AND n.deleted_at IS NOT NULL 
    AND o.deleted_at IS NULL 
    AND public.assignments.deleted_at IS NULL;

  UPDATE public.classroom_resources 
  SET deleted_at = n.deleted_at
  FROM new_table n
  JOIN old_table o ON n.id = o.id
  WHERE public.classroom_resources.classroom_id = n.id 
    AND n.deleted_at IS NOT NULL 
    AND o.deleted_at IS NULL 
    AND public.classroom_resources.deleted_at IS NULL;

  UPDATE public.announcements 
  SET deleted_at = n.deleted_at
  FROM new_table n
  JOIN old_table o ON n.id = o.id
  WHERE public.announcements.classroom_id = n.id 
    AND n.deleted_at IS NOT NULL 
    AND o.deleted_at IS NULL 
    AND public.announcements.deleted_at IS NULL;
  
  -- Restore cascade (classroom deleted_at goes TIMESTAMP -> NULL)
  UPDATE public.assignments 
  SET deleted_at = NULL
  FROM new_table n
  JOIN old_table o ON n.id = o.id
  WHERE public.assignments.classroom_id = n.id 
    AND n.deleted_at IS NULL 
    AND o.deleted_at IS NOT NULL 
    AND public.assignments.deleted_at = o.deleted_at;

  UPDATE public.classroom_resources 
  SET deleted_at = NULL
  FROM new_table n
  JOIN old_table o ON n.id = o.id
  WHERE public.classroom_resources.classroom_id = n.id 
    AND n.deleted_at IS NULL 
    AND o.deleted_at IS NOT NULL 
    AND public.classroom_resources.deleted_at = o.deleted_at;

  UPDATE public.announcements 
  SET deleted_at = NULL
  FROM new_table n
  JOIN old_table o ON n.id = o.id
  WHERE public.announcements.classroom_id = n.id 
    AND n.deleted_at IS NULL 
    AND o.deleted_at IS NOT NULL 
    AND public.announcements.deleted_at = o.deleted_at;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Drop and recreate trigger as statement-level
DROP TRIGGER IF EXISTS tr_classroom_soft_delete_cascade ON public.classrooms;
CREATE TRIGGER tr_classroom_soft_delete_cascade
  AFTER UPDATE ON public.classrooms
  REFERENCING NEW TABLE AS new_table OLD TABLE AS old_table
  FOR EACH STATEMENT
  EXECUTE FUNCTION public.handle_classroom_soft_delete_cascade();


-- Redefine Assignment Soft Delete Cascade Trigger Function
CREATE OR REPLACE FUNCTION public.handle_assignment_soft_delete_cascade()
RETURNS trigger AS $$
BEGIN
  -- Soft-delete cascade (assignment deleted_at goes NULL -> TIMESTAMP)
  UPDATE public.assignment_submissions 
  SET deleted_at = n.deleted_at
  FROM new_table n
  JOIN old_table o ON n.id = o.id
  WHERE public.assignment_submissions.assignment_id = n.id 
    AND n.deleted_at IS NOT NULL 
    AND o.deleted_at IS NULL 
    AND public.assignment_submissions.deleted_at IS NULL;

  -- Restore cascade (assignment deleted_at goes TIMESTAMP -> NULL)
  UPDATE public.assignment_submissions 
  SET deleted_at = NULL
  FROM new_table n
  JOIN old_table o ON n.id = o.id
  WHERE public.assignment_submissions.assignment_id = n.id 
    AND n.deleted_at IS NULL 
    AND o.deleted_at IS NOT NULL 
    AND public.assignment_submissions.deleted_at = o.deleted_at;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Drop and recreate trigger as statement-level
DROP TRIGGER IF EXISTS tr_assignment_soft_delete_cascade ON public.assignments;
CREATE TRIGGER tr_assignment_soft_delete_cascade
  AFTER UPDATE ON public.assignments
  REFERENCING NEW TABLE AS new_table OLD TABLE AS old_table
  FOR EACH STATEMENT
  EXECUTE FUNCTION public.handle_assignment_soft_delete_cascade();


-- =========================================================================
-- 3. REDEFINED & NEW TRANSACTION-SAFE RPC FUNCTIONS
-- =========================================================================

-- Task 1: Atomic XP update on save_kid_activity_progress
CREATE OR REPLACE FUNCTION public.save_kid_activity_progress(
  p_user_id uuid,
  p_activity_slug varchar,
  p_activity_title varchar,
  p_score_str varchar,
  p_timezone varchar DEFAULT 'Asia/Kolkata'
) RETURNS json 
LANGUAGE plpgsql
SECURITY DEFINER 
SET search_path = public AS $$
DECLARE
  v_activity_id uuid;
  v_activity_title varchar;
  v_xp_reward int;
  v_actual_xp int;
  v_score int;
  v_current_streak int;
  v_longest_streak int;
  v_last_activity_date date;
  v_today date;
  v_diff_days int;
  v_description varchar;
  v_response json;
BEGIN
  IF p_user_id != auth.uid() THEN
    RAISE EXCEPTION 'Unauthorized: Caller identity does not match student ID';
  END IF;

  SELECT id, xp_reward, title INTO v_activity_id, v_xp_reward, v_activity_title 
  FROM public.activity_settings 
  WHERE slug = p_activity_slug
     OR p_activity_slug ILIKE '%' || slug || '%'
     OR slug ILIKE '%' || p_activity_slug || '%'
     OR EXISTS (
       SELECT 1 
       FROM regexp_split_to_table(p_activity_slug, '-') as input_word
       WHERE length(input_word) > 2
         AND input_word NOT IN ('dynamic', 'ai', 'play', 'game', 'quest', 'challenge', 'challenges', 'puzzle', 'puzzles', 'lab', 'mixer', 'master')
         AND (
           slug ILIKE '%' || input_word || '%'
           OR input_word ILIKE '%' || slug || '%'
           OR slug ILIKE '%' || substring(input_word from 1 for 4) || '%'
         )
     )
  ORDER BY (slug = p_activity_slug) DESC, id ASC
  LIMIT 1;
  
  IF v_xp_reward IS NULL THEN
    v_xp_reward := 100;
  END IF;

  IF v_activity_title IS NULL THEN
    v_activity_title := coalesce(p_activity_title, p_activity_slug);
  END IF;

  IF p_score_str IS NOT NULL THEN
    BEGIN
      v_score := substring(p_score_str from '([0-9]+)')::integer;
    EXCEPTION WHEN OTHERS THEN
      v_score := NULL;
    END;
  END IF;

  IF v_score IS NOT NULL THEN
    IF v_score = 100 THEN
      v_actual_xp := v_xp_reward;
    ELSE
      v_actual_xp := round(v_xp_reward * (v_score::float / 100.0));
    END IF;
  ELSE
    v_actual_xp := v_xp_reward;
  END IF;

  v_actual_xp := greatest(0, v_actual_xp);

  SELECT current_streak, longest_streak 
  INTO v_current_streak, v_longest_streak
  FROM public.profile
  WHERE user_id = p_user_id;

  IF v_current_streak IS NULL THEN v_current_streak := 0; END IF;
  IF v_longest_streak IS NULL THEN v_longest_streak := 0; END IF;

  v_today := (timezone(p_timezone, now()))::date;
  
  SELECT (timezone(p_timezone, created_at))::date INTO v_last_activity_date
  FROM public.rewards
  WHERE user_id = p_user_id AND source_id IS NOT NULL
  ORDER BY created_at DESC
  LIMIT 1;

  IF v_last_activity_date IS NOT NULL THEN
    IF v_last_activity_date = v_today THEN
      IF v_current_streak = 0 THEN
        v_current_streak := 1;
      END IF;
    ELSE
      v_diff_days := (v_today - v_last_activity_date);
      IF v_diff_days = 1 THEN
        v_current_streak := v_current_streak + 1;
      ELSE
        v_current_streak := 1;
      END IF;
    END IF;
  ELSE
    v_current_streak := 1;
  END IF;

  IF v_current_streak > v_longest_streak THEN
    v_longest_streak := v_current_streak;
  END IF;

  v_description := 'Completed ' || p_activity_title;
  IF p_score_str IS NOT NULL THEN
    v_description := v_description || ' (Score: ' || p_score_str || ')';
  END IF;

  INSERT INTO public.rewards (
    user_id,
    rewards_amount,
    source_id,
    source_type,
    description,
    score
  ) VALUES (
    p_user_id,
    v_actual_xp,
    v_activity_id,
    v_activity_title,
    v_description,
    v_score
  );

  -- Atomic update kid profile total XP
  UPDATE public.profile SET
    total_experience_points = COALESCE(total_experience_points, 0) + v_actual_xp,
    current_streak = v_current_streak,
    longest_streak = v_longest_streak,
    updated_at = now()
  WHERE user_id = p_user_id;

  v_response := json_build_object(
    'success', true,
    'xp_earned', v_actual_xp,
    'score', v_score,
    'current_streak', v_current_streak,
    'longest_streak', v_longest_streak
  );
  
  RETURN v_response;
EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object(
    'success', false,
    'error', SQLERRM
  );
END;
$$;


-- Task 5: Reactivate soft-deleted link on conflict inside link_users_by_email
CREATE OR REPLACE FUNCTION public.link_users_by_email(
  p_current_user_id uuid,
  p_target_email varchar
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_current_role text;
  v_target_profile RECORD;
BEGIN
  -- Lookup current user's role and cast to text
  SELECT role::text
  INTO v_current_role
  FROM public.profile
  WHERE user_id = p_current_user_id
    AND deleted_at IS NULL
  LIMIT 1;

  IF v_current_role IS NULL THEN
    RETURN jsonb_build_object('status', 'error', 'message', 'Current user not found or missing role');
  END IF;

  -- Lookup target user by email (case-insensitive), casting role to text
  SELECT user_id, role::text as role, is_onboarded
  INTO v_target_profile
  FROM public.profile
  WHERE lower(email) = lower(p_target_email)
    AND deleted_at IS NULL
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('status', 'pending', 'message', 'Target email not registered yet');
  END IF;

  -- Check if target is onboarded. If not, they haven't explicitly chosen their final role yet.
  IF v_target_profile.is_onboarded = false THEN
    RETURN jsonb_build_object('status', 'error', 'message', 'The person you are trying to link with has not finished setting up their account. Please ask them to sign in and complete setup first!');
  END IF;

  -- Parent ↔ Kid linking with is_approved = true (immediate visibility)
  IF v_current_role = 'kid' AND v_target_profile.role = 'parent' THEN
    INSERT INTO public.parent_child_link (parent_user_id, child_user_id, is_approved, created_at, is_active)
    VALUES (v_target_profile.user_id, p_current_user_id, true, now(), true)
    ON CONFLICT (parent_user_id, child_user_id) 
    DO UPDATE SET 
      is_active = true, 
      deleted_at = NULL, 
      is_approved = true,
      updated_at = now();

    RETURN jsonb_build_object('status', 'success', 'message', 'Link created successfully!');

  ELSIF v_current_role = 'parent' AND v_target_profile.role = 'kid' THEN
    INSERT INTO public.parent_child_link (parent_user_id, child_user_id, is_approved, created_at, is_active)
    VALUES (p_current_user_id, v_target_profile.user_id, true, now(), true)
    ON CONFLICT (parent_user_id, child_user_id) 
    DO UPDATE SET 
      is_active = true, 
      deleted_at = NULL, 
      is_approved = true,
      updated_at = now();

    RETURN jsonb_build_object('status', 'success', 'message', 'Link created successfully!');

  -- Teacher → Kid linking
  ELSIF v_current_role = 'teacher' AND v_target_profile.role = 'kid' THEN
    INSERT INTO public.teacher_student_links (teacher_user_id, student_user_id, created_at)
    VALUES (p_current_user_id, v_target_profile.user_id, now())
    ON CONFLICT (teacher_user_id, student_user_id) 
    DO UPDATE SET
      deleted_at = NULL,
      updated_at = now();

    RETURN jsonb_build_object('status', 'success', 'message', 'Student link created successfully!');

  ELSE
    RETURN jsonb_build_object('status', 'error', 'message', 'Cannot link a ' || v_current_role || ' account with a ' || v_target_profile.role || ' account.');
  END IF;

EXCEPTION WHEN unique_violation THEN
  RETURN jsonb_build_object('status', 'success', 'message', 'You are already linked with this user!');
WHEN others THEN
  RETURN jsonb_build_object('status', 'error', 'message', SQLERRM);
END;
$$;


-- Task 6: Transaction-safe publish_assignment
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

  IF v_status != 'DRAFT' THEN
    RAISE EXCEPTION 'Only draft assignments can be published';
  END IF;

  -- 2. Update status
  UPDATE public.assignments
  SET status = 'PUBLISHED',
      published_at = now(),
      updated_at = now()
  WHERE id = p_assignment_id;

  -- 3. Insert activity event
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
    'ASSIGNMENT_CREATED',
    'assignments',
    p_assignment_id,
    jsonb_build_object('title', v_title, 'classroom_id', v_classroom_id)
  );

  -- 4. Notify students
  FOR v_student_record IN
    SELECT student_user_id
    FROM public.classroom_members
    WHERE classroom_id = v_classroom_id AND status = 'APPROVED'
  LOOP
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
  END LOOP;

  RETURN jsonb_build_object('success', true, 'classroom_id', v_classroom_id);
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;


-- Task 6: Transaction-safe submit_student_assignment
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

  -- Insert submission
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

  -- Log event
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

  RETURN jsonb_build_object('success', true, 'submission_id', v_submission_id, 'classroom_id', v_classroom_id);
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;


-- Task 6: Transaction-safe grade_student_submission
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

  -- 6. Award XP
  -- Fetch existing reward
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


-- Task 1: Atomic increment RPC for rewards client-side fallback
CREATE OR REPLACE FUNCTION public.increment_profile_xp(
  p_user_id uuid,
  p_xp_delta integer,
  p_current_streak integer,
  p_longest_streak integer
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_user_id != auth.uid() THEN
    RAISE EXCEPTION 'Unauthorized: Caller identity does not match kid profile ID';
  END IF;

  UPDATE public.profile
  SET total_experience_points = COALESCE(total_experience_points, 0) + p_xp_delta,
      current_streak = p_current_streak,
      longest_streak = p_longest_streak,
      updated_at = now()
  WHERE user_id = p_user_id;

  RETURN jsonb_build_object('success', true);
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

COMMIT;

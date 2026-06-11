BEGIN;

-- =========================================================================
-- 1. ADDITIVE HELPER FUNCTIONS
-- =========================================================================

-- Helper to check if two users share a classroom link (student/teacher relationship)
CREATE OR REPLACE FUNCTION public.are_classroom_linked(p_user_a uuid, p_user_b uuid)
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
    WHERE (c.teacher_user_id = p_user_a AND cm.student_user_id = p_user_b AND c.deleted_at IS NULL)
       OR (c.teacher_user_id = p_user_b AND cm.student_user_id = p_user_a AND c.deleted_at IS NULL)
  );
$$;

-- =========================================================================
-- 2. ENABLE ROW LEVEL SECURITY (RLS) ON ORPHANED TABLES
-- =========================================================================
ALTER TABLE IF EXISTS public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.subscriptions_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.kid_permissions_default ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.activity_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.safety_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.ai_request_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.whole_usage_tracking ENABLE ROW LEVEL SECURITY;

-- =========================================================================
-- 3. CREATE SECURITY POLICIES FOR SECURED TABLES
-- =========================================================================

-- subscriptions
DROP POLICY IF EXISTS subscriptions_select ON public.subscriptions;
CREATE POLICY subscriptions_select ON public.subscriptions
  FOR SELECT TO authenticated
  USING (
    user_id = auth.uid() 
    OR EXISTS (
      SELECT 1 FROM public.parent_child_link pcl
      WHERE pcl.parent_user_id = auth.uid() 
        AND pcl.child_user_id = public.subscriptions.user_id 
        AND pcl.is_approved = true 
        AND pcl.is_active = true
        AND pcl.deleted_at IS NULL
    )
  );

-- subscriptions_plans
DROP POLICY IF EXISTS plans_select ON public.subscriptions_plans;
CREATE POLICY plans_select ON public.subscriptions_plans
  FOR SELECT TO authenticated
  USING (true);

-- kid_permissions_default
DROP POLICY IF EXISTS kid_permissions_default_select ON public.kid_permissions_default;
CREATE POLICY kid_permissions_default_select ON public.kid_permissions_default
  FOR SELECT TO authenticated
  USING (true);

-- activity_templates
DROP POLICY IF EXISTS activity_templates_select ON public.activity_templates;
CREATE POLICY activity_templates_select ON public.activity_templates
  FOR SELECT TO authenticated
  USING (true);

-- safety_alerts
DROP POLICY IF EXISTS safety_alerts_select ON public.safety_alerts;
CREATE POLICY safety_alerts_select ON public.safety_alerts
  FOR SELECT TO authenticated
  USING (
    user_id = auth.uid() 
    OR EXISTS (
      SELECT 1 FROM public.parent_child_link pcl
      WHERE pcl.parent_user_id = auth.uid() 
        AND pcl.child_user_id = public.safety_alerts.user_id 
        AND pcl.is_approved = true 
        AND pcl.is_active = true
        AND pcl.deleted_at IS NULL
    )
  );

DROP POLICY IF EXISTS safety_alerts_insert ON public.safety_alerts;
CREATE POLICY safety_alerts_insert ON public.safety_alerts
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS safety_alerts_update ON public.safety_alerts;
CREATE POLICY safety_alerts_update ON public.safety_alerts
  FOR UPDATE TO authenticated
  USING (
    user_id = auth.uid() 
    OR EXISTS (
      SELECT 1 FROM public.parent_child_link pcl
      WHERE pcl.parent_user_id = auth.uid() 
        AND pcl.child_user_id = public.safety_alerts.user_id 
        AND pcl.is_approved = true 
        AND pcl.is_active = true
        AND pcl.deleted_at IS NULL
    )
  )
  WITH CHECK (resolved = true);

-- ai_request_logs
DROP POLICY IF EXISTS ai_logs_select ON public.ai_request_logs;
CREATE POLICY ai_logs_select ON public.ai_request_logs
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS ai_logs_insert ON public.ai_request_logs;
CREATE POLICY ai_logs_insert ON public.ai_request_logs
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- whole_usage_tracking
DROP POLICY IF EXISTS usage_select ON public.whole_usage_tracking;
CREATE POLICY usage_select ON public.whole_usage_tracking
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- =========================================================================
-- 4. HARDEN OVERLY PERMISSIVE NOTIFICATION POLICIES
-- =========================================================================

-- notifications
DROP POLICY IF EXISTS notifications_insert ON public.notifications;
CREATE POLICY notifications_insert ON public.notifications
  FOR INSERT TO authenticated
  WITH CHECK (
    recipient_user_id = auth.uid()
    OR public.are_classroom_linked(auth.uid(), recipient_user_id)
  );

-- parent_notifications
DROP POLICY IF EXISTS insert_authenticated ON public.parent_notifications;
CREATE POLICY insert_authenticated ON public.parent_notifications
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.parent_child_link pcl
      WHERE pcl.parent_user_id = parent_id 
        AND pcl.child_user_id = auth.uid() 
        AND pcl.is_approved = true 
        AND pcl.is_active = true
        AND pcl.deleted_at IS NULL
    )
  );

-- =========================================================================
-- 5. HARDEN SEARCH PATHS ON TRIGGER & UTILITY SECURITY DEFINER FUNCTIONS
-- =========================================================================
ALTER FUNCTION public.handle_new_user() SET search_path = public;
ALTER FUNCTION public.handle_parent_child_link_activation() SET search_path = public;
ALTER FUNCTION public.increment_screen_time(p_child_id UUID, p_date DATE, p_seconds INT) SET search_path = public;

-- =========================================================================
-- 6. SECURE RPC INVOCATION WITH IDENTITY CHECKS & SEARCH PATHS
-- =========================================================================
CREATE OR REPLACE FUNCTION public.get_child_chat_sessions(p_parent_id uuid, p_child_id uuid)
RETURNS TABLE (
  id uuid,
  title varchar,
  created_at timestamp
) 
LANGUAGE plpgsql
SECURITY DEFINER 
SET search_path = public AS $$
BEGIN
  IF p_parent_id != auth.uid() THEN
    RAISE EXCEPTION 'Unauthorized: Caller identity does not match parent ID';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.parent_child_link pcl
    WHERE pcl.parent_user_id = p_parent_id
      AND pcl.child_user_id = p_child_id
      AND pcl.is_approved IS TRUE
      AND pcl.is_active IS TRUE
      AND pcl.deleted_at IS NULL
  ) THEN
    RETURN QUERY
    SELECT cs.id, cs.title, cs.created_at::timestamp
    FROM public.chat_sessions cs
    WHERE cs.user_id = p_child_id
      AND cs.deleted_at IS NULL
    ORDER BY cs.created_at DESC;
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_parent_session_messages(p_parent_id uuid, p_session_id uuid)
RETURNS TABLE (
  id uuid,
  user_id uuid,
  session_id uuid,
  sender_role public.sender_role,
  content text,
  token_used integer,
  response_time_ms integer,
  generated_by_model varchar,
  is_flagged boolean,
  attachment_url varchar,
  created_at timestamp,
  updated_at timestamp,
  deleted_at timestamp
) 
LANGUAGE plpgsql
SECURITY DEFINER 
SET search_path = public AS $$
DECLARE
  v_child_id uuid;
BEGIN
  IF p_parent_id != auth.uid() THEN
    RAISE EXCEPTION 'Unauthorized: Caller identity does not match parent ID';
  END IF;

  SELECT cs.user_id INTO v_child_id
  FROM public.chat_sessions cs
  WHERE cs.id = p_session_id
    AND cs.deleted_at IS NULL;

  IF EXISTS (
    SELECT 1 FROM public.parent_child_link pcl
    WHERE pcl.parent_user_id = p_parent_id
      AND pcl.child_user_id = v_child_id
      AND pcl.is_approved IS TRUE
      AND pcl.is_active IS TRUE
      AND pcl.deleted_at IS NULL
  ) THEN
    RETURN QUERY
    SELECT 
      cm.id, 
      cm.user_id, 
      cm.session_id, 
      cm.sender_role, 
      cm.content, 
      cm.token_used, 
      cm.response_time_ms,
      cm.generated_by_model,
      cm.is_flagged,
      cm.attachment_url,
      cm.created_at::timestamp, 
      cm.updated_at::timestamp, 
      cm.deleted_at::timestamp
    FROM public.chat_messages cm
    WHERE cm.session_id = p_session_id
      AND cm.deleted_at IS NULL
    ORDER BY cm.created_at ASC;
  END IF;
END;
$$;

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
  v_current_xp int;
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

  SELECT total_experience_points, current_streak, longest_streak 
  INTO v_current_xp, v_current_streak, v_longest_streak
  FROM public.profile
  WHERE user_id = p_user_id;

  IF v_current_xp IS NULL THEN v_current_xp := 0; END IF;
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

  UPDATE public.profile SET
    total_experience_points = v_current_xp + v_actual_xp,
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

COMMIT;

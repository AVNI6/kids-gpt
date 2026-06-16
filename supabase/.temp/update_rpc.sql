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

CREATE OR REPLACE FUNCTION public.save_kid_activity_progress(
  p_user_id uuid,
  p_activity_slug varchar,
  p_activity_title varchar,
  p_score_str varchar,
  p_timezone varchar DEFAULT 'Asia/Kolkata'
) RETURNS json AS $$
DECLARE
  v_activity_id uuid;
  v_activity_title varchar;
  v_xp_reward int;
  v_actual_xp int;
  v_score int;
  v_current_xp int;
  v_longest_streak int;
  v_new_streak int;
  v_today date;
  v_description varchar;
  v_response json;
  v_tz varchar;
BEGIN
  -- 1. Validate and fallback timezone to prevent runtime database exceptions
  v_tz := p_timezone;
  IF v_tz IS NULL OR NOT EXISTS (SELECT 1 FROM pg_timezone_names WHERE name = v_tz) THEN
    v_tz := 'Asia/Kolkata';
  END IF;

  -- Convert UTC now() to user local date
  v_today := (timezone(v_tz, now()))::date;

  -- 2. Row lock the profile row immediately to eliminate lost update race conditions
  SELECT total_experience_points, longest_streak 
  INTO v_current_xp, v_longest_streak
  FROM public.profile
  WHERE user_id = p_user_id
  FOR UPDATE;

  IF v_current_xp IS NULL THEN
    v_current_xp := 0;
  END IF;
  IF v_longest_streak IS NULL THEN
    v_longest_streak := 0;
  END IF;

  -- 3. Resolve the activity settings record
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
    v_xp_reward := 100; -- Default fallback
  END IF;

  IF v_activity_title IS NULL THEN
    v_activity_title := coalesce(p_activity_title, p_activity_slug);
  END IF;

  -- 4. Idempotency Check: Ignore duplicate completions submitted within 5 seconds
  IF v_activity_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.rewards
    WHERE user_id = p_user_id
      AND source_id = v_activity_id
      AND created_at >= now() - INTERVAL '5 seconds'
  ) THEN
    RETURN json_build_object(
      'success', true,
      'xp_earned', 0,
      'score', v_score,
      'message', 'Duplicate completion ignored'
    );
  END IF;

  -- 5. Parse the completion score
  IF p_score_str IS NOT NULL THEN
    BEGIN
      v_score := substring(p_score_str from '([0-9]+)')::integer;
    EXCEPTION WHEN OTHERS THEN
      v_score := NULL;
    END;
  END IF;

  -- 6. Calculate score-based XP rewards
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

  -- 7. Insert the activity reward record
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

  -- 8. Compute local timezone-aware learning streak dynamically from history
  -- The recursive CTE starts counting consecutive days backwards ending on today/yesterday.
  WITH RECURSIVE active_dates AS (
    SELECT DISTINCT (timezone(v_tz, created_at))::date AS active_date
    FROM public.rewards
    WHERE user_id = p_user_id AND source_id IS NOT NULL
  ),
  anchor_date AS (
    SELECT active_date
    FROM active_dates
    WHERE active_date = v_today OR active_date = v_today - 1
    ORDER BY active_date DESC
    LIMIT 1
  ),
  streak_calc AS (
    SELECT active_date, 1 AS run_length
    FROM anchor_date

    UNION ALL

    SELECT d.active_date, s.run_length + 1
    FROM streak_calc s
    JOIN active_dates d ON d.active_date = s.active_date - 1
  )
  SELECT coalesce(MAX(run_length), 0) INTO v_new_streak
  FROM streak_calc;

  -- Enforce longest streak preservation
  IF v_new_streak > v_longest_streak THEN
    v_longest_streak := v_new_streak;
  END IF;

  -- 9. Update profile values
  UPDATE public.profile SET
    total_experience_points = v_current_xp + v_actual_xp,
    current_streak = v_new_streak,
    longest_streak = v_longest_streak,
    updated_at = now()
  WHERE user_id = p_user_id;

  v_response := json_build_object(
    'success', true,
    'xp_earned', v_actual_xp,
    'score', v_score,
    'current_streak', v_new_streak,
    'longest_streak', v_longest_streak
  );
  
  RETURN v_response;

EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object(
    'success', false,
    'error', SQLERRM
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
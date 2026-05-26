-- Migration: Relational Rewards Architecture Refactor
-- Date: 2026-05-26 UTC

BEGIN;

-- Step 1: Safely backfill source_id and source_type dynamically using a CTE
WITH mapping AS (
  SELECT id, slug, title FROM public.activity_settings
)
UPDATE public.rewards r
SET 
  source_id = m.id,
  source_type = m.slug
FROM mapping m
WHERE 
  r.source_id IS NULL AND (
    (r.description ILIKE '%Match Pairs%' AND m.slug = 'match-following') OR
    (r.description ILIKE '%Dynamic Match%' AND m.slug = 'match-following') OR
    (r.description ILIKE '%Quiz%' AND m.slug = 'quizzes') OR
    (r.description ILIKE '%Word Scramble%' AND m.slug = 'word-scrambles') OR
    (r.description ILIKE '%memory-match%' AND m.slug = 'memory-match') OR
    (r.description ILIKE '%Memory Match%' AND m.slug = 'memory-match') OR
    (r.description ILIKE '%Logic Puzzle%' AND m.slug = 'logic-puzzles') OR
    (r.description ILIKE '%Science Lab%' AND m.slug = 'science-lab') OR
    (r.description ILIKE '%Math Challenge%' AND m.slug = 'math-challenges') OR
    (r.description ILIKE '%Jigsaw%' AND m.slug = 'jigsaw-puzzle') OR
    (r.description ILIKE '%Mastered%' AND m.slug = 'flashcards') OR
    (r.description ILIKE '%' || m.title || '%')
  );

-- Step 2: Enforce Relational Integrity
ALTER TABLE public.rewards
DROP CONSTRAINT IF EXISTS rewards_source_id_fkey;

ALTER TABLE public.rewards
ADD CONSTRAINT rewards_source_id_fkey
FOREIGN KEY (source_id) REFERENCES public.activity_settings(id) ON DELETE SET NULL;

-- Step 3: Update save_kid_activity_progress RPC
CREATE OR REPLACE FUNCTION public.save_kid_activity_progress(
  p_user_id uuid,
  p_activity_slug varchar,
  p_activity_title varchar,
  p_score_str varchar,
  p_timezone varchar DEFAULT 'Asia/Kolkata'
) RETURNS json AS $$
DECLARE
  v_activity_id uuid;
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
  -- 1. Get base XP reward and ID from activity_settings
  SELECT id, xp_reward INTO v_activity_id, v_xp_reward 
  FROM public.activity_settings 
  WHERE slug = p_activity_slug;
  
  IF v_xp_reward IS NULL THEN
    v_xp_reward := 100; -- Default fallback
  END IF;

  -- 2. Parse score percentage from the string (e.g. "80%" -> 80)
  IF p_score_str IS NOT NULL THEN
    BEGIN
      v_score := substring(p_score_str from '([0-9]+)')::integer;
    EXCEPTION WHEN OTHERS THEN
      v_score := NULL;
    END;
  END IF;

  -- 3. Calculate score-based XP reward
  IF v_score IS NOT NULL THEN
    IF v_score = 100 THEN
      v_actual_xp := v_xp_reward;
    ELSE
      v_actual_xp := round(v_xp_reward * (v_score::float / 100.0));
    END IF;
  ELSE
    v_actual_xp := v_xp_reward;
  END IF;

  -- Ensure XP is non-negative
  v_actual_xp := greatest(0, v_actual_xp);

  -- 4. Get profile details
  SELECT total_experience_points, current_streak, longest_streak 
  INTO v_current_xp, v_current_streak, v_longest_streak
  FROM public.profile
  WHERE user_id = p_user_id;

  IF v_current_xp IS NULL THEN
    v_current_xp := 0;
  END IF;
  IF v_current_streak IS NULL THEN
    v_current_streak := 0;
  END IF;
  IF v_longest_streak IS NULL THEN
    v_longest_streak := 0;
  END IF;

  -- 5. Calculate streak logic (timezone-aware)
  v_today := (timezone(p_timezone, now()))::date;
  
  SELECT (timezone(p_timezone, created_at))::date INTO v_last_activity_date
  FROM public.rewards
  WHERE user_id = p_user_id AND source_type = 'activity'
  ORDER BY created_at DESC
  LIMIT 1;

  IF v_last_activity_date IS NOT NULL THEN
    IF v_last_activity_date = v_today THEN
      -- Activity completed today, maintain streak
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

  -- 6. Insert reward record
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
    p_activity_slug,
    v_description,
    v_score
  );

  -- 7. Update profile
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 4: Update upsert_memory_reward RPC
CREATE OR REPLACE FUNCTION public.upsert_memory_reward(
  p_user_id     UUID,
  p_world_id    INT,
  p_step_number INT,
  p_xp_earned   INT,
  p_score_str   TEXT
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_reward_id  UUID;
  v_current_xp INT;
  v_new_desc   TEXT;
  v_prefix     TEXT;
  v_activity_id UUID;
BEGIN
  -- Fetch the memory match activity setting id
  SELECT id INTO v_activity_id FROM public.activity_settings WHERE slug = 'memory-match';

  -- Build the LIKE prefix to identify this world's reward row
  v_prefix := 'Completed memory-match-w' || p_world_id || '-%';

  -- Build the new description for the completed step
  v_new_desc :=
    'Completed memory-match-w' ||
    p_world_id ||
    '-s' ||
    p_step_number ||
    ' (Score: ' || p_score_str || ')';

  -- Look up any existing reward row for this user + this World
  SELECT id, rewards_amount
  INTO v_reward_id, v_current_xp
  FROM public.rewards
  WHERE user_id    = p_user_id
    AND source_type = 'activity'
    AND description LIKE v_prefix
  ORDER BY created_at DESC
  LIMIT 1;

  IF v_reward_id IS NOT NULL THEN
    -- Row exists → UPDATE: accumulate XP + refresh description + bump updated_at
    UPDATE public.rewards
    SET
      description    = v_new_desc,
      rewards_amount = v_current_xp + p_xp_earned,
      source_id      = v_activity_id,
      source_type    = 'memory-match',
      updated_at     = NOW()
    WHERE id = v_reward_id;
  ELSE
    -- No row yet → INSERT the first reward row for this World
    INSERT INTO public.rewards (
      user_id,
      rewards_amount,
      source_id,
      source_type,
      description,
      created_at,
      updated_at
    )
    VALUES (
      p_user_id,
      p_xp_earned,
      v_activity_id,
      'memory-match',
      v_new_desc,
      NOW(),
      NOW()
    );
  END IF;
END;
$$;

COMMIT;

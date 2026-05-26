-- Migration: Create activity_settings table and seed XP rewards, add score & minutes columns, and add save_kid_activity_progress RPC
-- Date: 2026-05-21 13:06:00 UTC

BEGIN;

-- Create activity_settings table
CREATE TABLE IF NOT EXISTS public.activity_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug varchar UNIQUE NOT NULL,
  title varchar NOT NULL,
  xp_reward int NOT NULL,
  minutes int DEFAULT 10 NOT NULL,
  created_at timestamp WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at timestamp WITH TIME ZONE DEFAULT now() NOT NULL,
  deleted_at timestamp WITH TIME ZONE
);

-- Ensure minutes column exists if the table was already created in a previous deployment
ALTER TABLE public.activity_settings ADD COLUMN IF NOT EXISTS minutes integer DEFAULT 10 NOT NULL;

-- Ensure score column exists in rewards table
ALTER TABLE public.rewards ADD COLUMN IF NOT EXISTS score integer;

-- Add index on slug for fast selection
CREATE INDEX IF NOT EXISTS activity_settings_slug_idx ON public.activity_settings (slug);

-- Add updated_at trigger
DROP TRIGGER IF EXISTS activity_settings_set_updated_at ON public.activity_settings;
CREATE TRIGGER activity_settings_set_updated_at
BEFORE UPDATE ON public.activity_settings
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

-- Enable Row Level Security (RLS)
ALTER TABLE public.activity_settings ENABLE ROW LEVEL SECURITY;

-- Drop existing SELECT policy if it exists
DROP POLICY IF EXISTS activity_settings_select_all ON public.activity_settings;

-- Policy: Anyone can SELECT activity settings (read-only for all users)
CREATE POLICY activity_settings_select_all
  ON public.activity_settings
  FOR SELECT
  USING (true);

-- Seed values for the 9 games including their dynamic minutes
INSERT INTO public.activity_settings (slug, title, xp_reward, minutes) VALUES
  ('flashcards', 'Flashcards Master', 100, 5),
  ('quizzes', 'Quizzes Quest', 120, 10),
  ('logic-puzzles', 'Logic Puzzles', 150, 15),
  ('word-scrambles', 'Word Scrambles', 140, 8),
  ('math-challenges', 'Math Challenges', 130, 10),
  ('science-lab', 'Science Lab', 160, 15),
  ('memory-match', 'Memory Match', 80, 5),
  ('color-mixer', 'Color Mixer', 110, 5),
  ('match-following', 'Match Pairs', 90, 7)
ON CONFLICT (slug) DO UPDATE 
SET title = EXCLUDED.title, xp_reward = EXCLUDED.xp_reward, minutes = EXCLUDED.minutes, updated_at = now();

-- RPC Function: save_kid_activity_progress
CREATE OR REPLACE FUNCTION public.save_kid_activity_progress(
  p_user_id uuid,
  p_activity_slug varchar,
  p_activity_title varchar,
  p_score_str varchar,
  p_timezone varchar DEFAULT 'Asia/Kolkata'
) RETURNS json AS $$
DECLARE
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
  -- 1. Get base XP reward from activity_settings
  SELECT xp_reward INTO v_xp_reward 
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
  -- If score is all correct 100% then full XP points, else proportionally based on the score percentage
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
    source_type,
    description,
    score
  ) VALUES (
    p_user_id,
    v_actual_xp,
    'activity',
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

COMMIT;

-- Migration: Create activity_settings table and seed XP rewards
-- Date: 2026-05-21 13:06:00 UTC

BEGIN;

-- Create activity_settings table
CREATE TABLE IF NOT EXISTS public.activity_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug varchar UNIQUE NOT NULL,
  title varchar NOT NULL,
  xp_reward int NOT NULL,
  created_at timestamp WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at timestamp WITH TIME ZONE DEFAULT now() NOT NULL,
  deleted_at timestamp WITH TIME ZONE
);

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

-- Seed values for the 9 games
INSERT INTO public.activity_settings (slug, title, xp_reward) VALUES
  ('flashcards', 'Flashcards Master', 100),
  ('quizzes', 'Quizzes Quest', 120),
  ('logic-puzzles', 'Logic Puzzles', 150),
  ('word-scrambles', 'Word Scrambles', 140),
  ('math-challenges', 'Math Challenges', 130),
  ('science-lab', 'Science Lab', 160),
  ('memory-match', 'Memory Match', 80),
  ('color-mixer', 'Color Mixer', 110),
  ('match-following', 'Match Pairs', 90)
ON CONFLICT (slug) DO UPDATE 
SET title = EXCLUDED.title, xp_reward = EXCLUDED.xp_reward, updated_at = now();

COMMIT;

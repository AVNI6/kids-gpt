-- Migration: Hybrid Presence-Based Screen Time sessions
-- Date: 2026-05-28 UTC

BEGIN;

-- 1. Create screen_time_sessions table
CREATE TABLE IF NOT EXISTS public.screen_time_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id UUID NOT NULL REFERENCES public.profile(user_id) ON DELETE CASCADE,
  parent_id UUID NOT NULL REFERENCES public.profile(user_id) ON DELETE CASCADE,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at TIMESTAMPTZ,
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  status TEXT NOT NULL CHECK (status IN ('ACTIVE', 'COMPLETED')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Create performance indexes
CREATE INDEX IF NOT EXISTS idx_screen_time_sessions_child_id ON public.screen_time_sessions (child_id);
CREATE INDEX IF NOT EXISTS idx_screen_time_sessions_parent_id ON public.screen_time_sessions (parent_id);
CREATE INDEX IF NOT EXISTS idx_screen_time_sessions_status ON public.screen_time_sessions (status);
CREATE INDEX IF NOT EXISTS idx_screen_time_sessions_started_at ON public.screen_time_sessions (started_at);

-- 3. Enable Row-Level Security
ALTER TABLE public.screen_time_sessions ENABLE ROW LEVEL SECURITY;

-- 4. Drop existing policies to avoid duplicates
DROP POLICY IF EXISTS select_screen_time_sessions ON public.screen_time_sessions;
DROP POLICY IF EXISTS insert_screen_time_sessions ON public.screen_time_sessions;
DROP POLICY IF EXISTS update_screen_time_sessions ON public.screen_time_sessions;

-- 5. Define RLS Policies
-- Allow children to view their own sessions; parents can view sessions of connected kids
CREATE POLICY select_screen_time_sessions
  ON public.screen_time_sessions
  FOR SELECT
  TO authenticated
  USING (
    child_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.parent_child_link pcl
      WHERE pcl.parent_user_id = auth.uid()
        AND pcl.child_user_id = public.screen_time_sessions.child_id
        AND pcl.is_approved IS TRUE
        AND pcl.is_active IS TRUE
        AND pcl.deleted_at IS NULL
    )
  );

-- Kids can start their own sessions
CREATE POLICY insert_screen_time_sessions
  ON public.screen_time_sessions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    child_id = auth.uid()
  );

-- Kids can update heartbeats / end their own sessions
CREATE POLICY update_screen_time_sessions
  ON public.screen_time_sessions
  FOR UPDATE
  TO authenticated
  USING (
    child_id = auth.uid()
  )
  WITH CHECK (
    child_id = auth.uid()
  );

-- 6. Add screen_time_sessions to Supabase Realtime publication
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.screen_time_sessions;
  END IF;
EXCEPTION
  WHEN OTHERS THEN NULL;
END $$;

COMMIT;

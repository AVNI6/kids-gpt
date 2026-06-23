-- Migration: Add recover_stale_screen_time_sessions RPC and cron cleanup job
-- Date: 2026-06-22 UTC

BEGIN;

-- 1. Create stale session recovery function
CREATE OR REPLACE FUNCTION public.recover_stale_screen_time_sessions()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_updated_rows INTEGER;
BEGIN
  UPDATE public.screen_time_sessions
  SET status = 'COMPLETED',
      ended_at = last_seen_at
  WHERE status = 'ACTIVE'
    AND last_seen_at < (now() - INTERVAL '2 minutes');
    
  GET DIAGNOSTICS v_updated_rows = ROW_COUNT;
  RETURN v_updated_rows;
END;
$$;

-- 2. Schedule pg_cron job if pg_cron extension exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    -- Unscheduling existing job if it exists to prevent duplication
    PERFORM cron.unschedule('recover-stale-screen-time-sessions');
  END IF;
EXCEPTION
  WHEN OTHERS THEN NULL;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    PERFORM cron.schedule(
      'recover-stale-screen-time-sessions',
      '*/2 * * * *', -- Run every 2 minutes
      'SELECT public.recover_stale_screen_time_sessions()'
    );
  END IF;
EXCEPTION
  WHEN OTHERS THEN NULL;
END $$;

-- 3. Enable realtime for parent_child_link table to handle reactive limit updates
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables 
      WHERE pubname = 'supabase_realtime' 
        AND schemaname = 'public' 
        AND tablename = 'parent_child_link'
    ) THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.parent_child_link;
    END IF;
  END IF;
EXCEPTION
  WHEN OTHERS THEN NULL;
END $$;

COMMIT;

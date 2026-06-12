-- Migration: Add Screen Time Tracking and Parental Limits
-- Date: 2026-05-27 UTC

BEGIN;

-- 1. Add daily_limit_minutes to public.parent_child_link
ALTER TABLE public.parent_child_link
ADD COLUMN IF NOT EXISTS daily_limit_minutes INT NOT NULL DEFAULT 60;

-- 2. Add screen_time_seconds to public.daily_usage_tracking
ALTER TABLE public.daily_usage_tracking
ADD COLUMN IF NOT EXISTS screen_time_seconds INT NOT NULL DEFAULT 0;

-- 3. Ensure daily_usage_tracking has a unique index on (user_id, usage_date) to allow clean upsert
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'daily_usage_tracking_user_id_usage_date_key'
    ) THEN
        ALTER TABLE public.daily_usage_tracking
        ADD CONSTRAINT daily_usage_tracking_user_id_usage_date_key UNIQUE (user_id, usage_date);
    END IF;
END
$$;

-- 4. Enable RLS on daily_usage_tracking if not already enabled
ALTER TABLE public.daily_usage_tracking ENABLE ROW LEVEL SECURITY;

-- 5. Drop existing RLS policies on daily_usage_tracking to avoid duplicates
DROP POLICY IF EXISTS daily_usage_select_own_or_parent ON public.daily_usage_tracking;
DROP POLICY IF EXISTS daily_usage_insert_own ON public.daily_usage_tracking;
DROP POLICY IF EXISTS daily_usage_update_own ON public.daily_usage_tracking;

-- 6. Add policies for daily_usage_tracking
-- Kids can SELECT their own logs; parents can SELECT logs for linked kids
CREATE POLICY daily_usage_select_own_or_parent
  ON public.daily_usage_tracking
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.parent_child_link pcl
      WHERE pcl.parent_user_id = auth.uid()
        AND pcl.child_user_id = public.daily_usage_tracking.user_id
        AND pcl.is_approved IS TRUE
        AND pcl.is_active IS TRUE
        AND pcl.deleted_at IS NULL
    )
  );

-- Kids can INSERT their own logs
CREATE POLICY daily_usage_insert_own
  ON public.daily_usage_tracking
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid()
  );

-- Kids can UPDATE their own logs
CREATE POLICY daily_usage_update_own
  ON public.daily_usage_tracking
  FOR UPDATE
  TO authenticated
  USING (
    user_id = auth.uid()
  )
  WITH CHECK (
    user_id = auth.uid()
  );

COMMIT;

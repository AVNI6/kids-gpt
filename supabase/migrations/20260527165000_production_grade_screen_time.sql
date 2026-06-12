-- Migration: Production-Grade Screen Time Tracking & Safe Lock Enforcement
-- Date: 2026-05-27 UTC

BEGIN;

-- 1. Create Aggregated Daily Screen Time Table
CREATE TABLE IF NOT EXISTS public.daily_screen_time_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id UUID NOT NULL REFERENCES public.profile (user_id) ON DELETE CASCADE,
  usage_date DATE NOT NULL,
  total_seconds INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),
  CONSTRAINT daily_screen_time_usage_child_date_key UNIQUE (child_id, usage_date)
);

-- 2. Enable Row-Level Security
ALTER TABLE public.daily_screen_time_usage ENABLE ROW LEVEL SECURITY;

-- 3. Drop existing policies to avoid duplicates
DROP POLICY IF EXISTS select_screen_time ON public.daily_screen_time_usage;
DROP POLICY IF EXISTS insert_screen_time ON public.daily_screen_time_usage;
DROP POLICY IF EXISTS update_screen_time ON public.daily_screen_time_usage;

-- 4. Set up RLS Policies
-- Kids can SELECT their own screen time; parents can SELECT screen time for their connected kids
CREATE POLICY select_screen_time
  ON public.daily_screen_time_usage
  FOR SELECT
  TO authenticated
  USING (
    child_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.parent_child_link pcl
      WHERE pcl.parent_user_id = auth.uid()
        AND pcl.child_user_id = public.daily_screen_time_usage.child_id
        AND pcl.is_approved IS TRUE
        AND pcl.is_active IS TRUE
        AND pcl.deleted_at IS NULL
    )
  );

-- Kids can INSERT their own screen time
CREATE POLICY insert_screen_time
  ON public.daily_screen_time_usage
  FOR INSERT
  TO authenticated
  WITH CHECK (
    child_id = auth.uid()
  );

-- Kids can UPDATE their own screen time
CREATE POLICY update_screen_time
  ON public.daily_screen_time_usage
  FOR UPDATE
  TO authenticated
  USING (
    child_id = auth.uid()
  )
  WITH CHECK (
    child_id = auth.uid()
  );

-- 5. Create Atomic Increment PostgreSQL Function/RPC
CREATE OR REPLACE FUNCTION public.increment_screen_time(
  p_child_id UUID,
  p_date DATE,
  p_seconds INT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current_user UUID;
  v_role public.user_role;
BEGIN
  v_current_user := auth.uid();
  
  -- Get the role of the caller
  SELECT role INTO v_role FROM public.profile WHERE user_id = v_current_user;
  
  IF v_role IS NULL THEN
    RAISE EXCEPTION 'Unauthorized. Profile not found.';
  END IF;

  -- Kids can only log screen time for themselves
  IF v_role = 'kid' AND v_current_user != p_child_id THEN
    RAISE EXCEPTION 'Unauthorized to log screen time for another child.';
  END IF;
  
  -- Parents can only log screen time for active approved connected kids
  IF v_role = 'parent' THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.parent_child_link
      WHERE parent_user_id = v_current_user
        AND child_user_id = p_child_id
        AND is_active = TRUE
        AND is_approved = TRUE
        AND deleted_at IS NULL
    ) THEN
      RAISE EXCEPTION 'Unauthorized. Parent is not connected to this child.';
    END IF;
  END IF;

  -- Reject absurdly large increments (e.g., > 1 hour) to block client-side API manipulation
  IF p_seconds <= 0 OR p_seconds > 3600 THEN
    RAISE EXCEPTION 'Invalid screen time increment payload.';
  END IF;

  -- Perform safe, atomic atomic UPSERT using PostgreSQL ON CONFLICT clause
  INSERT INTO public.daily_screen_time_usage (child_id, usage_date, total_seconds)
  VALUES (p_child_id, p_date, p_seconds)
  ON CONFLICT (child_id, usage_date)
  DO UPDATE SET
    total_seconds = public.daily_screen_time_usage.total_seconds + EXCLUDED.total_seconds,
    updated_at = now();

  RETURN json_build_object('success', true);
END;
$$;

COMMIT;

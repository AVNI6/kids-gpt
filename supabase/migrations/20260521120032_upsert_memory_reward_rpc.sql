-- Migration: Add SECURITY DEFINER RPC for upserting memory match campaign rewards
-- Date: 2026-05-21 12:00:32 UTC
--
-- PURPOSE:
--   The rewards RLS policies only allow SELECT and INSERT for authenticated users.
--   There is intentionally no UPDATE policy on the rewards table (to prevent
--   arbitrary tampering with reward records).
--
--   The Memory Match campaign needs to UPDATE an existing World row when a kid
--   progresses through steps — accumulating XP and updating the description.
--
--   This SECURITY DEFINER function runs as the DB owner, safely bypassing RLS,
--   and encapsulates the full upsert logic (INSERT first time, UPDATE thereafter)
--   for the 1-row-per-World campaign design.
--
-- SECURITY:
--   - Function is SECURITY DEFINER (runs as owner, bypasses RLS)
--   - Caller is verified as authenticated via the JWT context in the server action
--   - p_user_id must equal auth.uid() — enforced in the TypeScript server action
--   - GRANT only to the `authenticated` role (not anon or public)

BEGIN;

-- Drop old version if it exists so CREATE OR REPLACE works cleanly
DROP FUNCTION IF EXISTS public.upsert_memory_reward(uuid, int, int, int, text);

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
BEGIN
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
      updated_at     = NOW()
    WHERE id = v_reward_id;
  ELSE
    -- No row yet → INSERT the first reward row for this World
    INSERT INTO public.rewards (
      user_id,
      rewards_amount,
      source_type,
      description,
      created_at,
      updated_at
    )
    VALUES (
      p_user_id,
      p_xp_earned,
      'activity',
      v_new_desc,
      NOW(),
      NOW()
    );
  END IF;
END;
$$;

-- Grant EXECUTE to authenticated users so Supabase client can call it via .rpc()
GRANT EXECUTE ON FUNCTION public.upsert_memory_reward(uuid, int, int, int, text)
  TO authenticated;

-- Revoke from anon to ensure unauthenticated callers cannot invoke it
REVOKE EXECUTE ON FUNCTION public.upsert_memory_reward(uuid, int, int, int, text)
  FROM anon;

COMMIT;

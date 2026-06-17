-- Migration: Update upsert_memory_reward RPC to return reward_id
-- Date: 2026-06-17 12:02:00 UTC
--
-- PURPOSE:
--   The current function returns void. We change it to return the UUID of the
--   upserted rewards row so the TypeScript server action can link the activity_reviews
--   record to it without an additional query.
--
-- CHANGE:
--   - RETURNS void → RETURNS uuid
--   - Capture id after INSERT, return v_reward_id in both branches

BEGIN;

-- Drop old signature (void return type cannot be replaced with a different type)
DROP FUNCTION IF EXISTS public.upsert_memory_reward(uuid, int, int, int, text);

CREATE OR REPLACE FUNCTION public.upsert_memory_reward(
  p_user_id     UUID,
  p_world_id    INT,
  p_step_number INT,
  p_xp_earned   INT,
  p_score_str   TEXT
)
RETURNS uuid
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
    -- v_reward_id already holds the existing row's id
  ELSE
    -- No row yet → INSERT the first reward row for this World; capture the new id
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
    )
    RETURNING id INTO v_reward_id;
  END IF;

  RETURN v_reward_id;
END;
$$;

-- Grant EXECUTE to authenticated users so Supabase client can call it via .rpc()
GRANT EXECUTE ON FUNCTION public.upsert_memory_reward(uuid, int, int, int, text)
  TO authenticated;

-- Revoke from anon to ensure unauthenticated callers cannot invoke it
REVOKE EXECUTE ON FUNCTION public.upsert_memory_reward(uuid, int, int, int, text)
  FROM anon;

COMMIT;

-- Migration: Redefine rewards index to be non-partial
-- Date: 2026-06-10 16:50:00

BEGIN;

DROP INDEX IF EXISTS public.idx_rewards_user_updated;

CREATE INDEX IF NOT EXISTS idx_rewards_user_updated 
ON public.rewards (user_id, updated_at DESC, created_at DESC);

COMMIT;

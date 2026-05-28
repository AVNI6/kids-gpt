-- Migration: Add is_screen_time_limit_enabled to parent_child_link
-- Date: 2026-05-27 UTC

BEGIN;

ALTER TABLE public.parent_child_link
ADD COLUMN IF NOT EXISTS is_screen_time_limit_enabled BOOLEAN NOT NULL DEFAULT false;

COMMIT;

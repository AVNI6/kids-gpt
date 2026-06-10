-- Migration: Add summary metadata columns to chat_sessions
-- Date: 2026-06-10 12:25:00

ALTER TABLE public.chat_sessions
ADD COLUMN IF NOT EXISTS summary_updated_at timestamptz NULL,
ADD COLUMN IF NOT EXISTS last_summarized_message_count integer DEFAULT 0 NOT NULL,
ADD COLUMN IF NOT EXISTS summary_pending boolean DEFAULT false NOT NULL;

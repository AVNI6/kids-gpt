-- Migration: Add summary column to chat_sessions
-- Date: 2026-06-09 16:05:00

ALTER TABLE public.chat_sessions
ADD COLUMN IF NOT EXISTS summary text NULL;

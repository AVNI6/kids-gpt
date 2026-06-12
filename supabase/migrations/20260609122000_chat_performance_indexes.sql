-- Migration: Add database indexes for chat performance optimization
-- 1. Create index on chat_sessions for fast user session listing
CREATE INDEX IF NOT EXISTS idx_chat_sessions_user_updated
ON public.chat_sessions (
  user_id,
  deleted_at,
  updated_at DESC
);

-- 2. Create index on chat_messages for cursor pagination and query execution speed
CREATE INDEX IF NOT EXISTS idx_chat_messages_session_created
ON public.chat_messages (
  session_id,
  deleted_at,
  created_at DESC,
  id DESC
);

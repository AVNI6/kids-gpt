-- Add status column to chat_messages table to track generation state
ALTER TABLE public.chat_messages
ADD COLUMN status VARCHAR DEFAULT 'completed' CHECK (status IN ('pending', 'streaming', 'completed', 'failed'));

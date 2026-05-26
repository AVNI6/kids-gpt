-- =========================================================
-- CHAT MESSAGES RLS
-- =========================================================

ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "chat_messages_select_own" ON public.chat_messages;
DROP POLICY IF EXISTS "chat_messages_insert_own" ON public.chat_messages;
DROP POLICY IF EXISTS "chat_messages_update_own" ON public.chat_messages;
DROP POLICY IF EXISTS "chat_messages_delete_own" ON public.chat_messages;

-- SELECT
CREATE POLICY "chat_messages_select_own"
ON public.chat_messages
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- INSERT
CREATE POLICY "chat_messages_insert_own"
ON public.chat_messages
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- UPDATE
CREATE POLICY "chat_messages_update_own"
ON public.chat_messages
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- DELETE
CREATE POLICY "chat_messages_delete_own"
ON public.chat_messages
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

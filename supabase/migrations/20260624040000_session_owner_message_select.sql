-- =========================================================
-- Allow session owners to see ALL messages in their session
-- =========================================================
-- When a parent sends a message in a kid's chat session, the
-- message's user_id is the parent's ID. The existing
-- "chat_messages_select_own" policy only allows auth.uid() = user_id,
-- so the kid (session owner) cannot see the parent's messages.
--
-- This policy lets the session owner see every message in
-- their session regardless of who sent it.
-- =========================================================

DROP POLICY IF EXISTS "chat_messages_select_session_owner" ON public.chat_messages;

CREATE POLICY "chat_messages_select_session_owner"
ON public.chat_messages
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.chat_sessions cs
    WHERE cs.id = chat_messages.session_id
      AND cs.user_id = auth.uid()
      AND cs.deleted_at IS NULL
  )
);

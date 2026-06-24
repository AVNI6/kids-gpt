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

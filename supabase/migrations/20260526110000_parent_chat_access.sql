-- =========================================================
-- Parent Chat Access Migrations
-- =========================================================

-- 1. Recreate get_child_chat_sessions with explicit timestamp casting to avoid any type mismatch issues
CREATE OR REPLACE FUNCTION public.get_child_chat_sessions(p_parent_id uuid, p_child_id uuid)
RETURNS TABLE (
  id uuid,
  title varchar,
  created_at timestamp
) SECURITY DEFINER AS $$
BEGIN
  -- Verify the parent-child relationship is approved and active
  IF EXISTS (
    SELECT 1 FROM public.parent_child_link pcl
    WHERE pcl.parent_user_id = p_parent_id
      AND pcl.child_user_id = p_child_id
      AND pcl.is_approved IS TRUE
      AND pcl.deleted_at IS NULL
  ) THEN
    RETURN QUERY
    SELECT cs.id, cs.title, cs.created_at::timestamp
    FROM public.chat_sessions cs
    WHERE cs.user_id = p_child_id
      AND cs.deleted_at IS NULL
    ORDER BY cs.created_at DESC;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- 2. Create get_parent_session_messages security definer RPC to fetch child session messages safely bypassing child RLS
CREATE OR REPLACE FUNCTION public.get_parent_session_messages(p_parent_id uuid, p_session_id uuid)
RETURNS TABLE (
  id uuid,
  user_id uuid,
  session_id uuid,
  sender_role public.sender_role,
  content text,
  token_used integer,
  response_time_ms integer,
  generated_by_model varchar,
  is_flagged boolean,
  attachment_url varchar,
  created_at timestamp,
  updated_at timestamp,
  deleted_at timestamp
) SECURITY DEFINER AS $$
DECLARE
  v_child_id uuid;
BEGIN
  -- Fetch the chat session owner
  SELECT cs.user_id INTO v_child_id
  FROM public.chat_sessions cs
  WHERE cs.id = p_session_id
    AND cs.deleted_at IS NULL;

  -- Verify parent access to this child
  IF EXISTS (
    SELECT 1 FROM public.parent_child_link pcl
    WHERE pcl.parent_user_id = p_parent_id
      AND pcl.child_user_id = v_child_id
      AND pcl.is_approved IS TRUE
      AND pcl.deleted_at IS NULL
  ) THEN
    -- Return the messages
    RETURN QUERY
    SELECT 
      cm.id, 
      cm.user_id, 
      cm.session_id, 
      cm.sender_role, 
      cm.content, 
      cm.token_used, 
      cm.response_time_ms,
      cm.generated_by_model,
      cm.is_flagged,
      cm.attachment_url,
      cm.created_at::timestamp, 
      cm.updated_at::timestamp, 
      cm.deleted_at::timestamp
    FROM public.chat_messages cm
    WHERE cm.session_id = p_session_id
      AND cm.deleted_at IS NULL
    ORDER BY cm.created_at ASC;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- 3. Define parent SELECT RLS policy on chat_sessions as a native direct select fallback
DROP POLICY IF EXISTS "chat_sessions_parent_select" ON public.chat_sessions;
CREATE POLICY "chat_sessions_parent_select" ON public.chat_sessions
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.parent_child_link pcl
    WHERE pcl.parent_user_id = auth.uid()
      AND pcl.child_user_id = chat_sessions.user_id
      AND pcl.is_approved IS TRUE
      AND pcl.deleted_at IS NULL
  )
);

-- 4. Define parent SELECT RLS policy on chat_messages as a native direct select fallback
DROP POLICY IF EXISTS "chat_messages_parent_select" ON public.chat_messages;
CREATE POLICY "chat_messages_parent_select" ON public.chat_messages
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.parent_child_link pcl
    JOIN public.chat_sessions cs ON cs.user_id = pcl.child_user_id
    WHERE pcl.parent_user_id = auth.uid()
      AND cs.id = chat_messages.session_id
      AND pcl.is_approved IS TRUE
      AND pcl.deleted_at IS NULL
      AND cs.deleted_at IS NULL
  )
);

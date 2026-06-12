CREATE TABLE IF NOT EXISTS public.parent_notifications (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid references public.profile (user_id) on delete cascade,
  child_id uuid references public.profile (user_id) on delete cascade,
  type varchar NOT NULL,
  title varchar NOT NULL,
  message varchar NOT NULL,
  is_read boolean default false,
  metadata jsonb default '{}'::jsonb,
  created_at timestamp default now(),
  updated_at timestamp default now(),
  deleted_at timestamp
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.parent_notifications ENABLE ROW LEVEL SECURITY;

-- SELECT: Only parents can read their own notifications
DROP POLICY IF EXISTS select_own ON public.parent_notifications;
CREATE POLICY select_own ON public.parent_notifications
  FOR SELECT TO authenticated USING ((SELECT auth.uid()) = parent_id);

-- INSERT: Authenticated users can insert notifications (so child activities can trigger them)
DROP POLICY IF EXISTS insert_authenticated ON public.parent_notifications;
CREATE POLICY insert_authenticated ON public.parent_notifications
  FOR INSERT TO authenticated WITH CHECK (true);

-- UPDATE: Only parents can update their own notifications (e.g. marking as read)
DROP POLICY IF EXISTS update_own ON public.parent_notifications;
CREATE POLICY update_own ON public.parent_notifications
  FOR UPDATE TO authenticated USING ((SELECT auth.uid()) = parent_id) WITH CHECK ((SELECT auth.uid()) = parent_id);

-- Add parent_notifications to Supabase Realtime publication if not already added
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.parent_notifications;
  END IF;
EXCEPTION
  WHEN OTHERS THEN NULL;
END $$;

-- Create SECURITY DEFINER function to allow parents to fetch child chat sessions securely bypassing child's RLS
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
    SELECT cs.id, cs.title, cs.created_at
    FROM public.chat_sessions cs
    WHERE cs.user_id = p_child_id
      AND cs.deleted_at IS NULL
    ORDER BY cs.created_at DESC;
  END IF;
END;
$$ LANGUAGE plpgsql;


-- Enable DELETE for public.notifications
DROP POLICY IF EXISTS notifications_delete ON public.notifications;
CREATE POLICY notifications_delete ON public.notifications
  FOR DELETE TO authenticated
  USING (recipient_user_id = (SELECT auth.uid()));

-- Enable DELETE for public.parent_notifications
DROP POLICY IF EXISTS parent_notifications_delete ON public.parent_notifications;
CREATE POLICY parent_notifications_delete ON public.parent_notifications
  FOR DELETE TO authenticated
  USING (parent_id = (SELECT auth.uid()));
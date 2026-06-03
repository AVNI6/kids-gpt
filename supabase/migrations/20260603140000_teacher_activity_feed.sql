-- Migration: Teacher Dashboard Pre-Shaped Activity Feed RPC
-- Date: 2026-06-03 14:00:00 UTC

BEGIN;

CREATE OR REPLACE FUNCTION public.get_teacher_activity_feed()
RETURNS jsonb
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_teacher_id uuid;
  v_feed jsonb;
BEGIN
  v_teacher_id := auth.uid();
  
  -- Double check teacher role
  IF NOT EXISTS (
    SELECT 1 FROM public.profile 
    WHERE user_id = v_teacher_id AND role = 'teacher' AND deleted_at IS NULL
  ) THEN
    RAISE EXCEPTION 'Unauthorized: User is not a teacher';
  END IF;

  SELECT coalesce(json_agg(row_to_json(t)), '[]'::json) INTO v_feed
  FROM (
    SELECT 
      ae.id,
      ae.event_type,
      ae.actor_user_id,
      ae.actor_role,
      p_actor.first_name as actor_first_name,
      p_actor.last_name as actor_last_name,
      p_actor.avatar_url as actor_avatar_url,
      ae.target_user_id,
      p_target.first_name as target_first_name,
      p_target.last_name as target_last_name,
      p_target.avatar_url as target_avatar_url,
      ae.source_type,
      ae.source_id,
      ae.metadata,
      ae.created_at,
      c.name as classroom_name,
      c.id as classroom_id
    FROM public.activity_events ae
    -- Join actor profile
    LEFT JOIN public.profile p_actor ON ae.actor_user_id = p_actor.user_id AND p_actor.deleted_at IS NULL
    -- Join target profile
    LEFT JOIN public.profile p_target ON ae.target_user_id = p_target.user_id AND p_target.deleted_at IS NULL
    -- Join classrooms to resolve classroom name using metadata or source_id
    LEFT JOIN public.classrooms c ON (
      (ae.target_type = 'classroom' AND ae.source_id = c.id)
      OR
      (ae.metadata->>'classroom_id')::uuid = c.id
    )
    WHERE (
      -- Event actor is the teacher OR target is the teacher
      ae.actor_user_id = v_teacher_id
      OR ae.target_user_id = v_teacher_id
      OR (
        -- Target is a classroom managed by this teacher
        c.teacher_user_id = v_teacher_id AND c.deleted_at IS NULL
      )
    )
    ORDER BY ae.created_at DESC
    LIMIT 20
  ) t;

  RETURN v_feed;
END;
$$;

COMMIT;

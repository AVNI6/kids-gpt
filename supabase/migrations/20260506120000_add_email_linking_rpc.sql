-- 2026-05-06 12:00:00 UTC
-- Migration: Add RPC to link users by email for parent-child relationships

-- Creates a safe, idempotent function to link users by email.
-- Inputs:
--   p_current_user_id UUID
--   p_target_email VARCHAR
-- Returns JSONB with status and message.

CREATE OR REPLACE FUNCTION public.link_users_by_email(
  p_current_user_id uuid,
  p_target_email varchar
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  current_role text;
  target_profile RECORD;
BEGIN
  -- Lookup current user's role
  SELECT role
  INTO current_role
  FROM public.profile
  WHERE user_id = p_current_user_id
    AND deleted_at IS NULL
  LIMIT 1;

  IF current_role IS NULL THEN
    RETURN jsonb_build_object('status','error','message','Current user not found or missing role');
  END IF;

  -- Lookup target user by email (case-insensitive)
  SELECT user_id, role
  INTO target_profile
  FROM public.profile
  WHERE lower(email) = lower(p_target_email)
    AND deleted_at IS NULL
  LIMIT 1;

  IF NOT FOUND THEN
    -- Target email not registered yet
    RETURN jsonb_build_object('status','pending','message','Target email not registered');
  END IF;

  -- If current is kid and target is parent => insert (parent_user_id=target, child_user_id=current)
  IF current_role = 'kid' AND target_profile.role = 'parent' THEN
    INSERT INTO public.parent_child_link (parent_user_id, child_user_id, is_approved, created_at)
    VALUES (target_profile.user_id, p_current_user_id, false, now())
    ON CONFLICT (parent_user_id, child_user_id) DO NOTHING;

    RETURN jsonb_build_object('status','success','message','Link request created or already exists');

  -- If current is parent and target is kid => insert (parent_user_id=current, child_user_id=target)
  ELSIF current_role = 'parent' AND target_profile.role = 'kid' THEN
    INSERT INTO public.parent_child_link (parent_user_id, child_user_id, is_approved, created_at)
    VALUES (p_current_user_id, target_profile.user_id, false, now())
    ON CONFLICT (parent_user_id, child_user_id) DO NOTHING;

    RETURN jsonb_build_object('status','success','message','Link request created or already exists');
  ELSE
    -- Invalid role combination (e.g., parent->parent, kid->kid, teacher involvement)
    RETURN jsonb_build_object('status','error','message','Invalid role combination for linking');
  END IF;

EXCEPTION WHEN unique_violation THEN
  -- Gracefully handle unique constraint violations
  RETURN jsonb_build_object('status','success','message','Link already exists');
WHEN others THEN
  RETURN jsonb_build_object('status','error','message', SQLERRM);
END;
$$;
-- 2026-05-20 12:00:00 UTC
-- Migration: Fix link_users_by_email RPC role casting and handle not-onboarded targets

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
  -- Lookup current user's role and cast to text
  SELECT role::text
  INTO current_role
  FROM public.profile
  WHERE user_id = p_current_user_id
    AND deleted_at IS NULL
  LIMIT 1;

  IF current_role IS NULL THEN
    RETURN jsonb_build_object('status', 'error', 'message', 'Current user not found or missing role');
  END IF;

  -- Lookup target user by email (case-insensitive), casting role to text
  SELECT user_id, role::text as role, is_onboarded
  INTO target_profile
  FROM public.profile
  WHERE lower(email) = lower(p_target_email)
    AND deleted_at IS NULL
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('status', 'pending', 'message', 'Target email not registered yet');
  END IF;

  -- Check if target is onboarded. If not, they haven't explicitly chosen their final role yet.
  IF target_profile.is_onboarded = false THEN
    RETURN jsonb_build_object('status', 'error', 'message', 'The person you are trying to link with has not finished setting up their account. Please ask them to sign in and complete setup first!');
  END IF;

  -- Parent ↔ Kid linking with is_approved = true (immediate visibility)
  IF current_role = 'kid' AND target_profile.role = 'parent' THEN
    INSERT INTO public.parent_child_link (parent_user_id, child_user_id, is_approved, created_at)
    VALUES (target_profile.user_id, p_current_user_id, true, now())
    ON CONFLICT (parent_user_id, child_user_id) DO NOTHING;

    RETURN jsonb_build_object('status', 'success', 'message', 'Link created successfully!');

  ELSIF current_role = 'parent' AND target_profile.role = 'kid' THEN
    INSERT INTO public.parent_child_link (parent_user_id, child_user_id, is_approved, created_at)
    VALUES (p_current_user_id, target_profile.user_id, true, now())
    ON CONFLICT (parent_user_id, child_user_id) DO NOTHING;

    RETURN jsonb_build_object('status', 'success', 'message', 'Link created successfully!');

  -- Teacher → Kid linking
  ELSIF current_role = 'teacher' AND target_profile.role = 'kid' THEN
    INSERT INTO public.teacher_student_links (teacher_user_id, student_user_id, created_at)
    VALUES (p_current_user_id, target_profile.user_id, now())
    ON CONFLICT (teacher_user_id, student_user_id) DO NOTHING;

    RETURN jsonb_build_object('status', 'success', 'message', 'Student link created successfully!');

  ELSE
    RETURN jsonb_build_object('status', 'error', 'message', 'Cannot link a ' || current_role || ' account with a ' || target_profile.role || ' account.');
  END IF;

EXCEPTION WHEN unique_violation THEN
  RETURN jsonb_build_object('status', 'success', 'message', 'You are already linked with this user!');
WHEN others THEN
  RETURN jsonb_build_object('status', 'error', 'message', SQLERRM);
END;
$$;

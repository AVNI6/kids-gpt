-- Migration: Require Invitation Acceptance & Transactional Acceptance RPC
-- Date: 2026-06-23 UTC

BEGIN;

-- 1. Redefine link_users_by_email to remove parent-caller direct linking
CREATE OR REPLACE FUNCTION public.link_users_by_email(
  p_current_user_id uuid,
  p_target_email varchar
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_current_role text;
  v_target_profile RECORD;
BEGIN
  -- Lookup current user's role and cast to text
  SELECT role::text
  INTO v_current_role
  FROM public.profile
  WHERE user_id = p_current_user_id
    AND deleted_at IS NULL
  LIMIT 1;

  IF v_current_role IS NULL THEN
    RETURN jsonb_build_object('status', 'error', 'message', 'Current user not found or missing role.');
  END IF;

  -- Lookup target user by email (case-insensitive), casting role to text
  SELECT user_id, role::text as role, is_onboarded
  INTO v_target_profile
  FROM public.profile
  WHERE lower(email) = lower(p_target_email)
    AND deleted_at IS NULL
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('status', 'pending', 'message', 'Target email not registered yet.');
  END IF;

  -- Check if target is onboarded. If not, they haven't explicitly chosen their final role yet.
  IF v_target_profile.is_onboarded = false THEN
    RETURN jsonb_build_object('status', 'error', 'message', 'The person you are trying to link with has not finished setting up their account. Please ask them to sign in and complete setup first!');
  END IF;

  -- Kid ↔ Parent linking (initiated by Kid)
  IF v_current_role = 'kid' AND v_target_profile.role = 'parent' THEN
    INSERT INTO public.parent_child_link (parent_user_id, child_user_id, is_approved, created_at, is_active, deleted_at)
    VALUES (v_target_profile.user_id, p_current_user_id, true, now(), true, NULL)
    ON CONFLICT (parent_user_id, child_user_id) DO UPDATE
      SET is_active = true, deleted_at = NULL;

    RETURN jsonb_build_object('status', 'success', 'message', 'Link created successfully!');

  -- Block Parent direct link attempts
  ELSIF v_current_role = 'parent' AND v_target_profile.role = 'kid' THEN
    RETURN jsonb_build_object('status', 'error', 'message', 'Direct linking from parent is not allowed. Please invite the child instead.');

  -- Teacher → Kid linking
  ELSIF v_current_role = 'teacher' AND v_target_profile.role = 'kid' THEN
    INSERT INTO public.teacher_student_links (teacher_user_id, student_user_id, created_at)
    VALUES (p_current_user_id, v_target_profile.user_id, now())
    ON CONFLICT (teacher_user_id, student_user_id) DO NOTHING;

    RETURN jsonb_build_object('status', 'success', 'message', 'Student link created successfully!');

  ELSE
    RETURN jsonb_build_object('status', 'error', 'message', 'Cannot link a ' || v_current_role || ' account with a ' || v_target_profile.role || ' account.');
  END IF;

EXCEPTION WHEN unique_violation THEN
  RETURN jsonb_build_object('status', 'success', 'message', 'You are already linked with this user!');
WHEN others THEN
  RETURN jsonb_build_object('status', 'error', 'message', SQLERRM);
END;
$$;


-- 2. Define accept_child_invitation to handle consent-driven linking transactionally
CREATE OR REPLACE FUNCTION public.accept_child_invitation(
  p_invite_id uuid,
  p_child_user_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_invite RECORD;
  v_parent_email varchar;
  v_child_email varchar;
BEGIN
  -- 1. Fetch and lock invitation row for update to prevent concurrent double-clicks
  SELECT * INTO v_invite
  FROM public.child_invitations
  WHERE id = p_invite_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('status', 'error', 'message', 'Invitation not found.');
  END IF;

  -- 2. Check if already accepted
  IF v_invite.accepted_at IS NOT NULL THEN
    RETURN jsonb_build_object('status', 'success', 'message', 'Invitation already accepted.');
  END IF;

  -- 3. Check if deleted/cancelled
  IF v_invite.deleted_at IS NOT NULL THEN
    RETURN jsonb_build_object('status', 'error', 'message', 'Invitation has been cancelled or declined.');
  END IF;

  -- 4. Check if expired
  IF v_invite.expires_at < now() THEN
    RETURN jsonb_build_object('status', 'error', 'message', 'Invitation has expired.');
  END IF;

  -- 5. Verify the kid email matches the invitee email
  SELECT email INTO v_child_email
  FROM public.profile
  WHERE user_id = p_child_user_id;

  IF v_child_email IS NULL OR lower(v_child_email) != lower(v_invite.invitee_email) THEN
    RETURN jsonb_build_object('status', 'error', 'message', 'This invitation belongs to a different email address.');
  END IF;

  -- 6. Resolve parent's email from profile
  SELECT email INTO v_parent_email
  FROM public.profile
  WHERE user_id = v_invite.parent_id AND deleted_at IS NULL;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('status', 'error', 'message', 'Inviting parent profile not found.');
  END IF;

  -- 7. Insert parent-child link (idempotent with ON CONFLICT)
  INSERT INTO public.parent_child_link (parent_user_id, child_user_id, is_approved, created_at, is_active, deleted_at)
  VALUES (v_invite.parent_id, p_child_user_id, true, now(), true, NULL)
  ON CONFLICT (parent_user_id, child_user_id) DO UPDATE
    SET is_active = true, deleted_at = NULL;

  -- 8. Mark invitation as accepted
  UPDATE public.child_invitations
  SET accepted_at = now()
  WHERE id = p_invite_id;

  RETURN jsonb_build_object('status', 'success', 'message', 'Invitation accepted and link established successfully!');
END;
$$;

COMMIT;

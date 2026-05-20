-- 2026-05-07 12:00:00 UTC
-- Migration: Add constraints, backfill email, create teacher schema, and unify RPC

-- Bug 1: Add UNIQUE constraint to parent_child_link
ALTER TABLE public.parent_child_link 
ADD CONSTRAINT uq_parent_child UNIQUE (parent_user_id, child_user_id);

-- Bug 3: Backfill email from auth.users for legacy users
UPDATE public.profile p
SET email = u.email
FROM auth.users u
WHERE p.user_id = u.id
  AND p.email IS NULL;

-- Bug 9 & 10: Create teacher_student_links table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.teacher_student_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_user_id uuid NOT NULL REFERENCES public.profile(user_id) ON DELETE CASCADE,
  student_user_id uuid NOT NULL REFERENCES public.profile(user_id) ON DELETE CASCADE,
  created_at timestamp DEFAULT now(),
  UNIQUE (teacher_user_id, student_user_id)
);

-- Enable RLS on teacher_student_links
ALTER TABLE public.teacher_student_links ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Teachers can read their own student links
CREATE POLICY "Teachers can read their student links"
ON public.teacher_student_links
FOR SELECT
USING (auth.uid() = teacher_user_id);

-- RLS Policy: Students can read their teacher links
CREATE POLICY "Students can read their teacher links"
ON public.teacher_student_links
FOR SELECT
USING (auth.uid() = student_user_id);

-- Bug 5, 7, 11: Update link_users_by_email RPC to handle all roles
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
    RETURN jsonb_build_object('status', 'error', 'message', 'Current user not found or missing role');
  END IF;

  -- Lookup target user by email (case-insensitive)
  SELECT user_id, role
  INTO target_profile
  FROM public.profile
  WHERE lower(email) = lower(p_target_email)
    AND deleted_at IS NULL
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('status', 'pending', 'message', 'Target email not registered yet');
  END IF;

  -- Bug 5, 7: Parent ↔ Kid linking with is_approved = true (immediate visibility)
  IF current_role = 'kid' AND target_profile.role = 'parent' THEN
    INSERT INTO public.parent_child_link (parent_user_id, child_user_id, is_approved, created_at)
    VALUES (target_profile.user_id, p_current_user_id, true, now())
    ON CONFLICT (parent_user_id, child_user_id) DO NOTHING;

    RETURN jsonb_build_object('status', 'success', 'message', 'Link created or already exists');

  ELSIF current_role = 'parent' AND target_profile.role = 'kid' THEN
    INSERT INTO public.parent_child_link (parent_user_id, child_user_id, is_approved, created_at)
    VALUES (p_current_user_id, target_profile.user_id, true, now())
    ON CONFLICT (parent_user_id, child_user_id) DO NOTHING;

    RETURN jsonb_build_object('status', 'success', 'message', 'Link created or already exists');

  -- Bug 11: Teacher → Kid linking (handled inside RPC to bypass RLS)
  ELSIF current_role = 'teacher' AND target_profile.role = 'kid' THEN
    INSERT INTO public.teacher_student_links (teacher_user_id, student_user_id, created_at)
    VALUES (p_current_user_id, target_profile.user_id, now())
    ON CONFLICT (teacher_user_id, student_user_id) DO NOTHING;

    RETURN jsonb_build_object('status', 'success', 'message', 'Student link created or already exists');

  ELSE
    RETURN jsonb_build_object('status', 'error', 'message', 'Invalid role combination for linking');
  END IF;

EXCEPTION WHEN unique_violation THEN
  RETURN jsonb_build_object('status', 'success', 'message', 'Link already exists');
WHEN others THEN
  RETURN jsonb_build_object('status', 'error', 'message', SQLERRM);
END;
$$;
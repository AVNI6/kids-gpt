-- Migration: Teacher Classroom System (Phase 1 — Isolation & Additive Architecture)
-- Date: 2026-06-02 12:30:00 UTC

BEGIN;

-- =========================================================================
-- 1. SCHEMAS & TABLES
-- =========================================================================

-- classrooms table (soft-delete enabled)
CREATE TABLE IF NOT EXISTS public.classrooms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_user_id uuid NOT NULL REFERENCES public.profile(user_id) ON DELETE CASCADE,
  name varchar NOT NULL,
  description text,
  subject varchar,
  grade varchar,
  class_code varchar UNIQUE NOT NULL,
  is_active boolean DEFAULT true NOT NULL,
  created_at timestamp DEFAULT now() NOT NULL,
  updated_at timestamp DEFAULT now() NOT NULL,
  deleted_at timestamp
);

-- classroom_members table (fully isolated)
CREATE TABLE IF NOT EXISTS public.classroom_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  classroom_id uuid NOT NULL REFERENCES public.classrooms(id) ON DELETE CASCADE,
  student_user_id uuid NOT NULL REFERENCES public.profile(user_id) ON DELETE CASCADE,
  status varchar NOT NULL CHECK (status in ('PENDING', 'APPROVED', 'REJECTED')),
  joined_at timestamp,
  approved_at timestamp,
  created_at timestamp DEFAULT now() NOT NULL,
  updated_at timestamp DEFAULT now() NOT NULL,
  CONSTRAINT uq_classroom_student UNIQUE (classroom_id, student_user_id)
);

-- polymorphic, future-proof notifications table (for kids and teachers)
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_user_id uuid NOT NULL REFERENCES public.profile(user_id) ON DELETE CASCADE,
  recipient_role public.user_role NOT NULL,
  type varchar NOT NULL,
  title varchar NOT NULL,
  message text NOT NULL,
  source_type varchar, -- e.g., 'classroom'
  source_id uuid,      -- e.g., classroom_id
  metadata jsonb DEFAULT '{}'::jsonb NOT NULL,
  is_read boolean DEFAULT false NOT NULL,
  created_at timestamp DEFAULT now() NOT NULL,
  updated_at timestamp DEFAULT now() NOT NULL
);

-- =========================================================================
-- 2. INDEXES
-- =========================================================================
CREATE INDEX IF NOT EXISTS idx_classrooms_teacher ON public.classrooms(teacher_user_id) WHERE deleted_at IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_classrooms_code ON public.classrooms(class_code) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_members_classroom_student ON public.classroom_members(classroom_id, student_user_id);
CREATE INDEX IF NOT EXISTS idx_members_student ON public.classroom_members(student_user_id);

CREATE INDEX IF NOT EXISTS idx_notifications_recipient_unread ON public.notifications(recipient_user_id, is_read);

-- =========================================================================
-- 3. TRIGGERS FOR TIMESTAMPS
-- =========================================================================
DROP TRIGGER IF EXISTS classrooms_set_updated_at ON public.classrooms;
CREATE TRIGGER classrooms_set_updated_at
  BEFORE UPDATE ON public.classrooms
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS classroom_members_set_updated_at ON public.classroom_members;
CREATE TRIGGER classroom_members_set_updated_at
  BEFORE UPDATE ON public.classroom_members
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS notifications_set_updated_at ON public.notifications;
CREATE TRIGGER notifications_set_updated_at
  BEFORE UPDATE ON public.notifications
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- =========================================================================
-- 4. ROW LEVEL SECURITY (RLS)
-- =========================================================================
ALTER TABLE public.classrooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classroom_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Classrooms SELECT: Owner teacher OR approved student
DROP POLICY IF EXISTS classrooms_select ON public.classrooms;
CREATE POLICY classrooms_select ON public.classrooms
  FOR SELECT
  TO authenticated
  USING (
    teacher_user_id = (SELECT auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.classroom_members cm
      WHERE cm.classroom_id = id
        AND cm.student_user_id = (SELECT auth.uid())
        AND cm.status = 'APPROVED'
    )
  );

-- Classrooms INSERT: Teacher only
DROP POLICY IF EXISTS classrooms_insert ON public.classrooms;
CREATE POLICY classrooms_insert ON public.classrooms
  FOR INSERT
  TO authenticated
  WITH CHECK (
    teacher_user_id = (SELECT auth.uid())
    AND public.has_profile_role((SELECT auth.uid()), 'teacher')
  );

-- Classrooms UPDATE: Owner teacher only
DROP POLICY IF EXISTS classrooms_update ON public.classrooms;
CREATE POLICY classrooms_update ON public.classrooms
  FOR UPDATE
  TO authenticated
  USING (
    teacher_user_id = (SELECT auth.uid())
    AND public.has_profile_role((SELECT auth.uid()), 'teacher')
  )
  WITH CHECK (
    teacher_user_id = (SELECT auth.uid())
    AND public.has_profile_role((SELECT auth.uid()), 'teacher')
  );

-- Classrooms DELETE (for safety, though we soft-delete): Owner teacher only
DROP POLICY IF EXISTS classrooms_delete ON public.classrooms;
CREATE POLICY classrooms_delete ON public.classrooms
  FOR DELETE
  TO authenticated
  USING (
    teacher_user_id = (SELECT auth.uid())
    AND public.has_profile_role((SELECT auth.uid()), 'teacher')
  );


-- Classroom Members SELECT: Student self OR classroom teacher
DROP POLICY IF EXISTS members_select ON public.classroom_members;
CREATE POLICY members_select ON public.classroom_members
  FOR SELECT
  TO authenticated
  USING (
    student_user_id = (SELECT auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.classrooms c
      WHERE c.id = classroom_id
        AND c.teacher_user_id = (SELECT auth.uid())
    )
  );

-- Classroom Members INSERT: Kid self requesting join (PENDING)
DROP POLICY IF EXISTS members_insert ON public.classroom_members;
CREATE POLICY members_insert ON public.classroom_members
  FOR INSERT
  TO authenticated
  WITH CHECK (
    student_user_id = (SELECT auth.uid())
    AND public.has_profile_role((SELECT auth.uid()), 'kid')
    AND status = 'PENDING'
  );

-- Classroom Members UPDATE: Teacher only (for approvals/rejections)
DROP POLICY IF EXISTS members_update ON public.classroom_members;
CREATE POLICY members_update ON public.classroom_members
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.classrooms c
      WHERE c.id = classroom_id
        AND c.teacher_user_id = (SELECT auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.classrooms c
      WHERE c.id = classroom_id
        AND c.teacher_user_id = (SELECT auth.uid())
    )
  );

-- Classroom Members DELETE: Student leaving OR teacher removing
DROP POLICY IF EXISTS members_delete ON public.classroom_members;
CREATE POLICY members_delete ON public.classroom_members
  FOR DELETE
  TO authenticated
  USING (
    student_user_id = (SELECT auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.classrooms c
      WHERE c.id = classroom_id
        AND c.teacher_user_id = (SELECT auth.uid())
    )
  );


-- Notifications SELECT/UPDATE: Recipient only
DROP POLICY IF EXISTS notifications_select ON public.notifications;
CREATE POLICY notifications_select ON public.notifications
  FOR SELECT
  TO authenticated
  USING (recipient_user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS notifications_update ON public.notifications;
CREATE POLICY notifications_update ON public.notifications
  FOR UPDATE
  TO authenticated
  USING (recipient_user_id = (SELECT auth.uid()))
  WITH CHECK (recipient_user_id = (SELECT auth.uid()));

-- Notifications INSERT: Authenticated users can insert
DROP POLICY IF EXISTS notifications_insert ON public.notifications;
CREATE POLICY notifications_insert ON public.notifications
  FOR INSERT
  TO authenticated
  WITH CHECK (true);


-- Additive Profile Policy: profile_select_by_classroom_teacher
-- Enables teachers to view student profiles ONLY if the status is APPROVED.
-- Legacy policies remain untouched.
DROP POLICY IF EXISTS profile_select_by_classroom_teacher ON public.profile;
CREATE POLICY profile_select_by_classroom_teacher ON public.profile
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.classroom_members cm
      JOIN public.classrooms c ON cm.classroom_id = c.id
      WHERE c.teacher_user_id = (SELECT auth.uid())
        AND cm.student_user_id = public.profile.user_id
        AND cm.status = 'APPROVED'
    )
  );

-- =========================================================================
-- 5. RPC FUNCTIONS
-- =========================================================================

-- Single aggregator function get_teacher_dashboard()
-- Bypasses RLS internally via SECURITY DEFINER to safely construct PENDING profile representations without RLS leakage.
CREATE OR REPLACE FUNCTION public.get_teacher_dashboard()
RETURNS jsonb
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_teacher_id uuid;
  v_classrooms jsonb;
  v_students jsonb;
  v_pending_requests jsonb;
BEGIN
  v_teacher_id := auth.uid();
  
  -- Double-verification of role
  IF NOT public.has_profile_role(v_teacher_id, 'teacher') THEN
    RAISE EXCEPTION 'Unauthorized: User is not a teacher';
  END IF;

  -- 1. Fetch classrooms (Active, not soft-deleted)
  SELECT coalesce(json_agg(t), '[]'::json) INTO v_classrooms
  FROM (
    SELECT id, name, description, subject, grade, class_code, is_active, created_at
    FROM public.classrooms
    WHERE teacher_user_id = v_teacher_id 
      AND is_active = true 
      AND deleted_at IS NULL
    ORDER BY created_at DESC
  ) t;

  -- 2. Fetch approved students across classrooms
  SELECT coalesce(json_agg(s), '[]'::json) INTO v_students
  FROM (
    SELECT 
      p.user_id,
      p.first_name,
      p.last_name,
      p.avatar_url,
      p.total_experience_points,
      p.current_streak,
      c.name as classroom_name,
      c.id as classroom_id
    FROM public.classroom_members cm
    JOIN public.classrooms c ON cm.classroom_id = c.id
    JOIN public.profile p ON cm.student_user_id = p.user_id
    WHERE c.teacher_user_id = v_teacher_id 
      AND cm.status = 'APPROVED'
      AND p.deleted_at IS NULL
    ORDER BY cm.approved_at DESC
  ) s;

  -- 3. Fetch pending requests (minimal representations for RLS restriction)
  SELECT coalesce(json_agg(r), '[]'::json) INTO v_pending_requests
  FROM (
    SELECT 
      cm.id as member_link_id,
      c.id as classroom_id,
      c.name as classroom_name,
      p.user_id,
      p.first_name,
      p.last_name,
      p.avatar_url,
      cm.created_at as requested_at
    FROM public.classroom_members cm
    JOIN public.classrooms c ON cm.classroom_id = c.id
    JOIN public.profile p ON cm.student_user_id = p.user_id
    WHERE c.teacher_user_id = v_teacher_id 
      AND cm.status = 'PENDING'
      AND p.deleted_at IS NULL
    ORDER BY cm.created_at ASC
  ) r;

  RETURN jsonb_build_object(
    'classrooms', v_classrooms,
    'students', v_students,
    'pendingRequests', v_pending_requests
  );
END;
$$;

COMMIT;

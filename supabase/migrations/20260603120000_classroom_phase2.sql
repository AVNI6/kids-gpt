-- Migration: Classroom System Phase 2 (Assignments, Resources, Announcements, Events)
-- Date: 2026-06-03 12:00:00 UTC

BEGIN;

-- =========================================================================
-- 1. SCHEMAS & TABLES
-- =========================================================================

-- activity_events table
CREATE TABLE IF NOT EXISTS public.activity_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_user_id uuid NOT NULL REFERENCES public.profile(user_id) ON DELETE CASCADE,
  actor_role public.user_role NOT NULL,
  target_user_id uuid REFERENCES public.profile(user_id) ON DELETE CASCADE,
  target_type varchar,
  event_type varchar NOT NULL,
  source_type varchar NOT NULL,
  source_id uuid NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb NOT NULL,
  created_at timestamp WITH TIME ZONE DEFAULT now() NOT NULL
);

-- assignments table (soft-delete enabled)
CREATE TABLE IF NOT EXISTS public.assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  classroom_id uuid NOT NULL REFERENCES public.classrooms(id) ON DELETE CASCADE,
  teacher_user_id uuid NOT NULL REFERENCES public.profile(user_id) ON DELETE CASCADE,
  created_by uuid NOT NULL REFERENCES public.profile(user_id) ON DELETE CASCADE,
  title varchar NOT NULL,
  description text,
  subject varchar,
  total_points integer DEFAULT 100 NOT NULL,
  due_date timestamp WITH TIME ZONE,
  status varchar NOT NULL CHECK (status IN ('DRAFT', 'PUBLISHED', 'CLOSED')) DEFAULT 'DRAFT',
  published_at timestamp WITH TIME ZONE,
  closed_at timestamp WITH TIME ZONE,
  created_at timestamp WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at timestamp WITH TIME ZONE DEFAULT now() NOT NULL,
  deleted_at timestamp WITH TIME ZONE
);

-- assignment_submissions table (soft-delete enabled)
CREATE TABLE IF NOT EXISTS public.assignment_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id uuid NOT NULL REFERENCES public.assignments(id) ON DELETE CASCADE,
  student_user_id uuid NOT NULL REFERENCES public.profile(user_id) ON DELETE CASCADE,
  submission_type varchar NOT NULL CHECK (submission_type IN ('TEXT', 'PDF', 'IMAGE', 'LINK')),
  submission_text text,
  submission_url text,
  submitted_at timestamp WITH TIME ZONE DEFAULT now() NOT NULL,
  score integer,
  feedback text,
  graded_at timestamp WITH TIME ZONE,
  graded_by uuid REFERENCES public.profile(user_id) ON DELETE SET NULL,
  created_at timestamp WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at timestamp WITH TIME ZONE DEFAULT now() NOT NULL,
  deleted_at timestamp WITH TIME ZONE
);

-- classroom_resources table (soft-delete enabled)
CREATE TABLE IF NOT EXISTS public.classroom_resources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  classroom_id uuid NOT NULL REFERENCES public.classrooms(id) ON DELETE CASCADE,
  teacher_user_id uuid NOT NULL REFERENCES public.profile(user_id) ON DELETE CASCADE,
  title varchar NOT NULL,
  description text,
  resource_type varchar NOT NULL CHECK (resource_type IN ('PDF', 'VIDEO', 'LINK', 'DOCUMENT')),
  resource_url text NOT NULL,
  storage_path text,
  created_at timestamp WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at timestamp WITH TIME ZONE DEFAULT now() NOT NULL,
  deleted_at timestamp WITH TIME ZONE
);

-- announcements table (soft-delete enabled)
CREATE TABLE IF NOT EXISTS public.announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  classroom_id uuid NOT NULL REFERENCES public.classrooms(id) ON DELETE CASCADE,
  teacher_user_id uuid NOT NULL REFERENCES public.profile(user_id) ON DELETE CASCADE,
  title varchar NOT NULL,
  message text NOT NULL,
  created_at timestamp WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at timestamp WITH TIME ZONE DEFAULT now() NOT NULL,
  deleted_at timestamp WITH TIME ZONE
);

-- =========================================================================
-- 2. INDEXES & CONSTRAINTS
-- =========================================================================

-- Unique index to enforce single active submission per student per assignment
CREATE UNIQUE INDEX IF NOT EXISTS uq_assignment_submission_active 
ON public.assignment_submissions (assignment_id, student_user_id) 
WHERE deleted_at IS NULL;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_activity_events_actor ON public.activity_events(actor_user_id);
CREATE INDEX IF NOT EXISTS idx_activity_events_target ON public.activity_events(target_user_id);
CREATE INDEX IF NOT EXISTS idx_activity_events_source ON public.activity_events(source_type, source_id);

CREATE INDEX IF NOT EXISTS idx_assignments_classroom ON public.assignments(classroom_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_assignments_teacher ON public.assignments(teacher_user_id) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_submissions_assignment ON public.assignment_submissions(assignment_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_submissions_student ON public.assignment_submissions(student_user_id) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_resources_classroom ON public.classroom_resources(classroom_id) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_announcements_classroom ON public.announcements(classroom_id) WHERE deleted_at IS NULL;

-- =========================================================================
-- 3. TRIGGERS FOR TIMESTAMPS
-- =========================================================================
DROP TRIGGER IF EXISTS assignments_set_updated_at ON public.assignments;
CREATE TRIGGER assignments_set_updated_at
  BEFORE UPDATE ON public.assignments
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS assignment_submissions_set_updated_at ON public.assignment_submissions;
CREATE TRIGGER assignment_submissions_set_updated_at
  BEFORE UPDATE ON public.assignment_submissions
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS classroom_resources_set_updated_at ON public.classroom_resources;
CREATE TRIGGER classroom_resources_set_updated_at
  BEFORE UPDATE ON public.classroom_resources
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS announcements_set_updated_at ON public.announcements;
CREATE TRIGGER announcements_set_updated_at
  BEFORE UPDATE ON public.announcements
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- =========================================================================
-- 4. SECURITY DEFINER HELPERS
-- =========================================================================

-- Helper to check if a user is the teacher of an assignment's classroom
CREATE OR REPLACE FUNCTION public.is_assignment_classroom_teacher(p_assignment_id uuid, p_user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.assignments a
    JOIN public.classrooms c ON a.classroom_id = c.id
    WHERE a.id = p_assignment_id
      AND c.teacher_user_id = p_user_id
      AND a.deleted_at IS NULL
      AND c.deleted_at IS NULL
  );
$$;

-- Helper to check if a student is approved in an assignment's classroom
CREATE OR REPLACE FUNCTION public.is_assignment_classroom_student(p_assignment_id uuid, p_user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.assignments a
    JOIN public.classroom_members cm ON a.classroom_id = cm.classroom_id
    WHERE a.id = p_assignment_id
      AND cm.student_user_id = p_user_id
      AND cm.status = 'APPROVED'
      AND a.deleted_at IS NULL
  );
$$;

-- =========================================================================
-- 5. ROW LEVEL SECURITY (RLS)
-- =========================================================================
ALTER TABLE public.activity_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignment_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classroom_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

-- Activity Events SELECT: User is actor, target, or classroom teacher
DROP POLICY IF EXISTS activity_events_select ON public.activity_events;
CREATE POLICY activity_events_select ON public.activity_events
  FOR SELECT
  TO authenticated
  USING (
    actor_user_id = (SELECT auth.uid())
    OR target_user_id = (SELECT auth.uid())
    OR (
      -- If target is a classroom the user teaches
      (target_type = 'classroom' AND public.is_classroom_teacher(source_id, (SELECT auth.uid())))
      OR
      -- If source is classroom-related and the user is the teacher
      EXISTS (
        SELECT 1 FROM public.classrooms c
        WHERE (c.id = source_id OR c.id = (SELECT classroom_id FROM public.assignments WHERE id = source_id))
          AND c.teacher_user_id = (SELECT auth.uid())
          AND c.deleted_at IS NULL
      )
    )
  );

-- Activity Events INSERT: Allow authenticated users
DROP POLICY IF EXISTS activity_events_insert ON public.activity_events;
CREATE POLICY activity_events_insert ON public.activity_events
  FOR INSERT
  TO authenticated
  WITH CHECK (actor_user_id = (SELECT auth.uid()));

-- Assignments SELECT: Teacher OR approved student
DROP POLICY IF EXISTS assignments_select ON public.assignments;
CREATE POLICY assignments_select ON public.assignments
  FOR SELECT
  TO authenticated
  USING (
    (teacher_user_id = (SELECT auth.uid()) OR created_by = (SELECT auth.uid()))
    OR public.is_classroom_student(classroom_id, (SELECT auth.uid()))
  );

-- Assignments INSERT/UPDATE/DELETE: Owner teacher only
DROP POLICY IF EXISTS assignments_modify ON public.assignments;
CREATE POLICY assignments_modify ON public.assignments
  FOR ALL
  TO authenticated
  USING (
    teacher_user_id = (SELECT auth.uid())
    AND public.has_profile_role((SELECT auth.uid()), 'teacher')
  )
  WITH CHECK (
    teacher_user_id = (SELECT auth.uid())
    AND public.has_profile_role((SELECT auth.uid()), 'teacher')
  );

-- Submissions SELECT: Student owner OR assignment teacher
DROP POLICY IF EXISTS submissions_select ON public.assignment_submissions;
CREATE POLICY submissions_select ON public.assignment_submissions
  FOR SELECT
  TO authenticated
  USING (
    student_user_id = (SELECT auth.uid())
    OR public.is_assignment_classroom_teacher(assignment_id, (SELECT auth.uid()))
  );

-- Submissions INSERT: Approved student only
DROP POLICY IF EXISTS submissions_insert ON public.assignment_submissions;
CREATE POLICY submissions_insert ON public.assignment_submissions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    student_user_id = (SELECT auth.uid())
    AND public.has_profile_role((SELECT auth.uid()), 'kid')
    AND public.is_assignment_classroom_student(assignment_id, (SELECT auth.uid()))
  );

-- Submissions UPDATE: Submitting student (if ungraded) OR assignment teacher
DROP POLICY IF EXISTS submissions_update ON public.assignment_submissions;
CREATE POLICY submissions_update ON public.assignment_submissions
  FOR UPDATE
  TO authenticated
  USING (
    (student_user_id = (SELECT auth.uid()) AND score IS NULL)
    OR public.is_assignment_classroom_teacher(assignment_id, (SELECT auth.uid()))
  )
  WITH CHECK (
    (student_user_id = (SELECT auth.uid()) AND score IS NULL)
    OR public.is_assignment_classroom_teacher(assignment_id, (SELECT auth.uid()))
  );

-- Resources SELECT: Teacher OR approved student
DROP POLICY IF EXISTS resources_select ON public.classroom_resources;
CREATE POLICY resources_select ON public.classroom_resources
  FOR SELECT
  TO authenticated
  USING (
    teacher_user_id = (SELECT auth.uid())
    OR public.is_classroom_student(classroom_id, (SELECT auth.uid()))
  );

-- Resources INSERT/UPDATE/DELETE: Owner teacher only
DROP POLICY IF EXISTS resources_modify ON public.classroom_resources;
CREATE POLICY resources_modify ON public.classroom_resources
  FOR ALL
  TO authenticated
  USING (
    teacher_user_id = (SELECT auth.uid())
    AND public.has_profile_role((SELECT auth.uid()), 'teacher')
  )
  WITH CHECK (
    teacher_user_id = (SELECT auth.uid())
    AND public.has_profile_role((SELECT auth.uid()), 'teacher')
  );

-- Announcements SELECT: Teacher OR approved student
DROP POLICY IF EXISTS announcements_select ON public.announcements;
CREATE POLICY announcements_select ON public.announcements
  FOR SELECT
  TO authenticated
  USING (
    teacher_user_id = (SELECT auth.uid())
    OR public.is_classroom_student(classroom_id, (SELECT auth.uid()))
  );

-- Announcements INSERT/UPDATE/DELETE: Owner teacher only
DROP POLICY IF EXISTS announcements_modify ON public.announcements;
CREATE POLICY announcements_modify ON public.announcements
  FOR ALL
  TO authenticated
  USING (
    teacher_user_id = (SELECT auth.uid())
    AND public.has_profile_role((SELECT auth.uid()), 'teacher')
  )
  WITH CHECK (
    teacher_user_id = (SELECT auth.uid())
    AND public.has_profile_role((SELECT auth.uid()), 'teacher')
  );

-- Additive SELECT policy on rewards for classroom teachers
DROP POLICY IF EXISTS rewards_select_by_classroom_teacher ON public.rewards;
CREATE POLICY rewards_select_by_classroom_teacher ON public.rewards
  FOR SELECT
  TO authenticated
  USING (
    public.is_approved_classroom_student_of_teacher(user_id, (SELECT auth.uid()))
  );

-- Additive INSERT policy on rewards for classroom teachers (to award grade XP)
DROP POLICY IF EXISTS rewards_insert_by_classroom_teacher ON public.rewards;
CREATE POLICY rewards_insert_by_classroom_teacher ON public.rewards
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_approved_classroom_student_of_teacher(user_id, (SELECT auth.uid()))
  );

COMMIT;

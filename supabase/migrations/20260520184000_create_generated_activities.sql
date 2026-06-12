-- Migration: Create generated_activities table and define RLS policies
-- Date: 2026-05-20 18:40:00 UTC

BEGIN;

-- Create generated_activities table
CREATE TABLE IF NOT EXISTS public.generated_activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kid_user_id uuid NOT NULL REFERENCES public.profile (user_id) ON DELETE CASCADE,
  activity_type varchar NOT NULL,
  content jsonb NOT NULL,
  created_at timestamp WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at timestamp WITH TIME ZONE DEFAULT now() NOT NULL,
  deleted_at timestamp WITH TIME ZONE
);

-- Add index on kid_user_id for high-performance foreign key lookup and policy scans
CREATE INDEX IF NOT EXISTS generated_activities_kid_user_id_idx ON public.generated_activities (kid_user_id);

-- Add updated_at trigger
DROP TRIGGER IF EXISTS generated_activities_set_updated_at ON public.generated_activities;
CREATE TRIGGER generated_activities_set_updated_at
BEFORE UPDATE ON public.generated_activities
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

-- Enable Row Level Security (RLS)
ALTER TABLE public.generated_activities ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they already exist
DROP POLICY IF EXISTS generated_activities_select_own ON public.generated_activities;
DROP POLICY IF EXISTS generated_activities_insert_own ON public.generated_activities;
DROP POLICY IF EXISTS generated_activities_select_by_parent ON public.generated_activities;
DROP POLICY IF EXISTS generated_activities_select_by_teacher ON public.generated_activities;

-- Policy: Kids can SELECT their own generated activities
CREATE POLICY generated_activities_select_own
  ON public.generated_activities
  FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = kid_user_id);

-- Policy: Kids can INSERT their own generated activities
CREATE POLICY generated_activities_insert_own
  ON public.generated_activities
  FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.uid()) = kid_user_id);

-- Policy: Parents can SELECT generated activities of their linked kids
CREATE POLICY generated_activities_select_by_parent
  ON public.generated_activities
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.parent_child_link pcl
      WHERE pcl.parent_user_id = (SELECT auth.uid())
        AND pcl.child_user_id = public.generated_activities.kid_user_id
        AND pcl.is_approved IS TRUE
        AND pcl.deleted_at IS NULL
    )
  );

-- Policy: Teachers can SELECT generated activities of their linked students
CREATE POLICY generated_activities_select_by_teacher
  ON public.generated_activities
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.teacher_student_links tsl
      WHERE tsl.teacher_user_id = (SELECT auth.uid())
        AND tsl.student_user_id = public.generated_activities.kid_user_id
    )
  );

COMMIT;

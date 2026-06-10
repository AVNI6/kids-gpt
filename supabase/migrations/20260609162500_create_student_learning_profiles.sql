-- Migration: Create student_learning_profiles table
-- Date: 2026-06-09 16:25:00

CREATE TABLE IF NOT EXISTS public.student_learning_profiles (
  student_id uuid PRIMARY KEY REFERENCES public.profile (user_id) ON DELETE CASCADE,
  strengths jsonb DEFAULT '[]'::jsonb NOT NULL,
  weaknesses jsonb DEFAULT '[]'::jsonb NOT NULL,
  interests jsonb DEFAULT '[]'::jsonb NOT NULL,
  preferred_learning_style varchar DEFAULT 'visual' NOT NULL,
  last_calculated_at timestamp WITH TIME ZONE DEFAULT now() NOT NULL,
  created_at timestamp WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at timestamp WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Trigger for updated_at
DROP TRIGGER IF EXISTS student_learning_profiles_set_updated_at ON public.student_learning_profiles;
CREATE TRIGGER student_learning_profiles_set_updated_at
BEFORE UPDATE ON public.student_learning_profiles
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

-- Enable RLS
ALTER TABLE public.student_learning_profiles ENABLE ROW LEVEL SECURITY;

-- Owner SELECT/INSERT/UPDATE/DELETE RLS policies
DROP POLICY IF EXISTS "student_learning_profiles_select_own" ON public.student_learning_profiles;
CREATE POLICY "student_learning_profiles_select_own"
ON public.student_learning_profiles
FOR SELECT
TO authenticated
USING (auth.uid() = student_id);

DROP POLICY IF EXISTS "student_learning_profiles_insert_own" ON public.student_learning_profiles;
CREATE POLICY "student_learning_profiles_insert_own"
ON public.student_learning_profiles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = student_id);

DROP POLICY IF EXISTS "student_learning_profiles_update_own" ON public.student_learning_profiles;
CREATE POLICY "student_learning_profiles_update_own"
ON public.student_learning_profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = student_id)
WITH CHECK (auth.uid() = student_id);

DROP POLICY IF EXISTS "student_learning_profiles_delete_own" ON public.student_learning_profiles;
CREATE POLICY "student_learning_profiles_delete_own"
ON public.student_learning_profiles
FOR DELETE
TO authenticated
USING (auth.uid() = student_id);

-- Parent SELECT RLS policy
DROP POLICY IF EXISTS "student_learning_profiles_parent_select" ON public.student_learning_profiles;
CREATE POLICY "student_learning_profiles_parent_select" ON public.student_learning_profiles
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.parent_child_link pcl
    WHERE pcl.parent_user_id = auth.uid()
      AND pcl.child_user_id = student_learning_profiles.student_id
      AND pcl.is_approved IS TRUE
      AND pcl.deleted_at IS NULL
  )
);

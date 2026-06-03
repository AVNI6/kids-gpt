-- Migration: Classroom System Phase 2 Hardening (Storage, Soft Delete Cascades, RLS & Performance)
-- Date: 2026-06-03 13:00:00 UTC

BEGIN;

-- =========================================================================
-- 1. STORAGE SECURITY REMEDIATION
-- =========================================================================

-- Drop old loose storage policies for 'materials'
DROP POLICY IF EXISTS "Authenticated Upload" ON storage.objects;
DROP POLICY IF EXISTS "Manage own storage objects" ON storage.objects;

-- Create secure insert policy: only allows uploads under own user folder prefix
CREATE POLICY "Authenticated Insert Materials"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'materials'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Create secure update policy: only allows modifications under own user folder prefix
CREATE POLICY "Authenticated Update Materials"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'materials'
  AND (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'materials'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- =========================================================================
-- 2. SECURITY DEFINER HELPER HARDENING (Preventing Soft-Delete Leakage)
-- =========================================================================

-- Checks if a user is an approved student of an active classroom (bypasses RLS)
CREATE OR REPLACE FUNCTION public.is_classroom_student(p_classroom_id uuid, p_user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.classroom_members cm
    JOIN public.classrooms c ON cm.classroom_id = c.id
    WHERE cm.classroom_id = p_classroom_id
      AND cm.student_user_id = p_user_id
      AND cm.status = 'APPROVED'
      AND c.deleted_at IS NULL
      AND c.is_active = true
  );
$$;

-- Checks if a user is the teacher of an active classroom (bypasses RLS)
CREATE OR REPLACE FUNCTION public.is_classroom_teacher(p_classroom_id uuid, p_user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.classrooms
    WHERE id = p_classroom_id
      AND teacher_user_id = p_user_id
      AND deleted_at IS NULL
      AND is_active = true
  );
$$;

-- =========================================================================
-- 3. SOFT DELETE CASCADES & RESTORATION TRIGGERS
-- =========================================================================

-- A. Trigger for classroom soft-delete cascade
CREATE OR REPLACE FUNCTION public.handle_classroom_soft_delete_cascade()
RETURNS trigger AS $$
BEGIN
  -- Soft-delete cascade
  IF NEW.deleted_at IS NOT NULL AND OLD.deleted_at IS NULL THEN
    UPDATE public.assignments 
    SET deleted_at = NEW.deleted_at 
    WHERE classroom_id = NEW.id AND deleted_at IS NULL;

    UPDATE public.classroom_resources 
    SET deleted_at = NEW.deleted_at 
    WHERE classroom_id = NEW.id AND deleted_at IS NULL;

    UPDATE public.announcements 
    SET deleted_at = NEW.deleted_at 
    WHERE classroom_id = NEW.id AND deleted_at IS NULL;
  
  -- Restore cascade
  ELSIF NEW.deleted_at IS NULL AND OLD.deleted_at IS NOT NULL THEN
    UPDATE public.assignments 
    SET deleted_at = NULL 
    WHERE classroom_id = NEW.id AND deleted_at = OLD.deleted_at;

    UPDATE public.classroom_resources 
    SET deleted_at = NULL 
    WHERE classroom_id = NEW.id AND deleted_at = OLD.deleted_at;

    UPDATE public.announcements 
    SET deleted_at = NULL 
    WHERE classroom_id = NEW.id AND deleted_at = OLD.deleted_at;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS tr_classroom_soft_delete_cascade ON public.classrooms;
CREATE TRIGGER tr_classroom_soft_delete_cascade
  AFTER UPDATE ON public.classrooms
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_classroom_soft_delete_cascade();


-- B. Trigger for assignment soft-delete cascade
CREATE OR REPLACE FUNCTION public.handle_assignment_soft_delete_cascade()
RETURNS trigger AS $$
BEGIN
  -- Soft-delete cascade
  IF NEW.deleted_at IS NOT NULL AND OLD.deleted_at IS NULL THEN
    UPDATE public.assignment_submissions 
    SET deleted_at = NEW.deleted_at 
    WHERE assignment_id = NEW.id AND deleted_at IS NULL;

  -- Restore cascade
  ELSIF NEW.deleted_at IS NULL AND OLD.deleted_at IS NOT NULL THEN
    UPDATE public.assignment_submissions 
    SET deleted_at = NULL 
    WHERE assignment_id = NEW.id AND deleted_at = OLD.deleted_at;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS tr_assignment_soft_delete_cascade ON public.assignments;
CREATE TRIGGER tr_assignment_soft_delete_cascade
  AFTER UPDATE ON public.assignments
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_assignment_soft_delete_cascade();

-- =========================================================================
-- 4. ADDITIONAL INDEXES FOR PERFORMANCE
-- =========================================================================
CREATE INDEX IF NOT EXISTS idx_activity_events_created_at ON public.activity_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_source ON public.notifications(source_type, source_id);

COMMIT;

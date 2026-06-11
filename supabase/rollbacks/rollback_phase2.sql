BEGIN;

-- Drop constraints
ALTER TABLE IF EXISTS public.subscriptions DROP CONSTRAINT IF EXISTS uq_subscription_user_id;
ALTER TABLE IF EXISTS public.rewards DROP CONSTRAINT IF EXISTS check_rewards_amount_non_negative;

-- Drop indexes
DROP INDEX IF EXISTS public.uq_active_screen_session;
DROP INDEX IF EXISTS public.uq_teacher_student_links;

-- Restore statement-level triggers to row-level triggers
-- classrooms soft delete cascade
DROP TRIGGER IF EXISTS tr_classroom_soft_delete_cascade ON public.classrooms;
CREATE OR REPLACE FUNCTION public.handle_classroom_soft_delete_cascade()
RETURNS trigger AS $$
BEGIN
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

CREATE TRIGGER tr_classroom_soft_delete_cascade
  AFTER UPDATE ON public.classrooms
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_classroom_soft_delete_cascade();

-- assignments soft delete cascade
DROP TRIGGER IF EXISTS tr_assignment_soft_delete_cascade ON public.assignments;
CREATE OR REPLACE FUNCTION public.handle_assignment_soft_delete_cascade()
RETURNS trigger AS $$
BEGIN
  IF NEW.deleted_at IS NOT NULL AND OLD.deleted_at IS NULL THEN
    UPDATE public.assignment_submissions 
    SET deleted_at = NEW.deleted_at 
    WHERE assignment_id = NEW.id AND deleted_at IS NULL;
  ELSIF NEW.deleted_at IS NULL AND OLD.deleted_at IS NOT NULL THEN
    UPDATE public.assignment_submissions 
    SET deleted_at = NULL 
    WHERE assignment_id = NEW.id AND deleted_at = OLD.deleted_at;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER tr_assignment_soft_delete_cascade
  AFTER UPDATE ON public.assignments
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_assignment_soft_delete_cascade();

-- Drop new RPCs
DROP FUNCTION IF EXISTS public.publish_assignment(uuid, uuid);
DROP FUNCTION IF EXISTS public.submit_student_assignment(uuid, uuid, varchar, text, varchar);
DROP FUNCTION IF EXISTS public.grade_student_submission(uuid, uuid, numeric, text);
DROP FUNCTION IF EXISTS public.increment_profile_xp(uuid, int, int, int);

COMMIT;

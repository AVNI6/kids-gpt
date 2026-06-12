-- Migration: Automatically reset deleted_at to NULL when is_active is set to true on parent_child_link
-- Date: 2026-05-27 UTC

BEGIN;

-- 1. Create or replace trigger function to handle link reactivation
CREATE OR REPLACE FUNCTION public.handle_parent_child_link_activation()
RETURNS TRIGGER AS $$
BEGIN
  -- If is_active is changed from false/null to true, reset deleted_at to NULL
  IF NEW.is_active = true AND (OLD.is_active = false OR OLD.is_active IS NULL OR NEW.deleted_at IS NOT NULL) THEN
    NEW.deleted_at = NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Bind the trigger function BEFORE UPDATE on public.parent_child_link
DROP TRIGGER IF EXISTS trg_handle_parent_child_link_activation ON public.parent_child_link;
CREATE TRIGGER trg_handle_parent_child_link_activation
  BEFORE UPDATE ON public.parent_child_link
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_parent_child_link_activation();

-- 3. Backfill any existing records that were manually activated (is_active = true) but still have deleted_at set
UPDATE public.parent_child_link
SET deleted_at = NULL
WHERE is_active = true AND deleted_at IS NOT NULL;

COMMIT;

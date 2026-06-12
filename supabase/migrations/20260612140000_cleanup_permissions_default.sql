-- Clean up unused kid_permissions_default table and its foreign key constraint on kid_permissions
ALTER TABLE IF EXISTS public.kid_permissions 
  DROP CONSTRAINT IF EXISTS kid_permissions_default_id_fkey;

ALTER TABLE IF EXISTS public.kid_permissions 
  DROP COLUMN IF EXISTS default_id;

DROP TABLE IF EXISTS public.kid_permissions_default CASCADE;

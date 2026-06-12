-- =========================================================
-- STORAGE BUCKET
-- =========================================================

-- Create materials bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('materials', 'materials', true)
ON CONFLICT (id) DO NOTHING;


-- =========================================================
-- STORAGE POLICIES
-- =========================================================

-- Remove old policies if they already exist
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Upload" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own materials" ON storage.objects;
DROP POLICY IF EXISTS "Manage own storage objects" ON storage.objects;

-- Public can read materials
CREATE POLICY "Public Access"
ON storage.objects
FOR SELECT
USING (bucket_id = 'materials');

-- Authenticated users can upload files
CREATE POLICY "Authenticated Upload"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'materials');

-- Authenticated users can update/manage files
CREATE POLICY "Manage own storage objects"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'materials')
WITH CHECK (bucket_id = 'materials');

-- Users can delete their own files
CREATE POLICY "Users can delete own materials"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'materials'
  AND (storage.foldername(name))[1] = auth.uid()::text
);


-- =========================================================
-- CHAT SESSIONS RLS
-- =========================================================

ALTER TABLE public.chat_sessions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies first
DROP POLICY IF EXISTS "chat_sessions_select_own" ON public.chat_sessions;
DROP POLICY IF EXISTS "chat_sessions_insert_own" ON public.chat_sessions;
DROP POLICY IF EXISTS "chat_sessions_update_own" ON public.chat_sessions;
DROP POLICY IF EXISTS "chat_sessions_delete_own" ON public.chat_sessions;
DROP POLICY IF EXISTS "Users can delete own sessions" ON public.chat_sessions;

-- SELECT
CREATE POLICY "chat_sessions_select_own"
ON public.chat_sessions
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- INSERT
CREATE POLICY "chat_sessions_insert_own"
ON public.chat_sessions
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- UPDATE
CREATE POLICY "chat_sessions_update_own"
ON public.chat_sessions
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- DELETE
CREATE POLICY "chat_sessions_delete_own"
ON public.chat_sessions
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);


-- =========================================================
-- GENERATED MATERIALS RLS
-- =========================================================

ALTER TABLE public.generated_materials ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can delete own generated materials"
ON public.generated_materials;

CREATE POLICY "Users can delete own generated materials"
ON public.generated_materials
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);
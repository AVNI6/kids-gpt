-- Create a new storage bucket for materials if it doesn't exist
INSERT INTO storage.buckets (id, name, public) 
VALUES ('materials', 'materials', true)
ON CONFLICT (id) DO NOTHING;

-- Storage Policies for 'materials' bucket
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Upload" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own materials" ON storage.objects;

-- Allow anyone to view materials (for sharing)
CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'materials');

-- Allow users to manage their own files in the bucket
CREATE POLICY "Manage own storage objects" 
ON storage.objects FOR ALL 
TO authenticated 
USING (bucket_id = 'materials')
WITH CHECK (bucket_id = 'materials');

-- SELECT: Users can view their own sessions
CREATE POLICY "chat_sessions_select_own" 
ON public.chat_sessions FOR SELECT 
TO authenticated 
USING (auth.uid() = user_id);
 
-- INSERT: Users can create sessions
CREATE POLICY "chat_sessions_insert_own" 
ON public.chat_sessions FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = user_id);
 
-- UPDATE: Users can update their own sessions (for renaming, etc.)
CREATE POLICY "chat_sessions_update_own" 
ON public.chat_sessions FOR UPDATE 
TO authenticated 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
 
-- DELETE: Users can delete their own sessions (THIS IS THE KEY ONE)
CREATE POLICY "chat_sessions_delete_own" 
ON public.chat_sessions FOR DELETE 
TO authenticated 
USING (auth.uid() = user_id);


-- 1. Allow public access to read files
CREATE POLICY "Public Access" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'materials');

-- 2. Allow authenticated users to upload files
CREATE POLICY "Authenticated Upload" 
ON storage.objects FOR INSERT 
TO authenticated 
WITH CHECK (bucket_id = 'materials');

-- 3. Allow users to delete their own files
CREATE POLICY "Users can delete own materials" 
ON storage.objects FOR DELETE 
TO authenticated 
USING (bucket_id = 'materials' AND (storage.foldername(name))[1] = auth.uid()::text);


-- Database Policies for chat_sessions

-- Enable RLS on chat_sessions (if not already enabled)
ALTER TABLE public.chat_sessions ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to delete their own sessions
CREATE POLICY "Users can delete own sessions" 
ON public.chat_sessions FOR DELETE 
TO authenticated 
USING (auth.uid() = user_id);

-- Ensure generated_materials also has delete policy
ALTER TABLE public.generated_materials ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can delete own generated materials" 
ON public.generated_materials FOR DELETE 
TO authenticated 
USING (auth.uid() = user_id);
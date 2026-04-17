-- 1. Create 'cvs' bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('cvs', 'cvs', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Add cv_url column to applications
ALTER TABLE public.applications 
ADD COLUMN IF NOT EXISTS cv_url text;

-- 3. Policy to allow authenticated users to upload CVs
-- (Adjust logic: user can upload if they are authenticated - effectively any student)
-- Note: better to restrict to their own folder, e.g. cvs/user_id/filename
DROP POLICY IF EXISTS "Give students access to own CV folder 1k3j1" ON storage.objects;
CREATE POLICY "Give students access to own CV folder 1k3j1"
ON storage.objects FOR ALL
TO authenticated
USING ( bucket_id = 'cvs' AND (auth.uid() = owner OR owner IS NULL) ) 
WITH CHECK ( bucket_id = 'cvs' AND (auth.uid() = owner OR owner IS NULL) );

-- 4. Policy to allow reading CVs
-- Companies need to read CVs of applications sent to them.
-- Students need to read their own CVs.
-- Simplest: public read (since bucket is public), relying on UUID filenames for obscurity?
-- Or strict:
DROP POLICY IF EXISTS "Public read access" ON storage.objects;
CREATE POLICY "Public read access"
ON storage.objects FOR SELECT
TO resultset
USING ( bucket_id = 'cvs' );

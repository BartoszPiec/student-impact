-- Enable RLS on objects provided it's not already enabled (it usually is)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 1. DROP ALL potential conflicting policies related to CVS to start fresh
DROP POLICY IF EXISTS "Authenticated Upload CVS" ON storage.objects;
DROP POLICY IF EXISTS "Public Read CVS" ON storage.objects;
DROP POLICY IF EXISTS "Give students access to own CV folder 1k3j1" ON storage.objects;
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Upload" ON storage.objects;
DROP POLICY IF EXISTS "Owner Manage" ON storage.objects;
-- Also drop policies that might have been created with different names
DROP POLICY IF EXISTS "Upload CVS" ON storage.objects;
DROP POLICY IF EXISTS "Read CVS" ON storage.objects;

-- 2. CREATE SIMPLE INSERT POLICY
-- Allows any logged-in user to upload a file to the 'cvs' bucket
CREATE POLICY "Workable Upload CVS"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK ( bucket_id = 'cvs' );

-- 3. CREATE SIMPLE SELECT POLICY
-- Allows anyone (public/anon) to read files from 'cvs' bucket (since it's a public bucket)
CREATE POLICY "Workable Read CVS"
ON storage.objects FOR SELECT
USING ( bucket_id = 'cvs' );

-- 4. CREATE UPDATE/DELETE POLICY
-- Allows users to manage their OWN files
CREATE POLICY "Workable Manage Own CVS"
ON storage.objects FOR ALL
TO authenticated
USING ( bucket_id = 'cvs' AND owner = auth.uid() );

-- Force schema reload to apply changes immediately
NOTIFY pgrst, 'reload schema';

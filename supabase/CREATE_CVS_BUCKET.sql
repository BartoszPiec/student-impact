-- Force create the bucket. Using UPDATE to ensure it's set to public if it existed but was private.
INSERT INTO storage.buckets (id, name, public)
VALUES ('cvs', 'cvs', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Ensure RLS is enabled on objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Clean up existing policies to avoid conflicts
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Upload" ON storage.objects;
DROP POLICY IF EXISTS "Give students access to own CV folder 1k3j1" ON storage.objects;
DROP POLICY IF EXISTS "Public read access" ON storage.objects;

-- Policy 1: allow EVERYONE (public) to read files from 'cvs' bucket
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'cvs' );

-- Policy 2: allow AUTHENTICATED users to upload/insert files to 'cvs' bucket
CREATE POLICY "Authenticated Upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK ( bucket_id = 'cvs' );

-- Policy 3: allow AUTHENTICATED users to update/delete their OWN files
CREATE POLICY "Owner Manage"
ON storage.objects FOR ALL
TO authenticated
USING ( bucket_id = 'cvs' AND auth.uid() = owner );

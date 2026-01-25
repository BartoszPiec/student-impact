-- 1. Ensure the bucket exists (idempotent)
INSERT INTO storage.buckets (id, name, public)
VALUES ('cvs', 'cvs', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 2. Make sure RLS is enabled (safe default)
ALTER TABLE storage.buckets ENABLE ROW LEVEL SECURITY;
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 3. CRITICAL: Allow users to SEE that the bucket exists
-- Without this, the client SDK might think the bucket doesn't exist
-- because it can't query 'storage.buckets'.
DROP POLICY IF EXISTS "Public View Buckets" ON storage.buckets;
CREATE POLICY "Public View Buckets"
ON storage.buckets FOR SELECT
USING ( true ); -- Allow viewing all buckets, or restrict to name='cvs'

-- 4. Allow upload to 'cvs' bucket for authenticated users
DROP POLICY IF EXISTS "Authenticated Upload CVS" ON storage.objects;
CREATE POLICY "Authenticated Upload CVS"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK ( bucket_id = 'cvs' );

-- 5. Allow public reading of files in 'cvs' bucket
DROP POLICY IF EXISTS "Public Read CVS" ON storage.objects;
CREATE POLICY "Public Read CVS"
ON storage.objects FOR SELECT
USING ( bucket_id = 'cvs' );

-- 6. Grant basic usage permissions on storage schema
GRANT USAGE ON SCHEMA storage TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA storage TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA storage TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA storage TO postgres, anon, authenticated, service_role; 

-- Reload schema cache
NOTIFY pgrst, 'reload schema';

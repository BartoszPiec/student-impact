-- 1. Check Buckets
SELECT * FROM storage.buckets;

-- 2. Check Objects in 'deliverables' bucket
SELECT * FROM storage.objects WHERE bucket_id = 'deliverables' ORDER BY created_at DESC LIMIT 5;

-- 3. Check Project Resources table
SELECT * FROM project_resources ORDER BY created_at DESC LIMIT 5;

-- 4. Check Contracts
SELECT id, application_id, service_order_id, terms_status, status FROM contracts ORDER BY created_at DESC LIMIT 5;

-- 5. Force Public Access on Deliverables Bucket (just in case)
UPDATE storage.buckets SET public = true WHERE id = 'deliverables';

DROP POLICY IF EXISTS "Public Access" ON storage.objects;
CREATE POLICY "Public Access" ON storage.objects FOR ALL USING ( bucket_id = 'deliverables' );

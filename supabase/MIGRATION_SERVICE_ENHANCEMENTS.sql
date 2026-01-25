-- MIGRATION_SERVICE_ENHANCEMENTS.sql

BEGIN;

-- 1. Add columns to service_packages
ALTER TABLE public.service_packages
ADD COLUMN IF NOT EXISTS requirements text,
ADD COLUMN IF NOT EXISTS gallery_urls text[] DEFAULT '{}';

-- 2. Create Storage Bucket for Portfolio
INSERT INTO storage.buckets (id, name, public)
VALUES ('portfolio', 'portfolio', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 3. Storage Policies for Portfolio
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Portfolio Public Read" ON storage.objects;
CREATE POLICY "Portfolio Public Read"
ON storage.objects FOR SELECT
USING ( bucket_id = 'portfolio' );

DROP POLICY IF EXISTS "Portfolio Auth Upload" ON storage.objects;
CREATE POLICY "Portfolio Auth Upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK ( bucket_id = 'portfolio' );

COMMIT;

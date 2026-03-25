-- Security Hardening: Storage RLS v2
-- Reconstructed from database state to resolve repository drift

-- 1. Ensure private buckets
-- NOTE: This part is typically done via Supabase Dashboard or CLI, 
-- but we include it for documentation.
-- UPDATE storage.buckets SET public = false WHERE id IN ('cvs', 'documents', 'deliverables');

-- 2. Storage Policies
DROP POLICY IF EXISTS "deliverables_read_strict" ON storage.objects;
CREATE POLICY "deliverables_read_strict" ON storage.objects
FOR SELECT TO authenticated
USING (
    (bucket_id = 'deliverables'::text) AND (
        (owner = auth.uid()) OR 
        ((storage.foldername(name))[1] ~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$'::text AND is_project_participant(((storage.foldername(name))[1])::uuid, ((storage.foldername(name))[1])::uuid)) OR
        ((storage.foldername(name))[2] ~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$'::text AND is_project_participant(((storage.foldername(name))[2])::uuid, ((storage.foldername(name))[2])::uuid))
    )
);

DROP POLICY IF EXISTS "admin_all_documents" ON storage.objects;
CREATE POLICY "admin_all_documents" ON storage.objects
FOR ALL TO authenticated
USING (
    (bucket_id = 'documents'::text) AND 
    (EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'admin'))
);

DROP POLICY IF EXISTS "cvs_upload_owner" ON storage.objects;
CREATE POLICY "cvs_upload_owner" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
    (bucket_id = 'cvs'::text) AND (owner = auth.uid())
);

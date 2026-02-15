-- ==============================================================================
-- MIGRATION: Security Hardening (RLS & Storage)
-- Date: 2026-02-09
-- Purpose: Secure project_resources, project_secrets and 'deliverables' bucket.
-- ==============================================================================

BEGIN;

-- ------------------------------------------------------------------------------
-- 1. Helper Function: Is Application/ServiceOrder Participant?
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_project_participant(
    p_application_id UUID,
    p_service_order_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Check Application
    IF p_application_id IS NOT NULL THEN
        IF EXISTS (
            SELECT 1 FROM public.applications a
            LEFT JOIN public.offers o ON o.id = a.offer_id
            WHERE a.id = p_application_id
            AND (
                a.student_id = auth.uid() 
                OR o.company_id = auth.uid()
            )
        ) THEN
            RETURN TRUE;
        END IF;
    END IF;

    -- Check Service Order
    IF p_service_order_id IS NOT NULL THEN
        IF EXISTS (
            SELECT 1 FROM public.service_orders so
            WHERE so.id = p_service_order_id
            AND (
                so.student_id = auth.uid() 
                OR so.company_id = auth.uid()
            )
        ) THEN
             RETURN TRUE;
        END IF;
    END IF;

    RETURN FALSE;
END;
$$;

-- ------------------------------------------------------------------------------
-- 2. RLS for project_resources
-- ------------------------------------------------------------------------------
ALTER TABLE public.project_resources ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "resources_select_participants" ON public.project_resources;
CREATE POLICY "resources_select_participants" ON public.project_resources
FOR SELECT USING (
    (uploader_id = auth.uid()) -- Uploader always sees
    OR
    public.is_project_participant(application_id, service_order_id)
);

DROP POLICY IF EXISTS "resources_insert_participants" ON public.project_resources;
CREATE POLICY "resources_insert_participants" ON public.project_resources
FOR INSERT WITH CHECK (
    -- Must be authenticated and participant
    auth.role() = 'authenticated'
    AND
    public.is_project_participant(application_id, service_order_id)
);

DROP POLICY IF EXISTS "resources_delete_uploader" ON public.project_resources;
CREATE POLICY "resources_delete_uploader" ON public.project_resources
FOR DELETE USING (
    uploader_id = auth.uid()
);

-- ------------------------------------------------------------------------------
-- 3. RLS for project_secrets
-- ------------------------------------------------------------------------------
ALTER TABLE public.project_secrets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "secrets_select_participants" ON public.project_secrets;
CREATE POLICY "secrets_select_participants" ON public.project_secrets
FOR SELECT USING (
    (author_id = auth.uid())
    OR
    public.is_project_participant(application_id, NULL) -- secrets only have app_id currently
);

DROP POLICY IF EXISTS "secrets_insert_participants" ON public.project_secrets;
CREATE POLICY "secrets_insert_participants" ON public.project_secrets
FOR INSERT WITH CHECK (
    auth.role() = 'authenticated'
    AND
    public.is_project_participant(application_id, NULL)
);

DROP POLICY IF EXISTS "secrets_delete_author" ON public.project_secrets;
CREATE POLICY "secrets_delete_author" ON public.project_secrets
FOR DELETE USING (
    author_id = auth.uid()
);

-- ------------------------------------------------------------------------------
-- 4. Storage Security: 'deliverables' Bucket
-- ------------------------------------------------------------------------------

-- Ensure bucket is PRIVATE (no public access)
UPDATE storage.buckets SET public = false WHERE id = 'deliverables';

-- Drop broad policies if they exist (cleanup)
DROP POLICY IF EXISTS "Deliverables Auth Upload" ON storage.objects;
DROP POLICY IF EXISTS "Deliverables Participant Read" ON storage.objects;
DROP POLICY IF EXISTS "deliverables_bucket_read" ON storage.objects;
DROP POLICY IF EXISTS "deliverables_bucket_upload" ON storage.objects;
DROP POLICY IF EXISTS "Give me access to everything" ON storage.objects;
DROP POLICY IF EXISTS "Public Access" ON storage.objects;

-- Policy: SELECT (Read/Download)
-- Handles:
-- 1. root/UUID/... (UploadForm)
-- 2. folder/UUID/... (FilesTab, generateContract)
CREATE POLICY "deliverables_read_strict" ON storage.objects
FOR SELECT TO authenticated USING (
    bucket_id = 'deliverables'
    AND (
        -- Allow uploader to always see their files (fallback)
        owner = auth.uid()
        OR
        (
           -- Case A: Root folder is UUID (Match Regex)
           (storage.foldername(name))[1] ~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$'
           AND
           public.is_project_participant(
               (storage.foldername(name))[1]::uuid, 
               (storage.foldername(name))[1]::uuid
           )
        )
        OR
        (
           -- Case B: Second segment is UUID (Match Regex)
           (storage.foldername(name))[2] ~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$'
           AND
           public.is_project_participant(
               (storage.foldername(name))[2]::uuid,
               (storage.foldername(name))[2]::uuid
           )
        )
    )
);

-- Policy: INSERT (Upload)
CREATE POLICY "deliverables_upload_strict" ON storage.objects
FOR INSERT TO authenticated WITH CHECK (
    bucket_id = 'deliverables'
    AND (
        (
           (storage.foldername(name))[1] ~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$'
           AND
           public.is_project_participant(
               (storage.foldername(name))[1]::uuid, 
               (storage.foldername(name))[1]::uuid
           )
        )
        OR
        (
           (storage.foldername(name))[2] ~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$'
           AND
           public.is_project_participant(
               (storage.foldername(name))[2]::uuid,
               (storage.foldername(name))[2]::uuid
           )
        )
    )
);

-- Policy: DELETE (Owner only)
CREATE POLICY "deliverables_delete_owner" ON storage.objects
FOR DELETE TO authenticated USING (
    bucket_id = 'deliverables'
    AND owner = auth.uid()
);

COMMIT;

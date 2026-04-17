-- REALIZATION EXTENSIONS: Resources & Secrets
-- Run this to add "Files" and "Secrets" features to the Realization phase.

BEGIN;

-- 1. PROJECT RESOURCES (Files uploaded by Company or Student as helper materials)
CREATE TABLE IF NOT EXISTS public.project_resources (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    application_id uuid REFERENCES public.applications(id) NOT NULL,
    uploader_id uuid REFERENCES auth.users(id) NOT NULL,
    filename text NOT NULL,
    file_url text NOT NULL,
    file_size integer,
    description text,
    created_at timestamptz DEFAULT now()
);

ALTER TABLE public.project_resources ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Resources view participants" ON public.project_resources;
CREATE POLICY "Resources view participants" ON public.project_resources
FOR SELECT USING (
    auth.uid() = uploader_id 
    OR 
    EXISTS (
        SELECT 1 FROM public.applications a
        JOIN public.offers o ON a.offer_id = o.id
        WHERE a.id = project_resources.application_id
        AND (a.student_id = auth.uid() OR o.company_id = auth.uid())
    )
);

DROP POLICY IF EXISTS "Resources insert participants" ON public.project_resources;
CREATE POLICY "Resources insert participants" ON public.project_resources
FOR INSERT WITH CHECK (
    auth.uid() = uploader_id 
    AND
    EXISTS (
        SELECT 1 FROM public.applications a
        JOIN public.offers o ON a.offer_id = o.id
        WHERE a.id = project_resources.application_id
        AND (a.student_id = auth.uid() OR o.company_id = auth.uid())
    )
);

DROP POLICY IF EXISTS "Resources delete own" ON public.project_resources;
CREATE POLICY "Resources delete own" ON public.project_resources
FOR DELETE USING (auth.uid() = uploader_id);


-- 2. PROJECT SECRETS (Shared credentials)
CREATE TABLE IF NOT EXISTS public.project_secrets (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    application_id uuid REFERENCES public.applications(id) NOT NULL,
    title text NOT NULL,
    secret_value text NOT NULL, -- Plain text for MVP (RLS protected), normally encrypted
    created_by uuid REFERENCES auth.users(id) NOT NULL,
    created_at timestamptz DEFAULT now()
);

ALTER TABLE public.project_secrets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Secrets view participants" ON public.project_secrets;
CREATE POLICY "Secrets view participants" ON public.project_secrets
FOR SELECT USING (
    created_by = auth.uid() 
    OR 
    EXISTS (
        SELECT 1 FROM public.applications a
        JOIN public.offers o ON a.offer_id = o.id
        WHERE a.id = project_secrets.application_id
        AND (a.student_id = auth.uid() OR o.company_id = auth.uid())
    )
);

DROP POLICY IF EXISTS "Secrets manage company" ON public.project_secrets;
CREATE POLICY "Secrets manage company" ON public.project_secrets
FOR ALL USING (
   created_by = auth.uid()
   OR
   EXISTS ( -- Allow company to manage even if not creator? Usually Company creates.
       SELECT 1 FROM public.applications a
       JOIN public.offers o ON a.offer_id = o.id
       WHERE a.id = project_secrets.application_id
       AND o.company_id = auth.uid()
   )
);

-- 3. STORAGE: Ensure 'deliverables' bucket is usable for this
-- (We assume bucket exists from previous step, we rely on RLS)

COMMIT;

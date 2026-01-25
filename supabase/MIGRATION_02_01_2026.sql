-- MIGRATION_02_01_2026.sql
-- COMPLETE MIGRATION FOR Jan 2, 2026
-- Apply this to the CORRECT Supabase instance to fix RLS, Visibility, and Data Issues.

BEGIN;

--------------------------------------------------------------------------------
-- 1. FIX: SAVED OFFERS (Ztracone 'Zapisane')
--------------------------------------------------------------------------------
-- Ensure table exists and has RLS
CREATE TABLE IF NOT EXISTS public.saved_offers (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id uuid REFERENCES auth.users(id) NOT NULL,
    offer_id uuid REFERENCES public.offers(id) NOT NULL,
    created_at timestamptz DEFAULT now(),
    UNIQUE(student_id, offer_id)
);
ALTER TABLE public.saved_offers ENABLE ROW LEVEL SECURITY;

-- Policies for Saved Offers
DROP POLICY IF EXISTS "Saved offers view own" ON public.saved_offers;
CREATE POLICY "Saved offers view own" ON public.saved_offers FOR SELECT USING (student_id = auth.uid());

DROP POLICY IF EXISTS "Saved offers insert own" ON public.saved_offers;
CREATE POLICY "Saved offers insert own" ON public.saved_offers FOR INSERT WITH CHECK (student_id = auth.uid());

DROP POLICY IF EXISTS "Saved offers delete own" ON public.saved_offers;
CREATE POLICY "Saved offers delete own" ON public.saved_offers FOR DELETE USING (student_id = auth.uid());

--------------------------------------------------------------------------------
-- 2. FIX: VISIBILITY FOR OFFERS (The "NULL" Offer Status Bug)
--------------------------------------------------------------------------------
-- Allow authenticated users (both students and companies) to view ALL offers.
-- This is necessary for students to see "In Progress" offers they are part of.
DROP POLICY IF EXISTS "Offers public view" ON public.offers;
DROP POLICY IF EXISTS "Offers view for applicants" ON public.offers;
DROP POLICY IF EXISTS "Offers view authenticated" ON public.offers;

CREATE POLICY "Offers view authenticated"
ON public.offers
FOR SELECT
TO authenticated
USING (true);

--------------------------------------------------------------------------------
-- 3. FIX: COMPANY PERMISSIONS (The "Cannot Accept Application" Bug)
--------------------------------------------------------------------------------
-- Allow companies to UPDATE applications (to Accept/Reject/Counter)
DROP POLICY IF EXISTS "Companies update applications" ON public.applications;

CREATE POLICY "Companies update applications"
ON public.applications
FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.offers
        WHERE offers.id = applications.offer_id
        AND offers.company_id = auth.uid()
    )
);

--------------------------------------------------------------------------------
-- 4. FIX: REALIZATION & FILES (If not already applied)
--------------------------------------------------------------------------------
-- Table: project_resources (Files for realizing the project)
CREATE TABLE IF NOT EXISTS public.project_resources (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    offer_id uuid REFERENCES public.offers(id) NOT NULL,
    uploader_id uuid REFERENCES auth.users(id) NOT NULL,
    file_name text NOT NULL,
    file_path text NOT NULL, -- path in storage
    file_type text,
    created_at timestamptz DEFAULT now()
);
ALTER TABLE public.project_resources ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Resources view participant" ON public.project_resources;
CREATE POLICY "Resources view participant" ON public.project_resources FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.applications a
        WHERE a.offer_id = project_resources.offer_id
        AND (a.student_id = auth.uid() OR EXISTS (SELECT 1 FROM public.offers o WHERE o.id = a.offer_id AND o.company_id = auth.uid()))
        AND a.status = 'accepted'
    )
);

DROP POLICY IF EXISTS "Resources insert list" ON public.project_resources;
CREATE POLICY "Resources insert list" ON public.project_resources FOR INSERT WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.applications a
        WHERE a.offer_id = project_resources.offer_id
        AND (a.student_id = auth.uid() OR EXISTS (SELECT 1 FROM public.offers o WHERE o.id = a.offer_id AND o.company_id = auth.uid()))
        AND a.status = 'accepted'
    )
);

-- Table: project_secrets (Credentials/Secrets)
CREATE TABLE IF NOT EXISTS public.project_secrets (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    offer_id uuid REFERENCES public.offers(id) NOT NULL,
    author_id uuid REFERENCES auth.users(id) NOT NULL,
    title text NOT NULL,
    secret_value text NOT NULL,
    created_at timestamptz DEFAULT now()
);
ALTER TABLE public.project_secrets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Secrets view participant" ON public.project_secrets;
CREATE POLICY "Secrets view participant" ON public.project_secrets FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.applications a
        WHERE a.offer_id = project_secrets.offer_id
        AND (a.student_id = auth.uid() OR EXISTS (SELECT 1 FROM public.offers o WHERE o.id = a.offer_id AND o.company_id = auth.uid()))
        AND a.status = 'accepted'
    )
);

DROP POLICY IF EXISTS "Secrets insert list" ON public.project_secrets;
CREATE POLICY "Secrets insert list" ON public.project_secrets FOR INSERT WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.applications a
        WHERE a.offer_id = project_secrets.offer_id
        AND (a.student_id = auth.uid() OR EXISTS (SELECT 1 FROM public.offers o WHERE o.id = a.offer_id AND o.company_id = auth.uid()))
        AND a.status = 'accepted'
    )
);

--------------------------------------------------------------------------------
-- 5. DATA REPAIR (Sync Statuses)
--------------------------------------------------------------------------------
-- Force Applications to 'accepted' if Offer is 'in_progress'
UPDATE public.applications
SET status = 'accepted', decided_at = now()
WHERE status IN ('sent', 'countered', 'rejected') 
AND offer_id IN (
    SELECT id FROM public.offers WHERE status = 'in_progress'
);

-- Force Offers to 'in_progress' if they have an 'accepted' Application
UPDATE public.offers
SET status = 'in_progress'
WHERE status = 'published'
AND id IN (
    SELECT offer_id FROM public.applications WHERE status = 'accepted'
);

COMMIT;

-- VERIFICATION QUERY
SELECT count(*) as fixed_apps_count FROM public.applications WHERE status = 'accepted';

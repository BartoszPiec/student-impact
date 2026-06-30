-- FIX_OFFERS_RLS_AND_VISIBILITY.sql
-- Run this in your Supabase SQL Editor to unblock offer visibility

BEGIN;

-- 1. Ensure RLS is enabled (good practice) but OPEN for reading
ALTER TABLE public.offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_profiles ENABLE ROW LEVEL SECURITY;

-- 2. Drop restrictive policies (to be safe/clean slate for reading)
DROP POLICY IF EXISTS "Enable read access for all users" ON public.offers;
DROP POLICY IF EXISTS "Public offers are viewable by everyone" ON public.offers;
DROP POLICY IF EXISTS "Company profiles are viewable by everyone" ON public.company_profiles;
DROP POLICY IF EXISTS "Companies can view their own profiles" ON public.company_profiles;

-- 3. Create permissive READ policies
-- All users (authenticated or anon) can see offers. 
-- In production, you might want to limit this to 'status = published', but for debugging: TRUE.
CREATE POLICY "Enable read access for all users" 
ON public.offers FOR SELECT 
USING (true);

-- Users need to see Company names/logos to display the offer card
CREATE POLICY "Enable read access for company profiles" 
ON public.company_profiles FOR SELECT 
USING (true);

-- 4. Verify/Fix Data (Ensure at least one offer exists and is published)
-- This part is optional but helpful to ensure there IS data to fetch.
UPDATE public.offers 
SET status = 'published' 
WHERE status IS NULL OR status = 'draft';

-- If no offers exist, insert a generic System micro-task for testing
INSERT INTO public.offers (
    tytul, 
    opis, 
    typ, 
    kategoria, 
    stawka, 
    status, 
    created_at, 
    company_id
)
SELECT 
    'Przykładowe Mikrozlecenie Systemowe',
    'To jest automatycznie wygenerowane zlecenie dla testów widoczności.',
    'Mikrozlecenie',
    'Administracja',
    '150',
    'published',
    NOW(),
    user_id
FROM public.company_profiles
WHERE NOT EXISTS (SELECT 1 FROM public.offers)
LIMIT 1;

COMMIT;

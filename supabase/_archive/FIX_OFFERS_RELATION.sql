-- Fix missing relationship between offers and company_profiles
-- This allows Supabase to join these tables in queries

-- 1. Ensure company_id in offers references user_id in company_profiles
ALTER TABLE public.offers
DROP CONSTRAINT IF EXISTS offers_company_id_fkey; -- Drop if exists with wrong name/config

ALTER TABLE public.offers
ADD CONSTRAINT offers_company_id_fkey
FOREIGN KEY (company_id)
REFERENCES public.company_profiles(user_id)
ON DELETE CASCADE;

-- 2. Verify RLS is not blocking joined query (already fixed in previous step, but good to keep in mind)
-- The query: select(..., company_profiles(nazwa, logo_url)) requires access to company_profiles.

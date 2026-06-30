-- Ensure logo_url exists in company_profiles
ALTER TABLE public.company_profiles 
ADD COLUMN IF NOT EXISTS logo_url text;

-- Also checking company_name/nazwa naming. Page.tsx uses "nazwa" in query but "company_name" in mapping.
-- If 'nazwa' exists, we use it. If not, we might need to add it or rename.
-- Assuming 'nazwa' is correct based on query: company_profiles ( nazwa, logo_url )
ALTER TABLE public.company_profiles 
ADD COLUMN IF NOT EXISTS nazwa text;

-- Fix RLS for update if needed (just in case)
ALTER TABLE public.company_profiles ENABLE ROW LEVEL SECURITY;

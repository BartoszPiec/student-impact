-- Fix RLS for company_profiles to allow public/authenticated read access
-- Problem: 'Profil niedostępny' usually means the query returned no data due to RLS hiding it.

-- 1. Enable RLS (idempotent)
ALTER TABLE public.company_profiles ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing restrictive policies if any (optional, but good practice to clean up)
-- DROP POLICY IF EXISTS "Company profiles are viewable by everyone" ON public.company_profiles; 

-- 3. Create a permissive SELECT policy
-- We allow 'true' because job offers are public, so the company profile showing basic info should also be visible.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'company_profiles' 
    AND policyname = 'Enable read access for all users'
  ) THEN
    CREATE POLICY "Enable read access for all users"
    ON public.company_profiles
    FOR SELECT
    USING (true);
  END IF;
END $$;

-- 4. Just in case, grant usage on schema public to anon/authenticated (usually default, but good to be safe)
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON public.company_profiles TO anon, authenticated;

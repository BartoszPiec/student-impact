-- COMPREHENSIVE FIX FOR COMPANY PROFILES

-- 0. Ensure Columns Exist (Schema Fix)
ALTER TABLE public.company_profiles ADD COLUMN IF NOT EXISTS nazwa text;
ALTER TABLE public.company_profiles ADD COLUMN IF NOT EXISTS opis text;
ALTER TABLE public.company_profiles ADD COLUMN IF NOT EXISTS miasto text;
ALTER TABLE public.company_profiles ADD COLUMN IF NOT EXISTS strona_www text;
ALTER TABLE public.company_profiles ADD COLUMN IF NOT EXISTS nip text;
ALTER TABLE public.company_profiles ADD COLUMN IF NOT EXISTS logo_url text;

-- 1. Ensure Data Exists: Insert profiles for any company_id in 'offers' that doesn't have a profile yet.
INSERT INTO public.company_profiles (user_id, nazwa, opis, miasto)
SELECT DISTINCT company_id, 'Firma ' || substr(company_id::text, 1, 4), 'Profil utworzony automatycznie.', 'Warszawa'
FROM public.offers
WHERE company_id IS NOT NULL 
  AND company_id NOT IN (SELECT user_id FROM public.company_profiles);

-- 2. Reset RLS Policies: Drop potentially conflicting or strictly scoped policies.
DROP POLICY IF EXISTS "Enable read access for all users" ON public.company_profiles;
DROP POLICY IF EXISTS "Company profiles are viewable by everyone" ON public.company_profiles;
DROP POLICY IF EXISTS "Companies can update own profile" ON public.company_profiles;
-- (Add any other custom names you might have created)

-- 3. Create Clean Policies
-- A) Public Read Access (Authenticated & Anon)
CREATE POLICY "Public Read Access"
ON public.company_profiles
FOR SELECT
USING (true);

-- B) Update Access (Only owner)
CREATE POLICY "Owner Update Access"
ON public.company_profiles
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- C) Insert Access (Only owner)
CREATE POLICY "Owner Insert Access"
ON public.company_profiles
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- 4. Enable RLS
ALTER TABLE public.company_profiles ENABLE ROW LEVEL SECURITY;

-- 5. Verification: Grant permissions
GRANT SELECT ON public.company_profiles TO anon, authenticated, service_role;

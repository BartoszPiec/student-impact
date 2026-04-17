-- FORCE_FIX_ALL_V3.sql
-- Run this to fix ALL permission and schema issues preventing Order Creation

BEGIN;

-- 1. Ensure 'offers' table has necessary columns
ALTER TABLE public.offers ADD COLUMN IF NOT EXISTS is_platform_service boolean DEFAULT false;
ALTER TABLE public.offers ADD COLUMN IF NOT EXISTS service_package_id uuid REFERENCES public.service_packages(id);
-- Ensure 'kategoria' column exists (it should, but just in case)
ALTER TABLE public.offers ADD COLUMN IF NOT EXISTS kategoria text;
-- Ensure 'wymagania' column exists and is array (text[]) or json
-- Assuming it is text[] based on usage as array
ALTER TABLE public.offers ADD COLUMN IF NOT EXISTS wymagania text[];


-- 2. ENABLE RLS
ALTER TABLE public.offers ENABLE ROW LEVEL SECURITY;

-- 3. GRANT PERMISSIONS (CRITICAL)
-- Allow Authenticated users (Companies) to INSERT into offers
DROP POLICY IF EXISTS "Companies can insert own offers" ON public.offers;
CREATE POLICY "Companies can insert own offers"
ON public.offers
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = company_id
);

-- Allow Authenticated users to SELECT their own offers (needed for the .select().single() return)
DROP POLICY IF EXISTS "Companies can view own offers" ON public.offers;
CREATE POLICY "Companies can view own offers"
ON public.offers
FOR SELECT
TO authenticated
USING (
  auth.uid() = company_id
);

-- Allow Students to view published offers (just in case)
DROP POLICY IF EXISTS "Students can view published offers" ON public.offers;
CREATE POLICY "Students can view published offers"
ON public.offers
FOR SELECT
TO authenticated
USING (
  status = 'published'
);

-- 4. Ensure Service Packages are readable
ALTER TABLE public.service_packages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable read access for all users" ON public.service_packages;
CREATE POLICY "Enable read access for all users"
ON public.service_packages
FOR SELECT
USING (true);

COMMIT;

NOTIFY pgrst, 'reload schema';

-- FIX_OFFER_CREATION_RLS.sql
BEGIN;

-- 1. Enable RLS on offers if not already (it should be)
ALTER TABLE public.offers ENABLE ROW LEVEL SECURITY;

-- 2. Allow companies to INSERT their own offers
DROP POLICY IF EXISTS "Companies can insert own offers" ON public.offers;
CREATE POLICY "Companies can insert own offers"
ON public.offers
FOR INSERT
WITH CHECK (
  auth.uid() = company_id
);

-- 3. Allow companies to SELECT their own offers (for the return select)
DROP POLICY IF EXISTS "Companies can view own offers" ON public.offers;
CREATE POLICY "Companies can view own offers"
ON public.offers
FOR SELECT
USING (
  auth.uid() = company_id
);

-- 4. Ensure service_packages are readable (they should be public mostly, but checking)
DROP POLICY IF EXISTS "Public can view active service packages" ON public.service_packages;
CREATE POLICY "Public can view active service packages"
ON public.service_packages
FOR SELECT
USING (status = 'active');

COMMIT;

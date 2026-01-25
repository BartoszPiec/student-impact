-- 1. Allow everyone (authenticated) to view company profiles (needed for Job Board)
DROP POLICY IF EXISTS company_profiles_read_all ON public.company_profiles;
CREATE POLICY company_profiles_read_all
  ON public.company_profiles
  FOR SELECT
  TO authenticated
  USING (true);

-- 2. TEMPORARY DEBUG: Allow viewing ALL offers to diagnose visibility issues
-- (We will revert this to 'status = published' later once confirmed)
DROP POLICY IF EXISTS offers_select ON public.offers;
CREATE POLICY offers_select
  ON public.offers
  FOR SELECT
  TO authenticated
  USING (true);

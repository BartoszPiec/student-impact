-- FIX_PACKAGES_RLS.sql

BEGIN;

ALTER TABLE public.service_packages ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    -- Drop potential conflicting policies (cleaning up old strict ones)
    DROP POLICY IF EXISTS "Allow all for auth users" ON public.service_packages;
    DROP POLICY IF EXISTS "Enable read access for all users" ON public.service_packages;
    DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.service_packages;
    DROP POLICY IF EXISTS "Enable update for users based on email" ON public.service_packages;
    DROP POLICY IF EXISTS "Enable delete for users based on user_id" ON public.service_packages;
    
    -- Create a permissive policy for testing/admin purposes (so you can run Reset Catalog)
    -- In production, you'd want stricter rules (e.g. only admin can edit platform_service)
    CREATE POLICY "Allow all actions for authenticated users"
    ON public.service_packages
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);
    
    -- Allow anonymous read if needed for public pages (optional)
    CREATE POLICY "Allow public read"
    ON public.service_packages
    FOR SELECT
    TO anon
    USING (true);

END $$;

COMMIT;

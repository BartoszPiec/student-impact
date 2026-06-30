-- FIX Foreign Key Names for Service Orders
-- Problem: PostgREST API expects exact constraint names ('service_orders_company_id_fkey') to resolve relationships.
-- If the table was created with auto-generated names that differ, the API fails with PGRST200.

-- 1. Fix Company FK
ALTER TABLE public.service_orders
DROP CONSTRAINT IF EXISTS service_orders_company_id_fkey; -- Drop if exists (to recreate cleanly)

-- Remove any other potential constraints on this column to avoid duplicates (hard to guess name, but 'service_orders_company_id_fkey' is standard)
-- We rely on adding the specific name the App expects.

ALTER TABLE public.service_orders
ADD CONSTRAINT service_orders_company_id_fkey
FOREIGN KEY (company_id)
REFERENCES public.profiles(user_id)
ON DELETE CASCADE;

-- 2. Fix Package FK
ALTER TABLE public.service_orders
DROP CONSTRAINT IF EXISTS service_orders_package_id_fkey;

ALTER TABLE public.service_orders
ADD CONSTRAINT service_orders_package_id_fkey
FOREIGN KEY (package_id)
REFERENCES public.service_packages(id)
ON DELETE SET NULL;

-- 3. Fix Student FK (Just in case, though code currently might filters by student_id instead of join)
ALTER TABLE public.service_orders
DROP CONSTRAINT IF EXISTS service_orders_student_id_fkey;

ALTER TABLE public.service_orders
ADD CONSTRAINT service_orders_student_id_fkey
FOREIGN KEY (student_id)
REFERENCES public.profiles(user_id)
ON DELETE CASCADE;

-- 4. Reload Schema Cache (Supabase does this automatically, but good to note)
NOTIFY pgrst, 'reload schema';

SELECT 'Foreign Key constraints renamed/fixed successfully' as status;

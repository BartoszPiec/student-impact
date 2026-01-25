-- ============================================================
-- FORCE DEBUG: Temporarily Disable Security to find the row
-- ============================================================

BEGIN;

-- 1. Disable RLS to see EVERYTHING
ALTER TABLE public.applications DISABLE ROW LEVEL SECURITY;

-- 2. Check for the specific App ID
SELECT 
    id, 
    status, 
    realization_status,
    contract_id
FROM public.applications 
WHERE id = '6b72ad79-0175-42bf-a100-6acf5485503f';

-- 3. Check if ANY application exists (count)
SELECT count(*) as total_apps FROM public.applications;

-- 4. Re-enable RLS (Important!)
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;

COMMIT;

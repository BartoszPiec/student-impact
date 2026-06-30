-- Check RLS status and Policies for core tables
SELECT 
    tablename, 
    rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('contracts', 'milestones', 'deliverables');

-- List all policies on these tables
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename IN ('contracts', 'milestones', 'deliverables')
ORDER BY tablename, policyname;

-- Check for "Access All" policies (should be gone)
SELECT count(*) as access_all_count
FROM pg_policies
WHERE policyname = 'Access All'
AND tablename IN ('contracts', 'milestones', 'deliverables');

-- ============================================================
-- FIND ID SCRIPT
-- Search for ID: 6b72ad79-0175-42bf-a100-6acf5485503f
-- ============================================================

SELECT 'applications' as table_name, id, status, student_id FROM public.applications WHERE id = '6b72ad79-0175-42bf-a100-6acf5485503f'
UNION ALL
SELECT 'service_orders' as table_name, id, status, student_id FROM public.service_orders WHERE id = '6b72ad79-0175-42bf-a100-6acf5485503f'
UNION ALL
SELECT 'contracts' as table_name, id, status, student_id FROM public.contracts WHERE id = '6b72ad79-0175-42bf-a100-6acf5485503f';

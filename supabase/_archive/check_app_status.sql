-- ============================================================
-- CHECK STATUS for App ID: 6b72ad79-0175-42bf-a100-6acf5485503f
-- This will show the result in the TABLE view (Results).
-- ============================================================

SELECT 
  id, 
  status, 
  realization_status, 
  contract_id,
  (SELECT count(*) FROM contracts WHERE application_id = applications.id) as has_contract
FROM public.applications 
WHERE id = '6b72ad79-0175-42bf-a100-6acf5485503f';

-- Check the most recent contract and its milestones
SELECT 
    c.id as contract_id, 
    c.status as contract_status, 
    c.terms_status,
    m.id as milestone_id, 
    m.idx, 
    m.status as milestone_status, 
    m.amount
FROM public.contracts c
LEFT JOIN public.milestones m ON m.contract_id = c.id
ORDER BY c.created_at DESC
LIMIT 10;

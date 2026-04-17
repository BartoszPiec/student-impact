-- Check post-approval state
SELECT 
    c.id, 
    c.status as contract_status, 
    c.terms_status,
    (SELECT count(*) FROM public.milestones m WHERE m.contract_id = c.id) as milestone_count
FROM public.contracts c
WHERE c.id = '4dde260e-4eae-4c43-864d-6be246d76fbe';

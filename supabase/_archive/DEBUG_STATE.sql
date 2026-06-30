-- DEBUG STATE (SELECT version for compatibility)
SELECT 
    c.id as contract_id,
    c.terms_status,
    c.status as contract_status,
    (SELECT count(*) FROM public.milestones m WHERE m.contract_id = c.id) as milestone_count,
    (SELECT min(status) FROM public.milestones m WHERE m.contract_id = c.id) as first_milestone_status,
    CASE 
        WHEN c.terms_status != 'agreed' THEN 'PROBLEM: terms_status not agreed'
        WHEN (SELECT count(*) FROM public.milestones m WHERE m.contract_id = c.id) = 0 THEN 'PROBLEM: No milestones'
        ELSE 'OK: Data looks good'
    END as diagnosis
FROM public.contracts c
WHERE c.id = '4dde260e-4eae-4c43-864d-6be246d76fbe';

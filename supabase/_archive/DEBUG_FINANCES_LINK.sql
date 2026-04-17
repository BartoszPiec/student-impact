-- Check if the active contract is linked to an application
SELECT 
    c.id as contract_id, 
    c.status as contract_status, 
    c.application_id,
    a.contract_id as app_contract_id,
    c.student_id,
    auth.users.email as student_email
FROM public.contracts c
JOIN auth.users ON c.student_id = auth.users.id
LEFT JOIN public.applications a ON a.id = c.application_id
ORDER BY c.created_at DESC
LIMIT 5;

-- Check milestones for the latest contract to verify 'released' status
SELECT 
    m.id, 
    m.status, 
    m.amount, 
    m.contract_id 
FROM public.milestones m
WHERE m.contract_id = (SELECT id FROM public.contracts ORDER BY created_at DESC LIMIT 1);

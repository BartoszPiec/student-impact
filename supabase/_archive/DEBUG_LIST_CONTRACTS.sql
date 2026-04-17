-- DEBUG: LIST RECENT CONTRACTS
-- This helps identify who actually owns the data (Student vs Company)

SELECT 
    c.id as contract_id,
    c.status as contract_status,
    c.created_at,
    c.student_id,
    us.email as student_email,
    c.company_id,
    uc.email as company_email
FROM public.contracts c
LEFT JOIN auth.users us ON c.student_id = us.id
LEFT JOIN auth.users uc ON c.company_id = uc.id
ORDER BY c.created_at DESC
LIMIT 5;

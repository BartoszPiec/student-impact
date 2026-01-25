-- CHECK OWNERSHIP DIRECTLY (Admin/No-RLS check)
-- We want to see if this specific user (3babf40d-0b17-4f7a-a7f6-1dc82e9ceae0) is actually set as student_id

SELECT 
    c.id as contract_id,
    c.status as contract_status,
    c.student_id,
    c.company_id,
    (c.student_id = '3babf40d-0b17-4f7a-a7f6-1dc82e9ceae0') as is_student_match,
    COUNT(m.id) as milestone_count
FROM public.contracts c
LEFT JOIN public.milestones m ON m.contract_id = c.id
WHERE c.student_id = '3babf40d-0b17-4f7a-a7f6-1dc82e9ceae0' 
   OR c.company_id = '3babf40d-0b17-4f7a-a7f6-1dc82e9ceae0'
GROUP BY c.id, c.status, c.student_id, c.company_id;

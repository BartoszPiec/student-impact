SELECT 
    id, 
    status, 
    company_feedback, 
    description,
    milestone_id,
    created_at 
FROM public.deliverables 
ORDER BY created_at DESC 
LIMIT 5;

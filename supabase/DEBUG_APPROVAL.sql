-- Find the most recently updated draft to see what's happening
SELECT 
    d.id as draft_id,
    d.contract_id,
    d.state as draft_state,
    d.updated_at as draft_updated_at,
    c.terms_status,
    c.status as contract_status
FROM public.milestone_drafts d
LEFT JOIN public.contracts c ON c.id = d.contract_id
ORDER BY d.updated_at DESC
LIMIT 1;

-- Check if ANY contract is agreed
SELECT count(*) as total_agreed_contracts FROM public.contracts WHERE terms_status = 'agreed';

-- Check definition of the function to see if it was updated
SELECT substr(prosrc, 1, 100) as function_source_start FROM pg_proc WHERE proname = 'draft_approve';

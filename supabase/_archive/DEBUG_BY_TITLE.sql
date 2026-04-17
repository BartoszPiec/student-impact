-- Find contract by exact title matches from the screenshot
SELECT 
    c.id as contract_id,
    c.title,
    c.status as contract_status,
    c.terms_status,
    d.id as draft_id,
    d.state as draft_state
FROM public.contracts c
LEFT JOIN public.milestone_drafts d ON d.contract_id = c.id
WHERE c.title ILIKE '%Test realizacji%';

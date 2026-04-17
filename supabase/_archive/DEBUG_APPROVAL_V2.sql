-- Try to find contract via Order title
SELECT 
    c.id as contract_id,
    o.title as order_title,
    c.terms_status,
    c.status as contract_status,
    d.id as draft_id,
    d.state as draft_state
FROM public.contracts c
JOIN public.service_orders o ON o.id = c.service_order_id
LEFT JOIN public.milestone_drafts d ON d.contract_id = c.id
WHERE o.title ILIKE '%Test realizacji%'
LIMIT 1;

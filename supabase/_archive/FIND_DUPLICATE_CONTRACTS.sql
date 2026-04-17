-- Check for multiple contracts linked to the same Service Order (by title)
SELECT 
    o.title as order_title,
    o.id as service_order_id,
    c.id as contract_id,
    c.status,
    c.terms_status,
    c.created_at
FROM public.service_orders o
JOIN public.contracts c ON c.service_order_id = o.id
WHERE o.title ILIKE '%Test realizacji%'
ORDER BY c.created_at DESC;

-- Inspect the specific contract loaded by the UI
SELECT 
    c.id as contract_id, 
    c.terms_status, 
    c.status as contract_status,
    d.id as draft_id, 
    d.state as draft_state,
    d.current_version_id,
    d.review_version_id
FROM public.contracts c
LEFT JOIN public.milestone_drafts d ON d.contract_id = c.id
WHERE c.id = '4dde260e-4eae-4c43-864d-6be246d76fbe';

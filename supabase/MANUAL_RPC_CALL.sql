-- Force call the approval function for the contract loaded in the UI
SELECT public.draft_approve('4dde260e-4eae-4c43-864d-6be246d76fbe');

-- Check the state immediately after
SELECT 
    c.id as contract_id, 
    c.terms_status, 
    d.state as draft_state 
FROM public.contracts c
JOIN public.milestone_drafts d ON d.contract_id = c.id
WHERE c.id = '4dde260e-4eae-4c43-864d-6be246d76fbe';

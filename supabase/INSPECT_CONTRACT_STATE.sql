-- Check contract and draft status
SELECT 
  c.id as contract_id, 
  c.terms_status, 
  c.status as contract_status,
  d.id as draft_id, 
  d.state as draft_state
FROM public.contracts c
LEFT JOIN public.milestone_drafts d ON d.contract_id = c.id
LIMIT 5;

-- Check drafts and their states
SELECT id, contract_id, state, current_version_id, review_version_id, company_changes_version_id
FROM public.milestone_drafts
LIMIT 10;

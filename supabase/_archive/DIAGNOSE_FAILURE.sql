-- DIAGNOSIS via SELECT (safer for SQL clients)
SELECT 
    c.id as contract_id,
    c.terms_status,
    c.status as contract_status,
    c.student_id,
    c.company_id,
    d.id as draft_id,
    d.state as draft_state,
    d.review_version_id,
    d.company_changes_version_id,
    -- Check snapshot counts for both potential target versions
    (SELECT COUNT(*) FROM public.milestone_snapshots ms WHERE ms.version_id = d.review_version_id) as review_snapshots_count,
    (SELECT COUNT(*) FROM public.milestone_snapshots ms WHERE ms.version_id = d.company_changes_version_id) as company_snapshots_count
FROM public.contracts c
LEFT JOIN public.milestone_drafts d ON d.contract_id = c.id
WHERE c.id = '4dde260e-4eae-4c43-864d-6be246d76fbe';

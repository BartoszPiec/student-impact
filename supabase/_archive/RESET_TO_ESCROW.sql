-- Revert contract and milestones to "Terms Agreed / Awaiting Funding" state (Step 2)
-- Correct status is 'awaiting_funding' based on check constraints

UPDATE public.milestones
SET status = 'awaiting_funding',
    delivered_at = NULL,
    accepted_at = NULL
WHERE contract_id = '4dde260e-4eae-4c43-864d-6be246d76fbe';

UPDATE public.contracts
SET status = 'awaiting_funding' 
WHERE id = '4dde260e-4eae-4c43-864d-6be246d76fbe';

DELETE FROM public.deliverables 
WHERE milestone_id IN (SELECT id FROM public.milestones WHERE contract_id = '4dde260e-4eae-4c43-864d-6be246d76fbe');

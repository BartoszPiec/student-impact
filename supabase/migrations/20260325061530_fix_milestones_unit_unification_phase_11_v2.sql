-- Phase 11 Hotfix: Milestones Unit Unification (v2)
ALTER TABLE public.milestones ADD COLUMN IF NOT EXISTS amount_minor bigint;

-- Backfill from legacy amount (PLN -> grosze)
UPDATE public.milestones
SET amount_minor = (amount * 100)::bigint
WHERE amount IS NOT NULL AND amount_minor IS NULL;

-- Ensure total_amount_minor in contracts matches sum of milestone minor amounts
UPDATE public.contracts c
SET total_amount_minor = (
  SELECT COALESCE(SUM(amount_minor), 0)
  FROM public.milestones m
  WHERE m.contract_id = c.id
)
WHERE EXISTS (SELECT 1 FROM public.milestones m WHERE m.contract_id = c.id);
;

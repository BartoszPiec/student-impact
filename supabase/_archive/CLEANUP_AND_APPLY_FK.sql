-- CLEANUP CORRUPT DATA AND APPLY FKs
-- We cannot apply constraints because existing data points to non-existent versions.
-- We must NULL-ify these bad pointers first.

BEGIN;

-- 1. Sanitize 'current_version_id'
UPDATE public.milestone_drafts
SET current_version_id = NULL
WHERE current_version_id IS NOT NULL 
AND current_version_id NOT IN (SELECT id FROM public.milestone_versions);

-- 2. Sanitize 'review_version_id'
UPDATE public.milestone_drafts
SET review_version_id = NULL
WHERE review_version_id IS NOT NULL 
AND review_version_id NOT IN (SELECT id FROM public.milestone_versions);

-- 3. Sanitize 'company_changes_version_id'
UPDATE public.milestone_drafts
SET company_changes_version_id = NULL
WHERE company_changes_version_id IS NOT NULL 
AND company_changes_version_id NOT IN (SELECT id FROM public.milestone_versions);


-- 4. Now drop old constraints (if any)
ALTER TABLE public.milestone_drafts 
DROP CONSTRAINT IF EXISTS fk_draft_current_version,
DROP CONSTRAINT IF EXISTS fk_draft_review_version,
DROP CONSTRAINT IF EXISTS fk_draft_company_changes_version,
DROP CONSTRAINT IF EXISTS fk_draft_current_version_fixed,
DROP CONSTRAINT IF EXISTS fk_draft_review_version_fixed,
DROP CONSTRAINT IF EXISTS fk_draft_company_changes_version_fixed;

-- 5. Add correct constraints SAFELY
ALTER TABLE public.milestone_drafts
ADD CONSTRAINT fk_draft_current_version_fixed
FOREIGN KEY (current_version_id)
REFERENCES public.milestone_versions(id)
ON DELETE SET NULL;

ALTER TABLE public.milestone_drafts
ADD CONSTRAINT fk_draft_review_version_fixed
FOREIGN KEY (review_version_id)
REFERENCES public.milestone_versions(id)
ON DELETE SET NULL;

ALTER TABLE public.milestone_drafts
ADD CONSTRAINT fk_draft_company_changes_version_fixed
FOREIGN KEY (company_changes_version_id)
REFERENCES public.milestone_versions(id)
ON DELETE SET NULL;

COMMIT;

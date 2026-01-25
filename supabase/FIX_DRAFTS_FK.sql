-- FIX FOREIGN KEYS ON MILESTONE_DRAFTS
-- The error "violates foreign key constraint fk_draft_current_version" pointing to "draft_versions" 
-- confirms that the drafts table has incorrect legacy constraints.
-- We must repoint them to 'milestone_versions'.

BEGIN;

-- 1. Drop potential bad constraints
ALTER TABLE public.milestone_drafts 
DROP CONSTRAINT IF EXISTS fk_draft_current_version,
DROP CONSTRAINT IF EXISTS fk_draft_review_version,
DROP CONSTRAINT IF EXISTS fk_draft_company_changes_version;

-- 2. Add correct constraints (pointing to milestone_versions)
-- We use ALTER TABLE to add them safely
ALTER TABLE public.milestone_drafts
ADD CONSTRAINT fk_draft_current_version_fixed
FOREIGN KEY (current_version_id)
REFERENCES public.milestone_versions(id)
ON DELETE SET NULL; -- If version is deleted, set pointer to null (or CASCADE? usually SET NULL for pointers)

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

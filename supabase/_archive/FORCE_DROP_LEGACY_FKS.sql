-- FORCE DROP LEGACY CONSTRAINTS
-- usage: Removing 'fk_draft_company_changes' which points to the dead 'draft_versions' table.

BEGIN;

-- 1. Drop the specific legacy constraint found in the screenshot
ALTER TABLE public.milestone_drafts 
DROP CONSTRAINT IF EXISTS fk_draft_company_changes;

-- 2. Drop other potentially lurking legacy constraints (just to be safe)
ALTER TABLE public.milestone_drafts 
DROP CONSTRAINT IF EXISTS fk_draft_current_version;

ALTER TABLE public.milestone_drafts 
DROP CONSTRAINT IF EXISTS fk_draft_review_version;

COMMIT;

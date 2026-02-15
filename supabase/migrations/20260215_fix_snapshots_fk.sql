-- ========================================
-- MIGRACJA: Naprawa FK milestone_snapshots
-- Data: 2026-02-15
-- Problem: milestone_snapshots.version_id ma FK do milestone_versions (stara tabela)
--          ale draft_save_version() wstawia version_id z draft_versions (nowa tabela)
-- Rozwiązanie: Usunąć stary FK i dodać poprawny do draft_versions
-- ========================================

-- 1. Usuń stare constrainty (mogą istnieć różne nazwy)
ALTER TABLE public.milestone_snapshots
DROP CONSTRAINT IF EXISTS milestone_snapshots_version_id_fkey_fixed;

ALTER TABLE public.milestone_snapshots
DROP CONSTRAINT IF EXISTS milestone_snapshots_version_id_fkey;

-- 2. Dodaj poprawny FK do draft_versions
ALTER TABLE public.milestone_snapshots
ADD CONSTRAINT milestone_snapshots_version_id_fkey
FOREIGN KEY (version_id) REFERENCES public.draft_versions(id) ON DELETE CASCADE;

-- 3. Napraw też FK w milestone_drafts (current_version_id, review_version_id, company_changes_version_id)
-- Te mogą wskazywać na milestone_versions zamiast draft_versions

ALTER TABLE public.milestone_drafts
DROP CONSTRAINT IF EXISTS fk_draft_current_version_fixed;

ALTER TABLE public.milestone_drafts
DROP CONSTRAINT IF EXISTS fk_draft_review_version_fixed;

ALTER TABLE public.milestone_drafts
DROP CONSTRAINT IF EXISTS fk_draft_company_changes_version_fixed;

-- Wyczyść orphaned version IDs (wskazujące na milestone_versions a nie draft_versions)
UPDATE public.milestone_drafts
SET current_version_id = NULL
WHERE current_version_id IS NOT NULL
AND current_version_id NOT IN (SELECT id FROM public.draft_versions);

UPDATE public.milestone_drafts
SET review_version_id = NULL
WHERE review_version_id IS NOT NULL
AND review_version_id NOT IN (SELECT id FROM public.draft_versions);

UPDATE public.milestone_drafts
SET company_changes_version_id = NULL
WHERE company_changes_version_id IS NOT NULL
AND company_changes_version_id NOT IN (SELECT id FROM public.draft_versions);

-- Dodaj poprawne FK do draft_versions
ALTER TABLE public.milestone_drafts
ADD CONSTRAINT fk_draft_current_version
FOREIGN KEY (current_version_id) REFERENCES public.draft_versions(id) ON DELETE SET NULL;

ALTER TABLE public.milestone_drafts
ADD CONSTRAINT fk_draft_review_version
FOREIGN KEY (review_version_id) REFERENCES public.draft_versions(id) ON DELETE SET NULL;

ALTER TABLE public.milestone_drafts
ADD CONSTRAINT fk_draft_company_changes_version
FOREIGN KEY (company_changes_version_id) REFERENCES public.draft_versions(id) ON DELETE SET NULL;

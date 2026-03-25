-- Migration: Fix Database Drifts (DRIFT-01, 02, 03)
-- Created: 2026-03-24
-- Description: Cleanup of legacy policies, redundant indices, and setting storage limits.

-- 1. DRIFT-01: Drop legacy/duplicate policies on applications
DROP POLICY IF EXISTS "Companies can update received applications" ON public.applications;
DROP POLICY IF EXISTS "Companies update applications" ON public.applications;
DROP POLICY IF EXISTS "Applications view own" ON public.applications;
DROP POLICY IF EXISTS "Student view own apps" ON public.applications;
DROP POLICY IF EXISTS "Company view offer apps" ON public.applications;

-- 2. DRIFT-02: Deliverables bucket hardening
-- Setting 100MB limit and allowing common archive/document/image types
UPDATE storage.buckets 
SET 
  file_size_limit = 104857600, -- 100MB
  allowed_mime_types = '{
    "application/pdf",
    "application/zip",
    "application/x-zip-compressed",
    "application/octet-stream",
    "image/jpeg",
    "image/png",
    "image/webp",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  }'
WHERE id = 'deliverables';

-- 3. DRIFT-03: Redundant index cleanup
DROP INDEX IF EXISTS public.idx_ledger_stripe_refund_v3;

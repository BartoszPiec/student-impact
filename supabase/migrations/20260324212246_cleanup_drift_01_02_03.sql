-- DRIFT-01: Drop legacy/duplicate RLS policies on applications table
-- Keeping canonical: applications_select_participants (superset), applications_update_student,
-- Companies can update received applications (has WITH CHECK), applications_insert_student,
-- applications_delete_own, Admins can delete applications

DROP POLICY IF EXISTS "Applications view own" ON applications;
DROP POLICY IF EXISTS "Student view own apps" ON applications;
DROP POLICY IF EXISTS "Company view offer apps" ON applications;
DROP POLICY IF EXISTS "Companies update applications" ON applications;

-- DRIFT-02: Set file_size_limit and allowed_mime_types on deliverables bucket
UPDATE storage.buckets
SET
  file_size_limit = 104857600, -- 100 MB
  allowed_mime_types = ARRAY[
    'application/pdf',
    'application/zip',
    'application/x-zip-compressed',
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'video/mp4',
    'video/webm',
    'audio/mpeg',
    'audio/wav',
    'text/plain',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ]
WHERE id = 'deliverables';

-- DRIFT-03: Drop redundant old partial index (replaced by idx_ledger_stripe_refund_unique_notnull)
DROP INDEX IF EXISTS idx_ledger_stripe_refund_v3;;

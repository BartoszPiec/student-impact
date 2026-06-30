
SELECT conname, pg_get_constraintdef(oid)
FROM pg_constraint
WHERE conname = 'deliverables_status_check';

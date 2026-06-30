-- INSPECT CONSTRAINTS ON MILESTONE_DRAFTS
SELECT conname, confrelid::regclass AS target_table
FROM pg_constraint 
WHERE conrelid = 'public.milestone_drafts'::regclass 
AND contype = 'f';

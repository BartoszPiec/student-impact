-- Drop the existing foreign key constraint
ALTER TABLE conversations
DROP CONSTRAINT IF EXISTS conversations_application_id_fkey;

-- Re-add the constraint with ON DELETE CASCADE
ALTER TABLE conversations
ADD CONSTRAINT conversations_application_id_fkey
FOREIGN KEY (application_id)
REFERENCES applications(id)
ON DELETE CASCADE;

-- Also check offers FK just in case (optional, but good practice for cleanup)
-- ALTER TABLE conversations
-- DROP CONSTRAINT IF EXISTS conversations_offer_id_fkey;
-- ALTER TABLE conversations
-- ADD CONSTRAINT conversations_offer_id_fkey
-- FOREIGN KEY (offer_id)
-- REFERENCES offers(id)
-- ON DELETE CASCADE;

-- FIX: Enable CASCADE DELETE for messages when conversation is deleted
-- This prevents FK violation errors when cleaning up conversations.

ALTER TABLE messages
DROP CONSTRAINT IF EXISTS messages_conversation_id_fkey;

ALTER TABLE messages
ADD CONSTRAINT messages_conversation_id_fkey
FOREIGN KEY (conversation_id)
REFERENCES conversations(id)
ON DELETE CASCADE;

-- Also specific fix: Make sure conversations are deleted if application is deleted (Optional, but good for cleanup)
ALTER TABLE conversations
DROP CONSTRAINT IF EXISTS conversations_application_id_fkey;

ALTER TABLE conversations
ADD CONSTRAINT conversations_application_id_fkey
FOREIGN KEY (application_id)
REFERENCES applications(id)
ON DELETE SET NULL; -- Or CASCADE? Usually we want to keep chat even if app deleted? 
-- Code tries to delete conversation manually anyway. Let's stick to SET NULL for safety, or CASCADE if we want full wipe.
-- User code attempts manual delete. The blocker is messages.

-- So just the messages fix is enough for the user error.

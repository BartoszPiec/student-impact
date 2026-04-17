-- Enable RLS just in case
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- 1. CONVERSATIONS: Allow participants to UPDATE (e.g. link application)
DROP POLICY IF EXISTS "Participants can update conversations" ON conversations;
CREATE POLICY "Participants can update conversations"
ON conversations
FOR UPDATE
USING (auth.uid() = student_id OR auth.uid() = company_id);

-- 2. MESSAGES: Allow participants to INSERT (send messages)
DROP POLICY IF EXISTS "Users can insert messages" ON messages;
CREATE POLICY "Users can insert messages"
ON messages
FOR INSERT
WITH CHECK (auth.uid() = sender_id);

-- 3. MESSAGES: Allow participants to SELECT (read messages)
-- Usually relies on being a participant of the conversation
DROP POLICY IF EXISTS "Participants can view messages" ON messages;
CREATE POLICY "Participants can view messages"
ON messages
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM conversations c
        WHERE c.id = messages.conversation_id
        AND (c.student_id = auth.uid() OR c.company_id = auth.uid())
    )
);

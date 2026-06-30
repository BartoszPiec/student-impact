-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Participants can view messages" ON messages;
DROP POLICY IF EXISTS "Participants can insert messages" ON messages;

-- View Policy: Participants (Student or Company) can view messages in their conversation
CREATE POLICY "Participants can view messages"
ON messages FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM conversations c
    WHERE c.id = messages.conversation_id
    AND (auth.uid() = c.student_id OR auth.uid() = c.company_id)
  )
);

-- Insert Policy: Participants can insert into their conversation
CREATE POLICY "Participants can insert messages"
ON messages FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM conversations c
    WHERE c.id = conversation_id
    AND (auth.uid() = c.student_id OR auth.uid() = c.company_id)
  )
);

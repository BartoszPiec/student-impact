-- Enable RLS on conversations if not already enabled (likely is)
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

-- POLICY: Participants can update their own conversations
-- Needed for linking application_id during negotiation
DROP POLICY IF EXISTS "Participants can update conversations" ON conversations;

CREATE POLICY "Participants can update conversations"
ON conversations
FOR UPDATE
USING (auth.uid() = student_id OR auth.uid() = company_id);

-- Ensure INSERT policy exists if not present (usually handled by trigger or other logic, but good to have)
-- DROP POLICY IF EXISTS "Users can create conversations" ON conversations;
-- CREATE POLICY "Users can create conversations" ON conversations FOR INSERT WITH CHECK (auth.uid() = student_id OR auth.uid() = company_id);

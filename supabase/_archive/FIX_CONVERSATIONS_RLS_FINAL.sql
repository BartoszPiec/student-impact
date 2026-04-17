-- Enable RLS (already enabled likely)
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

-- 1. SELECT: Participants can view their conversations
DROP POLICY IF EXISTS "Participants can view conversations" ON conversations;
CREATE POLICY "Participants can view conversations"
ON conversations
FOR SELECT
USING (auth.uid() = student_id OR auth.uid() = company_id);

-- 2. INSERT: Users can create conversations (if they are one of the participants)
-- Usually the creator is the student (student_id) or comapny (company_id)
DROP POLICY IF EXISTS "Users can create conversations" ON conversations;
CREATE POLICY "Users can create conversations"
ON conversations
FOR INSERT
WITH CHECK (auth.uid() = student_id OR auth.uid() = company_id);

-- 3. UPDATE: (Re-applying just in case)
DROP POLICY IF EXISTS "Participants can update conversations" ON conversations;
CREATE POLICY "Participants can update conversations"
ON conversations
FOR UPDATE
USING (auth.uid() = student_id OR auth.uid() = company_id);

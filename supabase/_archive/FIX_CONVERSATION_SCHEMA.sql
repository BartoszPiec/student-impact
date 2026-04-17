-- FIX_CONVERSATION_SCHEMA.sql
-- Makes application_id nullable to support 'Inquiry' conversations (asking about offer before applying)

BEGIN;

-- 1. Alter conversations table
ALTER TABLE public.conversations 
ALTER COLUMN application_id DROP NOT NULL;

-- 2. Verify RLS (ensure insert is allowed based on participants)
DROP POLICY IF EXISTS "Users can insert conversations" ON public.conversations;
CREATE POLICY "Users can insert conversations" ON public.conversations
FOR INSERT WITH CHECK (
  auth.uid() = student_id OR auth.uid() = company_id
);

COMMIT;

-- MASTER_FIX_CHAT.sql
BEGIN;

-- 1. Ensure conversation.application_id is nullable (required for Inquiries)
ALTER TABLE public.conversations 
ALTER COLUMN application_id DROP NOT NULL;

-- 2. Ensure type column exists (idempotent check)
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='conversations' AND column_name='type') THEN
        ALTER TABLE public.conversations 
        ADD COLUMN type text CHECK (type IN ('inquiry', 'application', 'order', 'direct')) DEFAULT 'direct';
    END IF;
END $$;

-- 3. Fix RLS Policies
-- Enable RLS just in case
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

-- Drop existng policies to avoid conflicts
DROP POLICY IF EXISTS "Users can insert conversations" ON public.conversations;
DROP POLICY IF EXISTS "Users can view conversations" ON public.conversations;
DROP POLICY IF EXISTS "Users can update conversations" ON public.conversations;

-- Create ALL necessary policies
CREATE POLICY "Users can insert conversations" ON public.conversations
FOR INSERT WITH CHECK (
  auth.uid() = student_id OR auth.uid() = company_id
);

CREATE POLICY "Users can view conversations" ON public.conversations
FOR SELECT USING (
  auth.uid() = student_id OR auth.uid() = company_id
);

CREATE POLICY "Users can update conversations" ON public.conversations
FOR UPDATE USING (
  auth.uid() = student_id OR auth.uid() = company_id
);

-- 4. Fix Messages RLS (Just in case)
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can insert messages" ON public.messages;
DROP POLICY IF EXISTS "Users can view messages" ON public.messages;

CREATE POLICY "Users can insert messages" ON public.messages
FOR INSERT WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.conversations c 
        WHERE c.id = conversation_id 
        AND (c.student_id = auth.uid() OR c.company_id = auth.uid())
    )
);

CREATE POLICY "Users can view messages" ON public.messages
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.conversations c 
        WHERE c.id = conversation_id 
        AND (c.student_id = auth.uid() OR c.company_id = auth.uid())
    )
);

COMMIT;

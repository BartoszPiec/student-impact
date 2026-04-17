-- ADD_STATUS_TO_CONVERSATIONS.sql
BEGIN;

-- Check if 'status' column exists, if not, add it.
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='conversations' AND column_name='status') THEN
        ALTER TABLE public.conversations 
        ADD COLUMN status text DEFAULT 'active';
    END IF;
END $$;

COMMIT;

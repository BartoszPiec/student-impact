-- FIX_MESSAGES_COLUMNS.sql
BEGIN;

DO $$ 
BEGIN 
    -- Check for 'event' column in 'public.messages'
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name='messages' AND column_name='event') THEN
        ALTER TABLE public.messages ADD COLUMN event text;
    END IF;

    -- Check for 'payload' column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name='messages' AND column_name='payload') THEN
        ALTER TABLE public.messages ADD COLUMN payload jsonb;
    END IF;
END $$;

COMMIT;

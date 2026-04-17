-- MIGRATION_CHAT_TYPES.sql
-- Adds 'type' column to conversations and backfills existing data.

BEGIN;

-- 1. Add type column
ALTER TABLE public.conversations 
ADD COLUMN IF NOT EXISTS type text CHECK (type IN ('inquiry', 'application', 'order', 'direct')) DEFAULT 'direct';

-- 2. Backfill existing data
-- If it has an application_id, it's an application chat
UPDATE public.conversations 
SET type = 'application' 
WHERE application_id IS NOT NULL;

-- If it has an offer_id but no application_id, it might be an inquiry or order?
-- Actually, 'inquiry' usually has student_id & company_id and maybe offer_id context but no application yet.
-- For now, default to 'direct' or leave as is if no better heuristic.
-- If created via startInquiry (which we will update), it will be 'inquiry'.

-- 3. Update Policies if needed (RLS usually doesn't care about type, but good to check)
-- Existing policies cover INSERT/SELECT based on participants.

COMMIT;

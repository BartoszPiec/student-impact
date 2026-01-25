-- FIX_EXISTING_INQUIRY.sql
BEGIN;

DO $$ 
DECLARE
    v_conversation_id uuid := '15a40dfb-ff92-4bc4-a0b4-f88c41aa86ba';
    v_new_app_id uuid;
    v_student_id uuid;
    v_package_id uuid;
    v_company_id uuid;
BEGIN 
    -- 1. Get Conversation Details
    SELECT student_id, company_id, package_id INTO v_student_id, v_company_id, v_package_id
    FROM public.conversations
    WHERE id = v_conversation_id;

    IF v_package_id IS NOT NULL THEN
        -- 2. Create Application (Order) from Inquiry
        INSERT INTO public.applications (student_id, package_id, status, proposed_stawka)
        VALUES (v_student_id, v_package_id, 'sent', 405) -- status='sent' allows company to Accept/Reject
        RETURNING id INTO v_new_app_id;

        -- 3. Link Conversation to new Application
        UPDATE public.conversations
        SET application_id = v_new_app_id,
            type = 'order' -- Upgrade to Order
        WHERE id = v_conversation_id;
    END IF;
END $$;

COMMIT;

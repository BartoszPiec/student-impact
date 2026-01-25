-- CHECK WHAT THIS ID IS
SELECT 'application' as type, id FROM applications WHERE id = '69eb3b81-b0ee-428c-867c-21e7cb7375c0'
UNION ALL
SELECT 'service_order' as type, id FROM service_orders WHERE id = '69eb3b81-b0ee-428c-867c-21e7cb7375c0';

-- INSERT TEST RESOURCE FOR THIS ID (Assume Application first, failover logic embedded)
DO $$
DECLARE
    v_target_id UUID := '69eb3b81-b0ee-428c-867c-21e7cb7375c0';
    v_is_order BOOLEAN;
    v_user_id UUID;
BEGIN
    SELECT auth.uid() INTO v_user_id; -- Might be null if run in SQL editor as anon, so fallback needed
    
    -- Fallback user (try to find owner of this app)
    IF v_user_id IS NULL THEN
        SELECT student_id INTO v_user_id FROM applications WHERE id = v_target_id;
    END IF;
    IF v_user_id IS NULL THEN
        SELECT student_id INTO v_user_id FROM service_orders WHERE id = v_target_id;
    END IF;

    -- Check if Order
    SELECT EXISTS(SELECT 1 FROM service_orders WHERE id = v_target_id) INTO v_is_order;

    IF v_is_order THEN
        INSERT INTO project_resources (service_order_id, uploader_id, file_name, file_path)
        VALUES (v_target_id, v_user_id, 'TEST_MANUAL_ORDER.txt', 'https://example.com/manual_test.txt');
    ELSE
        INSERT INTO project_resources (application_id, uploader_id, file_name, file_path)
        VALUES (v_target_id, v_user_id, 'TEST_MANUAL_APP.txt', 'https://example.com/manual_test.txt');
    END IF;
END;
$$;

-- VERIFY
SELECT * FROM project_resources WHERE application_id = '69eb3b81-b0ee-428c-867c-21e7cb7375c0' OR service_order_id = '69eb3b81-b0ee-428c-867c-21e7cb7375c0';

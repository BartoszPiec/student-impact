DO $$
DECLARE
    v_student_id UUID;
    v_review_count INT;
    v_contract_count INT;
    v_order_count INT;
BEGIN
    -- Try to find the student ID from a review or just pick one that has reviews
    SELECT student_id INTO v_student_id FROM reviews LIMIT 1;
    -- Or if we want specific student (from screenshot name "Bartosz Piec"), we can search profiles
    SELECT user_id INTO v_student_id FROM student_profiles WHERE public_name LIKE '%Bartosz Piec%' LIMIT 1;
    
    RAISE NOTICE 'Debug for Student ID: %', v_student_id;
    
    -- 1. Check Reviews
    SELECT COUNT(*) INTO v_review_count FROM reviews WHERE student_id = v_student_id OR reviewee_id = v_student_id;
    RAISE NOTICE 'Reviews Found: %', v_review_count;
    
    -- 2. Check Contracts (status=completed)
    SELECT COUNT(*) INTO v_contract_count FROM contracts 
    WHERE student_id = v_student_id AND status = 'completed';
    RAISE NOTICE 'Completed Contracts Found: %', v_contract_count;
    
    -- 3. Check All Contracts for this student
    FOR v_contract_count IN SELECT count(*) FROM contracts WHERE student_id = v_student_id LOOP
        RAISE NOTICE 'Total Contracts for Student: %', v_contract_count;
    END LOOP;

    -- 4. List specific non-completed contracts
    RAISE NOTICE '--- Non-Completed Contracts ---';
    PERFORM id, status, application_id, service_order_id FROM contracts 
    WHERE student_id = v_student_id AND status != 'completed';
    
    -- 5. Check Service Orders (status)
    RAISE NOTICE '--- Service Orders ---';
    PERFORM id, status, student_id FROM service_orders WHERE student_id = v_student_id;

END $$;

DO $$
DECLARE
    v_student_id UUID;
BEGIN
    -- 1. Find the student
    SELECT user_id INTO v_student_id FROM student_profiles WHERE public_name LIKE '%Bartosz Piec%' LIMIT 1;
    RAISE NOTICE 'Student ID: %', v_student_id;

    -- 2. Dump Contracts
    RAISE NOTICE '--- CONTRACTS ---';
    FOR v_student_id IN SELECT id FROM contracts WHERE student_id = v_student_id LOOP
    END LOOP;
    
    -- We'll use a temp table approach or just direct perform for notice output logic isn't great in DO block for sets.
    -- Let's just output distinct IDs and their links.
END $$;

-- Better: Just run a direct SELECT query that we can read the output of.
SELECT 
    c.id as contract_id, 
    c.status as contract_status, 
    c.application_id as c_app_id, 
    c.service_order_id as c_so_id, 
    c.created_at as c_created,
    r.id as review_id,
    r.application_id as r_app_id,
    r.service_order_id as r_so_id,
    r.offer_id as r_offer_id
FROM contracts c
LEFT JOIN reviews r ON 
    (c.application_id IS NOT NULL AND r.application_id = c.application_id) OR
    (c.service_order_id IS NOT NULL AND r.service_order_id = c.service_order_id)
WHERE c.student_id = (SELECT user_id FROM student_profiles WHERE public_name LIKE '%Bartosz Piec%' LIMIT 1);

-- DIAGNOSE TABLE RELATIONS and CONSTRAINTS
-- We need to see if 'milestone_versions' has correct structure and constraints.

SELECT 
    conname as constraint_name, 
    contype as constraint_type, 
    pg_get_constraintdef(c.oid) as definition
FROM pg_constraint c 
JOIN pg_namespace n ON n.oid = c.connamespace
WHERE conrelid = 'public.milestone_versions'::regclass;

-- Check if inserting a version manually works
DO $$
DECLARE
    v_draft_id UUID;
    v_ver_id UUID;
BEGIN
    SELECT id INTO v_draft_id FROM milestone_drafts LIMIT 1;
    IF v_draft_id IS NOT NULL THEN
        RAISE NOTICE 'Found draft: %', v_draft_id;
        
        INSERT INTO milestone_versions (draft_id, version_number)
        VALUES (v_draft_id, 999)
        RETURNING id INTO v_ver_id;
        
        RAISE NOTICE 'Inserted test version: %', v_ver_id;
        
        -- Clean up
        DELETE FROM milestone_versions WHERE id = v_ver_id;
    ELSE
        RAISE NOTICE 'No drafts found to test.';
    END IF;
END $$;

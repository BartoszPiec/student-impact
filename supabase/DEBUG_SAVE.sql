-- DEBUG VERSION OF draft_save_version
-- Adds heavy logging to diagnose FK failure.

CREATE OR REPLACE FUNCTION draft_save_version(
    p_contract_id UUID,
    p_base_version_id UUID,
    p_items JSONB
)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
    v_draft_id UUID;
    v_current_ver_num INTEGER;
    v_new_ver_id UUID;
    v_item JSONB;
    v_check_exists BOOLEAN;
BEGIN
    RAISE NOTICE 'DEBUG: Starting save for contract %', p_contract_id;

    SELECT id, current_version_id INTO v_draft_id, v_new_ver_id
    FROM milestone_drafts WHERE contract_id = p_contract_id;

    IF v_draft_id IS NULL THEN
        RAISE EXCEPTION 'Draft not found for contract %', p_contract_id;
    END IF;

    SELECT version_number INTO v_current_ver_num 
    FROM milestone_versions WHERE id = v_new_ver_id;

    IF v_current_ver_num IS NULL THEN v_current_ver_num := 0; END IF;
    RAISE NOTICE 'DEBUG: Current version num: %', v_current_ver_num;

    -- Create New Version
    INSERT INTO milestone_versions (draft_id, version_number, created_by)
    VALUES (v_draft_id, v_current_ver_num + 1, auth.uid())
    RETURNING id INTO v_new_ver_id;

    RAISE NOTICE 'DEBUG: Created version ID: %', v_new_ver_id;

    -- IMMEDIATE CHECK: Does it exist?
    SELECT EXISTS(SELECT 1 FROM milestone_versions WHERE id = v_new_ver_id) INTO v_check_exists;
    IF NOT v_check_exists THEN
        RAISE EXCEPTION 'CRITICAL: Version % inserted but not found immediately!', v_new_ver_id;
    END IF;
    RAISE NOTICE 'DEBUG: Version confirmed exists.';

    -- Insert Items
    IF p_items IS NOT NULL THEN
        RAISE NOTICE 'DEBUG: Inserting items...';
        FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
        LOOP
            -- Explicitly log what we are inserting
            -- RAISE NOTICE 'Item: %', v_item; 
            
            INSERT INTO milestone_snapshots (
                version_id, 
                milestone_client_id,
                position, 
                title, 
                amount_minor, 
                criteria
            )
            VALUES (
                v_new_ver_id,
                (v_item->>'client_id')::UUID,
                (v_item->>'position')::INTEGER,
                (v_item->>'title'),
                (v_item->>'amount_minor')::BIGINT,
                (v_item->>'criteria')
            );
        END LOOP;
        RAISE NOTICE 'DEBUG: Items inserted.';
    END IF;

    UPDATE milestone_drafts
    SET current_version_id = v_new_ver_id,
        updated_at = now()
    WHERE id = v_draft_id;

    RETURN jsonb_build_object('status', 'OK', 'version_id', v_new_ver_id);
END;
$$;

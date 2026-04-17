-- FIX RPCs to handle milestone_client_id
-- The DB schema has 'milestone_client_id' (NOT NULL) which is required for diffing.
-- We must update the RPCs to insert this value.

BEGIN;

-- 1. Initialize Draft (Update to gen random client_id)
CREATE OR REPLACE FUNCTION draft_initialize(
    p_contract_id UUID,
    p_total_amount_minor BIGINT
)
RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
    v_draft_id UUID;
    v_ver_id UUID;
BEGIN
    SELECT id INTO v_draft_id FROM milestone_drafts WHERE contract_id = p_contract_id;
    
    IF v_draft_id IS NOT NULL THEN
        RETURN v_draft_id;
    END IF;

    INSERT INTO milestone_drafts (contract_id, state)
    VALUES (p_contract_id, 'STUDENT_EDITING')
    RETURNING id INTO v_draft_id;

    INSERT INTO milestone_versions (draft_id, version_number, created_by)
    VALUES (v_draft_id, 1, auth.uid())
    RETURNING id INTO v_ver_id;

    -- Generate a fresh client_id for the initial milestone
    INSERT INTO milestone_snapshots (version_id, milestone_client_id, position, title, amount_minor, criteria)
    VALUES (
        v_ver_id, 
        gen_random_uuid(), -- NEW: Generate ID
        0, 
        'Pierwszy Etap', 
        p_total_amount_minor, 
        'Opis zakresu prac...'
    );

    UPDATE milestone_drafts
    SET current_version_id = v_ver_id
    WHERE id = v_draft_id;

    RETURN v_draft_id;
END;
$$;


-- 2. Save Version (Update to read client_id from JSON)
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
BEGIN
    SELECT id, current_version_id INTO v_draft_id, v_new_ver_id
    FROM milestone_drafts WHERE contract_id = p_contract_id;

    SELECT version_number INTO v_current_ver_num 
    FROM milestone_versions WHERE id = v_new_ver_id;

    IF v_current_ver_num IS NULL THEN v_current_ver_num := 0; END IF;

    INSERT INTO milestone_versions (draft_id, version_number, created_by)
    VALUES (v_draft_id, v_current_ver_num + 1, auth.uid())
    RETURNING id INTO v_new_ver_id;

    IF p_items IS NOT NULL THEN
        FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
        LOOP
            INSERT INTO milestone_snapshots (
                version_id, 
                milestone_client_id, -- NEW COLUMN
                position, 
                title, 
                amount_minor, 
                criteria
            )
            VALUES (
                v_new_ver_id,
                (v_item->>'client_id')::UUID, -- Extract from JSON
                (v_item->>'position')::INTEGER,
                (v_item->>'title'),
                (v_item->>'amount_minor')::BIGINT,
                (v_item->>'criteria') -- Now TEXT
            );
        END LOOP;
    END IF;

    UPDATE milestone_drafts
    SET current_version_id = v_new_ver_id,
        updated_at = now()
    WHERE id = v_draft_id;

    RETURN jsonb_build_object('status', 'OK', 'version_id', v_new_ver_id);
END;
$$;

COMMIT;

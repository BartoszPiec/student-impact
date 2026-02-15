-- ========================================
-- MIGRACJA: Naprawa budżetu po negocjacji stawki
-- Data: 2026-02-15
-- Problem: Po negocjacji stawki contract.total_amount nie jest aktualizowany
-- Rozwiązanie: draft_approve synchronizuje total_amount z sumą milestones
-- ========================================

-- Zaktualizuj funkcję draft_approve aby synchronizowała total_amount
CREATE OR REPLACE FUNCTION draft_approve(
    p_contract_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
    v_draft_id UUID;
    v_review_ver_id UUID;
    v_state draft_state;
    v_validation JSONB;
    v_items JSONB;
BEGIN
    SELECT id, state, review_version_id INTO v_draft_id, v_state, v_review_ver_id
    FROM milestone_drafts WHERE contract_id = p_contract_id;

    -- Authorization Check (Company Only)
    IF NOT EXISTS (
        SELECT 1 FROM contracts
        WHERE id = p_contract_id
        AND company_id = auth.uid()
    ) THEN
        RAISE EXCEPTION 'Access denied: Only company can approve draft';
    END IF;

    IF v_state != 'WAITING_COMPANY_REVIEW' THEN
         RAISE EXCEPTION 'Invalid transition from % to APPROVED', v_state;
    END IF;

    -- Verify the REVIEW VERSION budget
    SELECT jsonb_agg(jsonb_build_object('amount_minor', amount_minor)) INTO v_items
    FROM milestone_snapshots WHERE version_id = v_review_ver_id;

    v_validation := validate_draft_budget(v_draft_id, v_items);

    IF (v_validation->>'status') != 'OK' THEN
        RETURN v_validation;
    END IF;

    -- 1. Update Draft State
    UPDATE milestone_drafts
    SET state = 'APPROVED'
    WHERE id = v_draft_id;

    -- 2. Clear Existing Final Milestones (Legacy/Cleanup)
    DELETE FROM milestones WHERE contract_id = p_contract_id;

    -- 3. Insert Final Milestones from Snapshot
    INSERT INTO milestones (
        contract_id,
        title,
        amount,
        acceptance_criteria,
        idx,
        created_by,
        updated_by,
        status
    )
    SELECT
        p_contract_id,
        s.title,
        (s.amount_minor / 100.0),
        s.criteria,
        s.position,
        (SELECT company_id FROM contracts WHERE id = p_contract_id),
        (SELECT company_id FROM contracts WHERE id = p_contract_id),
        CASE WHEN s.position = 0 THEN 'awaiting_funding' ELSE 'pending' END
    FROM milestone_snapshots s
    WHERE s.version_id = v_review_ver_id
    ORDER BY s.position;

    -- 4. Update Contract Status + sync total_amount to sum of milestones
    UPDATE contracts
    SET terms_status = 'agreed',
        terms_version = terms_version + 1,
        company_approved_version = terms_version + 1,
        student_approved_version = terms_version + 1,
        total_amount = (
            SELECT COALESCE(SUM(amount), 0) FROM milestones WHERE contract_id = p_contract_id
        ),
        updated_at = now()
    WHERE id = p_contract_id;

    RETURN jsonb_build_object('status', 'OK', 'new_state', 'APPROVED');
END;
$$;

-- Napraw istniejące kontrakty: zsynchronizuj total_amount z sumą milestones
UPDATE contracts c
SET total_amount = (
    SELECT COALESCE(SUM(m.amount), 0)
    FROM milestones m
    WHERE m.contract_id = c.id
)
WHERE EXISTS (
    SELECT 1 FROM milestones m WHERE m.contract_id = c.id
)
AND total_amount != (
    SELECT COALESCE(SUM(m.amount), 0)
    FROM milestones m
    WHERE m.contract_id = c.id
);

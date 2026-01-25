-- 20260124_fix_draft_zero_budget_and_init_v2.sql
-- Fixes issue where drafts have 0 agreed_total_minor, blocking submission.
-- REVISED: Fetches amount from service_orders or offers tables as contracts table has no amount column.

BEGIN;

-- 1. DATA REPAIR: Update milestones drafts that have 0 budget.
-- Logic: Join contracts -> check service_order_id OR application_id -> fetch amount/stawka.
WITH calculated_amounts AS (
    SELECT 
        c.id as contract_id,
        CASE 
            WHEN c.service_order_id IS NOT NULL THEN (
                SELECT so.amount 
                FROM service_orders so 
                WHERE so.id = c.service_order_id
            )
            WHEN c.application_id IS NOT NULL THEN (
                SELECT o.stawka 
                FROM applications a 
                JOIN offers o ON a.offer_id = o.id 
                WHERE a.id = c.application_id
            )
            ELSE 0
        END as real_amount
    FROM contracts c
    JOIN milestone_drafts md ON md.contract_id = c.id
    WHERE (md.agreed_total_minor = 0 OR md.agreed_total_minor IS NULL)
)
UPDATE milestone_drafts md
SET agreed_total_minor = (ca.real_amount * 100)::bigint
FROM calculated_amounts ca
WHERE md.contract_id = ca.contract_id
  AND ca.real_amount > 0;


-- 2. PREVENTIVE: Update draft_initialize to self-heal 0-budget drafts on open.
-- Uses the p_total_amount_minor passed from frontend (which is correct in page.tsx).
CREATE OR REPLACE FUNCTION draft_initialize(
    p_contract_id UUID,
    p_total_amount_minor BIGINT
)
RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
    v_draft_id UUID;
BEGIN
    SELECT id INTO v_draft_id FROM milestone_drafts WHERE contract_id = p_contract_id;
    
    IF v_draft_id IS NOT NULL THEN
        -- Self-heal: If existing draft has 0 budget, update it to the requested one
        UPDATE milestone_drafts 
        SET agreed_total_minor = p_total_amount_minor
        WHERE id = v_draft_id AND agreed_total_minor = 0;
        
        RETURN v_draft_id;
    END IF;

    -- Create Draft Header
    INSERT INTO milestone_drafts (contract_id, agreed_total_minor, state)
    VALUES (p_contract_id, p_total_amount_minor, 'STUDENT_EDITING')
    RETURNING id INTO v_draft_id;

    RETURN v_draft_id;
END;
$$;

COMMIT;

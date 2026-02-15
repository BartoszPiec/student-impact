-- ==============================================================================
-- CONSOLIDATED MIGRATION: Milestone Negotiation Flow (Schema & RPCs)
-- Date: 2026-02-09
-- Purpose: Ensure all tables, types, and functions for milestone negotiation
--          are present and up-to-date. Replaces scattered non-timestamped files.
-- ==============================================================================

BEGIN;

-- ------------------------------------------------------------------------------
-- 1. ENUMS & TYPES
-- ------------------------------------------------------------------------------

DO $$ BEGIN
    CREATE TYPE draft_state AS ENUM (
        'STUDENT_EDITING',          -- S0
        'WAITING_COMPANY_REVIEW',   -- S1
        'COMPANY_EDITING',          -- S2
        'WAITING_STUDENT_REVIEW',   -- S3
        'APPROVED'                  -- S4
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE draft_author_role AS ENUM ('STUDENT', 'COMPANY', 'SYSTEM');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ------------------------------------------------------------------------------
-- 2. SCHEMA (TABLES)
-- ------------------------------------------------------------------------------

-- Main Draft Table
CREATE TABLE IF NOT EXISTS milestone_drafts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contract_id UUID NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
    state draft_state NOT NULL DEFAULT 'STUDENT_EDITING',
    
    agreed_total_minor BIGINT NOT NULL DEFAULT 0, -- Target budget in minor units (grosze)
    currency CHAR(3) NOT NULL DEFAULT 'PLN',

    -- Pointers to specific versions for logic/diffing
    current_version_id UUID,        -- Latest saved version
    review_version_id UUID,         -- S1: Version sent by Student
    company_changes_version_id UUID, -- S3: Version sent by Company
    
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),

    UNIQUE(contract_id)
);

-- Immutable Versions (Snapshots)
CREATE TABLE IF NOT EXISTS draft_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    draft_id UUID NOT NULL REFERENCES milestone_drafts(id) ON DELETE CASCADE,
    
    version_number INT NOT NULL,
    author_role draft_author_role NOT NULL,
    base_version_id UUID REFERENCES draft_versions(id), -- Lineage tracking
    
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Milestone Items within a Version
CREATE TABLE IF NOT EXISTS milestone_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    version_id UUID NOT NULL REFERENCES draft_versions(id) ON DELETE CASCADE,
    
    milestone_client_id UUID NOT NULL, -- Stable ID for UI Diffing across versions
    
    title TEXT NOT NULL,
    amount_minor BIGINT NOT NULL DEFAULT 0,
    criteria JSONB DEFAULT '[]'::jsonb,
    position INT NOT NULL DEFAULT 0,
    
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ------------------------------------------------------------------------------
-- 3. INDEXES & CONSTRAINTS
-- ------------------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_draft_contract ON milestone_drafts(contract_id);
CREATE INDEX IF NOT EXISTS idx_version_draft ON draft_versions(draft_id);
CREATE INDEX IF NOT EXISTS idx_snapshot_version ON milestone_snapshots(version_id);

-- Constraint: Unique Version Number per Draft
DO $$ BEGIN
    ALTER TABLE draft_versions ADD CONSTRAINT uk_draft_version_number UNIQUE (draft_id, version_number);
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ------------------------------------------------------------------------------
-- CLEANUP ORPHAN REFERENCES BEFORE ADDING CONSTRAINTS
-- Fixes potential "violates foreign key constraint" errors on existing data
-- ------------------------------------------------------------------------------

DO $$ 
BEGIN
    -- Nullify current_version_id if invalid
    UPDATE milestone_drafts 
    SET current_version_id = NULL 
    WHERE current_version_id NOT IN (SELECT id FROM draft_versions);

    -- Nullify review_version_id if invalid
    UPDATE milestone_drafts 
    SET review_version_id = NULL 
    WHERE review_version_id NOT IN (SELECT id FROM draft_versions);

    -- Nullify company_changes_version_id if invalid
    UPDATE milestone_drafts 
    SET company_changes_version_id = NULL 
    WHERE company_changes_version_id NOT IN (SELECT id FROM draft_versions);
END $$;

-- Circular FKs (Pointers back to versions) - Add safely
DO $$ BEGIN
    ALTER TABLE milestone_drafts 
    ADD CONSTRAINT fk_draft_current_version FOREIGN KEY (current_version_id) REFERENCES draft_versions(id);
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE milestone_drafts 
    ADD CONSTRAINT fk_draft_review_version FOREIGN KEY (review_version_id) REFERENCES draft_versions(id);
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE milestone_drafts 
    ADD CONSTRAINT fk_draft_company_changes FOREIGN KEY (company_changes_version_id) REFERENCES draft_versions(id);
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ------------------------------------------------------------------------------
-- 4. RPCs - PART 1: CORE LOGIC & VALIDATION
-- ------------------------------------------------------------------------------

-- Helper: Budget Validation Logic
DROP FUNCTION IF EXISTS validate_draft_budget(UUID, JSONB);
CREATE OR REPLACE FUNCTION validate_draft_budget(
    p_draft_id UUID,
    p_milestone_items JSONB -- Array of {amount_minor: int}
)
RETURNS JSONB
LANGUAGE plpgsql STABLE
AS $$
DECLARE
    v_agreed_total BIGINT;
    v_sum BIGINT := 0;
    v_item JSONB;
    v_amount BIGINT;
BEGIN
    SELECT agreed_total_minor INTO v_agreed_total 
    FROM milestone_drafts WHERE id = p_draft_id;

    -- Calculate Sum & Check for Negatives
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_milestone_items)
    LOOP
        v_amount := (v_item->>'amount_minor')::BIGINT;
        IF v_amount < 0 THEN
            RETURN jsonb_build_object('status', 'INVALID', 'reason', 'Negative amount found');
        END IF;
        v_sum := v_sum + v_amount;
    END LOOP;

    IF v_sum = v_agreed_total THEN
        RETURN jsonb_build_object('status', 'OK', 'delta', 0);
    ELSIF v_sum < v_agreed_total THEN
        RETURN jsonb_build_object('status', 'UNDER', 'delta', v_agreed_total - v_sum);
    ELSE
        RETURN jsonb_build_object('status', 'OVER', 'delta', v_sum - v_agreed_total);
    END IF;
END;
$$;

-- Initialize Draft (Bootstrap)
DROP FUNCTION IF EXISTS draft_initialize(UUID, BIGINT);
CREATE OR REPLACE FUNCTION draft_initialize(
    p_contract_id UUID,
    p_total_amount_minor BIGINT
)
RETURNS UUID -- Returns draft_id
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
    v_draft_id UUID;
BEGIN
    -- Check if exists
    SELECT id INTO v_draft_id FROM milestone_drafts WHERE contract_id = p_contract_id;
    
    IF v_draft_id IS NOT NULL THEN
        RETURN v_draft_id;
    END IF;

    -- Authorization Check
    IF NOT EXISTS (
        SELECT 1 FROM contracts 
        WHERE id = p_contract_id 
        AND (student_id = auth.uid() OR company_id = auth.uid())
    ) THEN
        RAISE EXCEPTION 'Access denied: User is not partial to this contract';
    END IF;

    -- Create Draft Header
    INSERT INTO milestone_drafts (contract_id, agreed_total_minor, state)
    VALUES (p_contract_id, p_total_amount_minor, 'STUDENT_EDITING')
    RETURNING id INTO v_draft_id;

    RETURN v_draft_id;
END;
$$;

-- Save Version
DROP FUNCTION IF EXISTS draft_save_version(UUID, UUID, JSONB);
CREATE OR REPLACE FUNCTION draft_save_version(
    p_contract_id UUID,
    p_base_version_id UUID, 
    p_items JSONB           -- Array of {client_id, title, amount_minor, criteria, position}
)
RETURNS TABLE (new_version_id UUID, validation_result JSONB)
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
    v_draft_id UUID;
    v_state draft_state;
    v_role draft_author_role;
    v_new_ver_id UUID;
    v_item JSONB;
    v_next_ver_num INT;
BEGIN
    -- 1. Get Draft Context
    SELECT id, state INTO v_draft_id, v_state 
    FROM milestone_drafts WHERE contract_id = p_contract_id;
    
    IF v_draft_id IS NULL THEN RAISE EXCEPTION 'Draft not initialized'; END IF;

    -- LOCKING: Serialize version creation for this draft to prevent race conditions
    -- This ensures that only one transaction can calculate the 'next version number' at a time.
    PERFORM 1 FROM milestone_drafts WHERE id = v_draft_id FOR UPDATE;

    -- 2. Determine User Role
    IF auth.uid() = (SELECT student_id FROM contracts WHERE id = p_contract_id) THEN
        v_role := 'STUDENT';
    ELSIF auth.uid() = (SELECT company_id FROM contracts WHERE id = p_contract_id) THEN
        v_role := 'COMPANY';
    ELSE
        RAISE EXCEPTION 'Access denied';
    END IF;

    -- 3. State Guard
    IF v_role = 'STUDENT' AND v_state NOT IN ('STUDENT_EDITING', 'WAITING_STUDENT_REVIEW') THEN
        RAISE EXCEPTION 'Student cannot edit in state %', v_state;
    END IF;
    IF v_role = 'COMPANY' AND v_state NOT IN ('COMPANY_EDITING') THEN
        RAISE EXCEPTION 'Company cannot edit in state %', v_state;
    END IF;

    -- 4. Calculate Version Number
    SELECT COALESCE(MAX(version_number), 0) + 1 INTO v_next_ver_num 
    FROM draft_versions WHERE draft_id = v_draft_id;

    -- 5. Create Version Header
    INSERT INTO draft_versions (draft_id, version_number, author_role, base_version_id)
    VALUES (v_draft_id, v_next_ver_num, v_role, p_base_version_id)
    RETURNING id INTO v_new_ver_id;

    -- 6. Insert Snapshots
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        INSERT INTO milestone_snapshots (
            version_id, milestone_client_id, title, amount_minor, criteria, position
        ) VALUES (
            v_new_ver_id,
            (v_item->>'client_id')::UUID,
            v_item->>'title',
            (v_item->>'amount_minor')::BIGINT,
            COALESCE(v_item->'criteria', '[]'::jsonb),
            (v_item->>'position')::INT
        );
    END LOOP;

    -- 7. Update Draft Head Pointer
    UPDATE milestone_drafts 
    SET current_version_id = v_new_ver_id, updated_at = now()
    WHERE id = v_draft_id;

    -- 8. Return Validation
    validation_result := validate_draft_budget(v_draft_id, p_items);
    new_version_id := v_new_ver_id;
    RETURN NEXT;
END;
$$;

-- Submit (Student -> S1)
DROP FUNCTION IF EXISTS draft_submit(UUID);
CREATE OR REPLACE FUNCTION draft_submit(
    p_contract_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
    v_draft_id UUID;
    v_current_ver_id UUID;
    v_state draft_state;
    v_validation JSONB;
    v_items JSONB;
BEGIN
    SELECT id, state, current_version_id INTO v_draft_id, v_state, v_current_ver_id
    FROM milestone_drafts WHERE contract_id = p_contract_id;

    -- Authorization Check (Student Only)
    IF NOT EXISTS (
        SELECT 1 FROM contracts 
        WHERE id = p_contract_id 
        AND student_id = auth.uid()
    ) THEN
        RAISE EXCEPTION 'Access denied: Only student can submit draft';
    END IF;

    -- Verification
    IF v_state NOT IN ('STUDENT_EDITING', 'WAITING_STUDENT_REVIEW') THEN
         RAISE EXCEPTION 'Invalid transition from %', v_state;
    END IF;

    -- Validate Budget Hard
    SELECT jsonb_agg(jsonb_build_object('amount_minor', amount_minor)) INTO v_items
    FROM milestone_snapshots WHERE version_id = v_current_ver_id;

    v_validation := validate_draft_budget(v_draft_id, v_items);

    IF (v_validation->>'status') != 'OK' THEN
        RETURN v_validation;
    END IF;

    -- Transition
    UPDATE milestone_drafts
    SET state = 'WAITING_COMPANY_REVIEW',
        review_version_id = v_current_ver_id
    WHERE id = v_draft_id;

    RETURN v_validation;
END;
$$;

-- ------------------------------------------------------------------------------
-- 5. RPCs - PART 2: NEGOTIATION LOOP & APPROVAL
-- ------------------------------------------------------------------------------

-- Request Changes (Company: S1 -> S2)
DROP FUNCTION IF EXISTS draft_request_changes(UUID);
CREATE OR REPLACE FUNCTION draft_request_changes(
    p_contract_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
    v_draft_id UUID;
    v_state draft_state;
BEGIN
    SELECT id, state INTO v_draft_id, v_state
    FROM milestone_drafts WHERE contract_id = p_contract_id;

    -- Authorization Check (Company Only)
    IF NOT EXISTS (
        SELECT 1 FROM contracts 
        WHERE id = p_contract_id 
        AND company_id = auth.uid()
    ) THEN
        RAISE EXCEPTION 'Access denied: Only company can request changes';
    END IF;

    IF v_state != 'WAITING_COMPANY_REVIEW' THEN
         RAISE EXCEPTION 'Invalid transition from % to COMPANY_EDITING', v_state;
    END IF;

    UPDATE milestone_drafts
    SET state = 'COMPANY_EDITING'
    WHERE id = v_draft_id;

    RETURN jsonb_build_object('status', 'OK', 'new_state', 'COMPANY_EDITING');
END;
$$;

-- Send Changes (Company: S2 -> S3)
DROP FUNCTION IF EXISTS draft_send_changes(UUID);
CREATE OR REPLACE FUNCTION draft_send_changes(
    p_contract_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
    v_draft_id UUID;
    v_current_ver_id UUID;
    v_state draft_state;
    v_validation JSONB;
    v_items JSONB;
BEGIN
    SELECT id, state, current_version_id INTO v_draft_id, v_state, v_current_ver_id
    FROM milestone_drafts WHERE contract_id = p_contract_id;

    -- Authorization Check (Company Only)
    IF NOT EXISTS (
        SELECT 1 FROM contracts 
        WHERE id = p_contract_id 
        AND company_id = auth.uid()
    ) THEN
        RAISE EXCEPTION 'Access denied: Only company can send changes';
    END IF;

    IF v_state != 'COMPANY_EDITING' THEN
         RAISE EXCEPTION 'Invalid transition from %', v_state;
    END IF;

    SELECT jsonb_agg(jsonb_build_object('amount_minor', amount_minor)) INTO v_items
    FROM milestone_snapshots WHERE version_id = v_current_ver_id;

    v_validation := validate_draft_budget(v_draft_id, v_items);

    IF (v_validation->>'status') != 'OK' THEN
        RETURN v_validation;
    END IF;

    UPDATE milestone_drafts
    SET state = 'WAITING_STUDENT_REVIEW',
        company_changes_version_id = v_current_ver_id
    WHERE id = v_draft_id;

    RETURN v_validation;
END;
$$;

-- Approve (Company: S1 -> S4)
DROP FUNCTION IF EXISTS draft_approve(UUID);
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

    -- 4. Update Contract Status
    UPDATE contracts
    SET terms_status = 'agreed',
        terms_version = terms_version + 1,
        company_approved_version = terms_version + 1,
        student_approved_version = terms_version + 1,
        updated_at = now()
    WHERE id = p_contract_id;

    RETURN jsonb_build_object('status', 'OK', 'new_state', 'APPROVED');
END;
$$;

-- ------------------------------------------------------------------------------
-- 6. POLICIES (RLS)
-- ------------------------------------------------------------------------------

-- Ensure RLS is enabled
ALTER TABLE milestone_drafts ENABLE ROW LEVEL SECURITY;
ALTER TABLE draft_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE milestone_snapshots ENABLE ROW LEVEL SECURITY;

-- Policy: Participants can view stuff
DROP POLICY IF EXISTS "drafts_participants_select" ON milestone_drafts;
CREATE POLICY "drafts_participants_select" ON milestone_drafts
FOR SELECT USING (
    auth.uid() IN (SELECT company_id FROM contracts WHERE id = contract_id) OR
    auth.uid() IN (SELECT student_id FROM contracts WHERE id = contract_id)
);

DROP POLICY IF EXISTS "versions_participants_select" ON draft_versions;
CREATE POLICY "versions_participants_select" ON draft_versions
FOR SELECT USING (
    EXISTS (SELECT 1 FROM milestone_drafts d 
            WHERE d.id = draft_id 
            AND (
                auth.uid() IN (SELECT company_id FROM contracts WHERE id = d.contract_id) OR
                auth.uid() IN (SELECT student_id FROM contracts WHERE id = d.contract_id)
            ))
);

DROP POLICY IF EXISTS "snapshots_participants_select" ON milestone_snapshots;
CREATE POLICY "snapshots_participants_select" ON milestone_snapshots
FOR SELECT USING (
    EXISTS (SELECT 1 FROM draft_versions v 
            JOIN milestone_drafts d ON d.id = v.draft_id
            WHERE v.id = version_id
            AND (
                auth.uid() IN (SELECT company_id FROM contracts WHERE id = d.contract_id) OR
                auth.uid() IN (SELECT student_id FROM contracts WHERE id = d.contract_id)
            ))
);

COMMIT;

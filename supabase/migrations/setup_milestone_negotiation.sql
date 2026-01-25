-- NEW SCHEMA for Milestone Negotiation (Rebuild)
-- Implements Versioned Drafts and State Machine (S0-S4)

BEGIN;

-- 1. Enums for State Machine
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

-- 2. Main Draft Table (Head of Negotiation)
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

-- 3. Immutable Versions (Snapshots)
CREATE TABLE IF NOT EXISTS draft_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    draft_id UUID NOT NULL REFERENCES milestone_drafts(id) ON DELETE CASCADE,
    
    version_number INT NOT NULL,
    author_role draft_author_role NOT NULL,
    base_version_id UUID REFERENCES draft_versions(id), -- Lineage tracking
    
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Milestone Items within a Version
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

-- Add Constraints / Indexes
CREATE INDEX IF NOT EXISTS idx_draft_contract ON milestone_drafts(contract_id);
CREATE INDEX IF NOT EXISTS idx_version_draft ON draft_versions(draft_id);
CREATE INDEX IF NOT EXISTS idx_snapshot_version ON milestone_snapshots(version_id);

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

COMMIT;

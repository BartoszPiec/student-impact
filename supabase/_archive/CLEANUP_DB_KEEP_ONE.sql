-- CLEANUP SCRIPT: Keep 1 latest offer of each type, delete the rest.
-- Handles dependencies explicitly to avoid FK violations.

WITH kept_offers AS (
    -- 1. Latest System Platform Service
    (SELECT id FROM offers WHERE is_platform_service = true ORDER BY created_at DESC LIMIT 1)
    UNION ALL
    -- 2. Latest Company Micro-Order
    (SELECT id FROM offers WHERE (typ = 'micro' OR typ = 'mikro') AND is_platform_service = false ORDER BY created_at DESC LIMIT 1)
    UNION ALL
    -- 3. Latest Job
    (SELECT id FROM offers WHERE typ = 'job' OR typ = 'Praca' ORDER BY created_at DESC LIMIT 1)
    UNION ALL
    -- 4. Latest Internship
    (SELECT id FROM offers WHERE typ = 'internship' OR typ = 'Staż' ORDER BY created_at DESC LIMIT 1)
),
offers_to_delete AS (
    SELECT id FROM offers WHERE id NOT IN (SELECT id FROM kept_offers)
)

-- 1. Delete Conversations linked to Applications of these Offers
DELETE FROM conversations
WHERE application_id IN (
    SELECT id FROM applications WHERE offer_id IN (SELECT id FROM offers_to_delete)
);

-- 2. Delete Applications of these Offers
DELETE FROM applications
WHERE offer_id IN (SELECT id FROM offers_to_delete);

-- 3. Delete the Offers themselves
DELETE FROM offers
WHERE id IN (SELECT id FROM offers_to_delete);

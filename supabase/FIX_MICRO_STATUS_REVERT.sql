-- FIX: Revert 'in_progress' applications for Micro/Platform services back to 'sent'
-- This allows the Company to manually Accept/Reject them (User Request).

UPDATE applications
SET status = 'sent'
FROM offers
WHERE applications.offer_id = offers.id
  AND applications.status = 'in_progress'
  AND (
      offers.is_platform_service = true 
      OR offers.typ ILIKE '%micro%' 
      OR offers.typ ILIKE '%mikro%'
  );

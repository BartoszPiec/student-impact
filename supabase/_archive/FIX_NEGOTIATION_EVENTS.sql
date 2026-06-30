-- Fix missing events for negotiation messages
-- This updates existing messages that look like negotiation proposals but have no event type.

UPDATE messages
SET event = 'negotiation_proposed'
WHERE content LIKE 'Proponuję stawkę%' 
  AND event IS NULL;

-- Also potentially fix auto-accepted messages if they are missing events (though less critical for UI controls)
-- UPDATE messages SET event = 'application_accepted' WHERE content = 'Zaakceptowano zgłoszenie' AND event IS NULL;

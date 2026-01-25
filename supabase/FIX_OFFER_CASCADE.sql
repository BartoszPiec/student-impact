-- Naprawa usuwania Ofert (Kaskadowe usuwanie powiązań)
-- Jeśli oferta ma aplikacje lub konwersacje, próba usunięcia bez CASCADE kończy się błędem.

-- 1. Popraw relację offers -> applications
ALTER TABLE applications
DROP CONSTRAINT IF EXISTS applications_offer_id_fkey;

ALTER TABLE applications
ADD CONSTRAINT applications_offer_id_fkey
FOREIGN KEY (offer_id)
REFERENCES offers(id)
ON DELETE CASCADE;

-- 2. Popraw relację offers -> conversations (jeśli konwersacja jest podpięta pod ofertę)
-- Sprawdzamy czy tabela conversations ma pole offer_id (zależy od schematu, czasem jest przez application_id)
-- Profilaktycznie:
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'conversations' AND column_name = 'offer_id') THEN
    ALTER TABLE conversations
    DROP CONSTRAINT IF EXISTS conversations_offer_id_fkey;

    ALTER TABLE conversations
    ADD CONSTRAINT conversations_offer_id_fkey
    FOREIGN KEY (offer_id)
    REFERENCES offers(id)
    ON DELETE CASCADE;
  END IF;
END $$;

-- 3. Upewnij się, że wiadomości usuwają się z konwersacją (to już było w FIX_CASCADE_DELETE, ale warto powtórzyć)
ALTER TABLE messages
DROP CONSTRAINT IF EXISTS messages_conversation_id_fkey;

ALTER TABLE messages
ADD CONSTRAINT messages_conversation_id_fkey
FOREIGN KEY (conversation_id)
REFERENCES conversations(id)
ON DELETE CASCADE;

SELECT 'Cascade delete configured for offers' as status;

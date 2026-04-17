-- 20260417100000_critical_indexes.sql
-- Critical pre-prod indexes aligned with current schema (public).

-- messages: hot path for chat thread
CREATE INDEX IF NOT EXISTS idx_messages_conversation_created
  ON public.messages (conversation_id, created_at DESC);

-- applications: student/company dashboards
CREATE INDEX IF NOT EXISTS idx_applications_student_status
  ON public.applications (student_id, status);

CREATE INDEX IF NOT EXISTS idx_applications_offer_status
  ON public.applications (offer_id, status);

-- service_orders: company/student dashboards
CREATE INDEX IF NOT EXISTS idx_service_orders_company_status_created
  ON public.service_orders (company_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_service_orders_student_status_created
  ON public.service_orders (student_id, status, created_at DESC);

-- conversations: sidebar list lookup by participant
CREATE INDEX IF NOT EXISTS idx_conversations_company_id
  ON public.conversations (company_id);

CREATE INDEX IF NOT EXISTS idx_conversations_student_id
  ON public.conversations (student_id);

-- financial ledger: audit view per contract (table is financial_ledger in this schema)
CREATE INDEX IF NOT EXISTS idx_financial_ledger_contract_created
  ON public.financial_ledger (contract_id, created_at DESC);

-- notifications: unread widget
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread_created
  ON public.notifications (user_id, read_at NULLS FIRST, created_at DESC);

-- offers: public listing (schema uses status='published')
CREATE INDEX IF NOT EXISTS idx_offers_published_created
  ON public.offers (status, created_at DESC)
  WHERE status = 'published';

-- payment intents: idempotency lookup
CREATE UNIQUE INDEX IF NOT EXISTS idx_payment_intents_provider_intent_id
  ON public.payment_intents (provider_intent_id)
  WHERE provider_intent_id IS NOT NULL;

-- payouts: per-contract status feeds
CREATE INDEX IF NOT EXISTS idx_payouts_contract_status_created
  ON public.payouts (contract_id, status, created_at DESC);

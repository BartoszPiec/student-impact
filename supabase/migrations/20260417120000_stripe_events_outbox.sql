-- 20260417120000_stripe_events_outbox.sql
-- Transactional outbox for Stripe webhooks.

CREATE TABLE IF NOT EXISTS public.stripe_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_event_id text NOT NULL UNIQUE,
  event_type text NOT NULL,
  payload jsonb NOT NULL,
  retry_count integer NOT NULL DEFAULT 0,
  processed_at timestamptz,
  processing_error text,
  last_attempt_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.stripe_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS stripe_events_deny_all ON public.stripe_events;
CREATE POLICY stripe_events_deny_all
  ON public.stripe_events
  FOR ALL
  USING (false)
  WITH CHECK (false);

CREATE INDEX IF NOT EXISTS idx_stripe_events_unprocessed
  ON public.stripe_events (created_at)
  WHERE processed_at IS NULL AND retry_count < 3;

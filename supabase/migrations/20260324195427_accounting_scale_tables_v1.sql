-- Phase 10: Scale Tables for Financial Operations

-- 1. Payout Batches (For bulk student payouts)
CREATE TABLE IF NOT EXISTS public.payout_batches (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at timestamptz DEFAULT now(),
    admin_id uuid REFERENCES auth.users(id),
    status text DEFAULT 'draft' CHECK (status IN ('draft', 'processing', 'completed', 'failed')),
    total_amount_minor bigint DEFAULT 0,
    payout_count int DEFAULT 0,
    notes text,
    processed_at timestamptz
);

-- Associate payouts with batches
ALTER TABLE public.payouts ADD COLUMN IF NOT EXISTS batch_id uuid REFERENCES public.payout_batches(id) ON DELETE SET NULL;

-- 2. Accounting Periods (For month-end closing)
CREATE TABLE IF NOT EXISTS public.accounting_periods (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    year int NOT NULL,
    month int NOT NULL CHECK (month >= 1 AND month <= 12),
    status text DEFAULT 'open' CHECK (status IN ('open', 'closed')),
    closed_at timestamptz,
    closed_by uuid REFERENCES auth.users(id),
    created_at timestamptz DEFAULT now(),
    UNIQUE(year, month)
);

-- 3. Event Inbox (For absolute webhook idempotency)
CREATE TABLE IF NOT EXISTS public.event_inbox (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id text NOT NULL UNIQUE, -- Stripe Event ID or other external ID
    source text NOT NULL,        -- 'stripe', 'cron', etc.
    event_type text NOT NULL,
    payload jsonb,
    processed_at timestamptz,
    created_at timestamptz DEFAULT now(),
    idempotency_key text UNIQUE
);

-- RLS for new tables
ALTER TABLE public.payout_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounting_periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_inbox ENABLE ROW LEVEL SECURITY;

-- Only admins can see/manage these
CREATE POLICY "admin_all_payout_batches" ON public.payout_batches FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'admin'));
CREATE POLICY "admin_all_accounting_periods" ON public.accounting_periods FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'admin'));
CREATE POLICY "admin_all_event_inbox" ON public.event_inbox FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'admin'));
;

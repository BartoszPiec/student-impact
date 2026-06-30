-- Quote Snapshot Phase — schema draft
-- Draft only. Do not apply automatically without implementation batch review.

alter table public.service_orders
  add column if not exists request_snapshot jsonb,
  add column if not exists quote_snapshot jsonb;

comment on column public.service_orders.request_snapshot is
  'Structured snapshot of the company request captured at order creation time.';

comment on column public.service_orders.quote_snapshot is
  'Structured snapshot of quote / counter-offer / acceptance state for service negotiation.';

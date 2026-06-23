-- Indexes aligned with the hottest list and dashboard queries measured during
-- the 2026-06-23 application audit.

create index if not exists contracts_student_created_idx
  on public.contracts (student_id, created_at desc);

create index if not exists service_packages_status_system_price_idx
  on public.service_packages (status, is_system desc, price);

create index if not exists payouts_status_created_idx
  on public.payouts (status, created_at);

create index if not exists reviews_reviewee_created_idx
  on public.reviews (reviewee_id, created_at desc);

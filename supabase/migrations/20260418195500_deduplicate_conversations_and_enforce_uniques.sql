-- Harden against duplicate rows created by retry/race conditions.
-- Scope: conversation thread identity + saved offers + one-review-per-side semantics.

-- 1) Remove legacy empty self-inquiry conversations (no business linkage and no messages).
with empty_self_inquiries as (
  select c.id
  from public.conversations c
  left join public.messages m on m.conversation_id = c.id
  where c.type = 'inquiry'
    and c.company_id = c.student_id
    and c.application_id is null
    and c.service_order_id is null
    and c.offer_id is null
    and c.package_id is null
  group by c.id
  having count(m.id) = 0
)
delete from public.conversations c
using empty_self_inquiries d
where c.id = d.id;

-- 2) Canonicalize duplicate conversations per application_id.
with ranked as (
  select
    c.id,
    c.application_id,
    row_number() over (
      partition by c.application_id
      order by c.updated_at desc nulls last, c.created_at desc nulls last, c.id desc
    ) as rn,
    first_value(c.id) over (
      partition by c.application_id
      order by c.updated_at desc nulls last, c.created_at desc nulls last, c.id desc
    ) as keep_id
  from public.conversations c
  where c.application_id is not null
), dup_map as (
  select id as duplicate_id, keep_id
  from ranked
  where rn > 1 and id <> keep_id
)
update public.messages m
set conversation_id = d.keep_id
from dup_map d
where m.conversation_id = d.duplicate_id;

with ranked as (
  select
    c.id,
    c.application_id,
    row_number() over (
      partition by c.application_id
      order by c.updated_at desc nulls last, c.created_at desc nulls last, c.id desc
    ) as rn,
    first_value(c.id) over (
      partition by c.application_id
      order by c.updated_at desc nulls last, c.created_at desc nulls last, c.id desc
    ) as keep_id
  from public.conversations c
  where c.application_id is not null
), dup_map as (
  select id as duplicate_id
  from ranked
  where rn > 1 and id <> keep_id
)
delete from public.conversations c
using dup_map d
where c.id = d.duplicate_id;

-- 3) Canonicalize duplicate conversations per service_order_id.
with ranked as (
  select
    c.id,
    c.service_order_id,
    row_number() over (
      partition by c.service_order_id
      order by c.updated_at desc nulls last, c.created_at desc nulls last, c.id desc
    ) as rn,
    first_value(c.id) over (
      partition by c.service_order_id
      order by c.updated_at desc nulls last, c.created_at desc nulls last, c.id desc
    ) as keep_id
  from public.conversations c
  where c.service_order_id is not null
), dup_map as (
  select id as duplicate_id, keep_id
  from ranked
  where rn > 1 and id <> keep_id
)
update public.messages m
set conversation_id = d.keep_id
from dup_map d
where m.conversation_id = d.duplicate_id;

with ranked as (
  select
    c.id,
    c.service_order_id,
    row_number() over (
      partition by c.service_order_id
      order by c.updated_at desc nulls last, c.created_at desc nulls last, c.id desc
    ) as rn,
    first_value(c.id) over (
      partition by c.service_order_id
      order by c.updated_at desc nulls last, c.created_at desc nulls last, c.id desc
    ) as keep_id
  from public.conversations c
  where c.service_order_id is not null
), dup_map as (
  select id as duplicate_id
  from ranked
  where rn > 1 and id <> keep_id
)
delete from public.conversations c
using dup_map d
where c.id = d.duplicate_id;

-- 4) Deduplicate saved offers: keep newest row per (student_id, offer_id).
with ranked as (
  select
    id,
    row_number() over (
      partition by student_id, offer_id
      order by created_at desc nulls last, id desc
    ) as rn
  from public.saved_offers
  where student_id is not null
    and offer_id is not null
)
delete from public.saved_offers s
using ranked r
where s.id = r.id
  and r.rn > 1;

-- 5) Deduplicate reviews: one review per reviewer per context.
with ranked as (
  select
    id,
    row_number() over (
      partition by application_id, reviewer_id
      order by created_at desc nulls last, id desc
    ) as rn
  from public.reviews
  where application_id is not null
    and reviewer_id is not null
)
delete from public.reviews r
using ranked d
where r.id = d.id
  and d.rn > 1;

with ranked as (
  select
    id,
    row_number() over (
      partition by service_order_id, reviewer_id
      order by created_at desc nulls last, id desc
    ) as rn
  from public.reviews
  where service_order_id is not null
    and reviewer_id is not null
)
delete from public.reviews r
using ranked d
where r.id = d.id
  and d.rn > 1;

-- 6) Enforce constraints/indexes to prevent future duplication.
do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'conversations_distinct_participants_check'
      and conrelid = 'public.conversations'::regclass
  ) then
    alter table public.conversations
      add constraint conversations_distinct_participants_check
      check (
        company_id is null
        or student_id is null
        or company_id <> student_id
      );
  end if;
end;
$$;

create unique index if not exists conversations_application_id_unique_idx
  on public.conversations (application_id)
  where application_id is not null;

create unique index if not exists conversations_service_order_id_unique_idx
  on public.conversations (service_order_id)
  where service_order_id is not null;

create unique index if not exists saved_offers_student_offer_unique_idx
  on public.saved_offers (student_id, offer_id);

create unique index if not exists reviews_application_reviewer_unique_idx
  on public.reviews (application_id, reviewer_id)
  where application_id is not null
    and reviewer_id is not null;

create unique index if not exists reviews_service_order_reviewer_unique_idx
  on public.reviews (service_order_id, reviewer_id)
  where service_order_id is not null
    and reviewer_id is not null;

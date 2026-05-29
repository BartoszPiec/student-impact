-- Pilot MVP hardening:
-- 1) PostgREST upsert requires a real unique/exclusion constraint for ON CONFLICT.
--    Existing partial unique indexes are not enough for ON CONFLICT (application_id/service_order_id).
-- 2) Message flags are per-user metadata stored on messages and guarded by participant RLS.

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

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.conversations'::regclass
      and conname = 'conversations_application_id_unique'
  ) then
    alter table public.conversations
      add constraint conversations_application_id_unique unique (application_id);
  end if;

  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.conversations'::regclass
      and conname = 'conversations_service_order_id_unique'
  ) then
    alter table public.conversations
      add constraint conversations_service_order_id_unique unique (service_order_id);
  end if;
end;
$$;

alter table public.messages
  add column if not exists flagged_by uuid[] not null default '{}';

drop policy if exists "Users can update messages in their conversations" on public.messages;
create policy "Users can update messages in their conversations"
on public.messages
for update
using (
  exists (
    select 1
    from public.conversations c
    where c.id = messages.conversation_id
      and (c.student_id = auth.uid() or c.company_id = auth.uid())
  )
)
with check (
  exists (
    select 1
    from public.conversations c
    where c.id = messages.conversation_id
      and (c.student_id = auth.uid() or c.company_id = auth.uid())
  )
);

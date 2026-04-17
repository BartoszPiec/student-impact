alter table public.service_orders
  add column if not exists entry_point text not null default 'company_request',
  add column if not exists initiated_by text not null default 'company';

comment on column public.service_orders.entry_point is
  'Origin of the service order workflow, e.g. company_request or student_private_proposal.';

comment on column public.service_orders.initiated_by is
  'Direction of workflow initiation, e.g. company or student.';

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'service_orders_entry_point_check'
  ) then
    alter table public.service_orders
      add constraint service_orders_entry_point_check
      check (entry_point in ('company_request', 'student_private_proposal'));
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'service_orders_initiated_by_check'
  ) then
    alter table public.service_orders
      add constraint service_orders_initiated_by_check
      check (initiated_by in ('company', 'student'));
  end if;
end
$$;

alter table public.conversations
  add column if not exists service_order_id uuid references public.service_orders(id) on delete set null;

comment on column public.conversations.service_order_id is
  'Direct link to the service order this conversation belongs to.';

create index if not exists conversations_service_order_id_idx
  on public.conversations(service_order_id);

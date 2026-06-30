create or replace function public.get_my_unread_chat_count()
returns bigint
language sql
stable
security invoker
set search_path = ''
as $$
  select count(*)::bigint
  from public.messages as message
  where message.read_at is null
    and message.sender_id <> (select auth.uid())
    and exists (
      select 1
      from public.conversations as conversation
      where conversation.id = message.conversation_id
        and (
          conversation.company_id = (select auth.uid())
          or conversation.student_id = (select auth.uid())
        )
    );
$$;

revoke all on function public.get_my_unread_chat_count() from public;
grant execute on function public.get_my_unread_chat_count() to authenticated;

create index if not exists messages_unread_conversation_sender_idx
  on public.messages (conversation_id, sender_id)
  where read_at is null;

create index if not exists notifications_user_unread_idx
  on public.notifications (user_id)
  where read_at is null;

create or replace function public.get_my_chat_previews(p_limit integer default 50)
returns table (
  id uuid,
  created_at timestamptz,
  updated_at timestamptz,
  conversation_type text,
  student_id uuid,
  company_id uuid,
  offer_title text,
  package_title text,
  application_offer_title text,
  last_message jsonb,
  unread_count bigint,
  student_name text,
  company_name text
)
language sql
stable
security invoker
set search_path = ''
as $$
  select
    conversation.id,
    conversation.created_at,
    conversation.updated_at,
    conversation.type::text,
    conversation.student_id,
    conversation.company_id,
    offer.tytul,
    package.title,
    application_offer.tytul,
    case
      when latest_message.id is null then null
      else jsonb_build_object(
        'content', latest_message.content,
        'created_at', latest_message.created_at,
        'read_at', latest_message.read_at,
        'sender_id', latest_message.sender_id,
        'event', latest_message.event,
        'payload', latest_message.payload,
        'attachment_type', latest_message.attachment_type
      )
    end,
    coalesce(unread_messages.unread_count, 0),
    student.public_name,
    company.nazwa
  from public.conversations as conversation
  left join public.offers as offer on offer.id = conversation.offer_id
  left join public.service_packages as package on package.id = conversation.package_id
  left join public.applications as application on application.id = conversation.application_id
  left join public.offers as application_offer on application_offer.id = application.offer_id
  left join public.student_profiles as student on student.user_id = conversation.student_id
  left join public.company_profiles as company on company.user_id = conversation.company_id
  left join lateral (
    select message.id, message.content, message.created_at, message.read_at, message.sender_id,
      message.event, message.payload, message.attachment_type
    from public.messages as message
    where message.conversation_id = conversation.id
    order by message.created_at desc
    limit 1
  ) as latest_message on true
  left join lateral (
    select count(*)::bigint as unread_count
    from public.messages as message
    where message.conversation_id = conversation.id
      and message.sender_id <> (select auth.uid())
      and message.read_at is null
  ) as unread_messages on true
  where conversation.student_id = (select auth.uid())
     or conversation.company_id = (select auth.uid())
  order by coalesce(conversation.updated_at, conversation.created_at) desc
  limit least(greatest(p_limit, 1), 100);
$$;

revoke all on function public.get_my_chat_previews(integer) from public;
grant execute on function public.get_my_chat_previews(integer) to authenticated;

create or replace function public.reconcile_contract_statuses_v1()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  completed_applications integer := 0;
  completed_service_orders integer := 0;
  active_applications integer := 0;
  active_service_orders integer := 0;
  active_offers integer := 0;
  closed_offers integer := 0;
begin
  update public.applications as application
  set status = 'completed', realization_status = 'completed'
  from public.contracts as contract
  where contract.application_id = application.id
    and contract.status = 'completed'
    and application.status in ('accepted', 'in_progress', 'delivered');
  get diagnostics completed_applications = row_count;

  update public.service_orders as service_order
  set status = 'completed'
  from public.contracts as contract
  where contract.service_order_id = service_order.id
    and contract.status = 'completed'
    and service_order.status in ('accepted', 'active', 'in_progress', 'revision', 'delivered');
  get diagnostics completed_service_orders = row_count;

  update public.applications as application
  set status = 'in_progress'
  from public.contracts as contract
  where contract.application_id = application.id
    and contract.status = 'active'
    and application.status = 'accepted';
  get diagnostics active_applications = row_count;

  update public.service_orders as service_order
  set status = 'active'
  from public.contracts as contract
  where contract.service_order_id = service_order.id
    and contract.status = 'active'
    and service_order.status in ('accepted', 'awaiting_funding');
  get diagnostics active_service_orders = row_count;

  update public.offers as offer
  set status = 'in_progress'
  where offer.status = 'published'
    and coalesce(offer.is_platform_service, false) = false
    and exists (
      select 1
      from public.applications as application
      where application.offer_id = offer.id
        and application.status in ('accepted', 'in_progress')
    );
  get diagnostics active_offers = row_count;

  update public.offers as offer
  set status = 'closed'
  where offer.status <> 'closed'
    and coalesce(offer.is_platform_service, false) = false
    and exists (
      select 1
      from public.applications as application
      join public.contracts as contract on contract.application_id = application.id
      where application.offer_id = offer.id
        and contract.status = 'completed'
    );
  get diagnostics closed_offers = row_count;

  return jsonb_build_object(
    'completed_applications', completed_applications,
    'completed_service_orders', completed_service_orders,
    'active_applications', active_applications,
    'active_service_orders', active_service_orders,
    'active_offers', active_offers,
    'closed_offers', closed_offers
  );
end;
$$;

revoke all on function public.reconcile_contract_statuses_v1() from public;
grant execute on function public.reconcile_contract_statuses_v1() to service_role;

alter policy student_profiles_select_own on public.student_profiles
  using (user_id = (select auth.uid()));

alter policy student_profiles_select_admin on public.student_profiles
  using (
    exists (
      select 1 from public.profiles as profile
      where profile.user_id = (select auth.uid()) and profile.role = 'admin'
    )
  );

alter policy student_profiles_select_related_company on public.student_profiles
  using (
    exists (
      select 1 from public.applications as application
      join public.offers as offer on offer.id = application.offer_id
      where application.student_id = student_profiles.user_id
        and offer.company_id = (select auth.uid())
    )
    or exists (
      select 1 from public.contracts as contract
      where contract.student_id = student_profiles.user_id
        and contract.company_id = (select auth.uid())
    )
    or exists (
      select 1 from public.conversations as conversation
      where conversation.student_id = student_profiles.user_id
        and conversation.company_id = (select auth.uid())
    )
  );

alter policy company_profiles_select_own on public.company_profiles
  using (user_id = (select auth.uid()));

alter policy company_profiles_select_admin on public.company_profiles
  using (
    exists (
      select 1 from public.profiles as profile
      where profile.user_id = (select auth.uid()) and profile.role = 'admin'
    )
  );

alter policy company_profiles_select_related_student on public.company_profiles
  using (
    exists (
      select 1 from public.applications as application
      join public.offers as offer on offer.id = application.offer_id
      where application.student_id = (select auth.uid())
        and offer.company_id = company_profiles.user_id
    )
    or exists (
      select 1 from public.contracts as contract
      where contract.company_id = company_profiles.user_id
        and contract.student_id = (select auth.uid())
    )
    or exists (
      select 1 from public.conversations as conversation
      where conversation.company_id = company_profiles.user_id
        and conversation.student_id = (select auth.uid())
    )
  );

alter policy "applications_update_company" on public.applications
  using (
    exists (
      select 1 from public.offers as offer
      where offer.id = applications.offer_id
        and offer.company_id = (select auth.uid())
    )
  )
  with check (
    exists (
      select 1 from public.offers as offer
      where offer.id = applications.offer_id
        and offer.company_id = (select auth.uid())
    )
  );

create index if not exists applications_student_created_idx
  on public.applications (student_id, created_at desc);
create index if not exists applications_offer_status_idx
  on public.applications (offer_id, status);
create index if not exists offers_company_created_idx
  on public.offers (company_id, created_at desc);
create index if not exists offers_published_created_idx
  on public.offers (created_at desc, id desc)
  where status = 'published';
create index if not exists service_orders_company_created_idx
  on public.service_orders (company_id, created_at desc);
create index if not exists contracts_application_status_idx
  on public.contracts (application_id, status)
  where application_id is not null;
create index if not exists contracts_service_order_status_idx
  on public.contracts (service_order_id, status)
  where service_order_id is not null;
create index if not exists milestones_auto_accept_due_idx
  on public.milestones (auto_accept_at, id)
  where status = 'delivered' and auto_accept_at is not null;
create index if not exists milestones_contract_status_idx
  on public.milestones (contract_id, status);
create index if not exists deliverables_milestone_status_created_idx
  on public.deliverables (milestone_id, status, created_at desc);
create index if not exists payouts_milestone_status_created_idx
  on public.payouts (milestone_id, status, created_at desc);

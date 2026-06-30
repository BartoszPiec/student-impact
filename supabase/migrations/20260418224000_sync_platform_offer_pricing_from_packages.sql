-- Keep platform offer pricing/commission synchronized with source service packages.
-- Scope:
-- 1) Fill defaults on platform-offer writes when values are not provided.
-- 2) Propagate package price/commission updates to linked open platform offers
--    only when offer values were still following the previous package value.

create or replace function public.sync_platform_offer_defaults_from_package()
returns trigger
language plpgsql
as $$
declare
  v_package record;
begin
  if coalesce(new.is_platform_service, false) is not true
     or new.service_package_id is null then
    return new;
  end if;

  select
    p.price,
    p.commission_rate
  into v_package
  from public.service_packages p
  where p.id = new.service_package_id;

  if not found then
    return new;
  end if;

  if new.stawka is null then
    new.stawka := v_package.price;
  end if;

  if new.commission_rate is null then
    new.commission_rate := v_package.commission_rate;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_sync_platform_offer_defaults_from_package on public.offers;

create trigger trg_sync_platform_offer_defaults_from_package
before insert or update of is_platform_service, service_package_id, stawka, commission_rate
on public.offers
for each row
execute function public.sync_platform_offer_defaults_from_package();

create or replace function public.propagate_service_package_commercial_updates_to_platform_offers()
returns trigger
language plpgsql
as $$
begin
  if coalesce(new.type, '') <> 'platform_service' then
    return new;
  end if;

  -- Price propagation:
  -- only for open/public platform offers and only if offer price was still derived
  -- from the previous package price (or was null).
  if new.price is distinct from old.price then
    update public.offers o
    set
      stawka = new.price,
      updated_at = now()
    where o.service_package_id = new.id
      and coalesce(o.is_platform_service, false) = true
      and coalesce(o.is_private, false) = false
      and coalesce(o.status, 'published') in ('published', 'active', 'draft')
      and (o.stawka is null or o.stawka = old.price);
  end if;

  -- Commission propagation with the same safety boundaries.
  if new.commission_rate is distinct from old.commission_rate then
    update public.offers o
    set
      commission_rate = new.commission_rate,
      updated_at = now()
    where o.service_package_id = new.id
      and coalesce(o.is_platform_service, false) = true
      and coalesce(o.is_private, false) = false
      and coalesce(o.status, 'published') in ('published', 'active', 'draft')
      and (o.commission_rate is null or o.commission_rate = old.commission_rate);
  end if;

  return new;
end;
$$;

drop trigger if exists trg_propagate_service_package_commercial_updates_to_platform_offers on public.service_packages;

create trigger trg_propagate_service_package_commercial_updates_to_platform_offers
after update of price, commission_rate, type
on public.service_packages
for each row
execute function public.propagate_service_package_commercial_updates_to_platform_offers();

-- Sync only null defaults immediately (safe backfill).
update public.offers o
set
  stawka = p.price,
  updated_at = now()
from public.service_packages p
where o.service_package_id = p.id
  and coalesce(o.is_platform_service, false) = true
  and coalesce(o.is_private, false) = false
  and coalesce(o.status, 'published') in ('published', 'active', 'draft')
  and o.stawka is null;

update public.offers o
set
  commission_rate = p.commission_rate,
  updated_at = now()
from public.service_packages p
where o.service_package_id = p.id
  and coalesce(o.is_platform_service, false) = true
  and coalesce(o.is_private, false) = false
  and coalesce(o.status, 'published') in ('published', 'active', 'draft')
  and o.commission_rate is null;

create index if not exists idx_offers_platform_sync_on_service_package
  on public.offers (service_package_id)
  where coalesce(is_platform_service, false) = true
    and coalesce(is_private, false) = false;

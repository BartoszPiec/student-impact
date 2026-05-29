-- Keep top-level price fields in sync with variants JSON.
-- This ensures one source of truth for package pricing.

create or replace function public.sync_service_package_price_bounds_from_variants()
returns trigger
language plpgsql
as $$
declare
  v_min numeric;
  v_max numeric;
begin
  if new.variants is null
    or jsonb_typeof(new.variants) <> 'array'
    or jsonb_array_length(new.variants) = 0 then
    if new.price is not null and new.price_max is not null and new.price_max <= new.price then
      new.price_max := null;
    end if;
    return new;
  end if;

  select
    min((item->>'price')::numeric),
    max((item->>'price')::numeric)
  into v_min, v_max
  from jsonb_array_elements(new.variants) as item
  where jsonb_typeof(item) = 'object'
    and item ? 'price'
    and coalesce(item->>'price', '') ~ '^[0-9]+(\.[0-9]+)?$';

  if v_min is not null then
    new.price := v_min;
    new.price_max := case when v_max > v_min then v_max else null end;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_sync_service_package_price_bounds_from_variants on public.service_packages;

create trigger trg_sync_service_package_price_bounds_from_variants
before insert or update of variants on public.service_packages
for each row
execute function public.sync_service_package_price_bounds_from_variants();

-- Backfill existing rows with variants so price bounds are aligned immediately.
update public.service_packages
set variants = variants
where variants is not null;

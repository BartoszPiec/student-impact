alter table public.offers
  add column if not exists cel_wspolpracy text,
  add column if not exists oczekiwany_rezultat text,
  add column if not exists kryteria_akceptacji text,
  add column if not exists osoba_prowadzaca text,
  add column if not exists planowany_start date,
  add column if not exists tryb_pracy text,
  add column if not exists czas_realizacji_typ text,
  add column if not exists czas_realizacji_dni integer,
  add column if not exists czas_realizacji_data date,
  add column if not exists wymagana_poufnosc boolean not null default false,
  add column if not exists przeniesienie_praw_autorskich boolean not null default false,
  add column if not exists portfolio_dozwolone boolean not null default true,
  add column if not exists materialy_legalnie_udostepnione boolean not null default false;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'offers_tryb_pracy_check'
  ) then
    alter table public.offers
      add constraint offers_tryb_pracy_check
      check (tryb_pracy is null or tryb_pracy in ('remote', 'onsite', 'hybrid'));
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'offers_czas_realizacji_typ_check'
  ) then
    alter table public.offers
      add constraint offers_czas_realizacji_typ_check
      check (czas_realizacji_typ is null or czas_realizacji_typ in ('days', 'date'));
  end if;
end
$$;

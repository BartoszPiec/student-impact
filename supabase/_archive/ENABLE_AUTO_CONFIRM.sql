-- Trigger: Automatyczne potwierdzanie emaila dla nowych użytkowników
-- Cel: Pozwala na natychmiastowe logowanie po rejestracji (bez SMTP).

create or replace function public.auto_confirm_email()
returns trigger as $$
begin
  new.email_confirmed_at = now();
  return new;
end;
$$ language plpgsql security definer;

-- Usuń stary trigger jeśli istnieje (żeby nie dublować)
drop trigger if exists on_auth_user_created_auto_confirm on auth.users;

-- Dodaj trigger "BEFORE INSERT" (żeby zapisać od razu confirmed)
create trigger on_auth_user_created_auto_confirm
before insert on auth.users
for each row execute procedure public.auto_confirm_email();

-- Komunikat
SELECT 'Auto-confirm enabled for new users' as status;

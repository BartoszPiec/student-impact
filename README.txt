Student Impact – patch: chat od aplikacji + blokada edycji propozycji

1) Supabase (SQL)
- Otwórz Supabase -> SQL Editor -> new query
- Wklej zawartość pliku: supabase_patch.sql
- Uruchom.

2) Kod (Next.js)
W repo podmień zawartość plików:

- app/app/applications/page.tsx
  -> użyj: app__app__applications__page.tsx

- app/app/applications/_actions.ts
  -> użyj: app__app__applications___actions.ts

- app/app/offers/[id]/page.tsx
  -> użyj: app__app__offers__[id]__page.tsx

- app/app/offers/[id]/_actions.ts
  -> użyj: app__app__offers__[id]___actions.ts

- app/app/chat/_actions.ts
  -> użyj: app__app__chat___actions.ts

- app/app/company/applications/_actions.ts
  -> użyj: app__app__company__applications___actions.ts

3) Co to daje
- Student po wysłaniu propozycji nie może jej edytować do czasu kontry firmy.
- Chat jest dostępny od razu po aplikacji (sent / countered / accepted).
- Wiadomość z aplikacji trafia jako pierwsza wiadomość na czat.
- Propozycje i kontroferty są zapisywane jako wiadomości na czacie.
- Po akceptacji aplikacji firma automatycznie odrzuca inne aplikacje do tej oferty i wysyła powiadomienia.

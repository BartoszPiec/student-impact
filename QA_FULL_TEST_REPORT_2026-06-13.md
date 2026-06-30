# QA full test report - 2026-06-13

Zakres: lokalny kod na `http://127.0.0.1:3000`, aktualny preview Vercel, konta testowe firmy i studenta. Hasla nie sa zapisywane w raporcie.

## Wynik ogolny

- Build: PASS (`npm run build`).
- MVP suite lokalnie: PASS, 26/26 (`test-results/mvp-local-pass.json`).
- MVP suite preview: PASS, 26/26 (`test-results/mvp-preview-pass-after-test-fix.json`).
- Supabase readiness: PASS dla tabel, RLS, funkcji i bucketu `deliverables`.
- Preview readiness: FAIL tylko na Stripe webhooku dla preview.
- Lint: FAIL, 227 errors / 110 warnings legacy.

## Przetestowane sciezki

### Quick Task

- Firma zalogowana poprawnie.
- Firma utworzyla zamowienie pakietu systemowego przez UI:
  - order: `56ad4771-4186-45db-9f3e-36e1e7b52ac4`
  - pakiet: `Retusz i obrobka zdjec produktowych`
  - wariant: M
  - kwota: 499 PLN
  - status: `Czeka na potwierdzenie`
  - wykonawca: `Pilot Sandbox Student`
- Student testowy nie widzi cudzego zamowienia i dostaje komunikat braku dostepu na bezposrednim URL.
- RBAC: student i firma nie widza panelu admina; cudze dokumenty zwracaja 403.

### Marketplace

- Firma utworzyla mikrozlecenie przez wizard:
  - offer: `4389cc81-21de-48a2-a327-ff2b1b94cd7c`
  - tytul: `QA Codex marketplace 2026-06-13`
  - status DB: `published`
  - budzet: 321 PLN
- Student widzi oferte na `/app/jobs` i szczegoly na `/app/offers/[id]`.
- Student zlozyl aplikacje:
  - application: `80befc39-d840-48f7-b840-f8122d4c5010`
  - status po wyslaniu: `sent`
- Firma widzi aplikacje w panelu oferty i zaakceptowala kandydata.
- Po akceptacji:
  - application status: `accepted`
  - realization_status: `in_progress`
  - contract: `3364cab4-3631-4a8e-9842-31a4db989de8`
  - contract status: `draft`
- Student widzi zadanie w `/app/applications` i panel realizacji `/app/deliverables/[applicationId]` bez bledow technicznych.

## Defekty / ryzyka

1. P0/P1: preview nadal ma blocker tworzenia zamowien pakietow systemowych, dopoki poprawka w `app/app/company/packages/_actions.ts` nie zostanie zacommitowana i wdrozona. Lokalnie flow przechodzi.
2. P1: Stripe nie ma aktywnego webhooka dla aktualnego preview URL: `https://student-impact-8vany1fkv-bartoszs-projects-216e6600.vercel.app/api/stripe/webhook`.
3. P1: auto-assign Quick Task przypisal zamowienie do `Pilot Sandbox Student`, nie do realnego konta studenta QA. W pilocie grozi to przypisaniem pracy do martwego/testowego konta.
4. P2: detal zamowienia Quick Task pokazuje `Cena bazowa w katalogu: 299 PLN`, mimo ze zamowiony wariant M ma 499 PLN.
5. P2: wiele widokow aplikacji ma teksty bez polskich znakow (`Zamowienia uslug`, `Moje ogloszenia`, `Gielda Zlecen`, `Uslugi`, `Wiadomosci`).
6. P2: finanse studenta pokazuja niezaokraglona wartosc `56140.999999999985 PLN`.
7. P2: Next dev log powtarza ostrzezenie o `/logo.png`: zmieniany jest tylko width albo height.
8. Tech debt: `npm run lint` nadal blokuje 227 bledow, glownie `no-explicit-any`, `react/no-unescaped-entities`, pojedyncze `prefer-const` i `no-html-link-for-pages`.

## Zmiany wykonane przy QA

- Zaktualizowano `scripts/mvp-scenario-suite.mjs`, bo test oczekiwal starego tekstu strony zamowien.
- Nie ruszano sekretow ani hasel w plikach.
- Utworzono testowe rekordy QA w bazie, wymienione powyzej.

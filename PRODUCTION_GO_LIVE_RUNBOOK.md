# Student2Work Production Go-Live Runbook

Status na 2026-05-24: aplikacja przechodzi preview gate, ale produkcja ma status NO-GO do czasu uzupelnienia live konfiguracji.

## Aktualny Preview Po Hardeningu

```text
https://student-impact-q1f4e47rz-bartoszs-projects-216e6600.vercel.app
```

Webhook preview:

```text
we_1TafE3LYZs1gNRrDCZoeWmrp
https://student-impact-q1f4e47rz-bartoszs-projects-216e6600.vercel.app/api/stripe/webhook
```

## Twarde Warunki GO

1. `npm.cmd run build` przechodzi.
2. `npm.cmd run check:preview` przechodzi dla aktualnego preview.
3. `npm.cmd run test:mvp-scenarios` przechodzi dla aktualnego preview.
4. `npm.cmd run check:production -- --env-file=.vercel\env.production.local` przechodzi bez bledow.
5. Stripe production uzywa live keys, live webhooka i live Connect.
6. `student2work.pl` wskazuje DNS-em na Vercel.
7. Produkcja ma rate limiting (`UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`) i runtime error reporting (`SENTRY_DSN`).

## Aktualne Blokery Produkcji

- Vercel Production ma nadal testowe klucze Stripe (`sk_test`, `pk_test`).
- Brakuje live webhooka Stripe dla `https://student2work.pl/api/stripe/webhook`.
- Brakuje `UPSTASH_REDIS_REST_URL` i `UPSTASH_REDIS_REST_TOKEN`, wiec rate limiting przeszedlby w tryb fallback.
- Brakuje `SENTRY_DSN` dla runtime error reporting.
- DNS `student2work.pl` wskazuje na `2.57.91.91`, a nie na Vercel `76.76.21.21`.
- Obecna domena `student2work.pl` nie obsluguje endpointow aplikacji Vercel API, wiec testy API na domenie produkcyjnej nie przechodza.

## Produkcyjne Env Do Ustawienia

```bash
NEXT_PUBLIC_APP_URL=https://student2work.pl
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_... # live endpoint dla /api/stripe/webhook
STRIPE_PAYOUTS_ENABLED=true
STRIPE_WEBHOOK_PROCESS_INLINE=false
UPSTASH_REDIS_REST_URL=...
UPSTASH_REDIS_REST_TOKEN=...
SENTRY_DSN=...
CRON_SECRET=...
```

## Scenariusze Testowe

Automatyczny pakiet:

```bash
npm.cmd run check:preview -- --env-file=.vercel\env.preview.local
npm.cmd run test:mvp-scenarios -- --base-url=https://student-impact-q1f4e47rz-bartoszs-projects-216e6600.vercel.app
npm.cmd run check:production -- --env-file=.vercel\env.production.local
```

CI:

- Workflow: `.github/workflows/mvp-e2e.yml`
- `workflow_dispatch` wymaga `base_url` i `target`.
- PR uruchamia build; E2E na PR wymaga repo variable `E2E_BASE_URL`.
- Wymagane sekrety CI:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `STRIPE_SECRET_KEY`
  - `STRIPE_PUBLISHABLE_KEY`
  - `STRIPE_WEBHOOK_SECRET`
  - `CRON_SECRET`
  - `TEST_COMPANY_EMAIL`
  - `TEST_COMPANY_PASSWORD`
  - `TEST_STUDENT_EMAIL`
  - `TEST_STUDENT_PASSWORD`

Raport E2E jest zapisywany jako artefakt `mvp-e2e-report` z plikiem `test-results/mvp-scenario-suite.json`.

Scenariusze reczne przed produkcja:

1. Firma rejestruje/loguje sie, wybiera Quick Task i wypelnia brief.
2. Student widzi zlecenie, status i nastepna akcje.
3. Student przyjmuje zlecenie.
4. System generuje umowy A/B.
5. Firma akceptuje umowe A, student akceptuje umowe B.
6. Firma przechodzi przez live-mode Stripe Checkout na malej kwocie testu produkcyjnego.
7. Live webhook aktualizuje platnosc bez recznej zmiany DB.
8. Student dostarcza wynik.
9. Firma akceptuje wynik.
10. Payout przechodzi przez live Stripe Connect albo zostaje zablokowany jasnym statusem, jesli konto studenta nie ma aktywnej capability `transfers`.
11. Firma i student widza dokumenty oraz finalny status.
12. Cron `process-stripe-events`, `auto-accept`, `cleanup-expired-sessions` odpowiada tylko z poprawnym `CRON_SECRET`.
13. Nieuprawniony student/firma nie widzi cudzych zlecen, rozmow, dokumentow ani finansow.
14. Zwrot Stripe (`refund.created` / `charge.refunded`) tworzy poprawny zapis finansowy.
15. Dispute blokuje dalsza wyplate i pokazuje status mediacji.

## Promocja

Produkcji nie promowac, dopoki `check:production` nie przejdzie na zielono.

Po przejsciu gate:

```bash
npm.cmd run build
npm.cmd run check:production -- --env-file=.vercel\env.production.local
vercel promote <validated-preview-url>
```

# Security hardening report - 2026-06-13

## Zrobione w kodzie

1. `lib/supabase/admin.ts` oznaczony jako `server-only`, aby service-role Supabase nie mogl zostac przypadkowo zaimportowany do bundla klienta.
2. Dodany wspolny guard `rejectCrossSiteRequest()` dla cookie-auth POST API.
3. Guard origin podpiety do:
   - `/api/stripe/create-checkout`
   - `/api/stripe/connect/onboarding`
   - `/api/stripe/verify-payment`
   - `/api/auth/verify-turnstile`
4. `verify-turnstile` nie zwraca juz surowego `error.message` do UI.
5. `/api/documents/download` waliduje `documentId` jako UUID przed zapytaniem przez admin client.
6. Admin exporty PIT/faktur:
   - waliduja `month` jako `YYYY-MM`,
   - nie zwracaja surowych bledow DB,
   - dodaja `Cache-Control: no-store` dla CSV z danymi osobowymi.
7. Globalne naglowki security w `next.config.ts` zachowane, ale HSTS i `upgrade-insecure-requests` nie sa wymuszane w lokalnym dev.
8. Testy readiness dopuszczaja `403` jako poprawny wynik dla cross-site/no-origin POST na endpointach finansowych.

## Zweryfikowane

- `npm run build` - PASS.
- `npm run test:mvp-scenarios -- --base-url=https://student-impact-8vany1fkv-bartoszs-projects-216e6600.vercel.app --report=test-results/mvp-preview-security-hardening.json` - PASS.
- `npm run check:preview` z preview URL - FAIL tylko na braku aktywnego Stripe webhooka dla aktualnego preview.

## Nadal wymagane przed uzytkownikami

1. Skonfigurowac Stripe webhook dla aktualnego/stabilnego URL aplikacji i ustawic pasujacy `STRIPE_WEBHOOK_SECRET` w Vercel.
2. Wdrozyc aktualny branch, bo preview `8vany...` nie zawiera jeszcze lokalnego fixu `_actions.ts` dla tworzenia pakietow systemowych.
3. Uporzadkowac legacy lint debt (`npm run lint`: 227 errors / 110 warnings), szczegolnie `any` w akcjach i panelach admina.
4. Zdecydowac o deterministycznym przypisywaniu studentow w Quick Task, z wykluczeniem kont sandbox/testowych.

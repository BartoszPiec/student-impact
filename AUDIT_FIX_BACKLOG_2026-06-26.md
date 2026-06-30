# Backlog poprawek po pelnym audycie - 2026-06-26

## Zasady wdrozenia

- Minimalne PR-y, bez refaktorow pobocznych.
- Nie cofac istniejacych niezacommitowanych zmian, jezeli nie sa bezposrednio czescia zadania.
- DB tylko przez forward migrations.
- Mutacje walidowac runtime schema.
- Kwoty, role i ownership zawsze z bazy/server-side, nigdy z frontendu.
- JSON API zachowuje `{ error: string }`, komunikaty po polsku.
- Publiczne endpointy bez stack trace i bez PII w logach.
- Storage prywatny: `storage://bucket/path` + signed download po autoryzacji.

## Wdrozone w partii 1

- `app/api/webhooks/notifications/route.ts`: dodana walidacja Zod, polskie bledy JSON, `Cache-Control: no-store`, fail-closed dla braku `RESEND_API_KEY` w produkcji i usuniecie logowania adresu email w dry-run.
- `app/api/stripe/create-checkout/route.ts`: request checkout walidowany Zod; frontend nie przekazuje juz kwoty jako czesci payloadu.
- `app/api/stripe/verify-payment/route.ts`: request verify walidowany Zod, metadane `milestone_ids` walidowane jako UUID array, bledy i komunikaty zwracane po polsku.
- `app/components/payment-modal.tsx` + `app/app/deliverables/[id]/tabs/StatusTab.tsx`: usuniety produkcyjny mock payment fallback (`onConfirm`, `useStripe`, `handleMockPayment`); modal kieruje tylko do Stripe Checkout.
- `app/components/payment-modal.tsx`: copy platnosci zmienione z "Escrow" na "Depozyt Student2Work" w dotknietym flow pilota.
- `app/app/company/packages/_actions.ts`: dopasowano rownolegla zmiane `pending_selection` tak, by TypeScript/lint byly czyste; usunieto martwy helper starego auto-przypisania.

Weryfikacja partii 1:

- `npm run lint` - PASS
- `npx tsc --noEmit` - PASS
- `npm run build` - PASS
- `npm audit --omit=dev --audit-level=moderate` - PASS
- `npm run check:preview` - FAIL tylko na znanych blokadach: lokalny `NEXT_PUBLIC_APP_URL` bez HTTPS i brak aktywnego webhooka Stripe dla `http://localhost:3000/api/stripe/webhook`.
- `npm run test:mvp-scenarios` - FAIL tylko na znanych blokadach: Stripe Connect payout studenta pending i brak `TEST_COMPANY_EMAIL/PASSWORD` oraz `TEST_STUDENT_EMAIL/PASSWORD`.
- `npm run check:production` - FAIL na znanych blokadach live-env/infrastruktury: Upstash, Sentry, live Stripe keys, `STRIPE_PAYOUTS_ENABLED=true`, HTTPS app URL, DNS Vercel i webhook Stripe.

## Wdrozone w partii 2

- `lib/pdf/legal-clauses-pl.ts`: `PLATFORM_ENTITY` czyta teraz dane podmiotu z server-only env `PLATFORM_LEGAL_*`, zamiast utrwalac placeholdery jako jedyne zrodlo prawdy dla umow i faktur.
- `.env.example`: dodane `PLATFORM_LEGAL_NAME`, `PLATFORM_LEGAL_NIP`, `PLATFORM_LEGAL_ADDRESS`, `PLATFORM_LEGAL_CITY`, `PLATFORM_LEGAL_KRS`, `PLATFORM_LEGAL_REPRESENTED_BY`, `RESEND_API_KEY`, `RESEND_FROM_EMAIL`.
- `scripts/validate-deploy-env.mjs`: produkcyjny deploy wymaga Resend oraz realnych danych prawnych platformy; placeholdery NIP/KRS/adres/reprezentacja blokuja deploy.
- `scripts/production-readiness-check.mjs`: dodane checki `email:*` i `legal:*`, aby production readiness jawnie raportowal brak Resend i placeholdery prawne.

Weryfikacja partii 2:

- `npm run lint` - PASS
- `npx tsc --noEmit` - PASS
- `npm run build` - PASS
- `npm audit --omit=dev --audit-level=moderate` - PASS
- `npm run check:preview` - FAIL tylko na znanych blokadach: lokalny `NEXT_PUBLIC_APP_URL` bez HTTPS i brak aktywnego webhooka Stripe dla `http://localhost:3000/api/stripe/webhook`.
- `npm run check:production` - FAIL zgodnie z oczekiwaniem na live-env/infrastrukturze oraz nowych legal/email gates: brak `RESEND_FROM_EMAIL` i brak realnych `PLATFORM_LEGAL_*`.
- `npm run test:mvp-scenarios` - FAIL tylko na znanych blokadach: Stripe Connect payout studenta pending i brak `TEST_COMPANY_EMAIL/PASSWORD` oraz `TEST_STUDENT_EMAIL/PASSWORD`.

## Wdrozone w partii 3

- `app/api/cron/process-stripe-events/route.ts`, `app/api/cron/cleanup-expired-sessions/route.ts`, `app/api/cron/auto-accept/route.ts`: ujednolicone polskie bledy dla braku konfiguracji/autoryzacji, dodany `Cache-Control: no-store` do odpowiedzi JSON.
- `app/api/stripe/webhook/route.ts`: zachowano raw body + signature verification, ale publiczne bledy webhooka sa po polsku i bez technicznego stack trace.
- `app/api/auth/verify-turnstile/route.ts`: request body walidowany runtime schema Zod; komunikaty bledow CAPTCHA ujednolicone.
- `app/api/storage/upload/route.ts`, `app/api/storage/download/route.ts`, `app/api/documents/download/route.ts`, `lib/security/storage.ts`, `lib/security/upload-policy.ts`, `lib/security/request-origin.ts`: poprawione polskie komunikaty bledow i no-store dla dokumentow.
- `app/api/admin/export/pit-csv/route.ts`, `app/api/admin/export/invoices-zip/route.ts`: admin export zwraca polskie 401/403 i poprawione bledy walidacji miesiaca; historyczny endpoint `invoices-zip` zostal najpierw jawnie oznaczony jako CSV, a w partii 10 zastapiony faktycznym ZIP.
- `app/app/admin/exports/page.tsx`: usunieto techniczne copy o nazwie endpointu i poprawiono polskie komunikaty widoczne w panelu eksportow.

Weryfikacja partii 3:

- `npm run lint` - PASS
- `npx tsc --noEmit` - PASS
- `npm run build` - PASS
- `npm audit --omit=dev --audit-level=moderate` - PASS
- `npm run check:preview` - FAIL tylko na znanych blokadach: lokalny `NEXT_PUBLIC_APP_URL` bez HTTPS i brak aktywnego webhooka Stripe dla `http://localhost:3000/api/stripe/webhook`.
- `npm run check:production` - FAIL zgodnie z oczekiwaniem na live-env/infrastrukturze oraz legal/email gates: Upstash, Sentry, `RESEND_FROM_EMAIL`, realne `PLATFORM_LEGAL_*`, live Stripe keys, `STRIPE_PAYOUTS_ENABLED=true`, HTTPS app URL, DNS Vercel i webhook Stripe.
- `npm run test:mvp-scenarios` - FAIL tylko na znanych blokadach: Stripe Connect payout studenta pending i brak `TEST_COMPANY_EMAIL/PASSWORD` oraz `TEST_STUDENT_EMAIL/PASSWORD`.

## Wdrozone w partii 4

- `lib/security/api-response.ts`: dodany wspolny server-only helper `noStoreJson` i `jsonError`, aby odpowiedzi JSON z endpointow wrażliwych nie rozjezdzaly sie w cache/error handlingu.
- `lib/security/validation.ts`: dodane wspolne `uuidSchema`, `isUuid`, `monthSchema`, `isAccountingMonth` dla runtime validation.
- Krytyczne route handlery (`stripe/create-checkout`, `stripe/verify-payment`, `stripe/connect/onboarding`, `stripe/webhook`, `cron/*`, `storage/*`, `documents/download`, `admin/export/*`, `webhooks/notifications`, `auth/verify-turnstile`) korzystaja ze wspolnego helpera odpowiedzi.
- `lib/stripe/stripe-event-processor.ts`: webhookowy procesor Stripe waliduje teraz `milestone_ids` z metadanych jako tablice UUID max 100 elementow, zamiast przekazywac dowolny JSON do RPC.
- `request-origin` korzysta z tych samych polskich, no-store odpowiedzi dla blokady Origin/Fetch-Site.

Weryfikacja partii 4:

- `npm run lint` - PASS
- `npx tsc --noEmit` - PASS
- `npm run build` - PASS
- `npm audit --omit=dev --audit-level=moderate` - PASS
- `npm run check:preview` - FAIL tylko na znanych blokadach: lokalny `NEXT_PUBLIC_APP_URL` bez HTTPS i brak aktywnego webhooka Stripe dla `http://localhost:3000/api/stripe/webhook`.
- `npm run check:production` - FAIL zgodnie z oczekiwaniem na live-env/infrastrukturze oraz legal/email gates: Upstash, Sentry, `RESEND_FROM_EMAIL`, realne `PLATFORM_LEGAL_*`, live Stripe keys, `STRIPE_PAYOUTS_ENABLED=true`, HTTPS app URL, DNS Vercel i webhook Stripe.
- `npm run test:mvp-scenarios` - FAIL tylko na znanych blokadach: Stripe Connect payout studenta pending i brak `TEST_COMPANY_EMAIL/PASSWORD` oraz `TEST_STUDENT_EMAIL/PASSWORD`.

## Wdrozone w partii 5

- `supabase/migrations/20260627100000_harden_pending_checkout_singleton.sql`: dodana forward migration, ktora porzadkuje stare duplikaty `payments.status = 'pending'` per `contract_id` i zaklada czesciowy unikalny indeks `idx_payments_one_pending_per_contract`.
- `app/api/stripe/create-checkout/route.ts`: dodany deterministyczny Stripe `idempotencyKey` dla Checkout Session w minutowym oknie proby, oparty o kontrakt, zrodlo, etapy i kwote.
- `app/api/stripe/create-checkout/route.ts`: jesli istnieje otwarta pending session, endpoint ja reuzywa; jesli sesja wygasla, oznacza lokalny rekord jako `expired`; jesli sesja jest kompletna, zwraca kontrolowany konflikt.
- `app/api/stripe/create-checkout/route.ts`: zapis `payments` jest teraz fail-closed. Przy bledzie DB endpoint wygasza nowo utworzona sesje Stripe i nie zwraca firmie linku do platnosci bez rekordu ledger/payment. Przy konflikcie `23505` probuje odzyskac istniejaca pending session.

Weryfikacja partii 5:

- `npm run lint` - PASS
- `npx tsc --noEmit` - PASS
- `npm run build` - PASS
- `npm audit --omit=dev --audit-level=moderate` - PASS
- `npm run check:preview` - FAIL tylko na znanych blokadach: lokalny `NEXT_PUBLIC_APP_URL` bez HTTPS i brak aktywnego webhooka Stripe dla `http://localhost:3000/api/stripe/webhook`.
- `npm run check:production` - FAIL zgodnie z oczekiwaniem na live-env/infrastrukturze oraz legal/email gates: Upstash, Sentry, `RESEND_FROM_EMAIL`, realne `PLATFORM_LEGAL_*`, live Stripe keys, `STRIPE_PAYOUTS_ENABLED=true`, HTTPS app URL, DNS Vercel i webhook Stripe.
- `npm run test:mvp-scenarios` - FAIL tylko na znanych blokadach: Stripe Connect payout studenta pending i brak `TEST_COMPANY_EMAIL/PASSWORD` oraz `TEST_STUDENT_EMAIL/PASSWORD`.
- Supabase dry-run `db push --linked --include-all --dry-run --yes` - PASS; dry-run wskazuje, ze push objalby dwie oczekujace migracje: `20260623194500_audit_query_indexes.sql` oraz `20260627100000_harden_pending_checkout_singleton.sql`. Nie wykonano realnego pushu.

## Wdrozone w partii 6

- `supabase/migrations/20260627101136_create_error_logs.sql`: dodana forward migration `public.error_logs` z RLS, admin-only SELECT, brakiem mutacji dla `authenticated` i INSERT/SELECT dla `service_role`.
- `lib/observability/error-log.ts`: dodany server-only helper `logCriticalError`, ktory sanitizuje kontekst diagnostyczny, redaguje pola wrazliwe, opcjonalnie wysyla zdarzenie do Sentry i zapisuje je w `error_logs` bez przerywania flow biznesowego.
- `app/api/stripe/create-checkout/route.ts`: bledy orphaned Stripe session, nieudany zapis `payments` po stworzeniu sesji oraz nieoczekiwane bledy checkoutu trafiaja do `error_logs`/Sentry.
- `app/api/stripe/verify-payment/route.ts`: bledy RPC `process_stripe_payment_v4`, sync `service_orders`, powiadomien po funding i catch-all verify sa logowane z kontekstem technicznym: user/contract/session/source.
- `app/api/stripe/webhook/route.ts` i `lib/stripe/stripe-event-processor.ts`: enqueue/inline processing/failed event processing oraz invoice generation warning sa widoczne w centralnym logu.
- `app/api/cron/auto-accept/route.ts` i `app/api/cron/process-stripe-events/route.ts`: brak `CRON_SECRET`, bledy RPC/reconciliation i nieoczekiwane awarie cronow sa logowane; pojedynczy blad transferu payout w batchu nie wywraca pozostalych transferow.
- `app/api/webhooks/notifications/route.ts`: braki konfiguracji webhook/Resend, brak emaila odbiorcy i blad Resend API trafiaja do logu bez zapisywania adresu email ani payloadu wiadomosci.
- `app/api/storage/upload/route.ts`: blad Supabase Storage upload loguje tylko bucket/purpose/contentType/size/userId, bez nazwy pliku jako danych diagnostycznych.

Weryfikacja partii 6:

- `npm run lint` - PASS
- `npx tsc --noEmit` - PASS
- `npm run build` - PASS
- `npm audit --omit=dev --audit-level=moderate` - PASS, 0 podatnosci.
- `git diff --check` - PASS; tylko ostrzezenia Windows LF -> CRLF.
- `npm run check:preview` - FAIL tylko na znanych blokadach: lokalny `NEXT_PUBLIC_APP_URL` bez HTTPS i brak aktywnego webhooka Stripe dla `http://localhost:3000/api/stripe/webhook`.
- `npm run test:mvp-scenarios` - FAIL tylko na znanych blokadach: Stripe Connect payout studenta pending/not ready i brak `TEST_COMPANY_EMAIL/PASSWORD` oraz `TEST_STUDENT_EMAIL/PASSWORD`.
- `npm run check:production` - FAIL zgodnie z oczekiwaniem na live-env/infrastrukturze: Upstash, Sentry, `RESEND_FROM_EMAIL`, realne `PLATFORM_LEGAL_*`, live Stripe keys, `STRIPE_PAYOUTS_ENABLED=true`, HTTPS app URL, DNS Vercel i webhook Stripe.
- Supabase dry-run `db push --linked --include-all --dry-run --yes` - PASS; dry-run wskazuje, ze push objalby trzy oczekujace migracje: `20260623194500_audit_query_indexes.sql`, `20260627100000_harden_pending_checkout_singleton.sql`, `20260627101136_create_error_logs.sql`. Nie wykonano realnego pushu.

## Wdrozone w partii 7

- `app/app/offers/[id]/apply-card.tsx`: usunieto komentarz i zmienna `mockOffer`; systemowe zlecenie dla `ApplySheet` powstaje przez jawny adapter `toApplySheetOffer`.
- `app/app/offers/[id]/apply-card.tsx`: usunieto testowy przycisk `Wyslij kolejne zgloszenie (test)` po sukcesie aplikacji; CTA prowadzi teraz do `Moje zgloszenia`, zamiast wspierac duplikowanie aplikacji.
- `app/app/offers/[id]/apply-card.tsx`: uproszczono inicjalizacje stanu stawki bez zbednego `useMemo`, zgodnie z React best practices dla prostych wartosci prymitywnych.
- `app/app/offers/[id]/_actions.ts`: server action `applyToOffer` nie zwraca juz `debug: logs` do klienta, nie buduje martwego trace przez `logs.push`, a nieoczekiwane bledy trafiaja do `logCriticalError`.
- `app/app/offers/[id]/_actions.ts`: `NEXT_REDIRECT` jest odfiltrowany przed `console.error`, aby normalny redirect nie byl logowany jako blad.
- `app/page.tsx`: usunieto publiczne copy `Przykladowe opinie z pilotazu - do podmiany...`; landing nie ujawnia juz placeholderowego charakteru sekcji opinii.
- `app/dla-studentow/page.tsx`: mobilna i desktopowa nawigacja maja lokalna, typowana liste linkow do istniejacych sekcji; usunieto zaleznosc od niezdefiniowanego `navLinks`.
- `app/app/app-navbar.tsx`: lazy-loaded `NotificationsBell` ma jawny typ propsow, wiec style triggera i badge'a sa sprawdzane przez TypeScript bez tracenia kontraktu komponentu.

Weryfikacja partii 7:

- `rg -n "debug: logs|logs\\.push|DEBUG START|Mock JobOffer|mockOffer|Wyslij kolejne zgloszenie|Wyślij kolejne zgłoszenie|test\\)" app/app/offers app/app/jobs` - PASS, brak trafien.
- `npm run lint` - PASS
- `npx tsc --noEmit` - PASS po poprawkach `/dla-studentow` i `NotificationsBell`.
- `npm run build` - PASS po finalnym `tsc`.
- `npm audit --omit=dev --audit-level=moderate` - PASS, 0 podatnosci.
- `git diff --check` - PASS; tylko ostrzezenia Windows LF -> CRLF.
- `npm run check:preview` - FAIL tylko na znanych blokadach: lokalny `NEXT_PUBLIC_APP_URL` bez HTTPS i brak aktywnego webhooka Stripe dla `http://localhost:3000/api/stripe/webhook`.
- `npm run test:mvp-scenarios` - FAIL tylko na znanych blokadach: Stripe Connect payout studenta pending/not ready i brak `TEST_COMPANY_EMAIL/PASSWORD` oraz `TEST_STUDENT_EMAIL/PASSWORD`.
- `npm run check:production` - FAIL zgodnie z oczekiwaniem na live-env/infrastrukturze: Upstash, Sentry, `RESEND_FROM_EMAIL`, realne `PLATFORM_LEGAL_*`, live Stripe keys, `STRIPE_PAYOUTS_ENABLED=true`, HTTPS app URL, DNS Vercel i webhook Stripe.

## Wdrozone w partii 8

- `ADR_PAYMENTS_GO_LIVE_MODEL_2026-06-27.md`: dodany proponowany ADR platnosci, ktory rozdziela obecny pilot Checkout + ledger + transfery od decyzji go-live.
- ADR opisuje dwie dopuszczalne sciezki: path A manual-capture escrow albo path B formalnie zatwierdzony Checkout + ledger z korekta copy/legal.
- Status produkcyjny platnosci live pozostaje `NO-GO`, dopoki ADR nie zostanie podpisany i dopoki `check:production` oraz `test:mvp-scenarios` nie przejda na docelowym env.

Weryfikacja partii 8:

- Dokumentacja-only; brak zmian runtime po zielonym `lint`, `tsc` i `build` z partii 7.
- `git diff --check` - PASS; tylko ostrzezenia Windows LF -> CRLF.

## Wdrozone w partii 9

- `app/page.tsx`, `app/dla-studentow/page.tsx`, `app/auth/page.tsx`: user-facing copy platnosci przestawione z `escrow` na `depozyt Student2Work`, `srodki zabezpieczone` i platnosc po akceptacji.
- `app/regulamin/page.tsx`, `lib/pdf/legal-clauses-pl.ts`: regulamin i klauzule PDF nie mowia juz o rachunku escrow; opisuja depozyt zabezpieczajacy rozliczany przez platforme po akceptacji albo sporze.
- `app/components/payment-modal.tsx`, `app/app/deliverables/[id]/tabs/StatusTab.tsx`, `app/app/company/applications/applications-view.tsx`: panele zasilenia platnosci uzywaja slownika `depozyt`, bez zmiany flow Stripe.
- `app/app/company/packages/*`, `app/app/company/jobs/new/page.tsx`, `app/app/company/challenges/new/challenge-form.tsx`, `app/app/company/orders/[id]/page.tsx`, `app/app/services/proposals/new/page.tsx`: katalog i flow firmowe nie obiecuja juz klasycznego escrow.
- `lib/pdf/generate-invoice.ts`, `app/app/admin/analytics/AnalyticsDashboard.tsx`: faktura i admin analytics rozrozniaja depozyt/ledger liability zamiast `Escrow`.
- Techniczne nazwy `escrow_funded`, `escrow_active_pln`, `isEscrowReady` pozostawiono bez migracji danych; to nie jest user-facing copy.

Weryfikacja partii 9:

- `npm run lint` - PASS
- `npx tsc --noEmit` - PASS
- `npm run build` - PASS
- `npm audit --omit=dev --audit-level=moderate` - PASS, 0 podatnosci.
- `git diff --check` - PASS; tylko ostrzezenia Windows LF -> CRLF.
- `rg -n "System Escrow|Escrow aktywne|Zasil escrow|oczekuje na escrow|rachunku escrow|depozytu escrow|Płatności chronione systemem escrow|Platnosci chronione systemem escrow|Jak dziala escrow|Jak działa escrow|Wymagane Zasilenie Escrow|Student Impact Escrow" app components lib` - PASS, brak trafien.
- `rg -n "escrow|Escrow" app components lib` - pozostaja tylko techniczne identyfikatory eventow/pol/zmiennych wymagajace osobnej migracji, nie publiczne copy.
- `npm run check:preview` - FAIL tylko na znanych blokadach: lokalny `NEXT_PUBLIC_APP_URL` bez HTTPS i brak aktywnego webhooka Stripe dla `http://localhost:3000/api/stripe/webhook`.
- `npm run test:mvp-scenarios` - FAIL tylko na znanych blokadach: Stripe Connect payout studenta pending/not ready i brak `TEST_COMPANY_EMAIL/PASSWORD` oraz `TEST_STUDENT_EMAIL/PASSWORD`.
- `npm run check:production` - FAIL zgodnie z oczekiwaniem na live-env/infrastrukturze: Upstash, Sentry, `RESEND_FROM_EMAIL`, realne `PLATFORM_LEGAL_*`, live Stripe keys, `STRIPE_PAYOUTS_ENABLED=true`, HTTPS app URL, DNS Vercel i webhook Stripe.

## Wdrozone w partii 10

- `lib/export/zip.ts`: dodany server-only ZIP writer bez nowej zaleznosci npm; generuje ZIP32 metodą store, z CRC32 i flaga UTF-8 dla nazw plikow.
- `app/api/admin/export/invoices-zip/route.ts`: historyczny endpoint zachowany, ale zwraca teraz prawdziwy `application/zip` z PDF-ami faktur/rachunkow z `invoices.storage_path` oraz `manifest-faktur.csv`.
- Endpoint pobiera tylko dokumenty `issued`/`paid` z prywatnego bucketu `deliverables`, wymaga admina i zachowuje polskie `{ error: string }`/`no-store`.
- `app/app/admin/exports/page.tsx`: UI komunikuje `Faktury ZIP`, pobiera `faktury_{month}.zip` i opisuje zawartosc paczki bez starego komunikatu o braku generatora PDF/ZIP.

Weryfikacja partii 10:

- `npm run lint` - PASS
- `npx tsc --noEmit` - PASS
- `npm run build` - PASS
- `npm audit --omit=dev --audit-level=moderate` - PASS, 0 podatnosci.
- `git diff --check` - PASS; tylko ostrzezenia Windows LF -> CRLF.
- `rg -n "invoices-zip|Rejestr faktur CSV|Paczki PDF/ZIP|X-Export-Format|faktury_\\$\\{month\\}\\.csv|zwraca CSV|CSV z danymi faktur" app lib` - PASS dla starego UI/CSV copy; zostaja tylko aktualne wystapienia endpointu i `X-Export-Format: zip`.
- `npm run test:mvp-scenarios` - FAIL tylko na znanych blokadach: Stripe Connect payout studenta pending/not ready i brak `TEST_COMPANY_EMAIL/PASSWORD` oraz `TEST_STUDENT_EMAIL/PASSWORD`; admin export bez auth nadal zwraca 401.
- `npm run check:preview` - FAIL tylko na znanych blokadach: lokalny `NEXT_PUBLIC_APP_URL` bez HTTPS i brak aktywnego webhooka Stripe dla `http://localhost:3000/api/stripe/webhook`.
- `npm run check:production` - FAIL zgodnie z oczekiwaniem na live-env/infrastrukturze: Upstash, Sentry, `RESEND_FROM_EMAIL`, realne `PLATFORM_LEGAL_*`, live Stripe keys, `STRIPE_PAYOUTS_ENABLED=true`, HTTPS app URL, DNS Vercel i webhook Stripe.

## Wdrozone w partii 11

- `ADR_STRIPE_CONNECT_ACCOUNT_MODEL_2026-06-27.md`: dodany proponowany ADR dla modelu kont studentow w Stripe Connect. Dokument rozdziela pilotowe v1 Express od rekomendowanej sciezki Accounts v2 `recipient`.
- `.env.example`: dodane `STRIPE_CONNECT_MODEL_APPROVED=false`, aby decyzja Connect byla jawna w konfiguracji.
- `scripts/validate-deploy-env.mjs`: produkcyjny deploy failuje, jezeli `STRIPE_CONNECT_MODEL_APPROVED` nie jest ustawione na `true`.
- `scripts/production-readiness-check.mjs`: `check:production` raportuje osobny check `stripe:connect-model-approved`.
- `app/api/stripe/connect/onboarding/route.ts`: przy v1 Express dodany komentarz, ze to kompatybilnosciowa sciezka pilota, a live payouty wymagaja bramki ADR.

Weryfikacja partii 11:

- `npm run lint` - PASS
- `npx tsc --noEmit` - PASS
- `npm run build` - PASS
- `npm audit --omit=dev --audit-level=moderate` - PASS, 0 podatnosci.
- `git diff --check` - PASS; tylko ostrzezenia Windows LF -> CRLF.
- `npm run check:preview` - FAIL tylko na znanych blokadach: lokalny `NEXT_PUBLIC_APP_URL` bez HTTPS i brak aktywnego webhooka Stripe dla `http://localhost:3000/api/stripe/webhook`.
- `npm run check:production` - FAIL zgodnie z oczekiwaniem na live-env/infrastrukturze oraz nowej bramce Connect: Upstash, Sentry, `RESEND_FROM_EMAIL`, realne `PLATFORM_LEGAL_*`, live Stripe keys, `STRIPE_PAYOUTS_ENABLED=true`, `STRIPE_CONNECT_MODEL_APPROVED=true`, HTTPS app URL, DNS Vercel i webhook Stripe.
- `npm run test:mvp-scenarios` - FAIL tylko na znanych blokadach: Stripe Connect payout studenta pending/not ready i brak `TEST_COMPANY_EMAIL/PASSWORD` oraz `TEST_STUDENT_EMAIL/PASSWORD`.

## Wdrozone w partii 12

- `proxy.ts`: dodany produkcyjny `Content-Security-Policy-Report-Only` z `script-src` bez `unsafe-inline`; enforced CSP pozostaje bez zmiany, aby nie ryzykowac blokady Next/Stripe/Turnstile bez visual QA.
- `app/api/security/csp-report/route.ts`: dodany publiczny endpoint raportowania CSP, z limitem rozmiaru body, obsluga legacy `csp-report` i Reporting API, sanitizacja URL-i bez query/hash oraz zapisem do `error_logs`/Sentry przez `logCriticalError`.
- `lib/rate-limit.ts`: dodany limiter `csp` dla raportow CSP.
- `scripts/mvp-scenario-suite.mjs`: dodane dwa testy dla `/api/security/csp-report`: nieprawidlowy JSON ma zwracac 400, poprawny raport 202.

Weryfikacja partii 12:

- `npm run lint` - PASS
- `npx tsc --noEmit` - PASS
- `npm run build` - PASS
- HTTP smoke dla `/api/security/csp-report` - PASS: poprawny raport 202, zly JSON 400.
- `npm run check:preview` - FAIL tylko na znanych blokadach: lokalny `NEXT_PUBLIC_APP_URL` bez HTTPS i brak aktywnego webhooka Stripe dla `http://localhost:3000/api/stripe/webhook`.
- `npm run check:production` - FAIL zgodnie z oczekiwaniem na 17 blokadach live-env/Connect: Upstash, Sentry, `RESEND_FROM_EMAIL`, realne `PLATFORM_LEGAL_*`, live Stripe keys, `STRIPE_PAYOUTS_ENABLED=true`, `STRIPE_CONNECT_MODEL_APPROVED=true`, HTTPS app URL, DNS Vercel i webhook Stripe.
- `npm run test:mvp-scenarios` - FAIL tylko na znanych blokadach: Stripe Connect payout studenta pending/not ready i brak `TEST_COMPANY_EMAIL/PASSWORD` oraz `TEST_STUDENT_EMAIL/PASSWORD`; nowe testy CSP report endpointu przechodza.

## Wdrozone w partii 13

- `app/app/orders/create/[packageId]/_actions.ts`: dodane Zod schema dla legacy `createOrder`: UUID pakietu, email kontaktowy, opcjonalna strona firmy, wariant i limit dodatkowego opisu.
- `createOrder` nie czyta juz `title` ani `price` z ukrytych pol formularza; tytul i kwota zamowienia pochodza z `service_packages`/wariantu po stronie serwera.
- Dynamiczne odpowiedzi briefu sa filtrowane do faktycznego `form_schema` pakietu, limitowane liczba pol i dlugoscia wartosci.
- `startInquiry` waliduje UUID i dlugosc wiadomosci oraz sprawdza role `company` server-side.
- `app/app/orders/create/[packageId]/order-form.tsx` i `page.tsx`: usuniete ukryte pole `price` oraz ukryte pole `title` z formularza.

Weryfikacja partii 13:

- `rg -n -F 'name="price"' 'app/app/orders/create/[packageId]'` - PASS, brak trafien.
- `rg -n -F 'name="title"' 'app/app/orders/create/[packageId]'` - PASS, brak trafien.
- `npm run lint` - PASS
- `npx tsc --noEmit` - PASS
- `npm run build` - PASS
- `git diff --check` dla plikow partii - PASS; tylko ostrzezenia Windows LF -> CRLF.
- `npm run test:mvp-scenarios` - FAIL tylko na znanych blokadach: Stripe Connect payout studenta pending/not ready i brak `TEST_COMPANY_EMAIL/PASSWORD` oraz `TEST_STUDENT_EMAIL/PASSWORD`.

## Wdrozone w partii 14

- `app/app/profile/_actions.ts`: przepisane akcje profilu pod Zod schemas i wspolne role guardy `student`/`company`.
- `saveStudentProfile`: waliduje bio, doswiadczenie, linki HTTPS, kompetencje i opcjonalne pola onboardingowe; nie zeruje juz `kierunek/rok/sciezka`, jesli aktualny formularz ich nie wysyla.
- `saveCompanyProfile`: waliduje nazwe firmy, NIP z checksum, adres, branze, opis oraz URL-e HTTPS.
- `saveStudentTaxData`: waliduje role studenta, date, PESEL z checksum i zapisuje tylko kontrolowane pola podatkowe.
- `addEducationEntry`/`deleteEducationEntry`: waliduja role studenta, lata edukacji i UUID wpisu.

Weryfikacja partii 14:

- `npm run lint` - PASS
- `npx tsc --noEmit` - PASS
- `npm run build` - PASS
- `git diff --check` dla plikow partii - PASS; tylko ostrzezenie Windows LF -> CRLF.
- `npm run test:mvp-scenarios` - FAIL tylko na znanych blokadach: Stripe Connect payout studenta pending/not ready i brak `TEST_COMPANY_EMAIL/PASSWORD` oraz `TEST_STUDENT_EMAIL/PASSWORD`. Authenticated UI profile forms nadal wymagaja credentiali testowych.

## Wdrozone w partii 15

- `app/app/cancel/[id]/_actions.ts`: przepisane anulowanie wspolpracy pod Zod schema, walidacje UUID i limit powodu anulowania.
- Przed RPC `cancel_application` akcja potwierdza, ze aplikacja istnieje, jest w statusie `accepted`, ma powiazana oferte oraz ze aktualny uzytkownik jest studentem albo firma tej wspolpracy.
- Bledy RPC i bledy zapisu historii/notyfikacji trafiaja do `logCriticalError`; kontekst diagnostyczny nie zawiera tresci powodu anulowania.
- Publiczny blad RPC jest po polsku i nie eksponuje komunikatu bazy.

Weryfikacja partii 15:

- `npm run lint` - PASS
- `npx tsc --noEmit` - PASS
- `npm run build` - PASS
- `git diff --check` dla plikow partii - PASS; tylko ostrzezenie Windows LF -> CRLF.
- `npm run test:mvp-scenarios` - FAIL tylko na znanych blokadach: Stripe Connect payout studenta pending/not ready i brak `TEST_COMPANY_EMAIL/PASSWORD` oraz `TEST_STUDENT_EMAIL/PASSWORD`.

## Kolejnosc PR-ow

### PR 1 - P0 release gates i decyzja platnicza

Cel: nie ruszac UI szeroko, tylko zamknac blokady, ktore decyduja o `GO/NO-GO`.

Zakres:

- Uporzadkowac `.env.example` i readiness checks pod realne wymagania produkcyjne: Upstash, Sentry, live Stripe, HTTPS app URL, DNS, webhook, `STRIPE_PAYOUTS_ENABLED=true`.
- Dodac/naprawic staging/test credentiale dla `TEST_COMPANY_EMAIL/PASSWORD` i `TEST_STUDENT_EMAIL/PASSWORD`.
- Zatwierdzic `ADR_PAYMENTS_GO_LIVE_MODEL_2026-06-27.md`: path A `manual-capture escrow` albo path B formalnie zatwierdzony `Checkout + ledger + transfery`.
- Zatwierdzic `ADR_STRIPE_CONNECT_ACCOUNT_MODEL_2026-06-27.md` i ustawic `STRIPE_CONNECT_MODEL_APPROVED=true` dopiero po decyzji Accounts v2 `recipient` albo v1 Express dla live pilota.
- Najbardziej ryzykowne publiczne copy "escrow" zostalo przestawione w partii 9 na `depozyt Student2Work`; po zatwierdzeniu ADR zostaje finalny legal/copy pass.
- Zweryfikowac student Stripe Connect test account i doprowadzic payout evidence do PASS.

Testy akceptacyjne:

- `npm run check:preview` przechodzi albo ma tylko jawnie zaakceptowane lokalne ograniczenia webhooka.
- `npm run test:mvp-scenarios` przechodzi w aktualnej pelnej suite.
- `npm run check:production` przechodzi na live env przed publicznym release.
- E2E: umowy zaakceptowane -> checkout test -> webhook -> kontrakt aktywny -> deliverable -> akceptacja -> payout.
- Negative: duplicate checkout, unsigned webhook, replay webhooka, brak auth, obcy origin.

### PR 2 - P0/P1 Stripe hardening

Cel: utwardzic obecny pilotowy model, bez migracji architektonicznej w tym samym PR.

Zakres:

- Dodac test race/retry dla pending Checkout session reuse.
- Rozwazyc Stripe idempotency key przy tworzeniu checkout session lub DB constraint na aktywny pending payment per contract/milestone.
- Upewnic sie, ze dispute blokuje payout w kazdej sciezce release.
- Zweryfikowac refund flow i ledger dla partial/full refunds.
- Ujednolicic statusy: `awaiting_funding`, `active`, `delivered`, `released/completed`, `disputed`.
- Dopelnic testy dispute/refund/payout dla Stripe; bazowe logowanie krytycznych bledow Stripe do `error_logs` i Sentry server zostalo wdrozone w partii 6.

Testy akceptacyjne:

- Payout nie wykona sie bez `payments.status = completed`.
- Payout nie wykona sie przy `milestone.status != released`.
- Payout nie wykona sie przy dispute.
- Ponowne klikniecie platnosci zwraca otwarta sesje albo kontrolowany blad, bez duplikatu liability.
- Webhook duplicate/replay nie tworzy drugiego ledger entry.

### PR 3 - P1 Notifications, cron i observability

Cel: zadne krytyczne procesy nie przechodza cicho w tryb udawany.

Zakres:

- `RESEND_API_KEY` i `RESEND_FROM_EMAIL`: albo wymagane w production readiness, albo feature flag `EMAIL_DELIVERY_ENABLED=false` z wyraznym statusem.
- W produkcji brak dry-run HTTP 200 dla powiadomien, jesli email jest wymagany.
- Nie logowac adresow email w dry-run/bladach.
- Rozszerzac Sentry/error_logs o kolejne sciezki w miare wdrozen; bazowe capture dla Stripe, cron, Resend i storage zostalo wdrozone w partii 6.
- Sprawdzic wszystkie cron endpoints z `CRON_SECRET` i no-cache.

Testy akceptacyjne:

- Brak `RESEND_API_KEY` w produkcji blokuje check albo endpoint fail-closed.
- Nieautoryzowany cron = 401.
- Prawidlowy cron uruchamia `processPendingStripeEvents` i `auto_accept_due_milestones_v2`.
- Logi nie zawieraja email/PESEL/stack trace w odpowiedzi HTTP.

### PR 4 - P1 API contracts i walidacja runtime

Cel: zamknac niespojnosc route handlerow.

Zakres:

- Centralny helper odpowiedzi API po polsku.
- Zod schemas dla `create-checkout`, `verify-payment`, `notifications webhook`, `storage upload/download`, export params.
- UUID validation jako reusable helper.
- Maksymalne rozmiary payloadow i uploadow potwierdzone server-side.
- Origin/CSRF checks dla wszystkich mutacji cookie-auth, poza webhookami z podpisem/sekretem.

Testy akceptacyjne:

- Brak auth = polski 401.
- Obcy Origin = polski 403.
- Brak Origin w produkcji dla cookie-auth mutation = polski 403.
- Zly UUID = polski 400.
- Oversized/malicious upload = polski 400/413.
- Webhook Stripe nadal dziala bez Origin, tylko z poprawnym podpisem Stripe.

### PR 5 - P1 Legal/compliance i dokumenty

Cel: usunac ryzyka prawne przed realnymi transakcjami.

Zakres:

- Dane platformy w umowach z konfiguracji, bez `0000000000` i `ul. Przykladowa 1`.
- Readiness check blokuje platnosci produkcyjne, jesli dane spółki sa placeholderem.
- Zweryfikowac zapis IP/timestamp dla akceptacji umow A/B.
- Uporzadkowac copy w legal clauses po decyzji ADR platnosci.
- `invoices-zip`: faktyczny ZIP z PDF i manifestem CSV wdrozony w partii 10; po stabilizacji mozna dodac test pozytywny z admin fixture.
- PIT/faktury: potwierdzic service-role-only finance RPC i eksporty admin-only.

Testy akceptacyjne:

- Nowy kontrakt ma contract A i B z realnymi danymi podmiotu.
- Firma nie pobierze dokumentu cudzego kontraktu.
- Student nie pobierze dokumentu cudzej firmy.
- Admin export PIT/faktur wymaga admina.
- Readiness check lapie placeholder NIP/KRS/adres.

### PR 6 - P1/P2 Usuniecie mockow i AI slop

Cel: usunac elementy, ktore obnizaja wiarygodnosc produktu.

Zakres:

- Usunac production mock path z `PaymentModal`.
- Kontynuowac usuwanie production mock/test UI poza sciezka ofert; `Mock JobOffer object for ApplySheet`, testowy przycisk ponownego zgloszenia i publiczne copy `przykladowe opinie z pilotazu` zostaly zamkniete w partii 7.
- Pelny copy pass po polsku: polskie znaki, brak mieszanki "platnosc/wspolpraca", spojny ton B2B.
- Ujednolicic nazewnictwo `Student Impact` vs `Student2Work`.

Testy akceptacyjne:

- `rg -n "mock|test\\)|Przykladowe|TODO Sprint|0000000000|Przykładowa|platnosc|wspolpraca" app lib` nie zwraca produkcyjnych trafien wymagajacych poprawy.
- Platnosc nie ma zadnej sciezki success bez Stripe/session/webhook w produkcji.
- Publiczne strony nie obiecuja funkcji, ktora nie istnieje.

### PR 7 - P2 Pelny UI polish i visual QA

Cel: dopracowac doswiadczenie uzytkownika po zabezpieczeniu logiki.

Zakres ekranow:

- Landing.
- Auth.
- Onboarding student/firma.
- Katalog pakietow Quick Task.
- Order flow.
- Deliverables.
- Chat.
- Profile.
- Finanse.
- Dokumenty.
- Admin.

Zakres jakosci:

- Mobile + desktop.
- Brak console errors.
- Brak overlayow Next.
- Brak nachodzacego tekstu.
- Loading/error/empty states.
- Dostepnosc labeli i focus states.
- Spójne komponenty shadcn/Tailwind.

Testy akceptacyjne:

- Screenshot QA dla kazdego kluczowego ekranu w desktop i mobile.
- `/auth` checkbox label/helper nie lacza sie w jeden tekst.
- Brak poziomego content overflow poza dekoracjami.
- Formularze maja czytelne validation errors po polsku.
- Krytyczne akcje maja toast/loading/disabled state.

### PR 8 - P2 Performance i typy

Cel: zoptymalizowac po zamknieciu blockerow biznesowych.

Zakres:

- Zidentyfikowac N+1 w panelach admin/company/student.
- Indeksy pod najciezsze zapytania i RLS predicates.
- Cache tylko dla danych publicznych.
- Ograniczyc client components tam, gdzie nie sa potrzebne.
- Bundle analysis i redukcja importow UI/icons.
- Usunac produkcyjne `any`; zostawic tylko uzasadnione typy zewnetrzne.

Testy akceptacyjne:

- `npm run lint`, `npx tsc --noEmit`, `npm run build`.
- Zmierzone przed/po dla najciezszych stron.
- Brak cache prywatnych danych.
- RLS nadal przechodzi readiness check.

## Wdrozone w partii 16

Zakres: aktywne Server Actions uslug i negocjacji w `app/app/services/_actions.ts`.

Zmiany:

- Dodano schematy Zod dla pakietow uslug, prywatnych propozycji, wycen, kontrofert i wyboru studenta.
- Usunieto zapis surowego `...data` z `createServiceAction`/`updateServiceAction`; serwer zapisuje tylko dopuszczone pola.
- Zablokowano client-side override pol systemowych pakietu: `student_id`, `is_system`, `commission_rate`, dowolny `status`.
- Dodano role guardy `student`/`company` dla tworzenia/edycji/usuwania uslug, ofert, kontrofert, wyboru studenta i potwierdzania realizacji.
- Dodano status guardy dla negocjacji: `inquiry/pending -> proposal_sent`, `proposal_sent -> accepted/countered`, `countered -> accepted`, `pending_selection/pending -> pending_student_confirmation`.
- Update'y statusow sprawdzaja zwrocony wiersz po `.in("status", ...)`, co ogranicza race condition i falszywe sukcesy.
- Akcje akceptacji/potwierdzenia sprawdzaja blad RPC `ensure_contract_for_service_order`.

Testy:

- `npm.cmd run lint` - OK.
- `npx.cmd tsc --noEmit` - OK.
- `npm.cmd run build` - OK.
- `git diff --check -- app/app/services/_actions.ts` - OK, tylko Windows LF->CRLF warning.
- `npm.cmd run test:mvp-scenarios` przy lokalnym `next start` - 26/28 OK; pozostale 2 fail sa znane i zewnetrzne: Stripe account studenta niegotowy do transferow oraz brak testowych credentiali UI.

## Wdrozone w partii 17

Zakres: aktywny flow Quick Task/company packages w `app/app/company/packages/_actions.ts`.

Zmiany:

- Dodano Zod validation dla `packageId`, `offerId` i pol briefu z `FormData`.
- Backend filtruje dynamiczne odpowiedzi `q_*` do `form_schema` pakietu i odrzuca oversized/nieprawidlowe select/radio/url/email.
- `materialsLink` musi uzywac HTTPS, a pola briefu maja limity dlugosci.
- Cena zamowienia pozostaje wyliczana z DB/wariantu pakietu; dodano guard dodatniej/skonczonej kwoty.
- Dotkniete sciezki nie zwracaja juz angielskiego `Unauthorized`, `Package not found` ani surowych bledow DB.
- `updateCustomizedOffer` zapisuje tylko oferte nalezaca do aktualnej firmy przez dodatkowe `.eq("company_id", user.id)`.

Testy:

- `npm.cmd run lint` - OK.
- `npx.cmd tsc --noEmit` - OK.
- `npm.cmd run build` - OK.
- `git diff --check -- app/app/company/packages/_actions.ts` - OK, tylko Windows LF->CRLF warning.
- `npm.cmd run test:mvp-scenarios` przy lokalnym `next start` - 26/28 OK; pozostale 2 fail sa znane i zewnetrzne: Stripe account studenta niegotowy do transferow oraz brak testowych credentiali UI.

## Wdrozone w partii 18

Zakres: aktywne Server Actions studenta dla aplikacji, negocjacji i propozycji z czatu w `app/app/applications/_actions.ts`.

Zmiany:

- Dodano Zod validation dla `applicationId`, `offerId`, `conversationId`, kwoty propozycji i wiadomosci.
- Akceptacja propozycji/kontroferty uzywa atomicznego update'u z `student_id` oraz dozwolonym statusem startowym; blad `ensure_contract_for_application` jest sprawdzany.
- Odrzucenie, nowa stawka i wycofanie aplikacji sprawdzaja zwrocony wiersz po `.in("status", ...)`, zeby race condition nie wygladal jak sukces.
- `submitQuoteProposal` sprawdza ownership rozmowy studenta, zgodnosc `conversation.offer_id` z przekazanym `offerId`, dozwolony status istniejacej aplikacji oraz autoryzowane powiazanie rozmowy z aplikacja.
- Kwoty nie sa juz przepuszczane surowo z klienta: musza byc skonczone, dodatnie, w limicie 100 000 i zaokraglone do dwoch miejsc.
- Dotkniete sciezki nie zwracaja juz surowych `error.message` z Supabase ani angielskich komunikatow uzytkownikowi.

Testy:

- `npm.cmd run lint` - OK.
- `npx.cmd tsc --noEmit` - OK.
- `npm.cmd run build` - OK.
- `npm.cmd audit --omit=dev --audit-level=moderate` - OK, 0 podatnosci.
- `git diff --check -- app/app/applications/_actions.ts` - OK, tylko Windows LF->CRLF warning.
- `npm.cmd run check:preview` przy lokalnym `next start` - FAIL tylko na znanych blokadach preview: `NEXT_PUBLIC_APP_URL` nie uzywa HTTPS oraz brak aktywnego webhooka Stripe dla `http://localhost:3000/api/stripe/webhook`; HTTP smoke w checku przechodzi.
- `npm.cmd run test:mvp-scenarios` przy lokalnym `next start` - 26/28 OK; pozostale 2 fail sa znane i zewnetrzne: Stripe account studenta niegotowy do transferow oraz brak testowych credentiali UI.

## Wdrozone w partii 19

Zakres: pierwsza grupa krytycznych Server Actions realizacji i milestone flow w `app/app/deliverables/_actions.ts`.

Zmiany:

- Dodano Zod validation dla UUID, signed URL, decyzji akceptacji/odrzucenia, opisow, komentarzy opinii, payloadu plikow, materialow i sekretow.
- `getSignedStorageUrl` i `getContractDocumentSignedUrl` waliduja bucket, identyfikator dokumentu, sciezke i czas wygasania; nie opieraja sie juz na runtime castach do typow storage.
- `submitDeliverable` oraz `submitMilestoneWorkAction` sprawdzaja source ownership, role studenta i powiazanie milestone ze zleceniem przed RPC.
- `reviewDeliverable`, `reviewMilestoneAction`, `fundMilestoneAction` i `fundContractAction` sprawdzaja role firmy oraz linkage `contract/milestone -> application/service_order`, zanim zmieniaja status albo wywoluja RPC finansowe.
- `addResource`/`deleteResource` i `addSecret`/`deleteSecret` sprawdzaja przynaleznosc rekordu do wskazanego zlecenia oraz usuwaja atomicznie po `uploader_id`/`author_id`.
- `addSecret` wspiera teraz `service_order_id`, zgodnie z tym, jak strona deliverables czyta sekrety dla service orders.
- Dotkniete sciezki nie zwracaja juz surowych `error.message` z Supabase/RPC.

Testy:

- `npm.cmd run lint` - OK.
- `npx.cmd tsc --noEmit` - OK.
- `npm.cmd run build` - OK.
- `npm.cmd audit --omit=dev --audit-level=moderate` - OK, 0 podatnosci.
- `git diff --check -- app/app/deliverables/_actions.ts` - OK, tylko Windows LF->CRLF warning.
- `npm.cmd run check:preview` przy lokalnym `next start` - FAIL tylko na znanych blokadach preview: `NEXT_PUBLIC_APP_URL` nie uzywa HTTPS oraz brak aktywnego webhooka Stripe dla `http://localhost:3000/api/stripe/webhook`; HTTP smoke w checku przechodzi.
- `npm.cmd run test:mvp-scenarios` przy lokalnym `next start` - 26/28 OK; pozostale 2 fail sa znane i zewnetrzne: Stripe account studenta niegotowy do transferow oraz brak testowych credentiali UI.

## Wdrozone w partii 20

Zakres: generowanie, akceptacja i cofanie dokumentow kontraktowych w `app/app/deliverables/_actions.ts`.

Zmiany:

- Usunieto nieuzywana akcje `generateContract`, ktora tworzyla legacy tekstowy plik umowy i zapisywala go jako material projektu.
- Usunieto martwy kod PDF po wczesnym `return` w `generateContractDocuments`; aktywna jest jedna sciezka przez `generateContractDocumentsInternal`.
- Dodano `assertContractMatchesSource`, ktory potwierdza linkage `contractId -> application_id/service_order_id` i role strony kontraktu albo admina.
- `generateContractDocuments`, `generateContractDocumentsForAdmin`, `acceptContractDocument` i `reopenMilestoneNegotiationAction` waliduja UUID runtime.
- Akceptacja dokumentu wymusza poprawny typ dokumentu: firma podpisuje `contract_a`, student podpisuje `contract_b`.
- Reopen negocjacji etapow usuwa niezaakceptowane dokumenty dopiero po potwierdzeniu linkage i roli uczestnika.
- Dotkniete sciezki nie doklejaja juz surowych `error.message` z Supabase/Storage do komunikatow uzytkownika.

Testy:

- `npm.cmd run lint` - OK.
- `npx.cmd tsc --noEmit` - OK.
- `npm.cmd run build` - OK.
- `npm.cmd audit --omit=dev --audit-level=moderate` - OK, 0 podatnosci.
- `git diff --check -- app/app/deliverables/_actions.ts` - OK, tylko Windows LF->CRLF warning.
- `npm.cmd run check:preview` przy lokalnym `next start` - FAIL tylko na znanych blokadach preview: `NEXT_PUBLIC_APP_URL` nie uzywa HTTPS oraz brak aktywnego webhooka Stripe dla `http://localhost:3000/api/stripe/webhook`; HTTP smoke w checku przechodzi.
- `npm.cmd run test:mvp-scenarios` przy lokalnym `next start` - 26/28 OK; pozostale 2 fail sa znane i zewnetrzne: Stripe account studenta niegotowy do transferow oraz brak testowych credentiali UI.

## Wdrozone w partii 21

Zakres: admin Legal Vault server actions w `app/app/admin/vault/_actions.ts`.

Zmiany:

- `getContractDocuments` waliduje `contractId` przez `uuidSchema`, zanim filtruje `contract_documents`.
- `repairSingleContractPdf` waliduje `contractId` przed generowaniem PDF, rewalidacja cache i redirectem do szczegolow kontraktu.
- Nieprawidlowy `contractId` konczy sie kontrolowanym redirectem z polskim komunikatem zamiast dalszego wykonywania akcji.
- Blad naprawy PDF nie trafia juz do UI jako surowe `error.message`; szczegoly sa logowane server-side, a query param dostaje staly bezpieczny komunikat.
- Redirect bledu uzywa `URLSearchParams`, zeby ograniczyc reczne skladanie parametrow w admin action.

Testy:

- `npm.cmd run lint` - OK.
- `npx.cmd tsc --noEmit` - OK.
- `npm.cmd run build` - OK.
- `npm.cmd audit --omit=dev --audit-level=moderate` - OK, 0 podatnosci po ponowieniu z dostepem sieciowym.
- `git diff --check -- app/app/admin/vault/_actions.ts` - OK, tylko Windows LF->CRLF warning.
- `npm.cmd run check:preview` przy lokalnym `next start` - FAIL tylko na znanych blokadach preview: `NEXT_PUBLIC_APP_URL` nie uzywa HTTPS oraz brak aktywnego webhooka Stripe dla `http://localhost:3000/api/stripe/webhook`; HTTP smoke w checku przechodzi.
- `npm.cmd run test:mvp-scenarios` przy lokalnym `next start` - 26/28 OK; pozostale 2 fail sa znane i zewnetrzne: Stripe account studenta niegotowy do transferow oraz brak testowych credentiali UI.

## Wdrozone w partii 22

Zakres: adminowe akcje ofert w `app/app/admin/offers/_actions.ts`.

Zmiany:

- `deleteOfferAction`, `closeOfferAction` i `updateOfferCommissionAction` waliduja `offerId` przez `uuidSchema`.
- Helper admin auth zwraca staly komunikat `Brak uprawnien administratora` zamiast surowego `error.message`.
- Kasowanie oferty nie ignoruje juz bledow na lookup/delete aplikacji, rozmow i wiadomosci.
- Mutacje nie zwracaja juz surowych `error.message` z Supabase do UI.
- Komunikat prowizji uwzglednia faktycznie dostepna stawke 25%.

Testy:

- `npm.cmd run lint` - OK.
- `npx.cmd tsc --noEmit` - OK.
- `npm.cmd run build` - OK.
- `npm.cmd audit --omit=dev --audit-level=moderate` - OK, 0 podatnosci po ponowieniu z dostepem sieciowym.
- `git diff --check -- app/app/admin/offers/_actions.ts app/app/admin/vault/_actions.ts` - OK, tylko Windows LF->CRLF warning.
- `npm.cmd run check:preview` przy lokalnym `next start` - FAIL tylko na znanych blokadach preview: `NEXT_PUBLIC_APP_URL` nie uzywa HTTPS oraz brak aktywnego webhooka Stripe dla `http://localhost:3000/api/stripe/webhook`; HTTP smoke w checku przechodzi.
- `npm.cmd run test:mvp-scenarios` przy lokalnym `next start` - 26/28 OK; pozostale 2 fail sa znane i zewnetrzne: Stripe account studenta niegotowy do transferow oraz brak testowych credentiali UI.

## Wdrozone w partii 23

Zakres: admin payout actions w `app/app/admin/payouts/_actions.ts`.

Zmiany:

- `markPayoutProcessing` i `markPayoutPaid` waliduja `payoutId` przez `uuidSchema`.
- Status `processing` potwierdza realnie zaktualizowany rekord z `pending`; brak zmiany zwraca kontrolowany blad domenowy.
- Mutacje payoutow loguja bledy Supabase/RPC/Stripe server-side, ale UI nie dostaje juz surowego `error.message`.
- `markPayoutPaid` przekazuje zwalidowane `safePayoutId` do transferu Stripe i `process_payout_paid_v1`.
- `getPayouts` ma allowliste filtrow statusu i omija puste zapytanie `.in("user_id", [])`.

Testy:

- `npm.cmd run lint` - OK.
- `npx.cmd tsc --noEmit` - OK.
- `npm.cmd run build` - OK.
- `npm.cmd audit --omit=dev --audit-level=moderate` - OK, 0 podatnosci po ponowieniu z dostepem sieciowym.
- `git diff --check -- app/app/admin/payouts/_actions.ts` - OK, tylko Windows LF->CRLF warning.
- `npm.cmd run check:preview` przy lokalnym `next start` - FAIL tylko na znanych blokadach preview: `NEXT_PUBLIC_APP_URL` nie uzywa HTTPS oraz brak aktywnego webhooka Stripe dla `http://localhost:3000/api/stripe/webhook`; HTTP smoke w checku przechodzi.
- `npm.cmd run test:mvp-scenarios` przy lokalnym `next start` - 26/28 OK; pozostale 2 fail sa znane i zewnetrzne: Stripe account studenta niegotowy do transferow oraz brak testowych credentiali UI.

## Wdrozone w partii 24

Zakres: admin PIT actions w `app/app/admin/pit/_actions.ts`.

Zmiany:

- `markPitPaid` waliduje `withholdingId` przez `uuidSchema`.
- `markPitBatchPaid` deduplikuje identyfikatory i waliduje batch przez Zod array schema.
- Batch PIT ma limit 200 rekordow i nie wywoluje `.in("id", [])`.
- Bledy Supabase sa logowane server-side, ale UI dostaje staly polski komunikat zamiast surowego `error.message`.

Testy:

- `npm.cmd run lint` - OK.
- `npx.cmd tsc --noEmit` - OK.
- `npm.cmd run build` - OK.
- `npm.cmd audit --omit=dev --audit-level=moderate` - OK, 0 podatnosci po ponowieniu z dostepem sieciowym.
- `git diff --check -- app/app/admin/pit/_actions.ts` - OK, tylko Windows LF->CRLF warning.
- `npm.cmd run check:preview` przy lokalnym `next start` - FAIL tylko na znanych blokadach preview: `NEXT_PUBLIC_APP_URL` nie uzywa HTTPS oraz brak aktywnego webhooka Stripe dla `http://localhost:3000/api/stripe/webhook`; HTTP smoke w checku przechodzi.
- `npm.cmd run test:mvp-scenarios` przy lokalnym `next start` - 26/28 OK; pozostale 2 fail sa znane i zewnetrzne: Stripe account studenta niegotowy do transferow oraz brak testowych credentiali UI.

## Wdrozone w partii 25

Zakres: admin system services actions w `app/app/admin/system-services/_actions.ts`.

Zmiany:

- `updateSystemService`, `deleteSystemService`, `updateSystemServiceCommission` i `updateSystemServiceStatus` waliduja ID przez `uuidSchema`.
- `updateSystemServiceStatus` waliduje runtime status przez Zod enum `active | inactive`.
- Update/delete/prowizja/status ograniczaja mutacje do `type = platform_service` i potwierdzaja realnie zmieniony rekord.
- Bledy Supabase sa logowane server-side, ale UI nie dostaje surowego `error.message`.
- Edytory prowizji/statusu zachowuja stabilny kontrakt: sukces zwraca `{ success: true, error: null }`.
- Komunikat prowizji uwzglednia faktyczna opcje 25%.

Testy:

- `npm.cmd run lint` - OK.
- `npx.cmd tsc --noEmit` - OK.
- `npm.cmd run build` - OK.
- `npm.cmd audit --omit=dev --audit-level=moderate` - OK, 0 podatnosci po ponowieniu z dostepem sieciowym.
- `git diff --check -- app/app/admin/system-services/_actions.ts` - OK, tylko Windows LF->CRLF warning.
- `npm.cmd run check:preview` przy lokalnym `next start` - FAIL tylko na znanych blokadach preview: `NEXT_PUBLIC_APP_URL` nie uzywa HTTPS oraz brak aktywnego webhooka Stripe dla `http://localhost:3000/api/stripe/webhook`; HTTP smoke w checku przechodzi.
- `npm.cmd run test:mvp-scenarios` przy lokalnym `next start` - 26/28 OK; pozostale 2 fail sa znane i zewnetrzne: Stripe account studenta niegotowy do transferow oraz brak testowych credentiali UI.

## Wdrozone w partii 26

Zakres: aplikowanie na oferte w `app/app/offers/[id]/_actions.ts`.

Zmiany:

- `applyToOffer` waliduje `offerId`, `message`, `proposedStawka` i `cvUrl` przez Zod.
- Surowy `offerId` nie trafia juz do lookupow, insertu aplikacji, tworzenia rozmowy ani redirect URL.
- Proponowana stawka musi byc dodatnia i maksymalnie 500000 PLN.
- Wiadomosc aplikacyjna jest trimowana i limitowana do 5000 znakow.
- Lookup istniejacej aplikacji, rozmowy repair, lock-check i limit platform service obsluguja bledy Supabase.
- Insert aplikacji i zapis wiadomosci czatu nie zwracaja ani nie rzucaja surowego `error.message` do UI.
- CV nadal wymaga prywatnego storage ref i bucketu `cvs`, z dodatkowym limitem dlugosci inputu.

Testy:

- `npm.cmd run lint` - OK.
- `npx.cmd tsc --noEmit` - OK.
- `npm.cmd run build` - OK.
- `npm.cmd audit --omit=dev --audit-level=moderate` - OK, 0 podatnosci po ponowieniu z dostepem sieciowym.
- `git diff --check -- app/app/offers/[id]/_actions.ts` - OK, tylko Windows LF->CRLF warning.
- `npm.cmd run check:preview` przy lokalnym `next start` - FAIL tylko na znanych blokadach preview: `NEXT_PUBLIC_APP_URL` nie uzywa HTTPS oraz brak aktywnego webhooka Stripe dla `http://localhost:3000/api/stripe/webhook`; HTTP smoke w checku przechodzi.
- `npm.cmd run test:mvp-scenarios` przy lokalnym `next start` - 26/28 OK; pozostale 2 fail sa znane i zewnetrzne: Stripe account studenta niegotowy do transferow oraz brak testowych credentiali UI.

## Wdrozone w partii 27

Zakres: saved offers flow w `app/app/offers/[id]/saved-actions.ts`, `app/app/offers/[id]/save-button.tsx` i `app/app/saved/_actions.ts`.

Zmiany:

- `toggleSavedOffer` i `removeSavedOffer` waliduja `offerId` przez `uuidSchema`.
- Zapisanie oferty wymaga istniejacej oferty ze statusem `published`.
- Lookup istniejacego zapisu obsluguje blad Supabase zamiast mylic go z brakiem rekordu.
- Delete/upsert/remove nie zwracaja surowego `error.message`; szczegoly zostaja w logu serwera.
- `SaveButton` pokazuje toast bledu server action zamiast nieobsluzonego wyjatku.
- `revalidatePath` dla strony oferty uzywa zwalidowanego `safeOfferId`.

Testy:

- `npm.cmd run lint` - OK.
- `npx.cmd tsc --noEmit` - OK.
- `npm.cmd run build` - OK.
- `npm.cmd audit --omit=dev --audit-level=moderate` - OK, 0 podatnosci po ponowieniu z dostepem sieciowym.
- `git diff --check -- app/app/offers/[id]/saved-actions.ts app/app/offers/[id]/save-button.tsx app/app/saved/_actions.ts` - OK, tylko Windows LF->CRLF warning.
- `npm.cmd run check:preview` przy lokalnym `next start` - FAIL tylko na znanych blokadach preview: `NEXT_PUBLIC_APP_URL` nie uzywa HTTPS oraz brak aktywnego webhooka Stripe dla `http://localhost:3000/api/stripe/webhook`; HTTP smoke w checku przechodzi.
- `npm.cmd run test:mvp-scenarios` przy lokalnym `next start` - 26/28 OK; pozostale 2 fail sa znane i zewnetrzne: Stripe account studenta niegotowy do transferow oraz brak testowych credentiali UI.

## Wdrozone w partii 28

Zakres: strona zapisanych ofert w `app/app/saved/page.tsx`.

Zmiany:

- Query `q` jest trimowany i limitowany do 120 znakow.
- `typ` i `sort` maja allowlisty zamiast inline filtrow bez normalizacji.
- Blad lookupu profilu jest logowany i konczy sie redirectem do `/app`.
- Blad pobierania `saved_offers` jest logowany server-side, przy zachowaniu komunikatu bledu na stronie.
- Blad lookupu zablokowanych aplikacji jest logowany i nie jest traktowany jak poprawny pusty wynik.
- Filtr typu korzysta z juz zwalidowanego parametru.

Testy:

- `npm.cmd run lint` - OK.
- `npx.cmd tsc --noEmit` - OK.
- `npm.cmd run build` - OK.
- `npm.cmd audit --omit=dev --audit-level=moderate` - OK, 0 podatnosci po ponowieniu z dostepem sieciowym.
- `git diff --check -- app/app/saved/page.tsx app/app/offers/[id]/saved-actions.ts app/app/offers/[id]/save-button.tsx app/app/saved/_actions.ts` - OK, tylko Windows LF->CRLF warning.
- `npm.cmd run check:preview` przy lokalnym `next start` - FAIL tylko na znanych blokadach preview: `NEXT_PUBLIC_APP_URL` nie uzywa HTTPS oraz brak aktywnego webhooka Stripe dla `http://localhost:3000/api/stripe/webhook`; HTTP smoke w checku przechodzi.
- `npm.cmd run test:mvp-scenarios` przy lokalnym `next start` - 26/28 OK; pozostale 2 fail sa znane i zewnetrzne: Stripe account studenta niegotowy do transferow oraz brak testowych credentiali UI.

## Wdrozone w partii 29

Zakres: tworzenie ofert firmy w `app/app/company/jobs/new/_actions.ts`.

Zmiany:

- `createOffer` ma Zod schema dla wejscia z formularza: wymagane pola briefu, typ, kategoria, tryb pracy, model realizacji, opcjonalne pola tekstowe i lista technologii.
- Budzet mikrozlecenia, widełki wynagrodzenia i liczba dni realizacji sa parsowane server-side, maja limity i nie moga przyjac wartosci NaN/ujemnych/nieograniczonych.
- `commission_rate` nie moze byc nadpisany z klienta przy tworzeniu oferty firmy; prowizja jest wyliczana przez serwer z `resolveCommissionRate`.
- Bledy zapisu oferty do Supabase trafiaja do `logCriticalError`, a UI dostaje staly polski komunikat bez surowego `error.message`.
- Dotychczasowy redirect po sukcesie i zapis kolumn `offers` pozostaja bez zmiany.

Testy:

- `npm.cmd run lint` - OK.
- `npx.cmd tsc --noEmit` - OK.
- `npm.cmd run build` - OK.
- `npm.cmd audit --omit=dev --audit-level=moderate` - OK, 0 podatnosci po ponowieniu z dostepem sieciowym.
- `git diff --check -- app/app/company/jobs/new/_actions.ts` - OK, tylko Windows LF->CRLF warning.
- `npm.cmd run check:preview` przy lokalnym `next start` - FAIL tylko na znanych blokadach preview: `NEXT_PUBLIC_APP_URL` nie uzywa HTTPS oraz brak aktywnego webhooka Stripe dla `http://localhost:3000/api/stripe/webhook`; HTTP smoke w checku przechodzi.
- `npm.cmd run test:mvp-scenarios` przy lokalnym `next start` - 26/28 OK; pozostale 2 fail sa znane i zewnetrzne: Stripe account studenta niegotowy do transferow oraz brak testowych credentiali UI.

## Wdrozone w partii 30

Zakres: tworzenie wyzwan firmy w `app/app/company/challenges/new/_actions.ts`.

Zmiany:

- Awaria insertu wyzwania do `offers` jest logowana przez `logCriticalError`.
- Log zawiera bezpieczny kontekst (`budgetRange`, `budgetLabel`) bez tresci briefu i danych osoby kontaktowej.
- UI nie dostaje juz surowego `error.message` Supabase; zachowany jest kontrakt `{ success: false, error: string }`.
- Flow sukcesu, rewalidacje i redirect pozostaja bez zmian.

Testy:

- `npm.cmd run lint` - OK.
- `npx.cmd tsc --noEmit` - OK.
- `npm.cmd run build` - OK.
- `npm.cmd audit --omit=dev --audit-level=moderate` - OK, 0 podatnosci.
- `git diff --check -- app/app/company/challenges/new/_actions.ts app/app/company/jobs/new/_actions.ts` - OK, tylko Windows LF->CRLF warning.
- `npm.cmd run check:preview` przy lokalnym `next start` - FAIL tylko na znanych blokadach preview: `NEXT_PUBLIC_APP_URL` nie uzywa HTTPS oraz brak aktywnego webhooka Stripe dla `http://localhost:3000/api/stripe/webhook`; HTTP smoke w checku przechodzi.
- `npm.cmd run test:mvp-scenarios` przy lokalnym `next start` - 26/28 OK; pozostale 2 fail sa znane i zewnetrzne: Stripe account studenta niegotowy do transferow oraz brak testowych credentiali UI.

## Wdrozone w partii 31

Zakres: status i edycja ofert firmy w `app/app/company/offers/_actions.ts`.

Zmiany:

- `offerId` jest walidowany przez `uuidSchema`, a status przez Zod enum `published | in_progress | closed`.
- Blokady przed ponownym otwarciem/edycja oferty obsluguja bledy lookupow `applications` i `deliverables` zamiast traktowac je jak pusty wynik.
- Update statusu i update danych oferty potwierdzaja zwrocony wiersz przez `.select("id").maybeSingle()`.
- Surowe `error.message` Supabase zastapiono `logCriticalError` i stalymi komunikatami po polsku.
- Stawka w edycji oferty obsluguje pusty input jako `null`, przecinek dziesietny, dodatnia wartosc i limit 500000 PLN.
- `revalidatePath` publicznej oferty korzysta ze zwalidowanego `safeOfferId`.

Testy:

- `npm.cmd run lint` - OK.
- `npx.cmd tsc --noEmit` - OK.
- `npm.cmd run build` - OK.
- `npm.cmd audit --omit=dev --audit-level=moderate` - OK, 0 podatnosci.
- `git diff --check -- app/app/company/offers/_actions.ts` - OK, tylko Windows LF->CRLF warning.
- `npm.cmd run check:preview` przy lokalnym `next start` - FAIL tylko na znanych blokadach preview: `NEXT_PUBLIC_APP_URL` nie uzywa HTTPS oraz brak aktywnego webhooka Stripe dla `http://localhost:3000/api/stripe/webhook`; HTTP smoke w checku przechodzi.
- `npm.cmd run test:mvp-scenarios` przy lokalnym `next start` - 26/28 OK; pozostale 2 fail sa znane i zewnetrzne: Stripe account studenta niegotowy do transferow oraz brak testowych credentiali UI.

## Wdrozone w partii 32

Zakres: wejscia i lookupi czatu w `app/app/chat/_actions.ts`.

Zmiany:

- Dodano `parseChatUuid` dla identyfikatorow rozmowy, aplikacji i oferty z runtime guardem oraz `uuidSchema`.
- `getOlderMessages` waliduje UUID rozmowy, kursor daty i clampuje `pageSize` do 1-100 bez przypadku `NaN`.
- `openChatForApplication` nie zwraca juz `appErr?.message` z Supabase i uzywa `safeApplicationId` w lookupach oraz notyfikacjach.
- `openChatForOfferInquiry` rozroznia blad Supabase od braku profilu/oferty/rozmowy i loguje awarie przez `logCriticalError`.
- `validateParticipant` waliduje UUID rozmowy centralnie dla kolejnych akcji czatu, a realne bledy lookupu trafiaja do logu.
- Logi nie zawieraja tresci wiadomosci; tylko bezpieczne identyfikatory rozmowy/aplikacji/oferty.

Testy:

- `npm.cmd run lint` - OK.
- `npx.cmd tsc --noEmit` - OK.
- `npm.cmd run build` - OK.
- `npm.cmd audit --omit=dev --audit-level=moderate` - OK, 0 podatnosci.
- `git diff --check -- app/app/chat/_actions.ts` - OK, tylko Windows LF->CRLF warning.
- `npm.cmd run check:preview` przy lokalnym `next start` - FAIL tylko na znanych blokadach preview: `NEXT_PUBLIC_APP_URL` nie uzywa HTTPS oraz brak aktywnego webhooka Stripe dla `http://localhost:3000/api/stripe/webhook`; HTTP smoke w checku przechodzi.
- `npm.cmd run test:mvp-scenarios` przy lokalnym `next start` - 26/28 OK; pozostale 2 fail sa znane i zewnetrzne: Stripe account studenta niegotowy do transferow oraz brak testowych credentiali UI.

## Wdrozone w partii 33

Zakres: helper rozmow dla aplikacji i service orders w `lib/services/service-order-conversations.ts`.

Zmiany:

- `findConversationByColumn` nie ignoruje juz bledu `maybeSingle()` przy lookupu rozmowy.
- `ensureConversationForApplication` i `ensureConversationForServiceOrder` nie rzucaja juz surowego `error?.message` Supabase.
- `findConversationForServiceOrder` obsluguje bledy direct i fallback lookupow zamiast traktowac je jak brak rekordu.
- Obsluga race condition duplicate-key zostala zachowana.

Testy:

- `npm.cmd run lint` - OK.
- `npx.cmd tsc --noEmit` - OK.
- `npm.cmd run build` - OK.
- `npm.cmd audit --omit=dev --audit-level=moderate` - OK, 0 podatnosci.
- `git diff --check -- lib/services/service-order-conversations.ts app/app/chat/_actions.ts` - OK, tylko Windows LF->CRLF warning.
- `npm.cmd run check:preview` przy lokalnym `next start` - FAIL tylko na znanych blokadach preview: `NEXT_PUBLIC_APP_URL` nie uzywa HTTPS oraz brak aktywnego webhooka Stripe dla `http://localhost:3000/api/stripe/webhook`; HTTP smoke w checku przechodzi.
- `npm.cmd run test:mvp-scenarios` przy lokalnym `next start` - 26/28 OK; pozostale 2 fail sa znane i zewnetrzne: Stripe account studenta niegotowy do transferow oraz brak testowych credentiali UI.

## Wdrozone w partii 34

Zakres: zamykanie rozmow po odrzuceniu aplikacji w `lib/services/application-chat-closure.ts`.

Zmiany:

- `closeRejectedApplicationConversation` sprawdza bledy update rozmowy, zliczania komunikatow `offer_closed` i inserta komunikatu systemowego.
- `rejectCompetingApplicationsForOffer` nie propaguje juz surowych `error.message` Supabase przy lookupu aplikacji, update statusow ani anulowaniu kontraktow.
- Szczegoly techniczne awarii trafiaja do `logCriticalError`; UI/wywolujacy dostaje stale komunikaty po polsku.
- Zachowano istniejacy kontrakt funkcji i kolejnosc procesu akceptacji/odrzucenia aplikacji.

Testy:

- `rg -n "error\\.message|error\\?\\.message|throw new Error\\([^\\n]*message" lib/services/application-chat-closure.ts` - OK, brak wynikow.
- `npm.cmd run lint` - OK.
- `npx.cmd tsc --noEmit` - OK.
- `npm.cmd run build` - OK.
- `npm.cmd audit --omit=dev --audit-level=moderate` - OK, 0 podatnosci po ponowieniu z dostepem sieciowym.
- `git diff --check -- lib/services/application-chat-closure.ts` - OK, tylko Windows LF->CRLF warning.
- `npm.cmd run check:preview` przy lokalnym `next start` - FAIL tylko na znanych blokadach preview: `NEXT_PUBLIC_APP_URL` nie uzywa HTTPS oraz brak aktywnego webhooka Stripe dla `http://localhost:3000/api/stripe/webhook`; HTTP smoke w checku przechodzi.
- `npm.cmd run test:mvp-scenarios` przy lokalnym `next start` - 26/28 OK; pozostale 2 fail sa znane i zewnetrzne: Stripe account studenta niegotowy do transferow oraz brak testowych credentiali UI.

## Wdrozone w partii 35

Zakres: akcje aplikacji firmy w `app/app/company/applications/_actions.ts`.

Zmiany:

- `acceptApplication`, `rejectApplication` i `counterOffer` waliduja `applicationId` przez `uuidSchema` przed uzyciem w query/RPC/notyfikacjach.
- Surowe `error.message` Supabase zostaly zastapione logowaniem przez `logCriticalError` i stalymi komunikatami po polsku.
- `ensure_contract_for_application` po akceptacji aplikacji ma sprawdzany `error`; awaria nie jest juz cicho ignorowana.
- Lookup/update pozostalych zgloszen oraz lookup rozmowy do rewalidacji maja jawne error paths.
- Istniejacy kontrakt funkcji i publiczne endpointy nie zostaly zmienione.

Testy:

- `rg -n 'application_id: applicationId|\\.eq\\("id", applicationId\\)|\\.neq\\("id", applicationId\\)|p_application_id: applicationId|error\\.message|error\\?\\.message' app/app/company/applications/_actions.ts` - OK, brak wynikow dla niezwalidowanych query i raw error propagation.
- `npm.cmd run lint` - OK.
- `npx.cmd tsc --noEmit` - OK.
- `npm.cmd run build` - OK.
- `npm.cmd audit --omit=dev --audit-level=moderate` - OK, 0 podatnosci.
- `git diff --check -- app/app/company/applications/_actions.ts` - OK, tylko Windows LF->CRLF warning.
- `npm.cmd run check:preview` przy lokalnym `next start` - FAIL tylko na znanych blokadach preview: `NEXT_PUBLIC_APP_URL` nie uzywa HTTPS oraz brak aktywnego webhooka Stripe dla `http://localhost:3000/api/stripe/webhook`; HTTP smoke w checku przechodzi.
- `npm.cmd run test:mvp-scenarios` przy lokalnym `next start` - 26/28 OK; pozostale 2 fail sa znane i zewnetrzne: Stripe account studenta niegotowy do transferow oraz brak testowych credentiali UI.

## Wdrozone w partii 36

Zakres: legacy flow zamowien i inquiry w `app/app/orders/create/[packageId]/_actions.ts`.

Zmiany:

- Insert `service_orders` nie propaguje juz surowego `error.message`; szczegoly trafiaja do `logCriticalError`.
- Lookup profilu/pakietu/istniejacej rozmowy w create-order/inquiry ma jawne error paths.
- Dodano guard na nieprawidlowa cene pakietu/wariantu przed utworzeniem zamowienia.
- Inserty wiadomosci po utworzeniu zamowienia i w `startInquiry` sprawdzaja `error` zamiast ignorowac wynik.
- Publiczny kontrakt akcji i redirecty pozostaly bez zmiany.

Testy:

- `rg -n 'error\\.message|error\\?\\.message|Package not found|Unauthorized|Cannot start inquiry|Failed to create conversation' app/app/orders/create/[packageId]/_actions.ts` - OK, brak wynikow.
- `npm.cmd run lint` - OK.
- `npx.cmd tsc --noEmit` - OK.
- `npm.cmd run build` - OK.
- `npm.cmd audit --omit=dev --audit-level=moderate` - OK, 0 podatnosci.
- `git diff --check -- app/app/orders/create/[packageId]/_actions.ts` - OK, tylko Windows LF->CRLF warning.
- `npm.cmd run check:preview` przy lokalnym `next start` - FAIL tylko na znanych blokadach preview: `NEXT_PUBLIC_APP_URL` nie uzywa HTTPS oraz brak aktywnego webhooka Stripe dla `http://localhost:3000/api/stripe/webhook`; HTTP smoke w checku przechodzi.
- `npm.cmd run test:mvp-scenarios` przy lokalnym `next start` - 26/28 OK; pozostale 2 fail sa znane i zewnetrzne: Stripe account studenta niegotowy do transferow oraz brak testowych credentiali UI.

## Wdrozone w partii 37

Zakres: akcje powiadomien w `app/app/notifications/_actions.ts`.

Zmiany:

- `markNotificationRead` waliduje ID powiadomienia przez `uuidSchema`.
- `markNotificationRead` i `markAllNotificationsRead` loguja bledy Supabase przez `logCriticalError` i nie zwracaja raw `error.message`.
- `getRecentNotifications` clampuje limit do 1-50 i loguje blad pobierania przed zwroceniem pustej listy.
- IDOR guard `eq("user_id", user.id)` pozostaje bez zmiany.

Testy:

- `rg -n 'error\\.message|error\\?\\.message|\\.eq\\("id", id\\)|\\.limit\\(limit\\)' app/app/notifications/_actions.ts` - OK, brak wynikow.
- `npm.cmd run lint` - OK.
- `npx.cmd tsc --noEmit` - OK.
- `npm.cmd run build` - OK.
- `npm.cmd audit --omit=dev --audit-level=moderate` - OK, 0 podatnosci.
- `git diff --check -- app/app/notifications/_actions.ts` - OK, tylko Windows LF->CRLF warning.
- `npm.cmd run check:preview` przy lokalnym `next start` - FAIL tylko na znanych blokadach preview: `NEXT_PUBLIC_APP_URL` nie uzywa HTTPS oraz brak aktywnego webhooka Stripe dla `http://localhost:3000/api/stripe/webhook`; HTTP smoke w checku przechodzi.
- `npm.cmd run test:mvp-scenarios` przy lokalnym `next start` - 26/28 OK; pozostale 2 fail sa znane i zewnetrzne: Stripe account studenta niegotowy do transferow oraz brak testowych credentiali UI.

## Wdrozone w partii 38

Zakres: akcje pakietow uslug w `app/app/services/_actions.ts`.

Zmiany:

- Dodano `logServiceActionError` i obsluge bledow profilu w `assertUserRole`.
- `createOfferFromSystemPackage` i `createInquiryAction` waliduja `packageId` przez `uuidInputSchema`.
- Raw `error.message` w legacy offer/inquiry oraz CRUD pakietow uslug zastapiono logowaniem i stalymi komunikatami po polsku.
- Lookupi ownership w `deleteServiceAction`, `updateServiceAction` i `toggleServiceStatusAction` uzywaja `maybeSingle()` z jawnym error path.
- Insert notyfikacji w `createInquiryAction` jest logowany przy awarii, bez blokowania przejscia do rozmowy.

Testy:

- `rg -n 'offerErr\\.message|orderError\\.message|if \\(error\\) throw new Error\\(error\\.message\\)|console\\.error\\(' app/app/services/_actions.ts` - OK dla edytowanego zakresu; pozostale wyniki w pliku dotycza innych sciezek negocjacji do kolejnych partii.
- `npm.cmd run lint` - OK.
- `npx.cmd tsc --noEmit` - OK.
- `npm.cmd run build` - OK.
- `npm.cmd audit --omit=dev --audit-level=moderate` - OK, 0 podatnosci.
- `git diff --check -- app/app/services/_actions.ts` - OK, tylko Windows LF->CRLF warning.
- `npm.cmd run check:preview` przy lokalnym `next start` - FAIL tylko na znanych blokadach preview: `NEXT_PUBLIC_APP_URL` nie uzywa HTTPS oraz brak aktywnego webhooka Stripe dla `http://localhost:3000/api/stripe/webhook`; HTTP smoke w checku przechodzi.
- `npm.cmd run test:mvp-scenarios` przy lokalnym `next start` - 26/28 OK; pozostale 2 fail sa znane i zewnetrzne: Stripe account studenta niegotowy do transferow oraz brak testowych credentiali UI.

## Wdrozone w partii 39

Zakres: negocjacje `service_orders` w `app/app/services/_actions.ts`.

Zmiany:

- `createPrivateProposalAction` nie zwraca juz raw `insertError?.message`; bledy lookupu pakietu/firmy, inserta zlecenia i inserta wiadomosci trafiaja do `logCriticalError`.
- Inserty wiadomosci w quote/counter/accept/reject oraz potwierdzeniu wyboru studenta maja jawne error handling i logowanie.
- `acceptServiceProposalAction`, `acceptServiceCounterAction` i `confirmStudentSelectionAction` loguja awarie RPC `ensure_contract_for_service_order`.
- `selectCompanyOrderStudentAction` nie propaguje raw `lockError?.message` z RPC przypisania studenta i loguje awarie notyfikacji.
- Dodano wspolny helper `insertServiceOrderMessage` dla system message przy potwierdzeniu realizacji.

Testy:

- `rg -n 'insertError\\?\\.message|console\\.error\\(|lockError\\?\\.message|await supabase\\.from\\("messages"\\)\\.insert|await supabase\\.from\\("notifications"\\)\\.insert|contractError\\) throw' app/app/services/_actions.ts` - OK dla edytowanego zakresu; pozostale inserty maja przechwycony `error` i logowanie.
- `npm.cmd run lint` - OK.
- `npx.cmd tsc --noEmit` - OK.
- `npm.cmd run build` - OK.
- `npm.cmd audit --omit=dev --audit-level=moderate` - OK, 0 podatnosci po ponowieniu z dostepem sieciowym.
- `git diff --check` - OK, tylko Windows LF->CRLF warning.
- `npm.cmd run check:preview` przy lokalnym `next start` - FAIL tylko na znanych blokadach preview: `NEXT_PUBLIC_APP_URL` nie uzywa HTTPS oraz brak aktywnego webhooka Stripe dla `http://localhost:3000/api/stripe/webhook`; HTTP smoke w checku przechodzi.
- `npm.cmd run test:mvp-scenarios` przy lokalnym `next start` - 26/28 OK; pozostale 2 fail sa znane i zewnetrzne: Stripe account studenta niegotowy do transferow oraz brak testowych credentiali UI.

## Wdrozone w partii 40

Zakres: endpoint `app/api/stripe/verify-payment/route.ts`.

Zmiany:

- Lookup kontraktu i aplikacji ma jawne logowanie do `error_logs` z kontekstem Stripe session/contract/user.
- Usunieto `console.error` z endpointu; pozostaje `logCriticalError` jako sciezka technicznego logowania.
- Raw `rpcError.message`, `serviceOrderSyncError.message` i `targetApplicationError?.message` zastapiono stalymi komunikatami.
- Publiczny JSON endpointu pozostaje zgodny z `{ error: string }` i polskimi komunikatami.

Testy:

- `rg -n 'console\\.error|throw new Error\\([^\\n]*(rpcError|serviceOrderSyncError|targetApplicationError|contractLookupError)\\.(message|toString)|throw new Error\\([^\\n]*\\+|\\.message' app/api/stripe/verify-payment/route.ts` - OK, brak wynikow.
- `npm.cmd run lint` - OK.
- `npx.cmd tsc --noEmit` - OK.
- `npm.cmd run build` - OK.
- `npm.cmd audit --omit=dev --audit-level=moderate` - OK, 0 podatnosci po ponowieniu z dostepem sieciowym.
- `git diff --check -- app/api/stripe/verify-payment/route.ts` - OK, tylko Windows LF->CRLF warning.
- `npm.cmd run check:preview` przy lokalnym `next start` - FAIL tylko na znanych blokadach preview: `NEXT_PUBLIC_APP_URL` nie uzywa HTTPS oraz brak aktywnego webhooka Stripe dla `http://localhost:3000/api/stripe/webhook`; HTTP smoke w checku przechodzi.
- `npm.cmd run test:mvp-scenarios` przy lokalnym `next start` - 26/28 OK; pozostale 2 fail sa znane i zewnetrzne: Stripe account studenta niegotowy do transferow oraz brak testowych credentiali UI.

## Wdrozone w partii 41

Zakres: endpoint `app/api/stripe/create-checkout/route.ts`.

Zmiany:

- Dodano lokalny `logCheckoutError`, zeby kazdy blad techniczny mial spójny kontekst `contractId`, `stripeSessionId`, `userId` i kod bledu Supabase.
- Usunieto `console.error`/`console.warn` z endpointu `create-checkout`.
- Bledy lookupow kontraktu, service order, aplikacji, pakietu, dokumentow umow i pending payment sa logowane i zwracaja stale komunikaty po polsku.
- `PGRST116` dla braku rekordu jest traktowany jako kontrolowany blad walidacyjny 400/404, nie jako 500.
- Konflikt duplicate `payments` ma jawne error handling dla lookupu tej samej/pending sesji i wygasza nowo utworzona osierocona sesje.

Testy:

- `rg -n 'console\\.|throw new Error|paymentError\\.message|error\\.message|\\.message' app/api/stripe/create-checkout/route.ts` - OK; jedyne trafienie to `input.message` w helperze loggera.
- `npm.cmd run lint` - OK.
- `npx.cmd tsc --noEmit` - OK.
- `npm.cmd run build` - OK.
- `npm.cmd audit --omit=dev --audit-level=moderate` - OK, 0 podatnosci po ponowieniu z dostepem sieciowym.
- `git diff --check -- app/api/stripe/create-checkout/route.ts` - OK, tylko Windows LF->CRLF warning.
- `npm.cmd run check:preview` przy lokalnym `next start` - FAIL tylko na znanych blokadach preview: `NEXT_PUBLIC_APP_URL` nie uzywa HTTPS oraz brak aktywnego webhooka Stripe dla `http://localhost:3000/api/stripe/webhook`; HTTP smoke w checku przechodzi.
- `npm.cmd run test:mvp-scenarios` przy lokalnym `next start` - 26/28 OK; pozostale 2 fail sa znane i zewnetrzne: Stripe account studenta niegotowy do transferow oraz brak testowych credentiali UI.

## Wdrozone w partii 42

Zakres: endpoint `app/api/stripe/webhook/route.ts`.

Zmiany:

- Usunieto `console.error` z route handlera webhooka Stripe.
- Brak secretu, enqueue failure i inline processing failure nadal trafiaja do `logCriticalError`.
- Nieprawidlowy podpis webhooka zwraca staly polski 400 bez technicznego logowania do konsoli.
- Raw body i `stripe.webhooks.constructEvent` pozostaly bez zmian.

Testy:

- `rg -n 'console\\.|\\.message' app/api/stripe/webhook/route.ts` - OK, brak wynikow.
- `npm.cmd run lint` - OK.
- `npx.cmd tsc --noEmit` - OK.
- `npm.cmd run build` - OK.
- `npm.cmd audit --omit=dev --audit-level=moderate` - OK, 0 podatnosci po ponowieniu z dostepem sieciowym.
- `git diff --check -- app/api/stripe/webhook/route.ts` - OK, tylko Windows LF->CRLF warning.
- `npm.cmd run check:preview` przy lokalnym `next start` - FAIL tylko na znanych blokadach preview: `NEXT_PUBLIC_APP_URL` nie uzywa HTTPS oraz brak aktywnego webhooka Stripe dla `http://localhost:3000/api/stripe/webhook`; HTTP smoke w checku przechodzi, w tym unsigned webhook 400.
- `npm.cmd run test:mvp-scenarios` przy lokalnym `next start` - 26/28 OK; pozostale 2 fail sa znane i zewnetrzne: Stripe account studenta niegotowy do transferow oraz brak testowych credentiali UI.

## Wdrozone w partii 43

Zakres: cron route'y `process-stripe-events`, `auto-accept`, `cleanup-expired-sessions`.

Zmiany:

- Usunieto `console.error`/`console.warn` i raw `.message` z publicznych cron route'ow.
- `cleanup-expired-sessions` loguje brak `CRON_SECRET`, awarie update i catch globalny przez `logCriticalError`.
- `auto-accept` i `process-stripe-events` uzywaja istniejacego `logCriticalError` bez dublowania do konsoli.
- 401 dla braku poprawnego bearer secret pozostaje bez technicznego logowania.

Testy:

- `rg -n 'console\\.|\\.message' app/api/cron/process-stripe-events/route.ts app/api/cron/auto-accept/route.ts app/api/cron/cleanup-expired-sessions/route.ts` - OK, brak wynikow.
- `npm.cmd run lint` - OK.
- `npx.cmd tsc --noEmit` - OK.
- `npm.cmd run build` - OK.
- `npm.cmd audit --omit=dev --audit-level=moderate` - OK, 0 podatnosci po ponowieniu z dostepem sieciowym.
- `git diff --check -- app/api/cron/process-stripe-events/route.ts app/api/cron/auto-accept/route.ts app/api/cron/cleanup-expired-sessions/route.ts` - OK, tylko Windows LF->CRLF warning.
- `npm.cmd run check:preview` przy lokalnym `next start` - FAIL tylko na znanych blokadach preview: `NEXT_PUBLIC_APP_URL` nie uzywa HTTPS oraz brak aktywnego webhooka Stripe dla `http://localhost:3000/api/stripe/webhook`; HTTP smoke w checku przechodzi.
- `npm.cmd run test:mvp-scenarios` przy lokalnym `next start` - 26/28 OK; cron endpointy bez sekretu zwracaja 401, a pozostale 2 fail sa znane i zewnetrzne: Stripe account studenta niegotowy do transferow oraz brak testowych credentiali UI.

## Wdrozone w partii 44

Zakres: webhook powiadomien i wspolny helper notification RPC.

Zmiany:

- Usunieto `console.error`/`console.info` z `app/api/webhooks/notifications/route.ts`.
- `sendNotification` loguje awarie `create_notification` do `error_logs` i zwraca staly polski blad zamiast raw Supabase message.
- `trySendNotification` loguje nieblokujace awarie jako warning przez `logCriticalError`.
- Webhook zachowuje dotychczasowe polskie odpowiedzi i rate limiting.

Testy:

- `rg -n 'console\\.|error\\.message|userErr\\?\\.message|create_notification failed' app/api/webhooks/notifications/route.ts lib/notifications/server.ts` - OK, brak wynikow.
- `npm.cmd run lint` - OK.
- `npx.cmd tsc --noEmit` - OK.
- `npm.cmd run build` - OK.
- `npm.cmd audit --omit=dev --audit-level=moderate` - OK, 0 podatnosci po ponowieniu z dostepem sieciowym.
- `git diff --check -- app/api/webhooks/notifications/route.ts lib/notifications/server.ts` - OK, tylko Windows LF->CRLF warning.
- `npm.cmd run check:preview` przy lokalnym `next start` - FAIL tylko na znanych blokadach preview: `NEXT_PUBLIC_APP_URL` nie uzywa HTTPS oraz brak aktywnego webhooka Stripe dla `http://localhost:3000/api/stripe/webhook`; HTTP smoke w checku przechodzi.
- `npm.cmd run test:mvp-scenarios` przy lokalnym `next start` - 26/28 OK; notifications webhook bez sekretu zwraca 401, a pozostale 2 fail sa znane i zewnetrzne: Stripe account studenta niegotowy do transferow oraz brak testowych credentiali UI.

## Wdrozone w partii 45

Zakres: `lib/stripe/stripe-event-processor.ts`.

Zmiany:

- Dodano `LoggedStripeProcessorError`, `failStripeProcessor` i `processingErrorMessage`, aby oddzielic techniczny log od stabilnego `processing_error`.
- Raw Supabase/RPC `*.message` w enqueue, queue load, checkout payment processing, refundach i syncu konta Stripe zastapiono stabilnymi bledami oraz logowaniem do `error_logs`.
- Dodano error handling dla update'ow kolejki `stripe_events`: invalid payload, processed marker i failed retry metadata.
- Usunieto `console.error` z invoice generation path.
- Komunikaty walidacyjne metadanych Stripe nie zapisują juz session ID w `processing_error`.

Testy:

- `rg -n 'console\\.error|throw new Error\\(`|paymentStatusError\\.message|contractError\\.message|rpcError\\.message|serviceOrderSyncError\\.message|refundError\\.message|paymentError\\.message|error\\.message' lib/stripe/stripe-event-processor.ts` - OK; jedyne `.message` to stabilny `LoggedStripeProcessorError`.
- `npm.cmd run lint` - OK.
- `npx.cmd tsc --noEmit` - OK.
- `npm.cmd run build` - OK.
- `npm.cmd audit --omit=dev --audit-level=moderate` - OK, 0 podatnosci po ponowieniu z dostepem sieciowym.
- `git diff --check -- lib/stripe/stripe-event-processor.ts` - OK, tylko Windows LF->CRLF warning.
- `npm.cmd run check:preview` przy lokalnym `next start` - FAIL tylko na znanych blokadach preview: `NEXT_PUBLIC_APP_URL` nie uzywa HTTPS oraz brak aktywnego webhooka Stripe dla `http://localhost:3000/api/stripe/webhook`; HTTP smoke w checku przechodzi.
- `npm.cmd run test:mvp-scenarios` przy lokalnym `next start` - 26/28 OK; pozostale 2 fail sa znane i zewnetrzne: Stripe account studenta niegotowy do transferow oraz brak testowych credentiali UI.

## Wdrozone w partii 46

Zakres: `lib/stripe/payouts.ts` i `app/app/admin/payouts/_actions.ts`.

Zmiany:

- Dodano logowanie payoutow przez `logCriticalError` po stronie helpera i admin actions.
- Raw Supabase/Stripe `*.message` nie trafia juz do admin UI ani `stripe_transfer_error`; zachowano tylko bezpieczne komunikaty biznesowe.
- Sprawdzane sa bledy update'ow: `processing`, zapis `stripe_transfer_id` i zapis `stripe_transfer_error`.
- Fallback RPC `process_payout_paid_v1` uzywa kodu `PGRST202`, bez parsowania raw message.
- Usunieto `console.*` z admin payout actions.

Testy:

- `rg -n 'console\\.|error\\.message|\\.message\\?\\.includes|throw new Error\\([^\\n]*\\+|studentStripeError\\.message|rpcError\\?\\.message' lib/stripe/payouts.ts app/app/admin/payouts/_actions.ts` - OK; jedyne `.message` jest filtrowane przez whitelistę bezpiecznych komunikatow biznesowych.
- `npm.cmd run lint` - OK.
- `npx.cmd tsc --noEmit` - OK.
- `npm.cmd run build` - OK.
- `npm.cmd audit --omit=dev --audit-level=moderate` - OK, 0 podatnosci po ponowieniu z dostepem sieciowym.
- `git diff --check -- lib/stripe/payouts.ts app/app/admin/payouts/_actions.ts` - OK, tylko Windows LF->CRLF warning.
- `npm.cmd run check:preview` przy lokalnym `next start` - FAIL tylko na znanych blokadach preview: `NEXT_PUBLIC_APP_URL` nie uzywa HTTPS oraz brak aktywnego webhooka Stripe dla `http://localhost:3000/api/stripe/webhook`; HTTP smoke w checku przechodzi.
- `npm.cmd run test:mvp-scenarios` przy lokalnym `next start` - 26/28 OK; payout Stripe studenta nadal pending przez niegotowe konto Connect, a drugi znany blocker to brak testowych credentiali UI.

## Wdrozone w partii 47

Zakres: `lib/pdf/generate-invoice.ts`.

Zmiany:

- Dodano `LoggedInvoiceError`, `failInvoiceOperation` i `logInvoiceWarning`.
- Helpery upload/RPC/update/upsert nie rzucaja juz raw Supabase/Storage `*.message`.
- `generateCompanyInvoice` i `generateStudentInvoice` loguja awarie do `error_logs` zamiast `console.error`, zachowujac kontrakt `id | null`.
- Dodano jawne error paths dla lookupow kontraktu, firmy, studenta, auth usera, istniejacych faktur i dokumentow kontraktowych.
- Cleanup tymczasowych PDF-ow draftu loguje warning przy awarii i nie blokuje wystawionej faktury.

Testy:

- `rg -n 'console\\.|error\\.message|throw new Error\\(`|Upload PDF failed|Invoice RPC failed|Invoice update failed|Contract document upsert failed' lib/pdf/generate-invoice.ts` - OK, brak wynikow.
- `npm.cmd run lint` - OK.
- `npx.cmd tsc --noEmit` - OK.
- `npm.cmd run build` - OK.
- `npm.cmd audit --omit=dev --audit-level=moderate` - OK, 0 podatnosci po ponowieniu z dostepem sieciowym.
- `git diff --check -- lib/pdf/generate-invoice.ts` - OK, tylko Windows LF->CRLF warning.
- `npm.cmd run check:preview` przy lokalnym `next start` - FAIL tylko na znanych blokadach preview: `NEXT_PUBLIC_APP_URL` nie uzywa HTTPS oraz brak aktywnego webhooka Stripe dla `http://localhost:3000/api/stripe/webhook`; HTTP smoke w checku przechodzi.
- `npm.cmd run test:mvp-scenarios` przy lokalnym `next start` - 26/28 OK; dowod faktury firmy przechodzi, a pozostale 2 fail sa znane i zewnetrzne: Stripe account studenta niegotowy do transferow oraz brak testowych credentiali UI.

## Wdrozone w partii 48

Zakres: `app/app/deliverables/_actions.ts`.

Zmiany:

- Dodano `logDeliverableActionError` jako wspolny logger dla server actions deliverables.
- Nieblokujace skutki uboczne akceptacji milestone'a, czyli faktura studenta i automatyczny payout, trafiaja do `error_logs` jako warning zamiast do konsoli.
- Generowanie umow A/B loguje awarie pobrania etapow, guardu dokumentow, uploadu PDF, insertu `contract_documents` i zapisu `documents_generated_at`.
- Akceptacja dokumentow kontraktowych loguje awarie odczytu dokumentu oraz update'ow timestampow/IP po stronie dokumentu i kontraktu.
- Cofniecie negocjacji milestone'ow sprawdza i loguje bledy update'u `milestone_drafts` oraz kasowania niezaakceptowanych dokumentow.

Testy:

- `rg -n 'console\\.error|console\\.warn' app/app/deliverables/_actions.ts` - OK, brak wynikow.
- `npm.cmd run lint` - OK.
- `npx.cmd tsc --noEmit --pretty false` - OK.
- `npm.cmd run build` - OK.
- `npm.cmd audit --omit=dev --audit-level=moderate` - OK, 0 podatnosci.
- `git diff --check -- app/app/deliverables/_actions.ts AUDIT_FULL_CODEBASE_2026-06-26.md AUDIT_FIX_BACKLOG_2026-06-26.md` - OK dla pliku kodu, tylko Windows LF->CRLF warning; raporty sa untracked, sprawdzone osobno przez `rg -n '[ \t]+$'`.
- `npm.cmd run check:preview -- --env-file=.env.local` przy lokalnym `next start`, ponowione poza sandboxem z dostepem do Stripe/Supabase - FAIL tylko na znanych blokadach preview: `NEXT_PUBLIC_APP_URL` nie uzywa HTTPS oraz brak aktywnego webhooka Stripe dla `http://localhost:3000/api/stripe/webhook`; Supabase i HTTP smoke przechodza.
- `npm.cmd run test:mvp-scenarios -- --base-url=http://127.0.0.1:3000` przy lokalnym `next start`, ponowione poza sandboxem z dostepem do Stripe/Supabase - 26/28 OK; pozostale 2 fail to Stripe Connect account studenta pending oraz brak testowych credentiali UI.

## Wdrozone w partii 49

Zakres: `app/api/admin/export/pit-csv/route.ts`, `app/api/admin/export/invoices-zip/route.ts`, `app/app/admin/pit/_actions.ts`, `app/app/admin/exports/page.tsx`.

Zmiany:

- Eksport PIT CSV loguje do `error_logs` bledy weryfikacji admina, pobrania `pit_withholdings`, `student_profiles` i emaili z Supabase Auth.
- Eksport faktur ZIP loguje do `error_logs` bledy weryfikacji admina, query faktur oraz pobrania PDF z private bucket `deliverables`.
- Akcje PIT usuwaja `console.error`, zachowuja runtime walidacje UUID/batch i loguja awarie update'u z kontekstem.
- Panel eksportow nie pokazuje raw `error.message` w toastach i ma copy zgodne z faktycznym outputem ZIP.

Testy:

- `rg -n 'console\\.|error\\.message|\\.message\\?\\.|throw new Error\\([^\\n]*\\+' app/api/admin/export/pit-csv/route.ts app/api/admin/export/invoices-zip/route.ts app/app/admin/pit/_actions.ts app/app/admin/exports/page.tsx` - OK, brak wynikow.
- `npm.cmd run lint` - OK.
- `npx.cmd tsc --noEmit --pretty false` - OK.
- `npm.cmd run build` - OK.
- `npm.cmd audit --omit=dev --audit-level=moderate` - OK, 0 podatnosci po ponowieniu z dostepem sieciowym.
- `git diff --check -- app/api/admin/export/pit-csv/route.ts app/api/admin/export/invoices-zip/route.ts app/app/admin/pit/_actions.ts app/app/admin/exports/page.tsx` - OK, tylko Windows LF->CRLF warning.
- Supabase changelog sprawdzony dla breaking/storage/auth/RLS; brak zmian wymagajacych korekty obecnego uzycia `supabase-js`/Storage w tej partii.
- `npm.cmd run check:preview -- --env-file=.env.local` przy lokalnym `next start`, ponowione poza sandboxem z dostepem do Stripe/Supabase - FAIL tylko na znanych blokadach preview: `NEXT_PUBLIC_APP_URL` nie uzywa HTTPS oraz brak aktywnego webhooka Stripe dla `http://localhost:3000/api/stripe/webhook`; Supabase i HTTP smoke przechodza.
- `npm.cmd run test:mvp-scenarios -- --base-url=http://127.0.0.1:3000` przy lokalnym `next start`, ponowione poza sandboxem z dostepem do Stripe/Supabase - 26/28 OK; pozostale 2 fail to Stripe Connect account studenta pending oraz brak testowych credentiali UI.

## Wdrozone w partii 50

Zakres: `app/app/admin/vault/_actions.ts`, `app/app/admin/vault/page.tsx`.

Zmiany:

- Legal Vault server actions loguja awarie pobierania dokumentow, backfillu PDF i pojedynczej naprawy PDF do `error_logs`.
- Signed URL failures dla dokumentow w private bucket `deliverables` sa logowane jako warning zamiast cichego/raw error path.
- Strona Legal Vault nie pokazuje raw `error.message` i loguje bledy glownego query oraz pomocniczych summary query.
- Batch backfill zachowuje dotychczasowa semantyke czesciowego sukcesu, ale kazdy fail kontraktu zostawia wpis obserwowalnosci.

Testy:

- `rg -n 'console\\.|error\\.message|\\.message\\?\\.|throw new Error\\([^\\n]*\\+' app/app/admin/vault/_actions.ts app/app/admin/vault/page.tsx` - OK poza techniczna detekcja `NEXT_REDIRECT`.
- `npm.cmd run lint` - OK.
- `npx.cmd tsc --noEmit --pretty false` - OK.
- `npm.cmd run build` - OK.
- `npm.cmd audit --omit=dev --audit-level=moderate` - OK, 0 podatnosci po ponowieniu z dostepem sieciowym.
- `git diff --check -- app/app/admin/vault/_actions.ts app/app/admin/vault/page.tsx` - OK, tylko Windows LF->CRLF warning.
- Supabase changelog sprawdzony dla breaking/storage/auth/RLS; brak zmian wymagajacych korekty obecnego uzycia `supabase-js`/Storage w tej partii.
- `npm.cmd run check:preview -- --env-file=.env.local` przy lokalnym `next start`, ponowione poza sandboxem z dostepem do Stripe/Supabase - FAIL tylko na znanych blokadach preview: `NEXT_PUBLIC_APP_URL` nie uzywa HTTPS oraz brak aktywnego webhooka Stripe dla `http://localhost:3000/api/stripe/webhook`; Supabase i HTTP smoke przechodza.
- `npm.cmd run test:mvp-scenarios -- --base-url=http://127.0.0.1:3000` przy lokalnym `next start`, ponowione poza sandboxem z dostepem do Stripe/Supabase - 26/28 OK; pozostale 2 fail to Stripe Connect account studenta pending oraz brak testowych credentiali UI.

## Wdrozone w partii 51

Zakres: `app/api/storage/upload/route.ts`.

Zmiany:

- Dodano `UploadRequestError` i wspolny logger `logUploadRouteError`.
- Lookup roli, rozmowy, aplikacji i service order loguje awarie Supabase zamiast mylic je z brakiem dostepu.
- Storage upload failure trafia do `error_logs` bez `console.error` i bez raw `uploadError.message`.
- Nieoczekiwane wyjatki zwracaja stabilny polski 500, a kontrolowane odmowy zachowuja `{ error }` i wlasciwy status.

Testy:

- `rg -n 'console\\.|error\\.message|\\.message\\?\\.|throw new Error\\([^\\n]*\\+|logCriticalError\\(' app/api/storage/upload/route.ts` - OK; jedyne `error.message` to kontrolowany `UploadRequestError`.
- `npm.cmd run lint` - OK.
- `npx.cmd tsc --noEmit --pretty false` - OK.
- `npm.cmd run build` - OK.
- `npm.cmd audit --omit=dev --audit-level=moderate` - OK, 0 podatnosci.
- `git diff --check -- app/api/storage/upload/route.ts` - OK, tylko Windows LF->CRLF warning.
- Supabase changelog sprawdzony dla breaking/storage/auth/RLS; brak zmian wymagajacych korekty obecnego uzycia `supabase-js`/Storage w tej partii.
- `npm.cmd run check:preview -- --env-file=.env.local` przy lokalnym `next start`, ponowione poza sandboxem z dostepem do Stripe/Supabase - FAIL tylko na znanych blokadach preview: `NEXT_PUBLIC_APP_URL` nie uzywa HTTPS oraz brak aktywnego webhooka Stripe dla `http://localhost:3000/api/stripe/webhook`; Supabase i HTTP smoke przechodza.
- `npm.cmd run test:mvp-scenarios -- --base-url=http://127.0.0.1:3000` przy lokalnym `next start`, ponowione poza sandboxem z dostepem do Stripe/Supabase - 26/28 OK; upload bez auth nadal zwraca 403, a pozostale 2 fail to Stripe Connect account studenta pending oraz brak testowych credentiali UI.

## Wdrozone w partii 52

Zakres: `app/api/stripe/connect/onboarding/route.ts`.

Zmiany:

- Dodano `logStripeConnectOnboardingError` i source codes dla awarii auth/profile/student profile oraz operacji Stripe Connect.
- Lookupi Supabase nie ignoruja juz `error`; trasa zwraca stabilne polskie `{ error }` i zapisuje awarie do `error_logs`.
- Stripe account create/retrieve oraz tworzenie login/account link sa opakowane w kontrolowane bloki z observability.
- Aktualizacja `stripe_onboarding_completed_at` loguje fail jako warning zamiast cicho go pomijac.
- Pilotowy legacy Express path pozostaje bez zmiany kontraktu; migracja do Accounts v2 zostaje przy decyzji go-live/ADR.

Testy:

- Stripe Connect reference przeczytany; obecna zmiana nie ukrywa migracji modelu Connect.
- Supabase changelog sprawdzony dla breaking/auth/storage/RLS/supabase-js; brak zmian wymagajacych korekty obecnego uzycia w tej partii.
- `rg -n 'console\\.|error\\.message|\\.message\\?\\.|throw new Error\\([^\\n]*\\+|logCriticalError\\(' app/api/stripe/connect/onboarding/route.ts` - OK; jedyny wynik to helper `logCriticalError`.
- `npx.cmd tsc --noEmit --pretty false` - OK.
- `npm.cmd run lint` - OK.
- `npm.cmd run build` - OK.
- `npm.cmd audit --omit=dev --audit-level=moderate` - OK, 0 podatnosci.
- `git diff --check -- app/api/stripe/connect/onboarding/route.ts` - OK, tylko Windows LF->CRLF warning.
- `npm.cmd run check:preview -- --env-file=.env.local` przy lokalnym `next start`, ponowione poza sandboxem z dostepem do Stripe/Supabase - FAIL tylko na znanych blokadach preview: `NEXT_PUBLIC_APP_URL` nie uzywa HTTPS oraz brak aktywnego webhooka Stripe dla `http://localhost:3000/api/stripe/webhook`; onboarding bez auth zwraca 403.
- `npm.cmd run test:mvp-scenarios -- --base-url=http://127.0.0.1:3000` przy lokalnym `next start`, ponowione poza sandboxem z dostepem do Stripe/Supabase - 26/28 OK; onboarding bez auth nadal zwraca 403, a pozostale 2 fail to Stripe Connect account studenta pending oraz brak testowych credentiali UI.

## Wdrozone w partii 53

Zakres: `app/api/auth/verify-turnstile/route.ts`.

Zmiany:

- Dodano rate limit `auth` po IP przed wywolaniem Cloudflare Turnstile.
- Dodano `logTurnstileError` i source codes dla awarii konfiguracji, HTTP, JSON/schema oraz catch-all.
- Odpowiedz Cloudflare jest walidowana Zod zamiast rzutowania `as TurnstileResponse`.
- Usunieto `console.error`; bledy operacyjne trafiaja do `error_logs`, a klient dostaje stabilne polskie komunikaty.
- Kontekst logow nie zawiera tokenu CAPTCHA ani sekretu Turnstile.

Testy:

- Supabase changelog sprawdzony dla breaking/auth/storage/RLS/supabase-js; brak zmian wymagajacych korekty obecnego uzycia `error_logs` w tej partii.
- `rg -n 'console\\.|error\\.message|\\.message\\?\\.|throw new Error\\([^\\n]*\\+|logCriticalError\\(' app/api/auth/verify-turnstile/route.ts` - OK; jedyny wynik to helper `logCriticalError`.
- `npx.cmd tsc --noEmit --pretty false` - OK.
- `npm.cmd run lint` - OK.
- `npm.cmd run build` - OK.
- `npm.cmd audit --omit=dev --audit-level=moderate` - OK, 0 podatnosci.
- `git diff --check -- app/api/auth/verify-turnstile/route.ts` - OK, tylko Windows LF->CRLF warning.
- `npm.cmd run check:preview -- --env-file=.env.local` przy lokalnym `next start`, ponowione poza sandboxem z dostepem do Stripe/Supabase - FAIL tylko na znanych blokadach preview: `NEXT_PUBLIC_APP_URL` nie uzywa HTTPS oraz brak aktywnego webhooka Stripe dla `http://localhost:3000/api/stripe/webhook`.
- `npm.cmd run test:mvp-scenarios -- --base-url=http://127.0.0.1:3000` przy lokalnym `next start`, ponowione poza sandboxem z dostepem do Stripe/Supabase - 26/28 OK; `POST /api/auth/verify-turnstile` bez poprawnego Origin nadal zwraca 403, a pozostale 2 fail to Stripe Connect account studenta pending oraz brak testowych credentiali UI.

## Wdrozone w partii 54

Zakres: `app/app/onboarding/_actions.ts`, `lib/gus/whitelist-client.ts`.

Zmiany:

- Dodano `logOnboardingError` i source codes dla awarii auth/profile lookup, update profilu, missing profile i VAT lookup.
- `saveOnboardingProfile` nie ignoruje juz bledow Supabase auth/profile lookup.
- Update onboardingu potwierdza zaktualizowany wiersz przez `.select("user_id").maybeSingle()`.
- `fetchCeidgData` wymaga aktywnej sesji i nie zwraca raw exception z klienta VAT do UI.
- Klient Bialej Listy VAT nie loguje juz surowych bledow przez `console.error`; observability jest w Server Action.

Testy:

- Supabase changelog sprawdzony dla breaking/auth/storage/RLS/supabase-js; brak zmian wymagajacych korekty obecnego uzycia `supabase-js`/`error_logs` w tej partii.
- `rg -n 'console\\.|error\\.message|\\.message\\?\\.|throw new Error\\([^\\n]*\\+|logCriticalError\\(' app/app/onboarding/_actions.ts lib/gus/whitelist-client.ts` - OK; jedyny wynik to helper `logCriticalError`.
- `npx.cmd tsc --noEmit --pretty false` - OK.
- `npm.cmd run lint` - OK.
- `npm.cmd run build` - OK.
- `npm.cmd audit --omit=dev --audit-level=moderate` - OK, 0 podatnosci.
- `git diff --check -- app/app/onboarding/_actions.ts lib/gus/whitelist-client.ts` - OK, tylko Windows LF->CRLF warning.
- `npm.cmd run check:preview -- --env-file=.env.local` przy lokalnym `next start`, ponowione poza sandboxem z dostepem do Stripe/Supabase - FAIL tylko na znanych blokadach preview: `NEXT_PUBLIC_APP_URL` nie uzywa HTTPS oraz brak aktywnego webhooka Stripe dla `http://localhost:3000/api/stripe/webhook`.
- `npm.cmd run test:mvp-scenarios -- --base-url=http://127.0.0.1:3000` przy lokalnym `next start`, ponowione poza sandboxem z dostepem do Stripe/Supabase - 26/28 OK; pozostale 2 fail to Stripe Connect account studenta pending oraz brak testowych credentiali UI.

## Wdrozone w partii 55

Zakres: `app/app/offers/[id]/_actions.ts`.

Zmiany:

- Dodano `logApplyToOfferError` z source codes dla auth/profile/offer/application/conversation/platform count/message insert/contract create/conversation flow/unexpected.
- `supabase.auth.getUser()` i lookup profilu maja osobne obslugi bledow Supabase.
- Usunieto `console.error` z flow aplikowania; awarie trafiaja do `error_logs`.
- Fail auto-kontraktu platform service jest logowany jako warning bez psucia juz utworzonej aplikacji.
- Logi nie zawieraja tresci aplikacji ani CV; tylko bezpieczne identyfikatory i eventy.

Testy:

- Supabase changelog sprawdzony dla breaking/auth/storage/RLS/supabase-js; brak zmian wymagajacych korekty obecnego uzycia `supabase-js`/`error_logs` w tej partii.
- `rg -n 'console\\.|error\\.message|\\.message\\?\\.|throw new Error\\([^\\n]*\\+|logCriticalError\\(|logApplyToOfferError' app/app/offers/[id]/_actions.ts` - OK; brak `console.error`, wyniki to helper i jego wywolania.
- `npx.cmd tsc --noEmit --pretty false` - OK.
- `npm.cmd run lint` - OK.
- `npm.cmd run build` - OK.
- `npm.cmd audit --omit=dev --audit-level=moderate` - OK, 0 podatnosci.
- `git diff --check -- app/app/offers/[id]/_actions.ts` - OK, tylko Windows LF->CRLF warning.
- `npm.cmd run check:preview -- --env-file=.env.local` przy lokalnym `next start`, ponowione poza sandboxem z dostepem do Stripe/Supabase - FAIL tylko na znanych blokadach preview: `NEXT_PUBLIC_APP_URL` nie uzywa HTTPS oraz brak aktywnego webhooka Stripe dla `http://localhost:3000/api/stripe/webhook`.
- `npm.cmd run test:mvp-scenarios -- --base-url=http://127.0.0.1:3000` przy lokalnym `next start`, ponowione poza sandboxem z dostepem do Stripe/Supabase - 26/28 OK; pozostale 2 fail to Stripe Connect account studenta pending oraz brak testowych credentiali UI.

## Wdrozone w partii 56

Zakres: `app/app/offers/[id]/saved-actions.ts`, `app/app/saved/_actions.ts`, `app/app/applications/_actions.ts`, `lib/observability/saved-offers.ts`.

Zmiany:

- Dodano server-only helper `logSavedOfferError`.
- `toggleSavedOffer` loguje auth, lookup, delete i upsert failures do `error_logs`.
- `removeSavedOffer` ze strony zapisanych loguje auth/delete failures i zachowuje stabilny komunikat.
- `removeSavedOffer` z listy aplikacji nie ignoruje juz delete failure; loguje blad i konczy bez surowego wycieku.
- Logi zawieraja tylko `offerId` i `userId`.

Testy:

- Supabase changelog sprawdzony dla breaking/auth/storage/RLS/supabase-js; brak zmian wymagajacych korekty obecnego uzycia `supabase-js`/`error_logs` w tej partii.
- `rg -n 'console\\.|error\\.message|\\.message\\?\\.|throw new Error\\([^\\n]*\\+|logSavedOfferError|logCriticalError\\(' app/app/offers/[id]/saved-actions.ts app/app/saved/_actions.ts app/app/applications/_actions.ts lib/observability/saved-offers.ts` - OK; brak `console.error`, wyniki to helper i jego wywolania.
- `npx.cmd tsc --noEmit --pretty false` - OK.
- `npm.cmd run lint` - OK.
- `npm.cmd run build` - OK.
- `npm.cmd audit --omit=dev --audit-level=moderate` - OK, 0 podatnosci.
- `git diff --check -- app/app/offers/[id]/saved-actions.ts app/app/saved/_actions.ts app/app/applications/_actions.ts lib/observability/saved-offers.ts` - OK, tylko Windows LF->CRLF warning.
- `npm.cmd run check:preview -- --env-file=.env.local` przy lokalnym `next start`, ponowione poza sandboxem z dostepem do Stripe/Supabase - FAIL tylko na znanych blokadach preview: `NEXT_PUBLIC_APP_URL` nie uzywa HTTPS oraz brak aktywnego webhooka Stripe dla `http://localhost:3000/api/stripe/webhook`.
- `npm.cmd run test:mvp-scenarios -- --base-url=http://127.0.0.1:3000` przy lokalnym `next start`, ponowione poza sandboxem z dostepem do Stripe/Supabase - 26/28 OK; pozostale 2 fail to Stripe Connect account studenta pending oraz brak testowych credentiali UI.

## Wdrozone w partii 57

Zakres: `app/app/company/packages/_actions.ts`, `lib/observability/company-packages.ts`.

Zmiany:

- Dodano server-only helper `logCompanyPackageError`.
- Flow company packages usuwa `console.error` z tworzenia ofert, zamowien systemowych, student inquiry, private offer context i resetu katalogu.
- `resetServices` sprawdza blad delete i insert, loguje szczegoly do `error_logs` i zwraca stabilny polski komunikat.
- `createCustomizedOffer` loguje awarie logo/system order, student order, private offer context, conversation fallback oraz auto-assign lock z bezpiecznym kontekstem.
- `updateCustomizedOffer` nie zwraca juz raw `packageResponse.error.message` ani `updateError.message`; szczegoly trafiaja do observability.
- Sprawdzanie `service_orders_status_check` jest zamkniete w helperze `hasOperationalErrorMessage`, a publiczne komunikaty pozostaja stabilne.

Testy:

- Supabase changelog sprawdzony dla breaking/auth/storage/RLS/supabase-js; brak zmian wymagajacych korekty obecnego uzycia `supabase-js`/`error_logs` w tej partii.
- `rg -n 'console\\.error|console\\.warn|error\\.message|\\.message\\?\\.|throw new Error\\([^\\n]*message' app/app/company/packages/_actions.ts lib/observability/company-packages.ts` - OK; jedyne trafienie to kontrolowany komunikat Zod.
- `npx.cmd tsc --noEmit --pretty false` - OK.
- `npm.cmd run lint` - OK.
- `npm.cmd run build` - OK.
- `npm.cmd audit --omit=dev --audit-level=moderate` - OK, 0 podatnosci.
- `git diff --check -- app/app/company/packages/_actions.ts lib/observability/company-packages.ts` - OK, tylko Windows LF->CRLF warning.
- `npm.cmd run check:preview -- --env-file=.env.local` przy lokalnym `next start`, ponowione poza sandboxem z dostepem do Stripe/Supabase - FAIL tylko na znanych blokadach preview: `NEXT_PUBLIC_APP_URL` nie uzywa HTTPS oraz brak aktywnego webhooka Stripe dla `http://localhost:3000/api/stripe/webhook`.
- `npm.cmd run test:mvp-scenarios -- --base-url=http://127.0.0.1:3000` przy lokalnym `next start`, ponowione poza sandboxem z dostepem do Stripe/Supabase - 26/28 OK; pozostale 2 fail to Stripe Connect account studenta pending oraz brak testowych credentiali UI.

## Wdrozone w partii 58

Zakres: `app/app/chat/_actions.ts`.

Zmiany:

- Rozszerzono `logChatActionError` o `level`, `message`, `packageId`, `serviceOrderId` i `contractId`.
- `validateParticipant` nie rzuca juz angielskiego `Unauthorized`.
- `acceptRate` sprawdza bledy update'u aplikacji, RPC kontraktu, reloadu aplikacji, statusu oferty, lookup/update service order, RPC kontraktu service order i inserta wiadomosci akceptacji.
- Akceptacja stawki bez aplikacji albo pakietu jest blokowana, zamiast tworzyc mylacy event rozmowy.
- `reportProblem` nie polega juz na nieskutecznym `try/catch` dla Supabase SDK; sprawdza `{ error }` dla notatki, lookupu/update'u kontraktu i lookupu adminow.
- Brak adminow do powiadomienia o sporze oraz awarie best-effort sa logowane jako warning w `error_logs`, bez `console.error`.

Testy:

- Supabase changelog sprawdzony dla breaking/auth/storage/RLS/supabase-js; brak zmian wymagajacych korekty obecnego uzycia `supabase-js`/`error_logs` w tej partii.
- `rg -n 'console\\.|Unauthorized|No application' app/app/chat/_actions.ts` - OK, brak wynikow.
- `npx.cmd tsc --noEmit --pretty false` - OK.
- `npm.cmd run lint` - OK.
- `npm.cmd run build` - OK.
- `npm.cmd audit --omit=dev --audit-level=moderate` - OK, 0 podatnosci.
- `git diff --check -- app/app/chat/_actions.ts` - OK, tylko Windows LF->CRLF warning.
- `npm.cmd run check:preview -- --env-file=.env.local` przy lokalnym `next start`, ponowione poza sandboxem z dostepem do Stripe/Supabase - FAIL tylko na znanych blokadach preview: `NEXT_PUBLIC_APP_URL` nie uzywa HTTPS oraz brak aktywnego webhooka Stripe dla `http://localhost:3000/api/stripe/webhook`.
- `npm.cmd run test:mvp-scenarios -- --base-url=http://127.0.0.1:3000` przy lokalnym `next start`, ponowione poza sandboxem z dostepem do Stripe/Supabase - 26/28 OK; pozostale 2 fail to Stripe Connect account studenta pending oraz brak testowych credentiali UI.

## Release gate po wszystkich falach

Przed jakimkolwiek publicznym go-live:

- `npm audit --omit=dev --audit-level=moderate`
- `npm run lint`
- `npx tsc --noEmit`
- `npm run build`
- `npm run check:preview`
- `npm run test:mvp-scenarios`
- `npm run check:production` na live env
- UI visual QA desktop/mobile
- ADR platnosci podpisany
- Legal placeholders usuniete
- Produkcja bez mock payment path

Status do czasu przejscia powyzszych: `PRODUCTION NO-GO`.

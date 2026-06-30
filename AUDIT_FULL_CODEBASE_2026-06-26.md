# Pelny audyt codebase Student2Work - 2026-06-26

## Status wykonania

Pierwotny audyt wykonano lokalnie w repozytorium `Student-impact-antygraviti` bez zmian w kodzie aplikacji. Po baseline wdrozono partie poprawek 1-7, a ten raport pokazuje stan laczny: historyczne dowody, status zamknietych ryzyk i pozostale blokady release.

Aktualizacja po partii wdrozeniowej 1: rozpoczęto realizacje backlogu P0/P1. Utwardzono notification webhook, runtime validation dla Stripe checkout/verify, usunieto produkcyjny mock payment fallback z modala platnosci i poprawiono najbardziej ryzykowne copy "Escrow" w dotknietym flow modala na "Depozyt Student2Work". Szczegoly zmian i weryfikacja sa w `AUDIT_FIX_BACKLOG_2026-06-26.md`.

Aktualizacja po partii wdrozeniowej 2: dane prawne platformy dla umow i faktur zostaly przeniesione do server-only env `PLATFORM_LEGAL_*`, a production readiness/deploy checks blokuja placeholdery oraz brak konfiguracji Resend. Produkcja pozostaje `NO-GO`, ale brak realnych danych prawnych jest teraz egzekwowany automatycznie.

Aktualizacja po partii wdrozeniowej 3: ujednolicono publiczne bledy API/cron/storage/exportow na polskie komunikaty, dodano runtime walidacje Zod dla Turnstile, uporzadkowano `no-store` w cronach i downloadach dokumentow oraz usunieto techniczne copy z panelu eksportow. Publiczne endpointy pozostaly bez zmiany URL-i.

Aktualizacja po partii wdrozeniowej 4: dodano wspolne server-only helpery `noStoreJson`/`jsonError` i walidacje UUID/miesiaca w `lib/security`, a krytyczne endpointy Stripe/cron/storage/exportow zostaly przestawione na jeden wzorzec odpowiedzi. Procesor webhookow Stripe waliduje teraz `milestone_ids` przed przekazaniem ich do RPC.

Aktualizacja po partii wdrozeniowej 5: utwardzono Checkout przed duplikatami/race condition. Dodano migracje ograniczajaca aktywne `payments.status = 'pending'` do jednego rekordu per kontrakt, deterministyczny Stripe `idempotencyKey` dla tworzenia Checkout Session oraz fail-closed, gdy rekord `payments` nie zostanie zapisany. Supabase dry-run przeszedl, ale wykazal takze starsza oczekujaca migracje `20260623194500_audit_query_indexes.sql`, wiec realny push wymaga swiadomego objecia calej kolejki migracji.

Aktualizacja po partii wdrozeniowej 6: dodano centralne server-only logowanie operacyjne `lib/observability/error-log.ts`, forward migration `public.error_logs` z RLS/admin-only select oraz wpiecia dla Stripe checkout/verify/webhook, procesora `stripe_events`, cronow, Resend notification webhook i Supabase Storage upload. Logi sa sanitizowane pod PII/sekrety, a klient nadal dostaje polskie `{ error: string }` bez stack trace. Supabase dry-run przechodzi i pokazuje trzy oczekujace migracje: `20260623194500_audit_query_indexes.sql`, `20260627100000_harden_pending_checkout_singleton.sql`, `20260627101136_create_error_logs.sql`.

Aktualizacja po partii wdrozeniowej 7: usunieto produkcyjny mock/test slop z flow aplikowania na oferte. `ApplyCard` uzywa jawnego adaptera `toApplySheetOffer` zamiast `mockOffer`, sukces aplikacji nie pokazuje juz przycisku testowego do duplikowania zgloszenia, a server action `applyToOffer` nie zwraca do klienta wewnetrznego `debug` trace z ID/statusami. Publiczny landing nie komunikuje juz, ze opinie sa przykladowym placeholderem. Przy okazji domknieto regresje typow w stronie `/dla-studentow` i lazy-loaded `NotificationsBell`, ktore wyszly podczas finalnego `tsc`.

Aktualizacja po partii wdrozeniowej 8: dodano `ADR_PAYMENTS_GO_LIVE_MODEL_2026-06-27.md` ze statusem `Proposed`. ADR opisuje obecny pilot Checkout + ledger + transfery, rekomendowane warunki kontynuacji pilota oraz dwie sciezki go-live: manual-capture escrow albo formalnie zatwierdzony Checkout + ledger z korekta copy/legal. Produkcja platnosci live pozostaje `NO-GO` do podpisania decyzji path A albo path B.

Aktualizacja po partii wdrozeniowej 9: ujednolicono user-facing copy platnosci pod obecny pilot Checkout + ledger + transfery. Publiczny landing, landing studentow, regulamin, klauzule PDF, modal/panele realizacji, katalog pakietow, flow ofert firmowych, faktury i admin analytics uzywaja teraz slownika `depozyt Student2Work` / `srodki zabezpieczone`, bez sugerowania rachunku escrow. Techniczne identyfikatory `escrow_funded`, `escrow_active_pln` i zmienne UI pozostawiono bez migracji danych.

Aktualizacja po partii wdrozeniowej 10: endpoint `app/api/admin/export/invoices-zip/route.ts` generuje teraz faktyczny ZIP z PDF-ami faktur/rachunkow zapisanymi w Supabase Storage oraz manifestem CSV. Panel admina `app/app/admin/exports/page.tsx` komunikuje `Faktury ZIP`, a historyczny URL zostal zachowany bez obnizania kontraktu. Dodano lekki server-only ZIP writer `lib/export/zip.ts`, bez nowej zaleznosci npm.

Aktualizacja po partii wdrozeniowej 11: dodano `ADR_STRIPE_CONNECT_ACCOUNT_MODEL_2026-06-27.md` oraz produkcyjna bramke `STRIPE_CONNECT_MODEL_APPROVED=true` w `validate-deploy-env` i `production-readiness-check`. Obecny v1 Express Connect pozostaje sciezka kompatybilnosciowa pilota, a produkcja live payoutow jest blokowana do podpisanej decyzji Connect.

Aktualizacja po partii wdrozeniowej 12: CSP dostal bezpieczny krok przejsciowy. W produkcji aplikacja wysyla teraz `Content-Security-Policy-Report-Only` bez `unsafe-inline` dla `script-src` oraz raportuje naruszenia do `app/api/security/csp-report/route.ts`, z rate limitingiem i sanitizacja URL-i. Enforced CSP pozostaje bez zmiany, dopoki nonce/SRI pass i visual QA nie potwierdza braku blokad Next/Stripe/Turnstile.

Aktualizacja po partii wdrozeniowej 13: legacy flow `app/app/orders/create/[packageId]` zostal utwardzony pod runtime validation. `createOrder` waliduje `packageId`, email, wariant i dodatkowy opis przez Zod, filtruje dynamiczne odpowiedzi briefu do schematu pakietu oraz zapisuje tytul i kwote z bazy, nie z ukrytych pol formularza. `startInquiry` waliduje UUID/message length i sprawdza role `company` server-side.

Aktualizacja po partii wdrozeniowej 14: `app/app/profile/_actions.ts` zostal przepisany pod Zod i role guardy. Akcje profilu studenta, profilu firmy, danych podatkowych i edukacji waliduja runtime payload, UUID, PESEL/NIP, lata edukacji oraz HTTPS URL. Naprawiono tez ryzyko zerowania `kierunek/rok/sciezka`, bo akcja studenta aktualizuje tylko pola obecne w aktualnym formularzu.

Aktualizacja po partii wdrozeniowej 15: `app/app/cancel/[id]/_actions.ts` zostal przepisany pod walidacje i ownership przed RPC. Anulowanie wspolpracy waliduje UUID, powod anulowania, status `accepted` oraz to, czy aktualny uzytkownik jest firma albo studentem tej aplikacji. Bledy RPC trafiaja do `error_logs`/Sentry bez zapisywania tresci powodu w kontekście diagnostycznym.

W working tree byly juz obecne niezacommitowane zmiany w:

- `app/app/app-navbar.tsx`
- `app/app/company/_components/company-card-theme.tsx`
- `app/app/company/offers/offer-card.tsx`
- `app/app/company/packages/page.tsx`
- `lib/rate-limit.ts`
- `scripts/validate-deploy-env.mjs`

Zgodnie z zalozeniem audytu potraktowano je jako cudze i nie cofnieto.

## Baseline komend

| Check | Wynik | Uwagi |
|---|---:|---|
| `git status --short` | INFO | Working tree zawiera wdrozone zmiany audytowe oraz wczesniejsze niezacommitowane pliki; nic nie bylo stage'owane ani cofane. |
| `npm audit --omit=dev --audit-level=moderate` | PASS | 0 podatnosci produkcyjnych na poziomie moderate+. |
| `npm run lint` | PASS | ESLint bez bledow. |
| `npx tsc --noEmit` | PASS | TypeScript bez bledow. |
| `npm run build` | PASS | Build Next.js zakonczony sukcesem. |
| `npm run check:preview` | FAIL | 2 blokady: `NEXT_PUBLIC_APP_URL` nie jest HTTPS; brak aktywnego webhooka Stripe dla lokalnego endpointu preview. |
| `npm run check:production` | FAIL | Produkcja `NO-GO`: brak Upstash, Sentry, `RESEND_FROM_EMAIL`, realnych `PLATFORM_LEGAL_*`, live Stripe keys, `STRIPE_PAYOUTS_ENABLED=true`, HTTPS app URL, poprawnego DNS i live webhooka. |
| `npm run test:mvp-scenarios` | FAIL | 2 blokady: payout Stripe studenta pending przez niegotowy onboarding; brak testowych credentiali roli company/student. |

Szczegolowy wynik MVP zapisany przez suite: `test-results/mvp-scenario-suite.json`.

## Najwazniejszy wniosek

Kod ma juz sporo realnych zabezpieczen: server-side Stripe, podpis webhooka, kolejke `stripe_events`, cron z `CRON_SECRET`, prywatny storage z signed URL, Supabase hardening migrations i podstawowe readiness checks. Nie jest to jednak jeszcze produkcyjnie gotowy system. Glowny risk surface to nie pojedynczy blad kompilacji, tylko rozjazd miedzy komunikowanym modelem "escrow" a realnym pilotowym modelem Checkout + ledger + pozniejsze transfery, niezamkniete go-live env, brak pelnej weryfikacji rolowej UI oraz pozostaly copy/compliance debt.

## Potwierdzone mocne punkty

### Stripe i finanse

- Stripe SDK jest server-only: `lib/stripe.ts:1`.
- Webhook Stripe czyta raw body i weryfikuje podpis: `app/api/stripe/webhook/route.ts:50`, `app/api/stripe/webhook/route.ts:57`.
- Webhook zapisuje eventy do outboxa `stripe_events`, a procesor ma retry/idempotency: `lib/stripe/stripe-event-processor.ts:103`, `lib/stripe/stripe-event-processor.ts:122`, `lib/stripe/stripe-event-processor.ts:132`.
- Checkout pobiera kwoty z kontraktu/milestone w bazie, a nie ufa kwocie z UI: `app/api/stripe/create-checkout/route.ts:312`, `app/api/stripe/create-checkout/route.ts:338`, `app/api/stripe/create-checkout/route.ts:365`.
- Checkout blokuje platnosc przed akceptacja obu umow i dokumentow A/B: `app/api/stripe/create-checkout/route.ts:237`, `app/api/stripe/create-checkout/route.ts:263`.
- Payout przez Stripe transfer ma guardy: kontrakt `active/completed`, milestone `released`, platnosc `completed`: `lib/stripe/payouts.ts:119`, `lib/stripe/payouts.ts:123`, `lib/stripe/payouts.ts:129`.
- Stripe transfer uzywa idempotency key: `lib/stripe/payouts.ts:154`, `lib/stripe/payouts.ts:166`.
- Aktualne glowne uzycie modala platnosci wymusza Stripe: `app/app/deliverables/[id]/tabs/StatusTab.tsx:266`.

### Supabase, RLS i storage

- Service-role client jest server-only: `lib/supabase/admin.ts:1`.
- Readiness check Supabase przechodzi dla RLS/functions/storage w preview i production checks.
- Wczesniejsze szerokie polityki w starych setup/archive plikach sa skompensowane nowsza migracja hardening: `supabase/migrations/20260614110000_security_audit_hardening.sql:263`.
- Prywatny storage uzywa `storage://bucket/path` i signed URL: `lib/security/storage.ts:56`, `lib/security/storage.ts:231`.
- Bucketi i typy plikow sa hardenowane migracjami: `supabase/migrations/20260324212246_cleanup_drift_01_02_03.sql:14`, `supabase/migrations/20260324212246_cleanup_drift_01_02_03.sql:15`.

### Cron, auth, rate limiting

- Cron endpoints wymagaja `CRON_SECRET`: `app/api/cron/process-stripe-events/route.ts:8`, `app/api/cron/auto-accept/route.ts:30`, `app/api/cron/cleanup-expired-sessions/route.ts:7`.
- Mutacje krytyczne maja rate limiting w wielu sciezkach: `app/api/stripe/create-checkout/route.ts:99`, `app/api/stripe/connect/onboarding/route.ts:31`, `app/api/storage/upload/route.ts:151`.
- `proxy.ts` ustawia security headers i CSP: `proxy.ts:269`.

## Znaleziska P0

### P0-01: Produkcja pozostaje `NO-GO`

Dowod: `npm run check:production` nie przechodzi. Blokady:

- brak `UPSTASH_REDIS_REST_URL`
- brak `UPSTASH_REDIS_REST_TOKEN`
- brak `SENTRY_DSN`
- brak `RESEND_FROM_EMAIL`
- brak realnych `PLATFORM_LEGAL_*` dla podmiotu platformy
- Stripe secret nie jest `sk_live_`
- Stripe publishable key nie jest `pk_live_`
- `STRIPE_PAYOUTS_ENABLED=true` nie jest ustawione
- `NEXT_PUBLIC_APP_URL` nie jest HTTPS
- DNS wskazuje na `localhost`, nie Vercel
- brak aktywnego Stripe webhooka dla endpointu

Wplyw: produkcja nie ma pelnego rate limitingu, observability, live platnosci, poprawnego hostingu ani webhookow. Release produkcyjny powinien pozostac zablokowany.

Akceptacja: `npm run check:production` przechodzi na live env bez ujawniania sekretow.

### P0-02: Komunikacja "escrow" nie odpowiada formalnie obecnemu modelowi pilota

Dowod w kodzie:

- Checkout tworzy `checkout.sessions.create({ mode: "payment" })`: `app/api/stripe/create-checkout/route.ts:365`.
- Brak `payment_intent_data.capture_method = "manual"` w sesji Checkout.
- Brak `application_fee_amount` i `transfer_data.destination` w checkout flow.
- Transfer do studenta jest osobna pozniejsza operacja: `lib/stripe/payouts.ts:154`.
- Copy publiczne i UI wielokrotnie mowi o escrow, np. `app/page.tsx:867`, `app/dla-studentow/page.tsx:655`, `app/components/payment-modal.tsx:190`, `app/components/payment-modal.tsx:230`.
- Legal clauses mowia, ze srodki sa przechowywane na rachunku escrow: `lib/pdf/legal-clauses-pl.ts:46`.

Wplyw: pilotowy model Checkout + ledger + pozniejszy transfer moze byc akceptowalny operacyjnie, ale copy i dokumenty prawne nie moga sugerowac mechaniki, ktora nie jest formalnie zatwierdzona. To ryzyko finansowe, prawne i zaufania.

Status po wdrozeniu: powstal proponowany ADR w `ADR_PAYMENTS_GO_LIVE_MODEL_2026-06-27.md`, a najbardziej ryzykowne user-facing copy zostalo przestawione na neutralny model `depozyt Student2Work` / `srodki zabezpieczone`. Decyzja biznesowo-prawna nadal jest wymagana: albo path A do manual-capture escrow, albo path B z formalnie zatwierdzonym Checkout + ledger. Techniczne nazwy eventow/pol moga zostac zmigrowane pozniej, jesli wybierzemy path B i bedzie to warte kosztu migracji.

Akceptacja: ADR zostaje podpisany jako path A albo path B, a publiczne copy, modal platnosci i umowy sa zgodne z zatwierdzonym modelem.

### P0-03: Release gate MVP nie przechodzi end-to-end

Dowod: `npm run test:mvp-scenarios` konczy sie 24/26.

Blokady:

- `db paid Stripe payout evidence`: payout pending, bo konto Stripe studenta nie jest gotowe do transferow.
- `ui authenticated role scenarios`: brak `TEST_COMPANY_EMAIL/PASSWORD` lub `TEST_STUDENT_EMAIL/PASSWORD`.

Wplyw: nie ma potwierdzonego, automatycznego testu roli student/firma dla pelnego flow oraz nie ma dowodu, ze testowy student moze otrzymac transfer Stripe.

Akceptacja: testowe konto studenta przechodzi Connect onboarding lub suite dostaje fixture gotowego konta; env testowe zawiera credentiale roli company/student; `npm run test:mvp-scenarios` przechodzi 26/26.

## Znaleziska P1

### P1-01: Notification webhook moze cicho przejsc w dry-run na produkcji - zamkniete

Status po wdrozeniu: zamkniete w partiach 1, 2 i 6. Produkcja wymaga konfiguracji email w readiness checks, brak Resend jest logowany jako blad operacyjny, a publiczna odpowiedz nie zawiera PII ani stack trace. `check:production` nadal blokuje release, bo brakuje `RESEND_FROM_EMAIL` w lokalnym/live env.

Dowod historyczny:

- Brak `RESEND_API_KEY` powoduje logowanie dry-run i HTTP 200: `app/api/webhooks/notifications/route.ts:166`, `app/api/webhooks/notifications/route.ts:170`.
- Produkcyjny readiness check nie wymaga `RESEND_API_KEY`.
- W dry-run logowany jest adres email odbiorcy: `app/api/webhooks/notifications/route.ts:167`.

Wplyw: powiadomienia email moga nie wychodzic, a system nadal zwroci sukces. Dodatkowo email w logach jest PII.

Fix wdrozony: fail-closed dla produkcji, legal/email readiness gates i centralne logowanie do `error_logs`/Sentry.

### P1-02: Endpointy API maja niespojny jezyk bledow - zamkniete dla krytycznych tras

Status po wdrozeniu: zamkniete dla route handlerow objetych partiami 3 i 4: Stripe, cron, storage, documents, admin exports, notifications webhook, Turnstile i request-origin uzywaja polskich `{ error: string }` oraz no-store JSON helperow. Dalszy copy pass moze objac mniej krytyczne Server Actions w ramach P2 polish.

Dowod historyczny:

- `app/api/webhooks/notifications/route.ts:133` - `Unauthorized`
- `app/api/admin/export/pit-csv/route.ts:15` - `Unauthorized`
- `app/api/admin/export/invoices-zip/route.ts:25` - `Forbidden`
- `app/api/cron/process-stripe-events/route.ts:10` - `Server misconfigured`
- `app/api/stripe/webhook/route.ts:54` - `Missing stripe-signature header`
- `app/api/stripe/verify-payment/route.ts:100` - `Missing session_id`

Wplyw: narusza kontrakt projektu "komunikaty bledow zawsze po polsku". Dla endpointow machine-to-machine mozna zostawic techniczne kody wewnetrzne, ale JSON `{ error: string }` powinien byc konsekwentny.

Fix wdrozony: `lib/security/api-response.ts` z `jsonError`/`noStoreJson` oraz wspolne walidatory w `lib/security/validation.ts`.

### P1-03: Mock payment fallback nadal istnieje w komponencie platnosci - zamkniete

Status po wdrozeniu: zamkniete w partii 1. Produkcyjny `PaymentModal` nie ma sciezki sukcesu bez Stripe Checkout/session/webhook, a `StatusTab` nie przekazuje juz mock fallbacku.

Dowod historyczny:

- `useStripe?: boolean` i komentarz "Toggle between mock and real Stripe": `app/components/payment-modal.tsx:19`.
- `handleMockPayment`: `app/components/payment-modal.tsx:151`.
- Fallback do mocka, gdy brakuje `contractId`/`applicationId`/`serviceOrderId` albo `useStripe=false`: `app/components/payment-modal.tsx:174`, `app/components/payment-modal.tsx:177`.

Wplyw: obecne wywolanie w `StatusTab` przekazuje `useStripe={true}`, ale komponent publicznie pozwala ominac realny Stripe, jesli zostanie uzyty w innym miejscu albo z niekompletnymi propsami. To typowy "pilot leftover", ktory przed go-live powinien zniknac albo byc zamkniety za dev-only flag.

Fix wdrozony: usunieto `handleMockPayment`, `useStripe` i `onConfirm` z produkcyjnego przeplywu platnosci.

### P1-04: Legal PDF clauses zawieraja placeholdery podmiotu - zamkniete mechanicznie, env nadal blokuje release

Status po wdrozeniu: placeholdery nie sa juz jedynym zrodlem prawdy w kodzie. Dane podmiotu ida z server-only `PLATFORM_LEGAL_*`, a deploy/readiness blokuje produkcje, jesli wartosci sa puste lub placeholderowe. Lokalny/live env nadal wymaga realnych danych, dlatego `check:production` zostaje `NO-GO`.

Dowod historyczny:

- NIP `0000000000`: `lib/pdf/legal-clauses-pl.ts:10`.
- Adres `ul. Przykladowa 1`: `lib/pdf/legal-clauses-pl.ts:11`.
- KRS `0000000000`: `lib/pdf/legal-clauses-pl.ts:13`.

Wplyw: dokumenty A/B nie powinny byc uzyte dla realnych transakcji z placeholderami spółki.

Fix wdrozony: `.env.example`, `validate-deploy-env.mjs`, `production-readiness-check.mjs` i generator klauzul prawnych zostaly dopiete do `PLATFORM_LEGAL_*`.

### P1-05: Endpoint `invoices-zip` nie generuje ZIP/PDF faktur - zamkniete

Status po wdrozeniu: zamkniete w partii 10. Historyczny URL `invoices-zip` zwraca teraz `Content-Type: application/zip`, `X-Export-Format: zip`, PDF-y z `invoices.storage_path` oraz `manifest-faktur.csv`. UI admina pobiera `faktury_{month}.zip`.

Pierwotny dowod z audytu:

- Endpoint `/api/admin/export/invoices-zip` zwracal CSV mimo nazwy sugerujacej ZIP.
- UI admina opisywal rejestr faktur CSV i informowal, ze paczki PDF/ZIP wymagaja osobnego wdrozenia.
- W kodzie endpointu istnial komentarz/TODO wskazujacy, ze prawdziwy ZIP/PDF nie byl jeszcze zaimplementowany.

Wplyw: panel admina i proces ksiegowy moga sugerowac funkcje, ktora realnie jest tylko eksportem CSV.

Fix wdrozony: `app/api/admin/export/invoices-zip/route.ts`, `lib/export/zip.ts`, `app/app/admin/exports/page.tsx`.

### P1-06: Stripe Connect onboarding uzywa legacy Express account creation - czesciowo zbramkowane

Status po wdrozeniu: czesciowo zbramkowane w partii 11. Dodano `ADR_STRIPE_CONNECT_ACCOUNT_MODEL_2026-06-27.md`, `.env.example` z `STRIPE_CONNECT_MODEL_APPROVED=false`, produkcyjna blokade deploy/readiness oraz komentarz przy pilotowej sciezce v1 Express. Runtime nie zostal zmigrowany do Accounts v2 w tej partii, bo obecny payout worker i readiness opieraja sie na v1 `Stripe.Account`, a profile nie przechowuja wersji modelu konta.

Dowod:

- `stripe.accounts.create({ type: "express", country: "PL", capabilities: { transfers: ... } })`: `app/api/stripe/connect/onboarding/route.ts:65`, `app/api/stripe/connect/onboarding/route.ts:69`.

Wplyw: dla nowej platformy Connect trzeba potwierdzic, czy ten wariant jest formalnie zatwierdzony. Aktualne rekomendacje Stripe dla nowych integracji preferuja nowsze parametry kont i kontrolerow zamiast trzymania sie legacy Express bez ADR.

Fix pozostaly: po zatwierdzeniu ADR wdrozyc osobna migracje modelu danych i feature flag dla tworzenia nowych kont przez Accounts v2 `recipient` albo formalnie zatwierdzic pozostanie przy v1 Express dla live pilota.

### P1-07: CSP nadal wymaga `unsafe-inline` - czesciowo zbramkowane

Status po wdrozeniu: czesciowo zbramkowane w partii 12. Enforced CSP nadal ma `unsafe-inline`, ale produkcja otrzymuje rownolegly `Content-Security-Policy-Report-Only` z ostrzejszym `script-src` bez `unsafe-inline` oraz endpoint raportujacy naruszenia do `error_logs`/Sentry.

Dowod:

- `script-src` zawiera `unsafe-inline` w produkcji: `proxy.ts:41`.
- `style-src` zawiera `unsafe-inline`: `proxy.ts:46`.

Wplyw: CSP jest lepsze niz brak CSP, ale `unsafe-inline` oslabia ochrone XSS. W Next/Stripe/Turnstile moze byc potrzebne przejsciowo, lecz go-live hardening powinien dązyc do nonce/hash.

Fix pozostaly: nonce dla skryptow aplikacji lub SRI, weryfikacja wymagan Stripe/Sentry/Turnstile, analiza raportow CSP i visual QA przed przestawieniem ostrzejszej polityki na enforce.

### P1-08: Runtime validation jest nierowna - zamkniete dla krytycznych mutacji, kontynuowane dla Server Actions

Status po wdrozeniu: zamkniete dla krytycznych route handlerow objetych partiami 1, 3 i 4. Checkout/verify/webhook notifications/storage/download/export/Turnstile waliduja runtime przez Zod albo wspolne walidatory. W partii 13 domknieto legacy Server Action zamowienia Quick Task/inquiry, w partii 14 akcje profilu/tax/edukacji, a w partii 15 anulowanie wspolpracy. Pozostale Server Actions powinny byc domkniete stopniowo przy kolejnych zmianach domenowych.

Aktualizacja partia 16: domknieto aktywne Server Actions uslug i negocjacji w `app/app/services/_actions.ts`.

- `createServiceAction` i `updateServiceAction` nie zapisuja juz surowego `...data` z klienta; payload jest whitelistowany schematem Zod.
- Student nie moze przez klienta ustawic `student_id`, `is_system`, `commission_rate` ani dowolnego statusu pakietu.
- `deleteServiceAction`, `toggleServiceStatusAction`, prywatne propozycje, wyceny, kontroferty, wybor studenta i potwierdzenie realizacji waliduja UUID/kwoty/statusy runtime.
- Przejscia negocjacji maja serwerowe guardy statusow: oferta studenta tylko z `inquiry/pending`, akceptacja firmy i kontroferta tylko z `proposal_sent`, akceptacja kontroferty tylko z `countered`, wybor studenta tylko z `pending_selection/pending`.
- Update'y statusow uzywaja dodatkowych filtracji `.in("status", ...)` i sprawdzaja zwrocony wiersz, zeby wyscig stanu nie wygladal jak sukces.
- Tworzenie kontraktu po akceptacji/potwierdzeniu sprawdza blad RPC `ensure_contract_for_service_order`.

Weryfikacja partii 16:

- `npm.cmd run lint` - OK.
- `npx.cmd tsc --noEmit` - OK.
- `npm.cmd run build` - OK.
- `git diff --check -- app/app/services/_actions.ts` - OK, tylko ostrzezenie Windows LF->CRLF.
- `npm.cmd run test:mvp-scenarios` przy lokalnym `next start` - 26/28 OK; pozostaja znane blokery niezalezne od tej zmiany: `db paid Stripe payout evidence` pending przez niedokonczony onboarding Stripe studenta oraz brak `TEST_COMPANY_EMAIL/PASSWORD` i `TEST_STUDENT_EMAIL/PASSWORD` dla UI authenticated role scenarios.

Aktualizacja partia 17: domknieto aktywny flow Quick Task/company packages w `app/app/company/packages/_actions.ts`.

- `createOfferFromPackage`, `createCustomizedOffer` i `updateCustomizedOffer` waliduja UUID (`packageId`/`offerId`) przed zapytaniami Supabase.
- Brief z `FormData` jest parsowany przez Zod: limity dlugosci dla pol legacy, `materialsLink` tylko HTTPS, tryb wyboru studenta z whitelisty aplikacyjnej.
- Dynamiczne odpowiedzi `q_*` sa filtrowane do pol z `form_schema`, maja limity dlugosci, walidacje select/radio options oraz walidacje URL/email.
- Cena nadal pochodzi z DB/wariantu pakietu, nie z frontendu; backend sprawdza, czy wyliczona cena jest dodatnia i skonczona.
- Tworzenie i edycja nie zwracaja juz surowych bledow DB/angielskiego `Unauthorized` w dotknietych sciezkach.
- `updateCustomizedOffer` ma dodatkowy filtr `.eq("company_id", user.id)` przy zapisie.

Weryfikacja partii 17:

- `npm.cmd run lint` - OK.
- `npx.cmd tsc --noEmit` - OK.
- `npm.cmd run build` - OK.
- `git diff --check -- app/app/company/packages/_actions.ts` - OK, tylko ostrzezenie Windows LF->CRLF.
- `npm.cmd run test:mvp-scenarios` przy lokalnym `next start` - 26/28 OK; pozostaja te same 2 blokery zewnetrzne: payout Stripe studenta pending oraz brak testowych credentiali UI.

Aktualizacja partia 18: domknieto aktywne Server Actions studenta dla aplikacji i propozycji z czatu w `app/app/applications/_actions.ts`.

- Wszystkie akcje przyjmujace `applicationId`, `offerId` albo `conversationId` waliduja UUID runtime przed zapytaniami Supabase i rate limitingiem.
- Akceptacja propozycji/kontroferty uzywa atomicznego helpera z filtrem `student_id` oraz dozwolonym statusem startowym; blad RPC `ensure_contract_for_application` jest sprawdzany i zwraca kontrolowany komunikat.
- Odrzucenie, nowa stawka i wycofanie aplikacji maja dodatkowe filtry `.eq("student_id", user.id)` oraz `.in("status", ...)` i sprawdzaja zwrocony wiersz, aby wyscig statusu nie wygladal jak sukces.
- Kwoty propozycji sa walidowane jednym schematem Zod: liczba skonczona, minimum 1, maksimum 100 000, zaokraglenie do dwoch miejsc.
- `submitQuoteProposal` nie ufa juz cenie/wiadomosci/ID z klienta: waliduje conversation/offer, sprawdza ownership rozmowy studenta, wymaga zgodnosci `conversation.offer_id`, blokuje edycje aplikacji w niedozwolonym statusie i laczy rozmowe z aplikacja przez autoryzowany update.
- Dotkniete sciezki nie zwracaja juz surowych `error.message` z Supabase ani angielskich/raw komunikatow w mutacjach studenta.

Weryfikacja partii 18:

- `npm.cmd run lint` - OK.
- `npx.cmd tsc --noEmit` - OK.
- `npm.cmd run build` - OK.
- `npm.cmd audit --omit=dev --audit-level=moderate` - OK, 0 podatnosci.
- `git diff --check -- app/app/applications/_actions.ts` - OK, tylko ostrzezenie Windows LF->CRLF.
- `npm.cmd run check:preview` przy lokalnym `next start` - FAIL tylko na znanych blokadach preview: `NEXT_PUBLIC_APP_URL` nie uzywa HTTPS oraz brak aktywnego webhooka Stripe dla `http://localhost:3000/api/stripe/webhook`; HTTP smoke w checku przechodzi.
- `npm.cmd run test:mvp-scenarios` przy lokalnym `next start` - 26/28 OK; pozostaja te same 2 blokery zewnetrzne: payout Stripe studenta pending przez niegotowe konto Connect oraz brak `TEST_COMPANY_EMAIL/PASSWORD` i `TEST_STUDENT_EMAIL/PASSWORD` dla UI authenticated role scenarios.

Aktualizacja partia 19: domknieto pierwsza grupe krytycznych Server Actions realizacji w `app/app/deliverables/_actions.ts`.

- Dodano lokalne schematy Zod dla UUID, decyzji milestone/deliverable, opisow, komentarzy opinii, payloadu plikow, zasobow, sekretow i signed URL.
- `getSignedStorageUrl` i `getContractDocumentSignedUrl` nie przyjmuja juz dowolnych bucketow/ID/czasow wygasania przez cast typow; zakres jest limitowany do prywatnych bucketow i 60-3600 sekund.
- `submitDeliverable` i `submitMilestoneWorkAction` sprawdzaja source ownership, role studenta, powiazanie milestone ze zleceniem oraz parsuja `filesJson` przez kontrolowany parser z polskim bledem.
- `reviewDeliverable`, `reviewMilestoneAction`, `fundMilestoneAction` i `fundContractAction` waliduja ID, role firmy i linkage `contract/milestone -> application/service_order`, zanim wywolaja RPC albo zsynchronizuja status parenta.
- `addResource`, `deleteResource`, `addSecret`, `deleteSecret` waliduja ID i payload, sprawdzaja dostep do zlecenia, potwierdzaja przynaleznosc rekordu do wskazanego source oraz usuwaja zasoby/sekrety atomicznie po `uploader_id`/`author_id`.
- `addSecret` zapisuje teraz poprawne `service_order_id` dla zlecen serwisowych zamiast zawsze uzywac tylko `application_id`, co domyka niespojnosc z odczytem strony deliverables.
- Dotkniete sciezki nie zwracaja surowych `error.message` z Supabase/RPC dla uzytkownika.

Weryfikacja partii 19:

- `npm.cmd run lint` - OK.
- `npx.cmd tsc --noEmit` - OK.
- `npm.cmd run build` - OK.
- `npm.cmd audit --omit=dev --audit-level=moderate` - OK, 0 podatnosci.
- `git diff --check -- app/app/deliverables/_actions.ts` - OK, tylko ostrzezenie Windows LF->CRLF.
- `npm.cmd run check:preview` przy lokalnym `next start` - FAIL tylko na znanych blokadach preview: `NEXT_PUBLIC_APP_URL` nie uzywa HTTPS oraz brak aktywnego webhooka Stripe dla `http://localhost:3000/api/stripe/webhook`; HTTP smoke w checku przechodzi.
- `npm.cmd run test:mvp-scenarios` przy lokalnym `next start` - 26/28 OK; pozostaja te same 2 blokery zewnetrzne: payout Stripe studenta pending przez niegotowe konto Connect oraz brak `TEST_COMPANY_EMAIL/PASSWORD` i `TEST_STUDENT_EMAIL/PASSWORD` dla UI authenticated role scenarios.

Aktualizacja partia 20: uporzadkowano generowanie i akceptacje dokumentow kontraktowych w `app/app/deliverables/_actions.ts`.

- Usunieto nieuzywana publiczna akcje `generateContract`, ktora generowala legacy tekstowy plik umowy i zapisywala go jako `project_resources`; aktywna sciezka pozostaje PDF A/B przez `generateContractDocumentsInternal`.
- Usunieto martwy, nieosiagalny kod po `return generateContractDocumentsInternal(...)` w `generateContractDocuments`; nie ma juz dwoch konkurencyjnych implementacji PDF w jednym pliku.
- Dodano helper `assertContractMatchesSource`, ktory sprawdza `contractId -> application_id/service_order_id`, role strony kontraktu albo admina, zanim akcje dokumentow wejda w admin client.
- `generateContractDocuments`, `generateContractDocumentsForAdmin`, `acceptContractDocument` i `reopenMilestoneNegotiationAction` waliduja UUID runtime oraz nie ufaja `applicationId` z klienta jako dowodowi linkage.
- Akceptacja dokumentow sprawdza, ze firma podpisuje tylko `contract_a`, a student tylko `contract_b`, na zwalidowanym dokumencie nalezacym do kontraktu.
- Reopen negocjacji etapow nie usuwa juz dokumentow na podstawie surowego `contractId`; najpierw potwierdza linkage i role uczestnika.
- Dotkniete komunikaty bledow nie doklejaja surowych `error.message` z Supabase/Storage do bledow uzytkownika.

Weryfikacja partii 20:

- `npm.cmd run lint` - OK.
- `npx.cmd tsc --noEmit` - OK.
- `npm.cmd run build` - OK.
- `npm.cmd audit --omit=dev --audit-level=moderate` - OK, 0 podatnosci.
- `git diff --check -- app/app/deliverables/_actions.ts` - OK, tylko ostrzezenie Windows LF->CRLF.
- `npm.cmd run check:preview` przy lokalnym `next start` - FAIL tylko na znanych blokadach preview: `NEXT_PUBLIC_APP_URL` nie uzywa HTTPS oraz brak aktywnego webhooka Stripe dla `http://localhost:3000/api/stripe/webhook`; HTTP smoke w checku przechodzi.
- `npm.cmd run test:mvp-scenarios` przy lokalnym `next start` - 26/28 OK; pozostaja te same 2 blokery zewnetrzne: payout Stripe studenta pending przez niegotowe konto Connect oraz brak `TEST_COMPANY_EMAIL/PASSWORD` i `TEST_STUDENT_EMAIL/PASSWORD` dla UI authenticated role scenarios.

Aktualizacja partia 21: utwardzono admin Legal Vault actions w `app/app/admin/vault/_actions.ts`.

- `getContractDocuments` waliduje teraz `contractId` przez runtime `uuidSchema`, zanim uzyje go w filtrze `contract_documents`.
- `repairSingleContractPdf` waliduje `contractId` przed generowaniem PDF, `revalidatePath` i redirectem do strony kontraktu.
- Nieprawidlowy `contractId` w server action jest zamykany kontrolowanym redirectem z polskim komunikatem, bez przepuszczania losowego stringa do URL.
- Blad naprawy pojedynczego PDF nie odbija juz surowego `error.message` w `errorMessage` query param; UI dostaje staly, bezpieczny komunikat, a szczegoly zostaja w logu serwera.
- Helper redirectu uzywa `URLSearchParams`, zeby uniknac recznego skladania query stringow dla sciezki bledu.

Weryfikacja partii 21:

- `npm.cmd run lint` - OK.
- `npx.cmd tsc --noEmit` - OK.
- `npm.cmd run build` - OK.
- `npm.cmd audit --omit=dev --audit-level=moderate` - OK, 0 podatnosci po ponowieniu z dostepem sieciowym.
- `git diff --check -- app/app/admin/vault/_actions.ts` - OK, tylko ostrzezenie Windows LF->CRLF.
- `npm.cmd run check:preview` przy lokalnym `next start` - FAIL tylko na znanych blokadach preview: `NEXT_PUBLIC_APP_URL` nie uzywa HTTPS oraz brak aktywnego webhooka Stripe dla `http://localhost:3000/api/stripe/webhook`; HTTP smoke w checku przechodzi.
- `npm.cmd run test:mvp-scenarios` przy lokalnym `next start` - 26/28 OK; pozostaja te same 2 blokery zewnetrzne: payout Stripe studenta pending przez niegotowe konto Connect oraz brak `TEST_COMPANY_EMAIL/PASSWORD` i `TEST_STUDENT_EMAIL/PASSWORD` dla UI authenticated role scenarios.

Aktualizacja partia 22: utwardzono adminowe mutacje ofert w `app/app/admin/offers/_actions.ts`.

- `deleteOfferAction`, `closeOfferAction` i `updateOfferCommissionAction` waliduja `offerId` przez `uuidSchema`, zanim dotkna tabel `applications`, `conversations`, `messages` albo `offers`.
- Auth failure w helperze admina nie zwraca juz surowego komunikatu z `requireAdmin`; UI dostaje staly polski komunikat, a szczegoly zostaja w logu serwera.
- Usuwanie oferty sprawdza bledy lookup/delete na kazdym kroku zaleznosci zamiast ignorowac bledy czyszczenia `messages`, `conversations` i `applications`.
- Mutacje admin ofert nie zwracaja juz surowych `error.message` z Supabase w `{ error }`.
- Komunikat walidacji prowizji jest zgodny z faktyczna lista `ALLOWED_COMMISSION_RATE_OPTIONS`: auto, 10%, 15%, 20% lub 25%.

Weryfikacja partii 22:

- `npm.cmd run lint` - OK.
- `npx.cmd tsc --noEmit` - OK.
- `npm.cmd run build` - OK.
- `npm.cmd audit --omit=dev --audit-level=moderate` - OK, 0 podatnosci po ponowieniu z dostepem sieciowym.
- `git diff --check -- app/app/admin/offers/_actions.ts app/app/admin/vault/_actions.ts` - OK, tylko ostrzezenie Windows LF->CRLF.
- `npm.cmd run check:preview` przy lokalnym `next start` - FAIL tylko na znanych blokadach preview: `NEXT_PUBLIC_APP_URL` nie uzywa HTTPS oraz brak aktywnego webhooka Stripe dla `http://localhost:3000/api/stripe/webhook`; HTTP smoke w checku przechodzi.
- `npm.cmd run test:mvp-scenarios` przy lokalnym `next start` - 26/28 OK; pozostaja te same 2 blokery zewnetrzne: payout Stripe studenta pending przez niegotowe konto Connect oraz brak `TEST_COMPANY_EMAIL/PASSWORD` i `TEST_STUDENT_EMAIL/PASSWORD` dla UI authenticated role scenarios.

Aktualizacja partia 23: utwardzono admin payout actions w `app/app/admin/payouts/_actions.ts`.

- `markPayoutProcessing` i `markPayoutPaid` waliduja `payoutId` przez `uuidSchema`, zanim wejda w tabele `payouts`, RPC albo transfer Stripe.
- Zmiana statusu na `processing` sprawdza, czy rekord faktycznie zostal zaktualizowany z `pending`; no-op zwraca kontrolowany polski blad domenowy.
- Bledy Supabase/RPC/Stripe w mutacjach payoutow sa logowane server-side, ale UI nie dostaje juz sklejonych surowych `error.message`.
- `markPayoutPaid` uzywa zwalidowanego `safePayoutId` dla transferu Stripe i obu wariantow `process_payout_paid_v1`.
- `getPayouts` ma allowliste filtrow statusu i pomija puste `.in("user_id", [])`, zeby nie generowac zbednego zapytania po profile studentow.

Weryfikacja partii 23:

- `npm.cmd run lint` - OK.
- `npx.cmd tsc --noEmit` - OK.
- `npm.cmd run build` - OK.
- `npm.cmd audit --omit=dev --audit-level=moderate` - OK, 0 podatnosci po ponowieniu z dostepem sieciowym.
- `git diff --check -- app/app/admin/payouts/_actions.ts` - OK, tylko ostrzezenie Windows LF->CRLF.
- `npm.cmd run check:preview` przy lokalnym `next start` - FAIL tylko na znanych blokadach preview: `NEXT_PUBLIC_APP_URL` nie uzywa HTTPS oraz brak aktywnego webhooka Stripe dla `http://localhost:3000/api/stripe/webhook`; HTTP smoke w checku przechodzi.
- `npm.cmd run test:mvp-scenarios` przy lokalnym `next start` - 26/28 OK; pozostaja te same 2 blokery zewnetrzne: payout Stripe studenta pending przez niegotowe konto Connect oraz brak `TEST_COMPANY_EMAIL/PASSWORD` i `TEST_STUDENT_EMAIL/PASSWORD` dla UI authenticated role scenarios.

Aktualizacja partia 24: utwardzono admin PIT actions w `app/app/admin/pit/_actions.ts`.

- `markPitPaid` waliduje pojedynczy `withholdingId` przez `uuidSchema`, zanim aktualizuje `pit_withholdings`.
- `markPitBatchPaid` deduplikuje ID i waliduje batch przez Zod array schema, z limitem 200 rekordow na akcje.
- Pusty albo niepoprawny batch konczy sie kontrolowanym polskim bledem zamiast wywolania `.in("id", [])`.
- Bledy aktualizacji PIT sa logowane server-side, ale UI nie dostaje juz surowych `error.message` z Supabase.

Weryfikacja partii 24:

- `npm.cmd run lint` - OK.
- `npx.cmd tsc --noEmit` - OK.
- `npm.cmd run build` - OK.
- `npm.cmd audit --omit=dev --audit-level=moderate` - OK, 0 podatnosci po ponowieniu z dostepem sieciowym.
- `git diff --check -- app/app/admin/pit/_actions.ts` - OK, tylko ostrzezenie Windows LF->CRLF.
- `npm.cmd run check:preview` przy lokalnym `next start` - FAIL tylko na znanych blokadach preview: `NEXT_PUBLIC_APP_URL` nie uzywa HTTPS oraz brak aktywnego webhooka Stripe dla `http://localhost:3000/api/stripe/webhook`; HTTP smoke w checku przechodzi.
- `npm.cmd run test:mvp-scenarios` przy lokalnym `next start` - 26/28 OK; pozostaja te same 2 blokery zewnetrzne: payout Stripe studenta pending przez niegotowe konto Connect oraz brak `TEST_COMPANY_EMAIL/PASSWORD` i `TEST_STUDENT_EMAIL/PASSWORD` dla UI authenticated role scenarios.

Aktualizacja partia 25: utwardzono admin system services actions w `app/app/admin/system-services/_actions.ts`.

- `updateSystemService`, `deleteSystemService`, `updateSystemServiceCommission` i `updateSystemServiceStatus` waliduja ID uslugi przez `uuidSchema`.
- Status uslugi systemowej jest walidowany runtime przez Zod enum `active | inactive`, zamiast polegac wylacznie na typie TypeScript.
- Mutacje edycji/usuwania/prowizji/statusu ograniczaja zapis do `type = platform_service` i potwierdzaja, ze rekord faktycznie zostal zmieniony.
- Bledy Supabase przy create/update/delete/prowizji/statusie sa logowane server-side, ale UI nie dostaje juz surowych `error.message`.
- Kontrakt akcji uzywanych przez edytory prowizji/statusu pozostaje kompatybilny: sukces zwraca `{ success: true, error: null }`, a blad `{ error: string }`.
- Komunikat walidacji prowizji uwzglednia faktycznie dostepna stawke 25%.

Weryfikacja partii 25:

- `npm.cmd run lint` - OK.
- `npx.cmd tsc --noEmit` - OK.
- `npm.cmd run build` - OK.
- `npm.cmd audit --omit=dev --audit-level=moderate` - OK, 0 podatnosci po ponowieniu z dostepem sieciowym.
- `git diff --check -- app/app/admin/system-services/_actions.ts` - OK, tylko ostrzezenie Windows LF->CRLF.
- `npm.cmd run check:preview` przy lokalnym `next start` - FAIL tylko na znanych blokadach preview: `NEXT_PUBLIC_APP_URL` nie uzywa HTTPS oraz brak aktywnego webhooka Stripe dla `http://localhost:3000/api/stripe/webhook`; HTTP smoke w checku przechodzi.
- `npm.cmd run test:mvp-scenarios` przy lokalnym `next start` - 26/28 OK; pozostaja te same 2 blokery zewnetrzne: payout Stripe studenta pending przez niegotowe konto Connect oraz brak `TEST_COMPANY_EMAIL/PASSWORD` i `TEST_STUDENT_EMAIL/PASSWORD` dla UI authenticated role scenarios.

Aktualizacja partia 26: utwardzono user-facing apply flow w `app/app/offers/[id]/_actions.ts`.

- `applyToOffer` waliduje runtime `offerId`, `message`, `proposedStawka` i `cvUrl` przez Zod przed zapytaniami do ofert/aplikacji.
- `offerId` w lookupach, insertach aplikacji, tworzeniu rozmowy i redirect URL pochodzi teraz z `safeOfferId`, a nie z surowego argumentu klienta.
- Proponowana stawka musi byc dodatnia i <= 500000 PLN; znika akceptacja ujemnych/niepoprawnych kwot negocjacji.
- `message_to_company` i pierwsza wiadomosc czatu uzywaja przycietego `safeMessage` z limitem 5000 znakow.
- Lookup istniejącej aplikacji, rozmowy repair, lock-check i limitu platform service sprawdzaja teraz bledy Supabase zamiast je ignorowac.
- Insert aplikacji i zapis wiadomosci czatu nie rzucaja juz surowego `error.message`; szczegoly ida do logu, UI dostaje kontrolowany polski blad.
- `cvUrl` przechodzi przez limit dlugosci i nadal jest weryfikowany przez prywatne storage ref + bucket `cvs`.

Weryfikacja partii 26:

- `npm.cmd run lint` - OK.
- `npx.cmd tsc --noEmit` - OK.
- `npm.cmd run build` - OK.
- `npm.cmd audit --omit=dev --audit-level=moderate` - OK, 0 podatnosci po ponowieniu z dostepem sieciowym.
- `git diff --check -- app/app/offers/[id]/_actions.ts` - OK, tylko ostrzezenie Windows LF->CRLF.
- `npm.cmd run check:preview` przy lokalnym `next start` - FAIL tylko na znanych blokadach preview: `NEXT_PUBLIC_APP_URL` nie uzywa HTTPS oraz brak aktywnego webhooka Stripe dla `http://localhost:3000/api/stripe/webhook`; HTTP smoke w checku przechodzi.
- `npm.cmd run test:mvp-scenarios` przy lokalnym `next start` - 26/28 OK; pozostaja te same 2 blokery zewnetrzne: payout Stripe studenta pending przez niegotowe konto Connect oraz brak `TEST_COMPANY_EMAIL/PASSWORD` i `TEST_STUDENT_EMAIL/PASSWORD` dla UI authenticated role scenarios.

Aktualizacja partia 27: utwardzono saved offers flow w `app/app/offers/[id]/saved-actions.ts`, `app/app/offers/[id]/save-button.tsx` i `app/app/saved/_actions.ts`.

- `toggleSavedOffer` i `removeSavedOffer` waliduja `offerId` przez `uuidSchema` przed zapytaniami do `saved_offers`.
- Dodawanie do zapisanych potwierdza, ze oferta istnieje i ma status `published`, zanim wykona upsert.
- Lookup istniejącego zapisu sprawdza błąd Supabase zamiast traktować go jak brak zapisu.
- Delete/upsert/remove nie rzucaja juz surowego `error.message`; szczegoly sa logowane server-side, a UI dostaje kontrolowany polski blad.
- Rewalidacja strony oferty uzywa zwalidowanego `safeOfferId`.
- `SaveButton` obsluguje bledy server action przez toast zamiast zostawiac nieobsluzony wyjatek w UI.

Weryfikacja partii 27:

- `npm.cmd run lint` - OK.
- `npx.cmd tsc --noEmit` - OK.
- `npm.cmd run build` - OK.
- `npm.cmd audit --omit=dev --audit-level=moderate` - OK, 0 podatnosci po ponowieniu z dostepem sieciowym.
- `git diff --check -- app/app/offers/[id]/saved-actions.ts app/app/offers/[id]/save-button.tsx app/app/saved/_actions.ts` - OK, tylko ostrzezenie Windows LF->CRLF.
- `npm.cmd run check:preview` przy lokalnym `next start` - FAIL tylko na znanych blokadach preview: `NEXT_PUBLIC_APP_URL` nie uzywa HTTPS oraz brak aktywnego webhooka Stripe dla `http://localhost:3000/api/stripe/webhook`; HTTP smoke w checku przechodzi.
- `npm.cmd run test:mvp-scenarios` przy lokalnym `next start` - 26/28 OK; pozostaja te same 2 blokery zewnetrzne: payout Stripe studenta pending przez niegotowe konto Connect oraz brak `TEST_COMPANY_EMAIL/PASSWORD` i `TEST_STUDENT_EMAIL/PASSWORD` dla UI authenticated role scenarios.

Aktualizacja partia 28: zoptymalizowano i utwardzono odczyt strony zapisanych ofert w `app/app/saved/page.tsx`.

- Query param `q` jest trimowany i limitowany do 120 znakow.
- `typ` i `sort` przechodza przez allowlisty zamiast trafiać do logiki filtrow bez normalizacji.
- Blad lookupu profilu jest logowany i konczy przeplyw redirectem do `/app`, zamiast cichego przejscia.
- Blad pobierania `saved_offers` jest logowany server-side, przy zachowaniu istniejacego komunikatu bledu na stronie.
- Blad lookupu zablokowanych aplikacji jest logowany i nie powoduje mylnego przetwarzania `undefined` jako kompletnego wyniku.
- Filtr typu nie powtarza inline allowlisty, tylko korzysta ze zwalidowanego `typ`.

Weryfikacja partii 28:

- `npm.cmd run lint` - OK.
- `npx.cmd tsc --noEmit` - OK.
- `npm.cmd run build` - OK.
- `npm.cmd audit --omit=dev --audit-level=moderate` - OK, 0 podatnosci po ponowieniu z dostepem sieciowym.
- `git diff --check -- app/app/saved/page.tsx app/app/offers/[id]/saved-actions.ts app/app/offers/[id]/save-button.tsx app/app/saved/_actions.ts` - OK, tylko ostrzezenie Windows LF->CRLF.
- `npm.cmd run check:preview` przy lokalnym `next start` - FAIL tylko na znanych blokadach preview: `NEXT_PUBLIC_APP_URL` nie uzywa HTTPS oraz brak aktywnego webhooka Stripe dla `http://localhost:3000/api/stripe/webhook`; HTTP smoke w checku przechodzi.
- `npm.cmd run test:mvp-scenarios` przy lokalnym `next start` - 26/28 OK; pozostaja te same 2 blokery zewnetrzne: payout Stripe studenta pending przez niegotowe konto Connect oraz brak `TEST_COMPANY_EMAIL/PASSWORD` i `TEST_STUDENT_EMAIL/PASSWORD` dla UI authenticated role scenarios.

Dowod historyczny:

- Czesc Server Actions uzywa Zod, np. onboarding i challenge: `app/app/onboarding/_actions.ts:9`, `app/app/company/challenges/new/_actions.ts:39`.
- Kilka Route Handlers nadal robi `await req.json()` plus cast typow bez schematu, np. `app/api/webhooks/notifications/route.ts:136`, `app/api/stripe/verify-payment/route.ts:96`, `app/api/stripe/create-checkout/route.ts:115`.

Wplyw: walidacje czesciowo istnieja, ale nie ma jednolitego kontraktu runtime dla wszystkich mutacji. To zwieksza ryzyko niejawnych `undefined`, zlych UUID, oversized payload i niespojnych odpowiedzi.

Fix pozostaly: kazda kolejna mutacja dotykana w PR ma dostac Zod albo rownowazny schema parser oraz polskie `{ error: string }`.

### P1-17: Wdrozone w partii 29 - tworzenie ofert firmy

Zakres: `app/app/company/jobs/new/_actions.ts`.

Dowod przed poprawka:

- `createOffer` parsowal wiele pol formularza recznie z `FormData`, bez jednego kontraktu runtime.
- Formularz mogl przeslac `commission_rate`, a server action przekazywal go do `resolveCommissionRate` jako `explicitRate`.
- Blad insertu do `offers` byl rzucany jako surowe `error.message` Supabase.
- Kwoty i czas realizacji mialy tylko czesciowe warunki dodatniosci, bez gornego limitu budzetu, widelek wynagrodzenia i dni realizacji.

Wdrozone:

- Dodano Zod schema dla wejscia tworzenia oferty firmy: wymagane pola briefu, typ oferty, kategoria, tryb pracy, model realizacji, limity opisow, technologii i opcjonalnych pol.
- Budzet mikrozlecenia oraz widełki wynagrodzenia sa parsowane server-side, przyjmują przecinek/kropke, sa zaokraglane do 2 miejsc i ograniczone do 500000 PLN.
- Czas realizacji w dniach musi byc dodatnia liczba calkowita i nie moze przekroczyc 365 dni.
- `commission_rate` nie jest juz brany z formularza firmy; serwer wylicza prowizje z reguly aplikacji i typu oferty.
- Bledy insertu sa logowane przez `logCriticalError` z bezpiecznym kontekstem, a UI dostaje staly polski komunikat bez szczegolow Supabase.
- Zapis do `offers` zachowuje dotychczasowy kontrakt kolumn i redirect `/app/company/offers?created=1`.

Weryfikacja partii 29:

- `npm.cmd run lint` - OK.
- `npx.cmd tsc --noEmit` - OK.
- `npm.cmd run build` - OK.
- `npm.cmd audit --omit=dev --audit-level=moderate` - OK, 0 podatnosci po ponowieniu z dostepem sieciowym.
- `git diff --check -- app/app/company/jobs/new/_actions.ts` - OK, tylko ostrzezenie Windows LF->CRLF.
- `npm.cmd run check:preview` przy lokalnym `next start` - FAIL tylko na znanych blokadach preview: `NEXT_PUBLIC_APP_URL` nie uzywa HTTPS oraz brak aktywnego webhooka Stripe dla `http://localhost:3000/api/stripe/webhook`; HTTP smoke w checku przechodzi.
- `npm.cmd run test:mvp-scenarios` przy lokalnym `next start` - 26/28 OK; pozostaja te same 2 blokery zewnetrzne: payout Stripe studenta pending przez niegotowe konto Connect oraz brak `TEST_COMPANY_EMAIL/PASSWORD` i `TEST_STUDENT_EMAIL/PASSWORD` dla UI authenticated role scenarios.

### P1-18: Wdrozone w partii 30 - tworzenie wyzwan firmy

Zakres: `app/app/company/challenges/new/_actions.ts`.

Dowod przed poprawka:

- `createChallengeOffer` mial juz Zod schema i role guard, ale przy bledzie insertu do `offers` zwracal `error?.message` z Supabase bezposrednio do UI.
- Brak `inserted.id` bez bledu Supabase konczyl sie komunikatem ogolnym, ale bez zapisu diagnostycznego w `error_logs`.

Wdrozone:

- Dodano `logCriticalError` dla awarii zapisu wyzwania do `offers`.
- Log zawiera bezpieczny kontekst domenowy (`budgetRange`, `budgetLabel`) i nie zapisuje tresci problemu ani osoby kontaktowej.
- UI dostaje staly polski komunikat: `Nie udalo sie zapisac wyzwania. Sprobuj ponownie lub skontaktuj sie z pomoca.`
- Kontrakt wyniku `{ success: false, error: string }` i redirect po sukcesie pozostaja bez zmian.

Weryfikacja partii 30:

- `npm.cmd run lint` - OK.
- `npx.cmd tsc --noEmit` - OK.
- `npm.cmd run build` - OK.
- `npm.cmd audit --omit=dev --audit-level=moderate` - OK, 0 podatnosci.
- `git diff --check -- app/app/company/challenges/new/_actions.ts app/app/company/jobs/new/_actions.ts` - OK, tylko ostrzezenie Windows LF->CRLF.
- `npm.cmd run check:preview` przy lokalnym `next start` - FAIL tylko na znanych blokadach preview: `NEXT_PUBLIC_APP_URL` nie uzywa HTTPS oraz brak aktywnego webhooka Stripe dla `http://localhost:3000/api/stripe/webhook`; HTTP smoke w checku przechodzi.
- `npm.cmd run test:mvp-scenarios` przy lokalnym `next start` - 26/28 OK; pozostaja te same 2 blokery zewnetrzne: payout Stripe studenta pending przez niegotowe konto Connect oraz brak `TEST_COMPANY_EMAIL/PASSWORD` i `TEST_STUDENT_EMAIL/PASSWORD` dla UI authenticated role scenarios.

### P1-19: Wdrozone w partii 31 - status i edycja ofert firmy

Zakres: `app/app/company/offers/_actions.ts`.

Dowod przed poprawka:

- `setOfferStatus` przyjmowal `offerId` i `status` bez runtime schema; typ TS nie chroni przed recznym wywolaniem server action.
- Lookupi `applications` i `deliverables` ignorowaly bledy Supabase, co moglo pozwolic na probe ponownego otwarcia oferty mimo niedostepnych danych blokujacych.
- Update statusu i edycji oferty nie potwierdzaly zwroconego wiersza, wiec RLS/ownership/race mogly wygladac jak sukces.
- `setOfferStatus` i `updateOffer` rzucaly surowe `error.message` Supabase.
- Stawka edytowanej oferty nie miala gornego limitu ani parsera pustej wartosci zgodnego z dotychczasowym `null`.

Wdrozone:

- Dodano `uuidSchema` dla `offerId` i Zod enum dla statusu `published | in_progress | closed`.
- Lookupi blokujacych aplikacji i deliverables loguja blad przez `logCriticalError` oraz przerywaja akcje stalym polskim komunikatem.
- Update statusu i edycji oferty uzywaja `.select("id").maybeSingle()` i redirectuja do panelu, gdy nie zmieniono zadnego wiersza.
- Surowe `error.message` Supabase zostaly zastapione bezpiecznymi komunikatami UI i logami operacyjnymi.
- Parser stawki obsluguje pusta wartosc jako `null`, przecinek dziesietny, dodatnia kwote i limit 500000 PLN.
- Revalidate publicznej strony oferty uzywa zwalidowanego `safeOfferId`.

Weryfikacja partii 31:

- `npm.cmd run lint` - OK.
- `npx.cmd tsc --noEmit` - OK.
- `npm.cmd run build` - OK.
- `npm.cmd audit --omit=dev --audit-level=moderate` - OK, 0 podatnosci.
- `git diff --check -- app/app/company/offers/_actions.ts` - OK, tylko ostrzezenie Windows LF->CRLF.
- `npm.cmd run check:preview` przy lokalnym `next start` - FAIL tylko na znanych blokadach preview: `NEXT_PUBLIC_APP_URL` nie uzywa HTTPS oraz brak aktywnego webhooka Stripe dla `http://localhost:3000/api/stripe/webhook`; HTTP smoke w checku przechodzi.
- `npm.cmd run test:mvp-scenarios` przy lokalnym `next start` - 26/28 OK; pozostaja te same 2 blokery zewnetrzne: payout Stripe studenta pending przez niegotowe konto Connect oraz brak `TEST_COMPANY_EMAIL/PASSWORD` i `TEST_STUDENT_EMAIL/PASSWORD` dla UI authenticated role scenarios.

### P1-20: Wdrozone w partii 32 - wejscia i lookupi czatu

Zakres: `app/app/chat/_actions.ts`.

Dowod przed poprawka:

- `getOlderMessages`, `openChatForApplication`, `openChatForOfferInquiry` i centralne `validateParticipant` przyjmowaly identyfikatory bez runtime UUID validation.
- `openChatForApplication` rzucal `appErr?.message` z Supabase do UI.
- Bledy lookupu profilu/oferty/rozmowy przy inicjowaniu inquiry mogly byc traktowane jak zwykly brak uprawnien albo brak rekordu.
- `getOlderMessages` przyjmowal dowolny kursor daty i `pageSize`, gdzie `NaN` moglo przejsc przez clamp jako nieoczywisty przypadek.

Wdrozone:

- Dodano wspolny `parseChatUuid` z runtime guardem typu, zakazem whitespace i `uuidSchema`.
- Dodano walidacje kursora paginacji wiadomosci i odporny clamp `pageSize` do zakresu 1-100.
- `getOlderMessages` loguje bledy lookupu rozmowy i pobierania wiadomosci przez `logCriticalError`.
- `openChatForApplication` uzywa zwalidowanego `safeApplicationId`, `maybeSingle()` i nie zwraca surowego `appErr?.message`.
- `openChatForOfferInquiry` uzywa zwalidowanego `safeOfferId`, rozroznia blad Supabase od braku rekordu i loguje awarie profilu/oferty/istniejacej rozmowy/inserta.
- Centralne `validateParticipant` waliduje UUID rozmowy i loguje realne bledy lookupu rozmowy; brak rozmowy pozostaje kontrolowanym bledem domenowym.

Weryfikacja partii 32:

- `npm.cmd run lint` - OK.
- `npx.cmd tsc --noEmit` - OK.
- `npm.cmd run build` - OK.
- `npm.cmd audit --omit=dev --audit-level=moderate` - OK, 0 podatnosci.
- `git diff --check -- app/app/chat/_actions.ts` - OK, tylko ostrzezenie Windows LF->CRLF.
- `npm.cmd run check:preview` przy lokalnym `next start` - FAIL tylko na znanych blokadach preview: `NEXT_PUBLIC_APP_URL` nie uzywa HTTPS oraz brak aktywnego webhooka Stripe dla `http://localhost:3000/api/stripe/webhook`; HTTP smoke w checku przechodzi.
- `npm.cmd run test:mvp-scenarios` przy lokalnym `next start` - 26/28 OK; pozostaja te same 2 blokery zewnetrzne: payout Stripe studenta pending przez niegotowe konto Connect oraz brak `TEST_COMPANY_EMAIL/PASSWORD` i `TEST_STUDENT_EMAIL/PASSWORD` dla UI authenticated role scenarios.

### P1-21: Wdrozone w partii 33 - helper rozmow dla aplikacji i service orders

Zakres: `lib/services/service-order-conversations.ts`.

Dowod przed poprawka:

- `ensureConversationForApplication` i `ensureConversationForServiceOrder` rzucaly surowe `error?.message` z Supabase przy nieudanym insercie rozmowy.
- `findConversationByColumn` ignorowal blad `maybeSingle()`, co moglo prowadzic do niepotrzebnego inserta albo mylenia awarii bazy z brakiem rozmowy.
- `findConversationForServiceOrder` ignorowal bledy direct/fallback lookupow rozmowy.

Wdrozone:

- Lookup rozmowy po `application_id` / `service_order_id` przerywa stale kontrolowanym bledem, jesli Supabase zwroci `error`.
- Inserty rozmow dla aplikacji i service orders nie propagują juz `error?.message`; UI/wywolujacy dostaje staly polski komunikat.
- Direct i fallback lookup w `findConversationForServiceOrder` rozrozniaja blad bazy od braku rekordu.
- Zachowano dotychczasowa obsluge duplicate-key race: przy `23505` helper ponawia lookup i zwraca istniejaca rozmowe.

Weryfikacja partii 33:

- `npm.cmd run lint` - OK.
- `npx.cmd tsc --noEmit` - OK.
- `npm.cmd run build` - OK.
- `npm.cmd audit --omit=dev --audit-level=moderate` - OK, 0 podatnosci.
- `git diff --check -- lib/services/service-order-conversations.ts app/app/chat/_actions.ts` - OK, tylko ostrzezenie Windows LF->CRLF.
- `npm.cmd run check:preview` przy lokalnym `next start` - FAIL tylko na znanych blokadach preview: `NEXT_PUBLIC_APP_URL` nie uzywa HTTPS oraz brak aktywnego webhooka Stripe dla `http://localhost:3000/api/stripe/webhook`; HTTP smoke w checku przechodzi.
- `npm.cmd run test:mvp-scenarios` przy lokalnym `next start` - 26/28 OK; pozostaja te same 2 blokery zewnetrzne: payout Stripe studenta pending przez niegotowe konto Connect oraz brak `TEST_COMPANY_EMAIL/PASSWORD` i `TEST_STUDENT_EMAIL/PASSWORD` dla UI authenticated role scenarios.

### P1-22: Wdrozone w partii 34 - zamykanie rozmow po odrzuceniu aplikacji

Zakres: `lib/services/application-chat-closure.ts`.

Dowod przed poprawka:

- `rejectCompetingApplicationsForOffer` propagowal surowe `error.message` z Supabase przy lookupu aplikacji, update statusow i anulowaniu kontraktow.
- `closeRejectedApplicationConversation` ignorowal bledy update rozmowy, zliczania istniejacych komunikatow `offer_closed` i inserta komunikatu systemowego.
- W przypadku awarii bazy wywolujacy mogl dostac techniczny komunikat albo system mogl zostawic niespojny stan bez logu operacyjnego.

Wdrozone:

- Dodano lokalny wrapper logowania przez `logCriticalError` z bezpiecznym kontekstem operacji aplikacji/oferty/rozmowy.
- Wszystkie krytyczne zapisy i lookupi w zamykaniu rozmowy sprawdzaja `error` i rzucaja stale polskie komunikaty domenowe.
- Odrzucanie konkurencyjnych aplikacji nie zwraca juz surowych komunikatow Supabase; szczegoly techniczne trafiaja do `error_logs`/Sentry.
- Zachowano dotychczasowy flow biznesowy: najpierw odrzucenie konkurencyjnych aplikacji, opcjonalne anulowanie kontraktow, potem zamkniecie rozmow i komunikat systemowy.

Weryfikacja partii 34:

- `rg -n "error\\.message|error\\?\\.message|throw new Error\\([^\\n]*message" lib/services/application-chat-closure.ts` - OK, brak wynikow.
- `npm.cmd run lint` - OK.
- `npx.cmd tsc --noEmit` - OK.
- `npm.cmd run build` - OK.
- `npm.cmd audit --omit=dev --audit-level=moderate` - OK, 0 podatnosci po ponowieniu z dostepem sieciowym.
- `git diff --check -- lib/services/application-chat-closure.ts` - OK, tylko ostrzezenie Windows LF->CRLF.
- `npm.cmd run check:preview` przy lokalnym `next start` - FAIL tylko na znanych blokadach preview: `NEXT_PUBLIC_APP_URL` nie uzywa HTTPS oraz brak aktywnego webhooka Stripe dla `http://localhost:3000/api/stripe/webhook`; HTTP smoke w checku przechodzi.
- `npm.cmd run test:mvp-scenarios` przy lokalnym `next start` - 26/28 OK; pozostaja te same 2 blokery zewnetrzne: payout Stripe studenta pending przez niegotowe konto Connect oraz brak `TEST_COMPANY_EMAIL/PASSWORD` i `TEST_STUDENT_EMAIL/PASSWORD` dla UI authenticated role scenarios.

### P1-23: Wdrozone w partii 35 - akcje aplikacji po stronie firmy

Zakres: `app/app/company/applications/_actions.ts`.

Dowod przed poprawka:

- `acceptApplication`, `rejectApplication` i `counterOffer` przyjmowaly `applicationId` bez runtime UUID validation.
- Helpery `hasAnotherLockedApplication` i `insertChatMessage` propagowaly surowe `error.message` z Supabase.
- Akceptacja aplikacji ignorowala blad RPC `ensure_contract_for_application`, co moglo zostawic zaakceptowana aplikacje bez kontraktu/milestone.
- Lookup/update konkurencyjnych aplikacji oraz lookup rozmowy do rewalidacji mialy silent failure albo mylily awarie bazy z brakiem rekordu.

Wdrozone:

- Dodano `parseApplicationId` oparte o `uuidSchema`; wszystkie trzy server actions uzywaja zwalidowanego ID w query, RPC, notyfikacjach i rewalidacjach.
- Dodano lokalne logowanie przez `logCriticalError` z kontekstem aplikacji/oferty/rozmowy.
- Usunieto propagacje surowych `error.message` Supabase z akceptacji, odrzucenia, kontroferty, lookupu lockow i inserta wiadomosci.
- RPC kontraktu po akceptacji jest sprawdzane; awaria trafia do logu i zwraca staly komunikat domenowy.
- Lookup/update pozostalych zgloszen oraz lookup rozmowy do rewalidacji maja jawne error paths.

Weryfikacja partii 35:

- `rg -n 'application_id: applicationId|\\.eq\\("id", applicationId\\)|\\.neq\\("id", applicationId\\)|p_application_id: applicationId|error\\.message|error\\?\\.message' app/app/company/applications/_actions.ts` - OK, brak wynikow dla niezwalidowanych query i raw error propagation.
- `npm.cmd run lint` - OK.
- `npx.cmd tsc --noEmit` - OK.
- `npm.cmd run build` - OK.
- `npm.cmd audit --omit=dev --audit-level=moderate` - OK, 0 podatnosci.
- `git diff --check -- app/app/company/applications/_actions.ts` - OK, tylko ostrzezenie Windows LF->CRLF.
- `npm.cmd run check:preview` przy lokalnym `next start` - FAIL tylko na znanych blokadach preview: `NEXT_PUBLIC_APP_URL` nie uzywa HTTPS oraz brak aktywnego webhooka Stripe dla `http://localhost:3000/api/stripe/webhook`; HTTP smoke w checku przechodzi.
- `npm.cmd run test:mvp-scenarios` przy lokalnym `next start` - 26/28 OK; pozostaja te same 2 blokery zewnetrzne: payout Stripe studenta pending przez niegotowe konto Connect oraz brak `TEST_COMPANY_EMAIL/PASSWORD` i `TEST_STUDENT_EMAIL/PASSWORD` dla UI authenticated role scenarios.

### P1-24: Wdrozone w partii 36 - legacy flow zamowien i inquiry

Zakres: `app/app/orders/create/[packageId]/_actions.ts`.

Dowod przed poprawka:

- Insert `service_orders` propagowal surowe `error.message` Supabase do wywolujacego.
- Lookup profilu/pakietu/istniejacej rozmowy i inserty wiadomosci w `startInquiry` nie mialy pelnej obslugi bledow.
- Dwa inserty wiadomosci po utworzeniu legacy service order ignorowaly wynik Supabase.
- Kwota zamowienia byla brana z DB/wariantu, ale nie bylo guardu na `NaN` albo wartosc niedodatnia po konwersji.

Wdrozone:

- Dodano logowanie przez `logCriticalError` dla create-order/inquiry z kontekstem pakietu, zamowienia i rozmowy.
- Lookup profilu i pakietu rozrozniaja blad Supabase od braku uprawnien/rekordu.
- Insert `service_orders` zwraca staly polski komunikat, a szczegoly bazy trafiaja do logu.
- Dodano guard ceny pakietu/wariantu przed insertem zamowienia.
- Inserty wiadomosci inquiry oraz details sprawdzaja `error` i przerywaja stalym komunikatem, zamiast zostawiac silent failure.
- `startInquiry` sprawdza blad lookupu istniejacej rozmowy, blad utworzenia rozmowy i blad wyslania wiadomosci.

Weryfikacja partii 36:

- `rg -n 'error\\.message|error\\?\\.message|Package not found|Unauthorized|Cannot start inquiry|Failed to create conversation' app/app/orders/create/[packageId]/_actions.ts` - OK, brak wynikow.
- `npm.cmd run lint` - OK.
- `npx.cmd tsc --noEmit` - OK.
- `npm.cmd run build` - OK.
- `npm.cmd audit --omit=dev --audit-level=moderate` - OK, 0 podatnosci.
- `git diff --check -- app/app/orders/create/[packageId]/_actions.ts` - OK, tylko ostrzezenie Windows LF->CRLF.
- `npm.cmd run check:preview` przy lokalnym `next start` - FAIL tylko na znanych blokadach preview: `NEXT_PUBLIC_APP_URL` nie uzywa HTTPS oraz brak aktywnego webhooka Stripe dla `http://localhost:3000/api/stripe/webhook`; HTTP smoke w checku przechodzi.
- `npm.cmd run test:mvp-scenarios` przy lokalnym `next start` - 26/28 OK; pozostaja te same 2 blokery zewnetrzne: payout Stripe studenta pending przez niegotowe konto Connect oraz brak `TEST_COMPANY_EMAIL/PASSWORD` i `TEST_STUDENT_EMAIL/PASSWORD` dla UI authenticated role scenarios.

### P1-25: Wdrozone w partii 37 - akcje powiadomien

Zakres: `app/app/notifications/_actions.ts`.

Dowod przed poprawka:

- `markNotificationRead` i `markAllNotificationsRead` propagowaly surowe `error.message` Supabase.
- `markNotificationRead` przyjmowal `id` bez runtime UUID validation.
- `getRecentNotifications` przyjmowal dowolny `limit` i ignorowal blad pobierania powiadomien.

Wdrozone:

- Dodano `parseNotificationId` na bazie `uuidSchema`.
- Dodano clamp limitu listy powiadomien do zakresu 1-50.
- Mutacje powiadomien loguja awarie przez `logCriticalError` i zwracaja stale polskie komunikaty.
- Lista ostatnich powiadomien loguje blad pobierania i bezpiecznie zwraca pusta liste.

Weryfikacja partii 37:

- `rg -n 'error\\.message|error\\?\\.message|\\.eq\\("id", id\\)|\\.limit\\(limit\\)' app/app/notifications/_actions.ts` - OK, brak wynikow.
- `npm.cmd run lint` - OK.
- `npx.cmd tsc --noEmit` - OK.
- `npm.cmd run build` - OK.
- `npm.cmd audit --omit=dev --audit-level=moderate` - OK, 0 podatnosci.
- `git diff --check -- app/app/notifications/_actions.ts` - OK, tylko ostrzezenie Windows LF->CRLF.
- `npm.cmd run check:preview` przy lokalnym `next start` - FAIL tylko na znanych blokadach preview: `NEXT_PUBLIC_APP_URL` nie uzywa HTTPS oraz brak aktywnego webhooka Stripe dla `http://localhost:3000/api/stripe/webhook`; HTTP smoke w checku przechodzi.
- `npm.cmd run test:mvp-scenarios` przy lokalnym `next start` - 26/28 OK; pozostaja te same 2 blokery zewnetrzne: payout Stripe studenta pending przez niegotowe konto Connect oraz brak `TEST_COMPANY_EMAIL/PASSWORD` i `TEST_STUDENT_EMAIL/PASSWORD` dla UI authenticated role scenarios.

### P1-26: Wdrozone w partii 38 - akcje pakietow uslug

Zakres: `app/app/services/_actions.ts`.

Dowod przed poprawka:

- `createOfferFromSystemPackage`, `createInquiryAction`, `deleteServiceAction`, `createServiceAction`, `updateServiceAction` i `toggleServiceStatusAction` nadal mialy raw Supabase `error.message` na sciezkach insert/update/delete.
- `createOfferFromSystemPackage` i `createInquiryAction` uzywaly `packageId` bez runtime UUID validation.
- Wspolny `assertUserRole` traktowal blad lookupu profilu jak zwykly brak roli.
- Lookupi ownership dla uslug uzywaly `.single()` i mogly mieszac blad DB z brakiem rekordu.
- Insert notyfikacji w legacy inquiry byl ignorowany bez logu.

Wdrozone:

- Dodano `logServiceActionError` oparte o `logCriticalError` z kontekstem uslugi/pakietu/oferty/zamowienia.
- `assertUserRole` loguje realne bledy profilu i zwraca staly polski komunikat.
- Legacy akcje pakietow waliduja `packageId` przez `uuidInputSchema`.
- Raw `error.message` w insert/update/delete pakietow uslug i legacy inquiry/offer zastapiono stalymi komunikatami po polsku oraz logiem technicznym.
- Lookupi ownership w `delete/update/toggle` uzywaja `maybeSingle()` z jawnym error path.
- Awaria notyfikacji inquiry jest logowana, ale nie blokuje przejscia do rozmowy.

Weryfikacja partii 38:

- `rg -n 'offerErr\\.message|orderError\\.message|if \\(error\\) throw new Error\\(error\\.message\\)|console\\.error\\(' app/app/services/_actions.ts` - OK dla edytowanego zakresu; pozostale wyniki w pliku dotycza innych sciezek negocjacji do kolejnych partii.
- `npm.cmd run lint` - OK.
- `npx.cmd tsc --noEmit` - OK.
- `npm.cmd run build` - OK.
- `npm.cmd audit --omit=dev --audit-level=moderate` - OK, 0 podatnosci.
- `git diff --check -- app/app/services/_actions.ts` - OK, tylko ostrzezenie Windows LF->CRLF.
- `npm.cmd run check:preview` przy lokalnym `next start` - FAIL tylko na znanych blokadach preview: `NEXT_PUBLIC_APP_URL` nie uzywa HTTPS oraz brak aktywnego webhooka Stripe dla `http://localhost:3000/api/stripe/webhook`; HTTP smoke w checku przechodzi.
- `npm.cmd run test:mvp-scenarios` przy lokalnym `next start` - 26/28 OK; pozostaja te same 2 blokery zewnetrzne: payout Stripe studenta pending przez niegotowe konto Connect oraz brak `TEST_COMPANY_EMAIL/PASSWORD` i `TEST_STUDENT_EMAIL/PASSWORD` dla UI authenticated role scenarios.

### P1-27: Wdrozone w partii 39 - negocjacje service orders

Zakres: druga polowa `app/app/services/_actions.ts`, czyli prywatne propozycje, quote/counter/accept/reject, wybor studenta przez firme i potwierdzenie realizacji przez studenta.

Dowod przed poprawka:

- `createPrivateProposalAction` propagowal raw `insertError?.message` po nieudanym zapisie prywatnej propozycji.
- Czesci flow negocjacji ignorowaly bledy insertow `messages` albo wypisywaly je przez `console.error`.
- Awaria RPC `ensure_contract_for_service_order` po akceptacji oferty/kontroferty/potwierdzeniu wyboru nie byla logowana technicznie.
- `selectCompanyOrderStudentAction` zwracal raw `lockError?.message` z RPC przypisania studenta i ignorowal blad notyfikacji.

Wdrozone:

- Prywatne propozycje loguja bledy lookupu pakietu, lookupu firmy, inserta zlecenia i inserta wiadomosci, a UI dostaje stale komunikaty po polsku.
- Inserty wiadomosci w quote/counter/accept/reject i potwierdzeniu wyboru sa przechwytywane oraz logowane przez `logServiceActionError`.
- RPC kontraktow w `acceptServiceProposalAction`, `acceptServiceCounterAction` i `confirmStudentSelectionAction` loguja szczegoly do `error_logs`.
- RPC przypisania studenta oraz notyfikacja po wyborze studenta maja jawne error paths bez propagowania surowych komunikatow Supabase.
- Dodano helper `insertServiceOrderMessage`, zeby nie gubic awarii system message w potwierdzeniu realizacji.

Weryfikacja partii 39:

- `rg -n 'insertError\\?\\.message|console\\.error\\(|lockError\\?\\.message|await supabase\\.from\\("messages"\\)\\.insert|await supabase\\.from\\("notifications"\\)\\.insert|contractError\\) throw' app/app/services/_actions.ts` - OK dla edytowanego zakresu; pozostale wyniki to przechwycone inserty z jawnym logowaniem.
- `npm.cmd run lint` - OK.
- `npx.cmd tsc --noEmit` - OK.
- `npm.cmd run build` - OK.
- `npm.cmd audit --omit=dev --audit-level=moderate` - OK, 0 podatnosci po ponowieniu z dostepem sieciowym.
- `git diff --check` - OK, tylko ostrzezenia Windows LF->CRLF.
- `npm.cmd run check:preview` przy lokalnym `next start` - FAIL tylko na znanych blokadach preview: `NEXT_PUBLIC_APP_URL` nie uzywa HTTPS oraz brak aktywnego webhooka Stripe dla `http://localhost:3000/api/stripe/webhook`; HTTP smoke w checku przechodzi.
- `npm.cmd run test:mvp-scenarios` przy lokalnym `next start` - 26/28 OK; pozostaja te same 2 blokery zewnetrzne: payout Stripe studenta pending przez niegotowe konto Connect oraz brak `TEST_COMPANY_EMAIL/PASSWORD` i `TEST_STUDENT_EMAIL/PASSWORD` dla UI authenticated role scenarios.

### P1-28: Wdrozone w partii 40 - Stripe verify-payment error handling

Zakres: `app/api/stripe/verify-payment/route.ts`.

Dowod przed poprawka:

- Endpoint logowal krytyczne sciezki przez `console.error` mimo rownoleglego `logCriticalError`.
- Awaria `process_stripe_payment_v4` skladala techniczny `rpcError.message` w rzucanym bledzie.
- Awaria synchronizacji `service_orders` skladala `serviceOrderSyncError.message` w rzucanym bledzie.
- Lookup aplikacji w sesji platnosci mogl propagowac `targetApplicationError?.message`.
- Blad lookupu kontraktu byl traktowany jak brak dostepu, bez wpisu do `error_logs`.

Wdrozone:

- Dodano jawne logowanie bledow lookupu kontraktu i aplikacji do `error_logs` z kontekstem Stripe session/contract/user.
- Usunieto `console.error` z endpointu `verify-payment`; szczegoly techniczne ida przez `logCriticalError`.
- Raw `rpcError.message`, `serviceOrderSyncError.message` i `targetApplicationError?.message` zastapiono stalymi komunikatami.
- Zachowano publiczny kontrakt odpowiedzi JSON i polskie komunikaty dla klienta.

Weryfikacja partii 40:

- `rg -n 'console\\.error|throw new Error\\([^\\n]*(rpcError|serviceOrderSyncError|targetApplicationError|contractLookupError)\\.(message|toString)|throw new Error\\([^\\n]*\\+|\\.message' app/api/stripe/verify-payment/route.ts` - OK, brak wynikow.
- `npm.cmd run lint` - OK.
- `npx.cmd tsc --noEmit` - OK.
- `npm.cmd run build` - OK.
- `npm.cmd audit --omit=dev --audit-level=moderate` - OK, 0 podatnosci po ponowieniu z dostepem sieciowym.
- `git diff --check -- app/api/stripe/verify-payment/route.ts` - OK, tylko ostrzezenie Windows LF->CRLF.
- `npm.cmd run check:preview` przy lokalnym `next start` - FAIL tylko na znanych blokadach preview: `NEXT_PUBLIC_APP_URL` nie uzywa HTTPS oraz brak aktywnego webhooka Stripe dla `http://localhost:3000/api/stripe/webhook`; HTTP smoke w checku przechodzi.
- `npm.cmd run test:mvp-scenarios` przy lokalnym `next start` - 26/28 OK; pozostaja te same 2 blokery zewnetrzne: payout Stripe studenta pending przez niegotowe konto Connect oraz brak `TEST_COMPANY_EMAIL/PASSWORD` i `TEST_STUDENT_EMAIL/PASSWORD` dla UI authenticated role scenarios.

### P1-29: Wdrozone w partii 41 - Stripe create-checkout fail-closed logging

Zakres: `app/api/stripe/create-checkout/route.ts`.

Dowod przed poprawka:

- Endpoint mial `console.error`/`console.warn` na sciezkach base URL, zapisu `payments`, ponownego uzycia sesji i catchu globalnego.
- Blad zapisu `payments` logowal raw `paymentError.message` przez `console.error`.
- Bledy lookupow kontraktu, service order, aplikacji, pakietu uslugi, dokumentow umow i pending payment byly ignorowane albo mapowane zbyt ogolnie.
- Przy konflikcie unikalnosci `payments` lookup tej samej/pending sesji mogl nie miec jawnego error path.

Wdrozone:

- Dodano lokalny `logCheckoutError` z jednolitym kontekstem `contractId`, `stripeSessionId`, `userId` i kodem bledu Supabase.
- Usunieto `console.*` z endpointu `create-checkout`; szczegoly trafiaja do `error_logs`/Sentry przez `logCriticalError`.
- Lookupi wplywajace na kwote, prowizje i deduplikacje platnosci failuja kontrolowanie z polskim `{ error }`.
- Brak rekordu `PGRST116` pozostaje walidacyjnym 400/404, a realne bledy DB sa logowane jako 500.
- Przy duplicate `payments` endpoint loguje bledy lookupow sesji i wygasza nowo utworzona sesje, zeby ograniczyc osierocone Checkout Sessions.

Weryfikacja partii 41:

- `rg -n 'console\\.|throw new Error|paymentError\\.message|error\\.message|\\.message' app/api/stripe/create-checkout/route.ts` - OK; jedyne trafienie to `input.message` przekazywane do loggera.
- `npm.cmd run lint` - OK.
- `npx.cmd tsc --noEmit` - OK.
- `npm.cmd run build` - OK.
- `npm.cmd audit --omit=dev --audit-level=moderate` - OK, 0 podatnosci po ponowieniu z dostepem sieciowym.
- `git diff --check -- app/api/stripe/create-checkout/route.ts` - OK, tylko ostrzezenie Windows LF->CRLF.
- `npm.cmd run check:preview` przy lokalnym `next start` - FAIL tylko na znanych blokadach preview: `NEXT_PUBLIC_APP_URL` nie uzywa HTTPS oraz brak aktywnego webhooka Stripe dla `http://localhost:3000/api/stripe/webhook`; HTTP smoke w checku przechodzi.
- `npm.cmd run test:mvp-scenarios` przy lokalnym `next start` - 26/28 OK; pozostaja te same 2 blokery zewnetrzne: payout Stripe studenta pending przez niegotowe konto Connect oraz brak `TEST_COMPANY_EMAIL/PASSWORD` i `TEST_STUDENT_EMAIL/PASSWORD` dla UI authenticated role scenarios.

### P1-30: Wdrozone w partii 42 - Stripe webhook route logging

Zakres: `app/api/stripe/webhook/route.ts`.

Dowod przed poprawka:

- Webhook route dublowal techniczne awarie przez `console.error`, mimo ze krytyczne sciezki mialy juz `logCriticalError`.
- Nieprawidlowy podpis webhooka wypisywal techniczny komunikat do konsoli, chociaz jest to normalny warunek publicznego endpointu.
- Inline processing i enqueue failure logowaly raw message do konsoli.

Wdrozone:

- Usunieto `console.error` z webhook route.
- Brak `STRIPE_WEBHOOK_SECRET`, awaria enqueue i awaria inline processing zostaja logowane przez `logCriticalError`.
- Signature validation nadal uzywa raw body i `stripe.webhooks.constructEvent`, a dla klienta zwraca staly polski 400 bez technicznych detali.
- Publiczny kontrakt `{ received: true }` / `{ error: string }` zostal zachowany.

Weryfikacja partii 42:

- `rg -n 'console\\.|\\.message' app/api/stripe/webhook/route.ts` - OK, brak wynikow.
- `npm.cmd run lint` - OK.
- `npx.cmd tsc --noEmit` - OK.
- `npm.cmd run build` - OK.
- `npm.cmd audit --omit=dev --audit-level=moderate` - OK, 0 podatnosci po ponowieniu z dostepem sieciowym.
- `git diff --check -- app/api/stripe/webhook/route.ts` - OK, tylko ostrzezenie Windows LF->CRLF.
- `npm.cmd run check:preview` przy lokalnym `next start` - FAIL tylko na znanych blokadach preview: `NEXT_PUBLIC_APP_URL` nie uzywa HTTPS oraz brak aktywnego webhooka Stripe dla `http://localhost:3000/api/stripe/webhook`; HTTP smoke w checku przechodzi, w tym unsigned webhook 400.
- `npm.cmd run test:mvp-scenarios` przy lokalnym `next start` - 26/28 OK; pozostaja te same 2 blokery zewnetrzne: payout Stripe studenta pending przez niegotowe konto Connect oraz brak `TEST_COMPANY_EMAIL/PASSWORD` i `TEST_STUDENT_EMAIL/PASSWORD` dla UI authenticated role scenarios.

### P1-31: Wdrozone w partii 43 - cron route logging

Zakres: `app/api/cron/process-stripe-events/route.ts`, `app/api/cron/auto-accept/route.ts`, `app/api/cron/cleanup-expired-sessions/route.ts`.

Dowod przed poprawka:

- Cron route'y dublowaly bledy przez `console.error`/`console.warn`.
- `cleanup-expired-sessions` nie logowal awarii update ani catcha globalnego do `error_logs`.
- Raw `error.message` byl wypisywany do konsoli dla RPC i update failures.

Wdrozone:

- Usunieto `console.*` i raw `.message` z trzech cron route'ow.
- `cleanup-expired-sessions` dostal `logCriticalError` dla braku `CRON_SECRET`, awarii update i catcha globalnego.
- `auto-accept` oraz `process-stripe-events` zachowuja istniejace `logCriticalError`, bez dublowania do konsoli.
- Nieautoryzowane wywolania nadal zwracaja staly polski 401 bez technicznego logowania.

Weryfikacja partii 43:

- `rg -n 'console\\.|\\.message' app/api/cron/process-stripe-events/route.ts app/api/cron/auto-accept/route.ts app/api/cron/cleanup-expired-sessions/route.ts` - OK, brak wynikow.
- `npm.cmd run lint` - OK.
- `npx.cmd tsc --noEmit` - OK.
- `npm.cmd run build` - OK.
- `npm.cmd audit --omit=dev --audit-level=moderate` - OK, 0 podatnosci po ponowieniu z dostepem sieciowym.
- `git diff --check -- app/api/cron/process-stripe-events/route.ts app/api/cron/auto-accept/route.ts app/api/cron/cleanup-expired-sessions/route.ts` - OK, tylko ostrzezenia Windows LF->CRLF.
- `npm.cmd run check:preview` przy lokalnym `next start` - FAIL tylko na znanych blokadach preview: `NEXT_PUBLIC_APP_URL` nie uzywa HTTPS oraz brak aktywnego webhooka Stripe dla `http://localhost:3000/api/stripe/webhook`; HTTP smoke w checku przechodzi.
- `npm.cmd run test:mvp-scenarios` przy lokalnym `next start` - 26/28 OK; cron endpointy bez sekretu zwracaja 401, a pozostale 2 fail to znane blokery zewnetrzne: payout Stripe studenta pending przez niegotowe konto Connect oraz brak `TEST_COMPANY_EMAIL/PASSWORD` i `TEST_STUDENT_EMAIL/PASSWORD`.

### P1-32: Wdrozone w partii 44 - notifications webhook i helper

Zakres: `app/api/webhooks/notifications/route.ts`, `lib/notifications/server.ts`.

Dowod przed poprawka:

- Webhook powiadomien mial `console.error`/`console.info` na sciezkach braku sekretu, braku emaila, braku `RESEND_API_KEY`, bledu Resend i catcha globalnego.
- Centralny `sendNotification` propagowal raw `create_notification failed: ${error.message}`.
- `trySendNotification` tlumil awarie przez `console.error`, bez wpisu do `error_logs`.

Wdrozone:

- Usunieto `console.*` i raw `error.message` z webhooka powiadomien.
- `sendNotification` loguje awarie RPC `create_notification` przez `logCriticalError` i rzuca staly polski blad.
- `trySendNotification` loguje nieblokujace awarie jako warning w `error_logs` zamiast do konsoli.
- Publiczne odpowiedzi webhooka pozostaja polskie i zgodne z `{ error: string }` albo `{ message: string }`.

Weryfikacja partii 44:

- `rg -n 'console\\.|error\\.message|userErr\\?\\.message|create_notification failed' app/api/webhooks/notifications/route.ts lib/notifications/server.ts` - OK, brak wynikow.
- `npm.cmd run lint` - OK.
- `npx.cmd tsc --noEmit` - OK.
- `npm.cmd run build` - OK.
- `npm.cmd audit --omit=dev --audit-level=moderate` - OK, 0 podatnosci po ponowieniu z dostepem sieciowym.
- `git diff --check -- app/api/webhooks/notifications/route.ts lib/notifications/server.ts` - OK, tylko ostrzezenia Windows LF->CRLF.
- `npm.cmd run check:preview` przy lokalnym `next start` - FAIL tylko na znanych blokadach preview: `NEXT_PUBLIC_APP_URL` nie uzywa HTTPS oraz brak aktywnego webhooka Stripe dla `http://localhost:3000/api/stripe/webhook`; HTTP smoke w checku przechodzi.
- `npm.cmd run test:mvp-scenarios` przy lokalnym `next start` - 26/28 OK; notifications webhook bez sekretu zwraca 401, a pozostale 2 fail to znane blokery zewnetrzne: payout Stripe studenta pending przez niegotowe konto Connect oraz brak `TEST_COMPANY_EMAIL/PASSWORD` i `TEST_STUDENT_EMAIL/PASSWORD`.

### P1-33: Wdrozone w partii 45 - Stripe event processor logging

Zakres: `lib/stripe/stripe-event-processor.ts`.

Dowod przed poprawka:

- Procesor zapisywal raw `error.message` Supabase/RPC do rzucanych bledow i dalej do `stripe_events.processing_error`.
- `enqueueStripeEvent` i `processPendingStripeEvents` tracily oryginalny obiekt bledu Supabase, rzucajac tylko zlozony string.
- Oznaczenie eventu jako `processed`, invalid payload oraz update retry metadata nie mialy jawnego error path.
- Invoice generation dublowalo awarie przez `console.error`, mimo ze istnial `logCriticalError`.

Wdrozone:

- Dodano `LoggedStripeProcessorError`, `failStripeProcessor` i `processingErrorMessage`, aby oryginalny blad trafial do `error_logs`, a `processing_error` pozostawal stabilnym komunikatem.
- Raw Supabase/RPC messages w enqueue, queue load, payment state lookup, contract/application lookup, payment RPC, service order sync, refund RPC i account sync zastapiono stabilnymi bledami.
- Dodano logowanie awarii update'ow kolejki: invalid payload, processed marker i failed retry metadata.
- Usunieto `console.error` z invoice generation path.
- Komunikaty walidacyjne metadanych Stripe nie zawieraja juz session ID w `processing_error`; identyfikator eventu pozostaje w `stripe_event_id` i `error_logs`.

Weryfikacja partii 45:

- `rg -n 'console\\.error|throw new Error\\(`|paymentStatusError\\.message|contractError\\.message|rpcError\\.message|serviceOrderSyncError\\.message|refundError\\.message|paymentError\\.message|error\\.message' lib/stripe/stripe-event-processor.ts` - OK; jedyne `.message` to stabilny `LoggedStripeProcessorError`.
- `npm.cmd run lint` - OK.
- `npx.cmd tsc --noEmit` - OK.
- `npm.cmd run build` - OK.
- `npm.cmd audit --omit=dev --audit-level=moderate` - OK, 0 podatnosci po ponowieniu z dostepem sieciowym.
- `git diff --check -- lib/stripe/stripe-event-processor.ts` - OK, tylko ostrzezenie Windows LF->CRLF.
- `npm.cmd run check:preview` przy lokalnym `next start` - FAIL tylko na znanych blokadach preview: `NEXT_PUBLIC_APP_URL` nie uzywa HTTPS oraz brak aktywnego webhooka Stripe dla `http://localhost:3000/api/stripe/webhook`; HTTP smoke w checku przechodzi.
- `npm.cmd run test:mvp-scenarios` przy lokalnym `next start` - 26/28 OK; pozostaja te same 2 blokery zewnetrzne: payout Stripe studenta pending przez niegotowe konto Connect oraz brak `TEST_COMPANY_EMAIL/PASSWORD` i `TEST_STUDENT_EMAIL/PASSWORD`.

### P1-34: Wdrozone w partii 46 - Stripe payouts i admin payout actions

Zakres: `lib/stripe/payouts.ts`, `app/app/admin/payouts/_actions.ts`.

Dowod przed poprawka:

- Helper payoutow laczyl raw `error.message` Supabase z komunikatami zwracanymi do admina i zapisywanymi w `stripe_transfer_error`.
- `recordPayoutTransferError`, oznaczenie `processing` oraz zapis `stripe_transfer_id` ignorowaly bledy update.
- Admin payout actions logowaly awarie przez `console.error` i uzywaly `rpcError?.message` do fallbacku RPC.
- Awaria transferu Stripe mogla trafic do UI jako raw `error.message` przez `resolvePayoutError`.

Wdrozone:

- Dodano `logPayoutTransferError` w helperze i `logAdminPayoutError` w server actions.
- Raw Supabase/Stripe messages zastapiono stalymi komunikatami; bezpieczne komunikaty biznesowe nadal sa pokazywane adminowi.
- Dodano error handling dla update'u `processing`, zapisu `stripe_transfer_id` i `recordPayoutTransferError`.
- `process_payout_paid_v1` fallback opiera sie na kodzie `PGRST202`, nie na raw message.
- Usunieto `console.*` z admin payout actions.

Weryfikacja partii 46:

- `rg -n 'console\\.|error\\.message|\\.message\\?\\.includes|throw new Error\\([^\\n]*\\+|studentStripeError\\.message|rpcError\\?\\.message' lib/stripe/payouts.ts app/app/admin/payouts/_actions.ts` - OK; jedyne `.message` jest filtrowane przez whitelistę bezpiecznych komunikatow biznesowych.
- `npm.cmd run lint` - OK.
- `npx.cmd tsc --noEmit` - OK.
- `npm.cmd run build` - OK.
- `npm.cmd audit --omit=dev --audit-level=moderate` - OK, 0 podatnosci po ponowieniu z dostepem sieciowym.
- `git diff --check -- lib/stripe/payouts.ts app/app/admin/payouts/_actions.ts` - OK, tylko ostrzezenia Windows LF->CRLF.
- `npm.cmd run check:preview` przy lokalnym `next start` - FAIL tylko na znanych blokadach preview: `NEXT_PUBLIC_APP_URL` nie uzywa HTTPS oraz brak aktywnego webhooka Stripe dla `http://localhost:3000/api/stripe/webhook`; HTTP smoke w checku przechodzi.
- `npm.cmd run test:mvp-scenarios` przy lokalnym `next start` - 26/28 OK; payout Stripe studenta nadal pending przez niegotowe konto Connect, a drugi znany blocker to brak `TEST_COMPANY_EMAIL/PASSWORD` i `TEST_STUDENT_EMAIL/PASSWORD`.

### P1-35: Wdrozone w partii 47 - generator faktur PDF

Zakres: `lib/pdf/generate-invoice.ts`.

Dowod przed poprawka:

- Helpery upload/RPC/update/upsert rzucaly raw `error.message` Supabase/Storage.
- `generateCompanyInvoice` i `generateStudentInvoice` tlumily awarie przez `console.error` i zwracaly `null` bez wpisu do `error_logs`.
- Lookupy kontraktu, firmy, studenta, auth usera i istniejacych dokumentow mialy ciche albo konsolowe error paths.
- Cleanup tymczasowych PDF-ow draftu ignorowal blad usuniecia.

Wdrozone:

- Dodano `LoggedInvoiceError`, `failInvoiceOperation` i `logInvoiceWarning`.
- Raw bledy Supabase Storage/RPC/DB zostaly zastapione stabilnymi komunikatami i logowaniem do `error_logs`.
- Jawne error paths dla lookupow kontraktu, profilu firmy/studenta, auth usera, istniejacych faktur i `contract_documents`.
- Cleanup tymczasowych PDF-ow draftu loguje warning przy awarii, ale nie blokuje poprawnie wystawionej faktury.
- Layout i tresc PDF pozostaly bez zmian.

Weryfikacja partii 47:

- `rg -n 'console\\.|error\\.message|throw new Error\\(`|Upload PDF failed|Invoice RPC failed|Invoice update failed|Contract document upsert failed' lib/pdf/generate-invoice.ts` - OK, brak wynikow.
- `npm.cmd run lint` - OK.
- `npx.cmd tsc --noEmit` - OK.
- `npm.cmd run build` - OK.
- `npm.cmd audit --omit=dev --audit-level=moderate` - OK, 0 podatnosci po ponowieniu z dostepem sieciowym.
- `git diff --check -- lib/pdf/generate-invoice.ts` - OK, tylko ostrzezenie Windows LF->CRLF.
- `npm.cmd run check:preview` przy lokalnym `next start` - FAIL tylko na znanych blokadach preview: `NEXT_PUBLIC_APP_URL` nie uzywa HTTPS oraz brak aktywnego webhooka Stripe dla `http://localhost:3000/api/stripe/webhook`; HTTP smoke w checku przechodzi.
- `npm.cmd run test:mvp-scenarios` przy lokalnym `next start` - 26/28 OK; dowod faktury firmy przechodzi, a pozostale 2 fail to znane blokery zewnetrzne: payout Stripe studenta pending przez niegotowe konto Connect oraz brak testowych credentiali UI.

### P1-36: Wdrozone w partii 48 - deliverables, dokumenty i skutki uboczne finansowe

Zakres: `app/app/deliverables/_actions.ts`.

Dowod przed poprawka:

- Akceptacja milestone'a logowala nieblokujace awarie faktury studenta i automatycznej wyplaty przez `console.error` / `console.warn`.
- Generowanie umow A/B logowalo awarie pobrania etapow, guardu `contract_documents`, uploadu PDF, insertu dokumentow i `documents_generated_at` do konsoli.
- Akceptacja dokumentu kontraktu zwracala stabilne komunikaty, ale nie zapisywala awarii update'u `contract_documents` / `contracts` do `error_logs`.
- Cofniecie negocjacji milestone'ow nie sprawdzalo wyniku update'u `milestone_drafts` ani usuniecia niezaakceptowanych `contract_documents`.

Wdrozone:

- Dodano lokalny helper `logDeliverableActionError` oparty o `logCriticalError`, z kontekstem: `contractId`, `milestoneId`, `applicationId`, `serviceOrderId`, `documentType`, `storagePath`.
- Nieblokujace awarie faktury studenta i automatycznego payoutu po akceptacji milestone'a sa logowane jako `warning`, bez blokowania glownej decyzji firmy.
- Krytyczne awarie generowania umow A/B sa zapisywane w `error_logs`, a UI dostaje stale polskie komunikaty bez raw Supabase/Storage message.
- Akceptacja umowy A/B loguje bledy odczytu dokumentu oraz update'ow timestampow/IP na poziomie dokumentu i kontraktu.
- Cofniecie negocjacji milestone'ow failuje jawnie i loguje awarie update'u draftow oraz kasowania niezaakceptowanych dokumentow.

Weryfikacja partii 48:

- `rg -n 'console\\.error|console\\.warn' app/app/deliverables/_actions.ts` - OK, brak wynikow.
- `npm.cmd run lint` - OK.
- `npx.cmd tsc --noEmit --pretty false` - OK.
- `npm.cmd run build` - OK.
- `npm.cmd audit --omit=dev --audit-level=moderate` - OK, 0 podatnosci.
- `git diff --check -- app/app/deliverables/_actions.ts AUDIT_FULL_CODEBASE_2026-06-26.md AUDIT_FIX_BACKLOG_2026-06-26.md` - OK dla pliku kodu, tylko ostrzezenie Windows LF->CRLF; raporty sa untracked, sprawdzone osobno przez `rg -n '[ \t]+$'`.
- `npm.cmd run check:preview -- --env-file=.env.local` przy lokalnym `next start`, ponowione poza sandboxem z dostepem do Stripe/Supabase - FAIL tylko na znanych blokadach preview: `NEXT_PUBLIC_APP_URL` nie uzywa HTTPS oraz brak aktywnego webhooka Stripe dla `http://localhost:3000/api/stripe/webhook`; Supabase readiness, RLS, functions, private bucket `deliverables` i HTTP smoke przechodza.
- `npm.cmd run test:mvp-scenarios -- --base-url=http://127.0.0.1:3000` przy lokalnym `next start`, ponowione poza sandboxem z dostepem do Stripe/Supabase - 26/28 OK; pozostale 2 fail to znane blokery zewnetrzne: payout Stripe studenta pending przez niegotowe konto Connect oraz brak `TEST_COMPANY_EMAIL/PASSWORD` i `TEST_STUDENT_EMAIL/PASSWORD`.

### P1-37: Wdrozone w partii 49 - admin export i akcje PIT

Zakres: `app/api/admin/export/pit-csv/route.ts`, `app/api/admin/export/invoices-zip/route.ts`, `app/app/admin/pit/_actions.ts`, `app/app/admin/exports/page.tsx`.

Dowod przed poprawka:

- Eksport PIT CSV logowal awarie zapytania przez `console.error` i nie sprawdzal bledow pobrania `student_profiles` ani emaili z Supabase Auth.
- Eksport faktur ZIP logowal awarie pobrania listy faktur i PDF-ow przez `console.error`, w tym techniczne szczegoly storage.
- Akcje oznaczania PIT jako zaplacone logowaly bledy do konsoli zamiast do `error_logs`.
- Klient panelu eksportow pokazywal raw `error.message` z przegladarki w toastach.

Wdrozone:

- Dodano logowanie do `error_logs` dla admin export PIT CSV: profile admina, `pit_withholdings`, `student_profiles` i Auth email lookup.
- Dodano logowanie do `error_logs` dla exportu faktur ZIP: profile admina, query faktur oraz download PDF z private bucket `deliverables`.
- Akcje PIT uzywaja runtime walidacji UUID/batch i loguja awarie update'u z `userId`, `withholdingId` oraz rozmiarem batcha.
- Klient `/app/admin/exports` pokazuje stabilny polski toast przy bledzie sieciowym i ma copy zgodne z realnym ZIP outputem.

Weryfikacja partii 49:

- `rg -n 'console\\.|error\\.message|\\.message\\?\\.|throw new Error\\([^\\n]*\\+' app/api/admin/export/pit-csv/route.ts app/api/admin/export/invoices-zip/route.ts app/app/admin/pit/_actions.ts app/app/admin/exports/page.tsx` - OK, brak wynikow.
- `npm.cmd run lint` - OK.
- `npx.cmd tsc --noEmit --pretty false` - OK.
- `npm.cmd run build` - OK.
- `npm.cmd audit --omit=dev --audit-level=moderate` - OK, 0 podatnosci po ponowieniu z dostepem sieciowym.
- `git diff --check -- app/api/admin/export/pit-csv/route.ts app/api/admin/export/invoices-zip/route.ts app/app/admin/pit/_actions.ts app/app/admin/exports/page.tsx` - OK, tylko ostrzezenia Windows LF->CRLF.
- Supabase changelog `https://supabase.com/changelog.md` sprawdzony dla breaking/storage/auth/RLS; brak zmian wymagajacych korekty obecnego uzycia `supabase-js`/Storage w tej partii.
- `npm.cmd run check:preview -- --env-file=.env.local` przy lokalnym `next start`, ponowione poza sandboxem z dostepem do Stripe/Supabase - FAIL tylko na znanych blokadach preview: `NEXT_PUBLIC_APP_URL` nie uzywa HTTPS oraz brak aktywnego webhooka Stripe dla `http://localhost:3000/api/stripe/webhook`; Supabase readiness, RLS, functions, private bucket `deliverables` i HTTP smoke przechodza.
- `npm.cmd run test:mvp-scenarios -- --base-url=http://127.0.0.1:3000` przy lokalnym `next start`, ponowione poza sandboxem z dostepem do Stripe/Supabase - 26/28 OK; pozostale 2 fail to znane blokery zewnetrzne: payout Stripe studenta pending przez niegotowe konto Connect oraz brak `TEST_COMPANY_EMAIL/PASSWORD` i `TEST_STUDENT_EMAIL/PASSWORD`.

### P1-38: Wdrozone w partii 50 - admin Legal Vault i naprawa PDF

Zakres: `app/app/admin/vault/_actions.ts`, `app/app/admin/vault/page.tsx`.

Dowod przed poprawka:

- Server actions Legal Vault logowaly awarie pobrania dokumentow, backfillu PDF i pojedynczej naprawy PDF przez `console.error`.
- Tworzenie signed URL dla dokumentow kontraktowych zapisywalo raw `error.message` w wyniku pomocniczym i nie mialo observability.
- Strona Legal Vault pokazywala raw `error.message` przy awarii glownego query kontraktow.
- Pomocnicze query dokumentow/faktur i masowe signed URL w panelu ignorowaly bledy.

Wdrozone:

- Dodano `logAdminVaultError` i `logVaultPageError` oparte o `logCriticalError`.
- Awarie pobrania dokumentow, query kontraktow, query dokumentow, backfillu PDF i pojedynczej naprawy PDF trafiaja do `error_logs` z `contractId`, `userId` albo licznikami zakresu.
- Signed URL failures dla private bucket `deliverables` sa logowane jako `warning`, bez wycieku raw storage message do UI.
- Strona Legal Vault pokazuje stabilny polski komunikat przy krytycznym bledzie i loguje pomocnicze awarie summary jako warning.

Weryfikacja partii 50:

- `rg -n 'console\\.|error\\.message|\\.message\\?\\.|throw new Error\\([^\\n]*\\+' app/app/admin/vault/_actions.ts app/app/admin/vault/page.tsx` - OK poza techniczna detekcja `NEXT_REDIRECT` w server action.
- `npm.cmd run lint` - OK.
- `npx.cmd tsc --noEmit --pretty false` - OK.
- `npm.cmd run build` - OK.
- `npm.cmd audit --omit=dev --audit-level=moderate` - OK, 0 podatnosci po ponowieniu z dostepem sieciowym.
- `git diff --check -- app/app/admin/vault/_actions.ts app/app/admin/vault/page.tsx` - OK, tylko ostrzezenia Windows LF->CRLF.
- Supabase changelog `https://supabase.com/changelog.md` sprawdzony dla breaking/storage/auth/RLS; brak zmian wymagajacych korekty obecnego uzycia `supabase-js`/Storage w tej partii.
- `npm.cmd run check:preview -- --env-file=.env.local` przy lokalnym `next start`, ponowione poza sandboxem z dostepem do Stripe/Supabase - FAIL tylko na znanych blokadach preview: `NEXT_PUBLIC_APP_URL` nie uzywa HTTPS oraz brak aktywnego webhooka Stripe dla `http://localhost:3000/api/stripe/webhook`; Supabase readiness, RLS, functions, private bucket `deliverables` i HTTP smoke przechodza.
- `npm.cmd run test:mvp-scenarios -- --base-url=http://127.0.0.1:3000` przy lokalnym `next start`, ponowione poza sandboxem z dostepem do Stripe/Supabase - 26/28 OK; pozostale 2 fail to znane blokery zewnetrzne: payout Stripe studenta pending przez niegotowe konto Connect oraz brak `TEST_COMPANY_EMAIL/PASSWORD` i `TEST_STUDENT_EMAIL/PASSWORD`.

### P1-39: Wdrozone w partii 51 - storage upload route

Zakres: `app/api/storage/upload/route.ts`.

Dowod przed poprawka:

- Endpoint uploadu logowal awarie Supabase Storage przez `console.error` z raw `uploadError.message`.
- Catch zwracal `error.message` z dowolnego wyjatku jako `{ error }`, co moglo ujawnic techniczne komunikaty z helperow/SDK.
- Lookup roli, rozmowy, aplikacji i service order nie sprawdzal bledow Supabase query, przez co awarie DB mogly wygladac jak zwykly brak dostepu.
- Bledy ownership dla rozmow/zlecen nie mialy statusu kontrolowanego przez lokalny typ.

Wdrozone:

- Dodano `UploadRequestError`, `readErrorCode` i `logUploadRouteError`.
- Lookup roli i ownership dla rozmow/zlecen loguje awarie do `error_logs` i zwraca stabilne polskie komunikaty.
- Storage upload failure loguje `storage.upload.failed` z kontekstem bucket/purpose/contentType/size/storagePath.
- Nieoczekiwany catch loguje `storage.upload.unhandled` i zwraca stabilny 500; kontrolowane odmowy nadal zwracaja polskie `{ error }` z odpowiednim statusem.
- Usunieto `console.error` i raw SDK message z odpowiedzi uploadu.

Weryfikacja partii 51:

- `rg -n 'console\\.|error\\.message|\\.message\\?\\.|throw new Error\\([^\\n]*\\+|logCriticalError\\(' app/api/storage/upload/route.ts` - OK; jedyne `error.message` to kontrolowany `UploadRequestError`, a `logCriticalError` jest przez lokalny helper.
- `npm.cmd run lint` - OK.
- `npx.cmd tsc --noEmit --pretty false` - OK.
- `npm.cmd run build` - OK.
- `npm.cmd audit --omit=dev --audit-level=moderate` - OK, 0 podatnosci.
- `git diff --check -- app/api/storage/upload/route.ts` - OK, tylko ostrzezenie Windows LF->CRLF.
- Supabase changelog `https://supabase.com/changelog.md` sprawdzony dla breaking/storage/auth/RLS; brak zmian wymagajacych korekty obecnego uzycia `supabase-js`/Storage w tej partii.
- `npm.cmd run check:preview -- --env-file=.env.local` przy lokalnym `next start`, ponowione poza sandboxem z dostepem do Stripe/Supabase - FAIL tylko na znanych blokadach preview: `NEXT_PUBLIC_APP_URL` nie uzywa HTTPS oraz brak aktywnego webhooka Stripe dla `http://localhost:3000/api/stripe/webhook`; Supabase readiness, RLS, functions, private bucket `deliverables` i HTTP smoke przechodza.
- `npm.cmd run test:mvp-scenarios -- --base-url=http://127.0.0.1:3000` przy lokalnym `next start`, ponowione poza sandboxem z dostepem do Stripe/Supabase - 26/28 OK; upload bez auth nadal zwraca 403, a pozostale 2 fail to znane blokery zewnetrzne: payout Stripe studenta pending przez niegotowe konto Connect oraz brak `TEST_COMPANY_EMAIL/PASSWORD` i `TEST_STUDENT_EMAIL/PASSWORD`.

### P1-40: Wdrozone w partii 52 - Stripe Connect onboarding route

Zakres: `app/api/stripe/connect/onboarding/route.ts`.

Dowod przed poprawka:

- Trasa Stripe Connect onboarding logowala nieoczekiwane awarie przez `console.error`.
- `supabase.auth.getUser()`, lookup `profiles` i lookup `student_profiles` ignorowaly `error`, przez co awarie Supabase mogly wygladac jak brak roli albo pusty profil.
- Utworzenie konta Stripe i generowanie linkow onboarding/login nie mialo rozdzielonych source codes w observability.
- Aktualizacja `stripe_onboarding_completed_at` byla wykonywana bez sprawdzenia bledu.

Wdrozone:

- Dodano `logStripeConnectOnboardingError` oparty o `logCriticalError`, z osobnymi source codes dla auth/profile/student_profile/account_create/account_retrieve/status_update/login_link/account_link/app_url/unhandled.
- Auth/profile/student profile lookup zwracaja stabilne polskie `{ error }` i loguja awarie Supabase do `error_logs`.
- Awarie Stripe account create/retrieve, login link i account link sa logowane bez `console.error`, a klient dostaje stabilny komunikat.
- Aktualizacja statusu onboardingu studenta nie jest juz cicho ignorowana; fail trafia jako `warning` do `error_logs`.
- Pilotowy legacy Express account creation pozostaje swiadomie oznaczony jako compatibility path; migracja do Accounts v2 pozostaje decyzja go-live/ADR, nie ukryta zmiana w tej partii.

Weryfikacja partii 52:

- Stripe Connect reference dla Accounts v2/legacy account types przeczytany; obecny pilotowy path zostal utrzymany bez zmiany publicznego kontraktu.
- Supabase changelog `https://supabase.com/changelog.md` sprawdzony dla breaking/auth/storage/RLS/supabase-js; brak zmian wymagajacych korekty obecnego uzycia w tej partii.
- `rg -n 'console\\.|error\\.message|\\.message\\?\\.|throw new Error\\([^\\n]*\\+|logCriticalError\\(' app/api/stripe/connect/onboarding/route.ts` - OK; jedyny wynik to kontrolowany helper `logCriticalError`.
- `npx.cmd tsc --noEmit --pretty false` - OK.
- `npm.cmd run lint` - OK.
- `npm.cmd run build` - OK.
- `npm.cmd audit --omit=dev --audit-level=moderate` - OK, 0 podatnosci.
- `git diff --check -- app/api/stripe/connect/onboarding/route.ts` - OK, tylko ostrzezenie Windows LF->CRLF.
- `npm.cmd run check:preview -- --env-file=.env.local` przy lokalnym `next start`, ponowione poza sandboxem z dostepem do Stripe/Supabase - FAIL tylko na znanych blokadach preview: `NEXT_PUBLIC_APP_URL` nie uzywa HTTPS oraz brak aktywnego webhooka Stripe dla `http://localhost:3000/api/stripe/webhook`; `http:/api/stripe/connect/onboarding:unauthenticated` zwraca 403.
- `npm.cmd run test:mvp-scenarios -- --base-url=http://127.0.0.1:3000` przy lokalnym `next start`, ponowione poza sandboxem z dostepem do Stripe/Supabase - 26/28 OK; Stripe Connect onboarding bez auth nadal zwraca 403, a pozostale 2 fail to znane blokery zewnetrzne: payout Stripe studenta pending przez niegotowe konto Connect oraz brak `TEST_COMPANY_EMAIL/PASSWORD` i `TEST_STUDENT_EMAIL/PASSWORD`.

### P1-41: Wdrozone w partii 53 - Turnstile CAPTCHA verification route

Zakres: `app/api/auth/verify-turnstile/route.ts`.

Dowod przed poprawka:

- Publiczna trasa CAPTCHA logowala nieoczekiwane awarie przez `console.error`.
- Endpoint nie mial lokalnego rate limitu przed wywolaniem Cloudflare Turnstile.
- Odpowiedz Cloudflare byla rzutowana przez `as TurnstileResponse`, bez runtime walidacji ksztaltu odpowiedzi.
- Awarie HTTP/JSON/schema z Cloudflare nie trafialy do `error_logs`, przez co produkcyjna diagnostyka CAPTCHA byla slaba.

Wdrozone:

- Dodano rate limit `auth` po IP dla `verify-turnstile`.
- Dodano `logTurnstileError` oparty o `logCriticalError`, z source codes dla `missing_secret`, `cloudflare_http`, `cloudflare_json`, `cloudflare_schema` i `unhandled`.
- Zastapiono `as TurnstileResponse` walidacja Zod odpowiedzi Cloudflare.
- Usunieto `console.error`; klient dostaje stabilne polskie komunikaty, a szczegoly trafiaja do observability.
- Nie logujemy tokenu CAPTCHA ani sekretu; kontekst ogranicza sie do statusu HTTP i bezpiecznych kodow/typow awarii.

Weryfikacja partii 53:

- Supabase changelog `https://supabase.com/changelog.md` sprawdzony dla breaking/auth/storage/RLS/supabase-js; brak zmian wymagajacych korekty obecnego uzycia `error_logs` w tej partii.
- `rg -n 'console\\.|error\\.message|\\.message\\?\\.|throw new Error\\([^\\n]*\\+|logCriticalError\\(' app/api/auth/verify-turnstile/route.ts` - OK; jedyny wynik to kontrolowany helper `logCriticalError`.
- `npx.cmd tsc --noEmit --pretty false` - OK.
- `npm.cmd run lint` - OK.
- `npm.cmd run build` - OK.
- `npm.cmd audit --omit=dev --audit-level=moderate` - OK, 0 podatnosci.
- `git diff --check -- app/api/auth/verify-turnstile/route.ts` - OK, tylko ostrzezenie Windows LF->CRLF.
- `npm.cmd run check:preview -- --env-file=.env.local` przy lokalnym `next start`, ponowione poza sandboxem z dostepem do Stripe/Supabase - FAIL tylko na znanych blokadach preview: `NEXT_PUBLIC_APP_URL` nie uzywa HTTPS oraz brak aktywnego webhooka Stripe dla `http://localhost:3000/api/stripe/webhook`.
- `npm.cmd run test:mvp-scenarios -- --base-url=http://127.0.0.1:3000` przy lokalnym `next start`, ponowione poza sandboxem z dostepem do Stripe/Supabase - 26/28 OK; `POST /api/auth/verify-turnstile` bez poprawnego Origin nadal zwraca 403, a pozostale 2 fail to znane blokery zewnetrzne: payout Stripe studenta pending przez niegotowe konto Connect oraz brak `TEST_COMPANY_EMAIL/PASSWORD` i `TEST_STUDENT_EMAIL/PASSWORD`.

### P1-42: Wdrozone w partii 54 - onboarding profile actions i Biala Lista VAT

Zakres: `app/app/onboarding/_actions.ts`, `lib/gus/whitelist-client.ts`.

Dowod przed poprawka:

- `saveOnboardingProfile` ignorowal blad `supabase.auth.getUser()` i blad lookupu `profiles`.
- Update `company_profiles` / `student_profiles` nie potwierdzal, czy faktycznie zaktualizowal wiersz profilu.
- Awarie update profilu byly logowane przez `console.error` z raw `result.error.message`.
- `fetchCeidgData` mogl zwrocic uzytkownikowi surowy komunikat wyjatku z klienta Bialej Listy VAT.
- `lib/gus/whitelist-client.ts` logowal awarie HTTP/polaczenia przez `console.error` w warstwie bibliotecznej.

Wdrozone:

- Dodano `logOnboardingError` oparty o `logCriticalError`, z source codes dla auth/profile lookup, profile update, missing profile i VAT lookup.
- `saveOnboardingProfile` sprawdza bledy auth/profile lookup i zwraca stabilne polskie komunikaty.
- Update profilu wykonuje `.select("user_id").maybeSingle()` i failuje kontrolowanie, gdy nie ma zaktualizowanego wiersza.
- `fetchCeidgData` wymaga aktywnej sesji, loguje awarie VAT lookup do `error_logs` i zwraca stabilny komunikat zamiast raw exception.
- Klient Bialej Listy VAT nie pisze juz do konsoli; szczegoly sa logowane w Server Action z ograniczonym kontekstem bez pelnego NIP.

Weryfikacja partii 54:

- Supabase changelog `https://supabase.com/changelog.md` sprawdzony dla breaking/auth/storage/RLS/supabase-js; brak zmian wymagajacych korekty obecnego uzycia `supabase-js`/`error_logs` w tej partii.
- `rg -n 'console\\.|error\\.message|\\.message\\?\\.|throw new Error\\([^\\n]*\\+|logCriticalError\\(' app/app/onboarding/_actions.ts lib/gus/whitelist-client.ts` - OK; jedyny wynik to kontrolowany helper `logCriticalError`.
- `npx.cmd tsc --noEmit --pretty false` - OK.
- `npm.cmd run lint` - OK.
- `npm.cmd run build` - OK.
- `npm.cmd audit --omit=dev --audit-level=moderate` - OK, 0 podatnosci.
- `git diff --check -- app/app/onboarding/_actions.ts lib/gus/whitelist-client.ts` - OK, tylko ostrzezenie Windows LF->CRLF.
- `npm.cmd run check:preview -- --env-file=.env.local` przy lokalnym `next start`, ponowione poza sandboxem z dostepem do Stripe/Supabase - FAIL tylko na znanych blokadach preview: `NEXT_PUBLIC_APP_URL` nie uzywa HTTPS oraz brak aktywnego webhooka Stripe dla `http://localhost:3000/api/stripe/webhook`.
- `npm.cmd run test:mvp-scenarios -- --base-url=http://127.0.0.1:3000` przy lokalnym `next start`, ponowione poza sandboxem z dostepem do Stripe/Supabase - 26/28 OK; pozostale 2 fail to znane blokery zewnetrzne: payout Stripe studenta pending przez niegotowe konto Connect oraz brak `TEST_COMPANY_EMAIL/PASSWORD` i `TEST_STUDENT_EMAIL/PASSWORD`.

### P1-43: Wdrozone w partii 55 - aplikowanie na oferte

Zakres: `app/app/offers/[id]/_actions.ts`.

Dowod przed poprawka:

- `applyToOffer` logowal wiele awarii Supabase przez `console.error`, m.in. lookup oferty, lookup aplikacji, lookup rozmowy, limit platform service, insert aplikacji, auto-kontrakt i catch koncowy.
- `supabase.auth.getUser()` ignorowal `authError`.
- Blad lookupu profilu studenta byl laczony z bledem roli, bez observability dla awarii DB/RLS.
- Nieblokujacy fail `ensure_contract_for_application` dla platform service byl widoczny tylko w konsoli, bez wpisu w `error_logs`.
- Insert wiadomosci czatu aplikacji nie mial source code ani kontekstu rozmowy w observability.

Wdrozone:

- Dodano `logApplyToOfferError` oparty o `logCriticalError`, z source codes dla auth/profile/offer/application/conversation/platform count/message insert/contract create/conversation flow/unexpected.
- Auth lookup i profile lookup sa rozdzielone; awaria DB/RLS nie udaje juz braku roli studenta.
- Wszystkie dotychczasowe `console.error` w akcji aplikowania zastapiono logowaniem do `error_logs`.
- Nieblokujace utworzenie kontraktu platform service loguje `warning`, ale nadal nie psuje juz utworzonej aplikacji.
- Kontekst logow ogranicza sie do `offerId`, `applicationId`, `conversationId`, eventu wiadomosci i identyfikatora usera; bez tresci aplikacji/CV.

Weryfikacja partii 55:

- Supabase changelog `https://supabase.com/changelog.md` sprawdzony dla breaking/auth/storage/RLS/supabase-js; brak zmian wymagajacych korekty obecnego uzycia `supabase-js`/`error_logs` w tej partii.
- `rg -n 'console\\.|error\\.message|\\.message\\?\\.|throw new Error\\([^\\n]*\\+|logCriticalError\\(|logApplyToOfferError' app/app/offers/[id]/_actions.ts` - OK; brak `console.error`, wyniki to kontrolowany helper i jego wywolania.
- `npx.cmd tsc --noEmit --pretty false` - OK.
- `npm.cmd run lint` - OK.
- `npm.cmd run build` - OK.
- `npm.cmd audit --omit=dev --audit-level=moderate` - OK, 0 podatnosci.
- `git diff --check -- app/app/offers/[id]/_actions.ts` - OK, tylko ostrzezenie Windows LF->CRLF.
- `npm.cmd run check:preview -- --env-file=.env.local` przy lokalnym `next start`, ponowione poza sandboxem z dostepem do Stripe/Supabase - FAIL tylko na znanych blokadach preview: `NEXT_PUBLIC_APP_URL` nie uzywa HTTPS oraz brak aktywnego webhooka Stripe dla `http://localhost:3000/api/stripe/webhook`.
- `npm.cmd run test:mvp-scenarios -- --base-url=http://127.0.0.1:3000` przy lokalnym `next start`, ponowione poza sandboxem z dostepem do Stripe/Supabase - 26/28 OK; pozostale 2 fail to znane blokery zewnetrzne: payout Stripe studenta pending przez niegotowe konto Connect oraz brak `TEST_COMPANY_EMAIL/PASSWORD` i `TEST_STUDENT_EMAIL/PASSWORD`.

### P1-44: Wdrozone w partii 56 - zapisane oferty

Zakres: `app/app/offers/[id]/saved-actions.ts`, `app/app/saved/_actions.ts`, `app/app/applications/_actions.ts`, `lib/observability/saved-offers.ts`.

Dowod przed poprawka:

- `toggleSavedOffer` logowal awarie lookup/upsert/delete przez `console.error`.
- `toggleSavedOffer`, `removeSavedOffer` na stronie zapisanych i wariant z listy aplikacji ignorowaly `authError` z `supabase.auth.getUser()`.
- Wariant `removeSavedOffer` z listy aplikacji ignorowal blad delete na `saved_offers`.
- Brakowalo wspolnego source namespace dla awarii `saved_offers`, przez co diagnostyka RLS/ownership byla rozproszona.

Wdrozone:

- Dodano server-only helper `logSavedOfferError` oparty o `logCriticalError`.
- `toggleSavedOffer` loguje awarie auth, lookup oferty, lookup istniejacego zapisu, delete i upsert do `error_logs`.
- `removeSavedOffer` na stronie zapisanych loguje awarie auth oraz delete i zachowuje stabilny komunikat UI.
- `removeSavedOffer` z listy aplikacji loguje auth/delete failures zamiast cicho je ignorowac.
- Kontekst logow zawiera tylko `offerId` i `userId`; bez danych PII ani tresci ofert.

Weryfikacja partii 56:

- Supabase changelog `https://supabase.com/changelog.md` sprawdzony dla breaking/auth/storage/RLS/supabase-js; brak zmian wymagajacych korekty obecnego uzycia `supabase-js`/`error_logs` w tej partii.
- `rg -n 'console\\.|error\\.message|\\.message\\?\\.|throw new Error\\([^\\n]*\\+|logSavedOfferError|logCriticalError\\(' app/app/offers/[id]/saved-actions.ts app/app/saved/_actions.ts app/app/applications/_actions.ts lib/observability/saved-offers.ts` - OK; brak `console.error`, wyniki to helper i jego wywolania.
- `npx.cmd tsc --noEmit --pretty false` - OK.
- `npm.cmd run lint` - OK.
- `npm.cmd run build` - OK.
- `npm.cmd audit --omit=dev --audit-level=moderate` - OK, 0 podatnosci.
- `git diff --check -- app/app/offers/[id]/saved-actions.ts app/app/saved/_actions.ts app/app/applications/_actions.ts lib/observability/saved-offers.ts` - OK, tylko ostrzezenie Windows LF->CRLF.
- `npm.cmd run check:preview -- --env-file=.env.local` przy lokalnym `next start`, ponowione poza sandboxem z dostepem do Stripe/Supabase - FAIL tylko na znanych blokadach preview: `NEXT_PUBLIC_APP_URL` nie uzywa HTTPS oraz brak aktywnego webhooka Stripe dla `http://localhost:3000/api/stripe/webhook`.
- `npm.cmd run test:mvp-scenarios -- --base-url=http://127.0.0.1:3000` przy lokalnym `next start`, ponowione poza sandboxem z dostepem do Stripe/Supabase - 26/28 OK; pozostale 2 fail to znane blokery zewnetrzne: payout Stripe studenta pending przez niegotowe konto Connect oraz brak `TEST_COMPANY_EMAIL/PASSWORD` i `TEST_STUDENT_EMAIL/PASSWORD`.

### P1-45: Wdrozone w partii 57 - company packages observability

Zakres: `app/app/company/packages/_actions.ts`, `lib/observability/company-packages.ts`.

Dowod przed poprawka:

- Flow zamawiania pakietow nadal zawieral `console.error` w server actions dla tworzenia ofert, zamowien systemowych, zapytan do studenta i resetu katalogu.
- `resetServices` propagowal surowe `error.message` z Supabase do wywolujacego.
- Edycja customizowanej oferty mogla zwrocic surowe `packageResponse.error.message` albo `updateError.message`.
- Utworzenie rozmowy dla student-gig branch ignorowalo `conversationError`, wiec uzytkownik mogl zostac przeniesiony do fallbacku bez widocznego sygnalu diagnostycznego.

Wdrozone:

- Dodano server-only helper `logCompanyPackageError` oparty o `logCriticalError`.
- Krytyczne awarie insertow/update'ow/delete'ow w `company/packages` trafiaja do `error_logs` z `source`, `userId`, `packageId`, `offerId` i `serviceOrderId`.
- `resetServices` sprawdza blad delete przed insertem domyslnych uslug i zwraca stabilny polski komunikat.
- Tworzenie logo/system service order, student inquiry, private offer context oraz update oferty nie zwracaja juz raw `error.message` z Supabase.
- Bledy auto-assign lock i tworzenia rozmowy sa logowane jako warning, bez zmiany dotychczasowego redirect/fallback flow.
- Sprawdzanie technicznego tokenu `service_orders_status_check` zostalo zamkniete w helperze `hasOperationalErrorMessage`, zamiast rozlewac raw `.message` po mutacji.

Weryfikacja partii 57:

- Supabase skill/changelog sprawdzony dla breaking/auth/storage/RLS/supabase-js; brak zmian wymagajacych migracji lub korekty obecnego uzycia `supabase-js` w tej partii.
- `rg -n 'console\\.error|console\\.warn|error\\.message|\\.message\\?\\.|throw new Error\\([^\\n]*message' app/app/company/packages/_actions.ts lib/observability/company-packages.ts` - OK; jedyne trafienie to kontrolowany komunikat Zod `parsed.error.issues[0]?.message`.
- `npx.cmd tsc --noEmit --pretty false` - OK.
- `npm.cmd run lint` - OK.
- `npm.cmd run build` - OK.
- `npm.cmd audit --omit=dev --audit-level=moderate` - OK, 0 podatnosci.
- `git diff --check -- app/app/company/packages/_actions.ts lib/observability/company-packages.ts` - OK, tylko ostrzezenie Windows LF->CRLF.
- `npm.cmd run check:preview -- --env-file=.env.local` przy lokalnym `next start`, ponowione poza sandboxem z dostepem do Stripe/Supabase - FAIL tylko na znanych blokadach preview: `NEXT_PUBLIC_APP_URL` nie uzywa HTTPS oraz brak aktywnego webhooka Stripe dla `http://localhost:3000/api/stripe/webhook`.
- `npm.cmd run test:mvp-scenarios -- --base-url=http://127.0.0.1:3000` przy lokalnym `next start`, ponowione poza sandboxem z dostepem do Stripe/Supabase - 26/28 OK; pozostale 2 fail to znane blokery zewnetrzne: payout Stripe studenta pending przez niegotowe konto Connect oraz brak `TEST_COMPANY_EMAIL/PASSWORD` i `TEST_STUDENT_EMAIL/PASSWORD`.

### P1-46: Wdrozone w partii 58 - chat negotiation i dispute observability

Zakres: `app/app/chat/_actions.ts`.

Dowod przed poprawka:

- `acceptRate` logowal brak aktywnego zlecenia przez `console.warn`, a rozmowa bez aplikacji/pakietu mogla dojsc do komunikatu akceptacji bez realnej aktualizacji zrodla.
- Branch service order w `acceptRate` ignorowal blad lookupu aktywnego zlecenia oraz blad RPC `ensure_contract_for_service_order`.
- Branch aplikacji w `acceptRate` ignorowal blad RPC `ensure_contract_for_application`, reloadu aplikacji po update i update'u statusu oferty.
- `reportProblem` uzywal `try/catch` wokol Supabase SDK, mimo ze insert/update/query zwracaja `{ error }`, a nie rzucaja wyjatkow.
- `reportProblem` logowal awarie notatki, kontraktu i braku adminow przez `console.error`, bez centralnego `error_logs`.

Wdrozone:

- Rozszerzono `logChatActionError` o `level`, `message`, `packageId`, `serviceOrderId` i `contractId`, z mapowaniem `serviceOrderId -> orderId` oraz `contractId` w `error_logs`.
- `validateParticipant` nie zwraca juz angielskiego `Unauthorized`.
- `acceptRate` sprawdza i loguje bledy update'u aplikacji, RPC kontraktu, reloadu aplikacji, update'u statusu oferty, lookupu/update'u service order, RPC kontraktu service order i inserta wiadomosci akceptacji.
- Akceptacja stawki bez powiazanej aplikacji albo pakietu jest blokowana stabilnym polskim komunikatem, zamiast tworzyc mylacy event rozmowy.
- `reportProblem` jawnie sprawdza `problemMessageError`, `contractLookupError`, `contractUpdateError` i `adminProfilesError`; wszystkie awarie best-effort trafiaja do observability jako warning.
- Brak kont administratorow do powiadomienia o sporze jest logowany jako warning z kontekstem rozmowy/kontraktu, bez `console.error`.

Weryfikacja partii 58:

- Supabase skill/changelog sprawdzony dla breaking/auth/storage/RLS/supabase-js; brak zmian wymagajacych migracji lub korekty obecnego uzycia `supabase-js` w tej partii.
- `rg -n 'console\\.|Unauthorized|No application' app/app/chat/_actions.ts` - OK, brak wynikow.
- `npx.cmd tsc --noEmit --pretty false` - OK.
- `npm.cmd run lint` - OK.
- `npm.cmd run build` - OK.
- `npm.cmd audit --omit=dev --audit-level=moderate` - OK, 0 podatnosci.
- `git diff --check -- app/app/chat/_actions.ts` - OK, tylko ostrzezenie Windows LF->CRLF.
- `npm.cmd run check:preview -- --env-file=.env.local` przy lokalnym `next start`, ponowione poza sandboxem z dostepem do Stripe/Supabase - FAIL tylko na znanych blokadach preview: `NEXT_PUBLIC_APP_URL` nie uzywa HTTPS oraz brak aktywnego webhooka Stripe dla `http://localhost:3000/api/stripe/webhook`.
- `npm.cmd run test:mvp-scenarios -- --base-url=http://127.0.0.1:3000` przy lokalnym `next start`, ponowione poza sandboxem z dostepem do Stripe/Supabase - 26/28 OK; pozostale 2 fail to znane blokery zewnetrzne: payout Stripe studenta pending przez niegotowe konto Connect oraz brak `TEST_COMPANY_EMAIL/PASSWORD` i `TEST_STUDENT_EMAIL/PASSWORD`.

## Znaleziska P2

### P2-01: UI i copy nadal wymagaja pelnego polish passu

Dowod po partii 9:

- Zamkniete w partii 7: publiczny placeholder opinii pilota w `app/page.tsx`, mock/test naming w `app/app/offers/[id]/apply-card.tsx` oraz testowy przycisk ponownego zgloszenia po sukcesie aplikacji.
- Zamkniete w partii 9: najbardziej ryzykowne publiczne i prawne copy `escrow` zostalo zastapione przez `depozyt Student2Work` / `srodki zabezpieczone` w landingach, regulaminie, PDF clauses, fakturze i panelach realizacji.
- Pozostaly zakres: pelny copy pass po polsku na landingach, auth i panelach authenticated, w tym polskie znaki i ton B2B.

Wplyw: produkt wyglada mniej wiarygodnie, a czesc copy moze byc mylaca dla polskiego rynku B2B.

Fix pozostaly: pelny copy pass po polsku i dopasowanie finalnych sformulowan do zatwierdzonej decyzji ADR platnosci.

### P2-02: Audit UI wymaga pelnej sesji authenticated

Wykonano szybki test browser:

- `/` desktop i mobile: brak console errors, strona renderuje sie, wykryte overflow dotyczy dekoracyjnych elementow absolutnych.
- `/auth` mobile: brak console errors, ale label checkboxa laczy tekst z helperem w jedna dluga fraze.

Blokada:

- Brak credentiali testowych company/student uniemozliwil pelny visual QA paneli authenticated.

Fix: dodac bezpieczne testowe credentiale do lokalnego env/staging i wykonac screenshot QA dla kluczowych ekranow.

### P2-03: Admin i finance copy/export wymagaja spojnosc domenowa

Dowod:

- Zamkniete w partii 9: `Escrow liability` zmienione na `Depozyt / ledger liability`, a opis zwrotow odnosi sie do warstwy depozytu.
- Zamkniete w partii 9: opis pozycji faktury `Escrow - ...` zmieniony na `Depozyt - ...`.
- Pozostaly zakres: po ADR zdecydowac, czy migrowac techniczne pole `escrow_active_pln` oraz event `escrow_funded`.

Wplyw: admin widzi jezyk, ktory moze mieszac formalny rachunek escrow z wewnetrzna liability ledger.

Fix: po ADR platnosci ujednolicic nazewnictwo: `depozyt platformy`, `ledger liability`, `escrow`, `funding`, `release`.

## UI polish audit - szybka probka

| Ekran | Viewport | Wynik |
|---|---|---|
| `/` | desktop | Render OK, brak console errors, H1 widoczny, copy bez polskich znakow. |
| `/` | mobile 390x844 | Render OK, brak console errors, brak istotnego content overflow. |
| `/auth` | mobile 390x844 | Render OK, brak console errors, problem z laczeniem label/helper checkboxa. |

Pelny UI polish nadal wymaga sesji authenticated: onboarding, katalog pakietow, order flow, deliverables, chat, profile, finanse, dokumenty i admin.

## Rekomendowany status wydania

- Preview/pilot lokalny: warunkowo `GO`, jesli jasno komunikujemy pilotowy model Checkout + ledger i mamy swiadomosc blokad testowych.
- Produkcja publiczna: `NO-GO`.
- Produkcja z platnosciami live: `NO-GO` do czasu przejscia `check:production`, `test:mvp-scenarios`, ADR platnosci i usuniecia placeholderow prawnych.

## Artefakty powiazane

- Backlog wdrozenia: `AUDIT_FIX_BACKLOG_2026-06-26.md`
- ADR platnosci: `ADR_PAYMENTS_GO_LIVE_MODEL_2026-06-27.md`
- Poprzedni raport security: `security_best_practices_report.md`
- MVP suite: `test-results/mvp-scenario-suite.json`

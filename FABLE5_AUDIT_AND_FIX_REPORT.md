# FABLE5 — Audyt i naprawy przed pilotem (2026-06-12)

> Codex follow-up 2026-06-12: po przejęciu paczki uruchomiono dodatkowo targetowany ESLint na pozostałych zmienionych plikach. Wynik: FAIL, 53 errors / 28 warnings, głównie istniejący dług `@typescript-eslint/no-explicit-any` w modyfikowanych legacy obszarach (`company/applications/_actions.ts`, `finances/page.tsx`, `ChatSidebar.tsx`). `npm run build` przechodzi. Nie wykonywano masowego refaktoru typów w tej paczce.

Audyt wykonany przez Claude (Fable 5) na branchu `codex/mvp-pilot-ready` z niezacommitowanymi zmianami innego agenta w working tree (nie były cofane). Zakres: bezpieczeństwo, płatności, customer journey firmy/studenta/admina, DB/RLS/migracje, martwe trasy.

---

## 1. Executive summary

**Co działa (zweryfikowane w kodzie i checkach):**
- Pełny łańcuch płatności Stripe jest po stronie serwera i nie ufa frontendowi: kwoty wyłącznie z DB/kontraktu, webhook z weryfikacją podpisu (`stripe.webhooks.constructEvent`), kolejka `stripe_events` z idempotencją (unique + retry_count), RPC `process_stripe_payment_v4` jako atomowy punkt aktywacji, payouty z kluczem idempotencji Stripe (`payout_transfer_<payoutId>`).
- Guardy server-side: `proxy.ts` (JWT verify + rate limiting + wymuszenie onboardingu), `app/app/layout.tsx` (redirect niezalogowanych), `app/app/admin/layout.tsx` + `requireAdmin()` we WSZYSTKICH admin server actions, cron endpoints z `CRON_SECRET`, webhook notyfikacji z `NOTIFICATIONS_WEBHOOK_SECRET`, eksporty admina z weryfikacją roli.
- `npm run check:preview`: Supabase RLS, krytyczne tabele, funkcje i storage — wszystkie checki ZIELONE; testy HTTP (401 na niezalogowane checkouty, 400 na niepodpisany webhook) zielone.
- Build (`npm run build`) przechodzi.

**Co blokowało pilota (naprawione w tym audycie):**
- `/app/orders/market` — legacy „Giełda Zleceń": pozwalała KAŻDEMU zalogowanemu przejąć zamówienie z pominięciem umów A/B i płatności (status od razu `in_progress`) i przekierowywała na nieistniejącą trasę `/app/orders/[id]` (404). Usunięta akcja, strona zamieniona na redirect.
- `createOrder` (`app/app/orders/create/[packageId]/_actions.ts`) — brak weryfikacji roli firmy (strona miała guard, akcja nie); dla pakietów systemowych tworzyła osierocone zamówienia (`student_id NULL`, status `pending`), których nikt nie mógł podjąć po usunięciu giełdy; ignorowała cenę wariantu (S/M/L). Naprawione: rola, redirect pakietów systemowych do kanonicznego flow `customize`, cena wariantu.
- Niespójność prowizji (P0-2 z CODEX_WYTYCZNE): `isAllowedCommissionRate(0.25) === false` mimo że pakiety niosą 0.25. Wdrożone nowe stawki wspólników: platform_service 25%, job/custom 15%, allowed options + 0.25.
- Brak twardego guardu pilot-mode vs klucze live (P0-1): dodany w `getStripe()` — `NEXT_PUBLIC_PILOT_MODE=true` + `sk_live_` → twardy błąd.

**Ryzyka go-live (NIE naprawione, dla właściciela):**
- P0-1 (pilot mode) wdrożony tylko częściowo: brak banera pilotażowego w layoucie, adnotacji na PDF i prefiksu `[PILOTAŻ]` w mailach — to zadania Codexa wg CODEX_WYTYCZNE (deadline 24.06).
- P0-3: nazewnictwo umowy B (zlecenie vs dzieło) czeka na prawnika — ma skutki PIT dla <26 r.ż.
- 234 błędy ESLint (głównie `no-explicit-any`) w ~40 plikach — build przechodzi, ale to dług, który maskuje błędy typów. Nie ruszane masowo (ryzyko konfliktu ze zmianami innego agenta in-flight).
- RPC `security definer` (`cancel_application`, `company_fund_contract_v2`, `process_stripe_payment_v4`, `auto_accept_due_milestones_v2`) — kod TS używa ich poprawnie, ale weryfikacja, że same RPC sprawdzają role/ownership, wymaga odczytu definicji w DB (brak dostępu z tego środowiska). `check:preview` raportuje `supabase:functions OK`, co pokrywa istnienie, nie semantykę.

**Model płatności (rozjazd dokumenty vs kod):** dokumenty mówią o escrow/manual capture; kod realizuje **Stripe Checkout (płatność natychmiastowa) → ledger w DB → osobne transfery Connect po akceptacji milestone'ów** (escrow logiczny po stronie platformy, nie Stripe manual capture). Łańcuch warunków przed checkoutem jest kompletny: `terms_status=agreed` → akceptacja umów A i B w `contract_documents` → gotowość konta Connect studenta → kwota z milestone'ów w DB. Model spełnia wymóg „firma → platforma → student" i wymogi bezpieczeństwa; warto tylko ujednolicić nazewnictwo w dokumentach biznesowych.

---

## 2. Customer journey: firma

| Krok | Status | Uwagi |
|---|---|---|
| Landing / public | OK | `/`, `/auth`, `/regulamin`, `/polityka-prywatnosci` — 200 |
| Rejestracja/logowanie | OK | rate limit na `/auth` w proxy, Turnstile endpoint |
| Onboarding (NIP, nazwa) | OK | wymuszany w proxy.ts (redirect do `/app/onboarding` dopóki brak `nazwa`) |
| Katalog Quick Task | OK | `/app/company/packages` (tab platform), guard roli |
| Wybór pakietu i wariantu | OK | `/app/company/packages/[id]` → `customize`; warianty z cenami per wariant |
| Brief | OK | `form_schema` per pakiet, walidacja URL |
| Utworzenie zamówienia | OK | `createCustomizedOffer`: rola firmy, cena z wariantu (DB), auto-przypisanie studenta lub wybór (logo), status `pending_student_confirmation` |
| Status po utworzeniu | OK | redirect do `/app/company/orders/[id]` |
| Umowa A / dokumenty | OK | `generateContractDocuments` + `acceptContractDocument` w deliverables |
| Płatność testowa | OK | create-checkout: pełen łańcuch warunków (sekcja 1), kwoty w groszach z DB |
| Widok po płatności | OK | `payment-modal` → verify-payment → reload; fallback webhook+cron |
| Komunikacja | OK | czat z guardami rola+uczestnictwo; `ReportProblemButton` → dispute |
| Odbiór pracy / akceptacja | OK | `reviewMilestoneAction` / `reviewDeliverable` |
| Recenzja | OK | modal w StatusTab (`/app/company/review/[id]` jako strona alternatywna) |
| Dokumenty końcowe / finanse | OK | `/app/company/documents`, download z weryfikacją roli i typu dokumentu |

Custom marketplace (jobs/applications/negocjacje): `createOffer` ma rolę, `applyToOffer` ma guard studenta, negocjacja przez `applications` + czat (nie omija platformy), akceptacja aplikacji → kontrakt → ten sam pipeline umów+płatności. Trigger DB `prevent_multiple_active_applications_per_offer` (advisory lock) chroni przed dwoma wykonawcami.

## 3. Customer journey: student

| Krok | Status | Uwagi |
|---|---|---|
| Rejestracja/onboarding | OK | proxy wymusza `kierunek`; dane podatkowe w `/app/profile` |
| Stripe Connect | OK | endpoint tylko dla roli student, rate-limited; readiness sync na `account.updated` |
| Widoczność ofert | OK | `/app/jobs`; Quick Task przychodzi jako zamówienie do potwierdzenia (dashboard/czat + notyfikacja) |
| Aplikowanie | OK | rola studenta wymagana |
| Praca / deliverables | OK | upload: limit 50 MB + MIME client-side, bucket `deliverables` ma limit 100 MB + MIME server-side (DRIFT-02) |
| Umowa B | OK | `contract_b` w contract_documents; download tylko dla studenta kontraktu |
| Izolacja danych | OK | download dokumentów: firma widzi tylko `contract_a`/`invoice_company`, student tylko `contract_b`/`invoice_student`; RLS na tabelach finansowych (check zielony) |
| Wypłata/finanse | OK | `/app/finances`; payout pending z czytelnym statusem gdy Connect niegotowy; admin może ponowić |
| Edge: zmiana ceny po akceptacji | OK | kwoty checkoutu z kontraktu/milestone'ów w DB, nie z requestu |

## 4. Customer journey: admin

- Wszystkie strony pod `/app/admin/*` chronione layoutem (`requireAdmin({redirectOnFail:true})`), a **każda** akcja w `_actions.ts` woła `requireAdmin()` niezależnie — wzorowo.
- Eksporty (`/api/admin/export/*`) weryfikują rolę admina server-side.
- `/app/admin/disputes` — naprawiono: surowy `error.message` DB szedł do UI; usunięto `as any[]`. Panel pozostaje read-only (P1-2 z CODEX: minimalne akcje rozwiązywania sporów — do zrobienia przed go-live).
- Payouty: `transferPayoutViaStripe` — statusy `pending/processing/paid`, idempotency key, brak podwójnej wypłaty przy retry.

## 5. Security findings

**P0 (naprawione):**
- `app/app/orders/market/_actions.ts` — `acceptOrder` bez roli, omijał umowy i płatność (status `in_progress` bez kontraktu); usunięty, strona → redirect `/app/jobs`.
- `app/app/orders/create/[packageId]/_actions.ts` — `createOrder` bez weryfikacji roli (akcja wywoływalna bezpośrednio mimo guardu na stronie); dodany guard + redirect pakietów systemowych.
- `lib/stripe.ts` — brak twardej walidacji pilot vs live keys; dodany guard `NEXT_PUBLIC_PILOT_MODE` + `sk_live_` → throw.

**P1 (naprawione):**
- `app/api/stripe/{create-checkout,verify-payment,connect/onboarding}/route.ts` — catch-all zwracał surowe `error.message` (angielskie/techniczne komunikaty Stripe/DB) do UI; teraz generyczny polski komunikat + log.
- `lib/commission.ts` — rozjazd allowed-options vs stawki pakietów (0.25).

**P1 (do zrobienia):**
- `lib/supabase/admin.ts` — brak `import "server-only"`; dziś żaden klient go nie importuje (zweryfikowane lintem/buildem), ale guard kosztuje 1 linię + pakiet `server-only`. Rekomendowane przy najbliższym `npm install`.
- Weryfikacja semantyki RPC `security definer` w DB (lista w sekcji 1).

**P2:**
- `app/app/services/dashboard/page.tsx` — `Błąd pobierania danych: {String(error)}` w UI (surowy błąd; plik ma `eslint-disable no-explicit-any`).
- Dług `any` (234 błędy lint) — m.in. `app/app/company/applications/_actions.ts`, `app/app/admin/contracts/[id]/page.tsx`, `lib/services/private-proposals.ts`.
- `resetServices` w `packages/_actions.ts` — destrukcyjna akcja (delete pakietów) za rolą admin; OK, ale powinna zniknąć z kodu produkcyjnego po ustabilizowaniu seedów.

## 6. Database / RLS / migracje

- `check:preview`: `supabase:rls`, `supabase:critical-tables`, `supabase:functions`, `supabase:storage:deliverables` — zielone (na zlinkowanym projekcie `Antygravity`).
- **Naprawione:** 13 plików SQL bez timestampu (np. `force_fix_rpc.sql`, `milestone_negotiation*.sql`, `allow_company_edits.sql`) leżało w `supabase/migrations/` — przeniesione do `supabase/_archive/` (CLI i tak je ignorował; teraz nie udają aktywnych migracji). Migracje z 8-cyfrowym prefiksem (`20260121_*` itd.) NIE były ruszane — mogą być zarejestrowane w historii migracji.
- Czerwcowe migracje: `20260605113000` (company_defined_milestones — kolumny+constraint+RPC, sane), `20260605124500` (trigger anti-duplikat wykonawcy z advisory lock, sane), `20260606120000` (seed 3 pakietów wejściowych, idempotentny, commission 0.25 — spójny z nowymi stawkami).
- `supabase/migrations/README.md` jest aktualny do 2026-03-24 — wymaga dopisania grup migracji kwiecień–czerwiec (zaległość dokumentacyjna, nie kodowa).
- Kwoty: nowe tabele w minor units (`*_minor`), legacy kolumny PLN z jawnym przeliczaniem (`milestoneAmountMinor`, `amountNetMinorFromPayout`); `invoices` w PLN (nie groszach) — odnotowane w AGENT_NOTEBOOK, formattery rozdzielone.

## 7. Inwentarz tras martwych/zdublowanych

| Trasa | Decyzja | Status |
|---|---|---|
| `/app/orders/market` | **usunięta logika, redirect → /app/jobs** | wykonane |
| `/app/orders/create/[packageId]` | zachowana dla gigów studenckich (inquiry), pakiety systemowe → redirect do customize | wykonane |
| `/app/auth` | już był redirectem → `/auth` | OK |
| `/app/review/[applicationId]` | zachowana — strona recenzji STUDENTA (poprawne guardy), nielinkowana z nav, recenzje idą głównie przez modal w deliverables; działa jako deep link | OK |
| `/app/company/review/[applicationId]` | aktywna (linkowana z aplikacji firmy) — to nie duplikat, inna rola | OK |
| `/app/company/orders` vs `/app/services/dashboard` | dwa widoki tego samego flow z różnych ról (firma vs student) — nie duplikat | OK |
| `/app/services` (katalog gigów) | nielinkowane z nav (zgodnie z decyzją pilota), strony działają z guardami | zostawione |
| `/app/services/my`, `/app/services/new` | w nav studenta („Usługi") — zgodne z decyzją? CODEX mówi „publiczna giełda gigów wyłączona z nav"; `services/my` to zarządzanie własnymi, zostawione (decyzja właściciela czy ukryć) | do decyzji |
| `/app/cancel/[id]` | aktywna — anulowanie współpracy przez RPC `cancel_application` | OK |
| `app/components/*` vs `components/*` | `app/components/payment-modal.tsx` + `SecureImageViewer` używane przez StatusTab — działa; niespójność struktury (P2, nie ruszane) | OK |
| `/app/saved`, `/app/notifications`, `/app/students/[id]`, `/app/companies/[id]` | aktywne, linkowane kontekstowo | OK |

## 8. Zmiany wykonane w kodzie

1. `lib/commission.ts` — stawki: job 0.10→0.15, platform_service 0.20→0.25, allowed options +0.25 (decyzja wspólników 2026-06-10; `contracts.commission_rate` zamrożona per kontrakt — istniejące umowy nietknięte).
2. `lib/stripe.ts` — guard pilot-mode vs `sk_live_`.
3. `app/app/orders/market/page.tsx` — redirect zamiast giełdy; `_actions.ts` usunięty.
4. `app/app/orders/create/[packageId]/_actions.ts` — guard roli firmy, redirect pakietów systemowych do `customize`, cena wariantu z `resolveSelectedPackageVariant`.
5. `app/app/admin/disputes/page.tsx` — brak surowego błędu DB w UI, typy zamiast `as any[]`, helper `idleDaysSince` (czyści błąd react-hooks/purity).
6. `lib/services/application-chat-closure.ts` — `supabase: any` → `SupabaseClient` (oba exporty).
7. `app/api/stripe/verify-payment/route.ts` — usunięty `admin as any`; generyczny polski komunikat w catch-all.
8. `lib/stripe/stripe-event-processor.ts` — usunięty `supabase as any`.
9. `app/api/stripe/create-checkout/route.ts`, `app/api/stripe/connect/onboarding/route.ts` — generyczne polskie komunikaty w catch-all (logi pełne server-side).
10. `supabase/migrations/` → `supabase/_archive/`: 13 plików SQL bez timestampu.

## 9. Testy uruchomione

| Komenda | Wynik |
|---|---|
| `npm run lint` (całość) | FAIL — 234 błędy / 112 ostrzeżeń (dług sprzed audytu; pliki zmienione w audycie — czyste) |
| `npm run build` | PASS (przed i po zmianach) |
| `npm run check:preview` | 21/23 PASS; 2 FAIL środowiskowe (HTTPS + webhook URL wskazują localhost — oczekiwane lokalnie, nie błąd kodu) |
| `npm run test:mvp-scenarios -- --base-url=http://localhost:3000` | 14/15 PASS — zielone m.in.: cron 401 bez sekretu, webhook 400 bez podpisu, checkout/onboarding 401 bez auth, documents 400, readiness RPC, pakiet pilota, dowody kontraktu i dokumentów. Jedyny FAIL: `ui authenticated role scenarios` — brak `TEST_COMPANY_EMAIL/PASSWORD` i `TEST_STUDENT_EMAIL/PASSWORD` w env (blokada środowiska, nie kodu). Weryfikacja po dostarczeniu env: ustawić te 4 zmienne (konta z `seed-pilot-sandbox.mjs`) i powtórzyć komendę. |

## 10. Rekomendowane następne kroki (kolejność)

1. **Dokończyć P0-1 pilot mode** (baner, PDF-y, maile `[PILOTAŻ]`) — CODEX, przed 24.06.
2. **Decyzja prawnika P0-3** (zlecenie vs dzieło) i ujednolicenie szablonów.
3. **Zweryfikować definicje RPC security definer w Supabase** (SQL editor, read-only): `cancel_application`, `company_fund_contract_v2`, `process_stripe_payment_v4` — czy sprawdzają ownership.
4. **`import "server-only"` w `lib/supabase/admin.ts`** przy najbliższej zmianie zależności.
5. Zbić dług `any` plik-po-pliku (zaczynając od `company/applications/_actions.ts` — ścieżka pieniędzy).
6. Dopisać grupy migracji kwiecień–czerwiec do `supabase/migrations/README.md`.
7. P1-2: minimalne akcje w `/app/admin/disputes` przed go-live.
8. Decyzja: czy „Usługi" (`/app/services/my`) zostaje w nav studenta na pilota.

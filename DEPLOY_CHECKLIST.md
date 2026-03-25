# Pre-Deploy Checklist — student2work.pl

> Wersja: v5 (2026-03-25) | Owner: Claude + Codex
> Ostatnia aktualizacja: KROK 6 — Release path + Stripe/Supabase decisions (Bartosz)

---

## AKTUALNY STAN VERCEL

| Co | Stan |
|----|------|
| Projekt | `student-impact` (prj_YcSCdnrZH4xf1k7Zo2m5nJ39mZs8) |
| Ostatni deployment | `dpl_6nLsAm9XD7WTvWTp1Jk6b7TnT3BX` — **READY** (stary main `3eb2e4bd`) |
| **Candidate baseline** | branch `codex/predeploy-backup-20260324` (commit `5ebc7de`) — na GitHub, NIE zmergowany do main |
| Vercel build (stary main) | Compiled in 20.2s, TypeScript OK, 16 static pages OK — **PASS** |
| Vercel build (nowy branch) | PENDING — wymaga push brancha lub PR do uruchomienia Preview |
| **Wymagane dzialanie** | Bartosz lub Codex: push `codex/predeploy-backup-20260324` → Vercel Preview → verify |

---

## GATE 0 — Build Verification

- [x] **Lokalny npm run build: PASS** (Codex, 2026-03-24, po fix ChatList.tsx + seed-benchmark)
- [x] **Vercel build na starym main: PASS** (potwierdzone z logow Vercel — compiled 20.2s, 0 errors)
- [ ] **Push `codex/predeploy-backup-20260324`** → GitHub → Vercel Preview (wymaga akcji Bartosza/Codex)
- [ ] Vercel Preview build na nowym branchu: zielony

### Klasyfikacja ostrzezen build (potwierdzone z logow Vercel — nie blokuja):

| Ostrzezenie | Klasyfikacja | Evidence | Akcja |
|-------------|--------------|----------|-------|
| `baseline-browser-mapping outdated` | **NON-BLOCKER** | Widoczny w prod buildzie, build PASS mimo tego | Post-launch: `npm i baseline-browser-mapping@latest -D` |
| `import-in-the-middle version mismatch` | **NON-BLOCKER** | Nie pojawil sie w sprawdzonych logach | Post-launch: `overrides` w package.json jesli wystapi |

---

## GATE 1 — Drift Resolution — COMPLETE

Wszystkie drifty rozwiazane migracja `20260324212246_cleanup_drift_01_02_03` + `20260324212322_fix_applications_company_update_policy`:

- [x] **DRIFT-01** — applications: 6 kanonicznych polityk (usunieto 4 legacy)
- [x] **DRIFT-02** — deliverables bucket: 100MB limit, 16 MIME types
- [x] **DRIFT-03** — idx_ledger_stripe_refund_v3 usuniety

---

## GATE 2 — Srodowisko Produkcyjne (Vercel)

Ustawic w Vercel Dashboard → Settings → Environment Variables → **Production**:

- [ ] `STRIPE_SECRET_KEY` = `sk_live_...` _(zastapic sk_test)_
- [ ] `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` = `pk_live_...` _(zastapic pk_test)_
- [ ] `STRIPE_WEBHOOK_SECRET` = `whsec_...` _(z nowego endpointu produkcyjnego)_
- [ ] `NEXT_PUBLIC_SUPABASE_URL` = URL produkcyjnej instancji Supabase
- [ ] `SUPABASE_SERVICE_ROLE_KEY` = service_role key produkcji
- [ ] `NEXT_PUBLIC_SITE_URL` = `https://student2work.pl`
- [ ] `CRON_SECRET` = random string >=64 znakow (`openssl rand -hex 32`)
- [ ] `SENTRY_DSN` / `NEXT_PUBLIC_SENTRY_DSN` = DSN z Sentry projektu _(opcjonalne, ale rekomendowane — bez tego bledy produkcyjne nie sa monitorowane)_
- [ ] **Weryfikacja**: zadna zmienna `sk_live_` / `service_role` NIE jest w `NEXT_PUBLIC_*`

---

## GATE 3 — Stripe Konfiguracja

> **DECYZJA (2026-03-25):** Deploy nastepuje na kluczach TESTOWYCH. Live mode defer do momentu
> rejestracji dzialalnosci Bartosza. Podmiana na live = tylko zmiana 3 env vars w Vercel, bez nowego deploy.

### Teraz (deploy na test keys):
- [ ] Stripe Dashboard (test mode) → Webhooks → Add endpoint: `https://student2work.pl/api/stripe/webhook`
- [ ] Zdarzenia: `checkout.session.completed`, `charge.refunded`, `refund.created`
- [ ] Signing secret → skopiowac jako `STRIPE_WEBHOOK_SECRET` w Vercel
- [ ] Webhook signature test: replay `checkout.session.completed` → brak 400

### Pozniej (po rejestracji dzialalnosci — bez nowego deployment kodu):
- [ ] Stripe → Live mode wlaczony
- [ ] Nowy webhook endpoint dla live: `https://student2work.pl/api/stripe/webhook`
- [ ] Podmiana 3 zmiennych w Vercel: `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`

---

## GATE 4 — Supabase DB — COMPLETE

> **DECYZJA (2026-03-25):** dev = prod (jedna instancja Supabase). Parity check odpada.

### Migracje (45 applied)

Ostatnie migracje potwierdzajace hardening:
- `20260324212221` fix_database_drifts
- `20260324212246` cleanup_drift_01_02_03
- `20260324212322` fix_applications_company_update_policy
- `20260325093000` obs01_agreed_stawka_minor_sync_constraint _(OBS-01 — APPLIED)_

### Storage buckets
- [x] `cvs` = private
- [x] `documents` = private
- [x] `deliverables` = private, 100MB, 16 MIME
- [x] `portfolio` = public
- [x] `chat-attachments` = public
- [x] `offer_attachments` = public

- [ ] `service_role` key NIE jest w NEXT_PUBLIC_* zmiennych

---

## GATE 5A — Smoke Testy (test-mode, WYMAGANE)

### Codex app-flow smoke — PASS WITH RESIDUAL RISK

- [x] localhost:3000 — **PASS** (Codex, 2026-03-24)
- [x] /app/admin/offers, /app/notifications, /app/chat/{id}, /app/deliverables/{id} — **PASS**
- [x] Workspace tabs (STATUS/PLIKI/DOSTEPY/WIADOMOSCI) — **PASS**
- [x] acceptApplication multi-instance fix — **PASS** (touched: company/applications/_actions.ts)
- [ ] **RESIDUAL RISK**: testy wykonane na koncie admin — brak clean student/company actor smoke

### Anti financial smoke — PASS WITH CORRECTIONS

> Status: PASS WITH CORRECTIONS (Codex partial acceptance, 2026-03-25)
> Uwaga: walkthrough.md nie istnieje jako plik w repo; scripts/gate5a-smoke-tests.ts jest untracked artefaktem roboczym

- [x] **1.** Rejestracja student + firma, onboarding, profil — PASS (Anti)
- [x] **2.** Application flow: student aplikuje → firma akceptuje → kontrakt draft — PASS (Anti)
- [x] **3.** Checkout + webhook: firma placi → `checkout.session.completed` → `verify-payment` → kontrakt active — PASS (Anti)
- [x] **4.** Webhook signature: `STRIPE_WEBHOOK_SECRET` poprawny — PASS (Anti)
- [x] **5.** Deliverable + milestone: upload → acceptance → `escrow_release` w ledgerze — PASS (Anti)
- [x] **6.** Payout path: admin payout → `student_payout` w ledgerze + `amount_minor` poprawny — PASS (Anti)
- [x] **7.** Partial refund: Stripe test → webhook → `stripe_refund` w ledgerze — PASS (Anti)
- [x] **8.** Full refund: kontrakt cancelled → ledger kompletny — PASS (Anti)
- [x] **9.** Admin exports: `/api/admin/export/pit-csv` + `/api/admin/export/invoices-zip` → HTTP 200 — **PASS** (potwierdzone niezaleznie przez Codexa)
- [x] **10.** Service order funding: service_order platny → `stripe_payment` w ledgerze — PASS (Anti)

### Pre-launch hardening (OBS)

- [x] **OBS-01** — `agreed_stawka_minor_sync_check` CHECK CONSTRAINT na tabeli applications — **APPLIED** (migracja 20260325093000, zweryfikowana przez Codexa)
- [x] **OBS-02** — Guard przeciw duplikatom checkout session w `create-checkout/route.ts` — **APPLIED** (reuse otwartej sesji, zweryfikowane przez Codexa)
- [x] **OBS-03** — `is_project_participant(x,x)` — VERIFY ONLY, brak dowodu na realny exploit (Codex: nie bloker bez evidence)
- [x] **OBS-05** — seed-benchmark page bezpieczna w produkcji (guard `notFound()`) — CONFIRMED
- [x] **OBS-06** — CRON_SECRET guard w auto-accept route — CONFIRMED

---

## GATE 5B — Smoke Testy Live (opcjonalne, tylko po autoryzacji Bartosza)

- [ ] Autoryzacja Bartosza: TAK / NIE
- [ ] Mala transakcja live (min. kwota) z realna karta (NIE 4242 — to karta testowa)
- [ ] Zero 500 przez 30 min po deploy

---

## GATE 6 — Go/No-Go (owner: Codex)

- [ ] GATE 0: Vercel Preview build PASS
- [ ] GATE 1: Drift — COMPLETE
- [ ] GATE 2: Env vars live — skonfigurowane przez Bartosza
- [ ] GATE 3: Stripe live mode + webhook — skonfigurowane przez Bartosza
- [ ] GATE 4: DB migracje prod — potwierdzone
- [ ] GATE 5A: Smoke — PASS WITH CORRECTIONS (Anti) + PASS (Codex app-flow)
- [ ] Zero 500 w Vercel logs podczas smoke testow
- [ ] Codex: **launch-safe** / **not-safe** z lista evidence

---

## Rollback Plan

| Problem | Akcja |
|---------|-------|
| Vercel build error | Redeploy poprzedni deployment (1 klik) |
| Stripe webhook broken | Przelaczyc na test endpoint / wylaczyc live mode |
| Supabase migracja zepsuta | Nowa migracja `down_*.sql` (nie reset!) |
| Krytyczny blad finansowy | Wylaczyc checkout (feature flag), kontakt Stripe support |

---

## Post-Launch Cleanup (nieblokujace)

- [ ] `npx update-browserslist-db@latest` — odswiezenie bazy browserslist
- [ ] Dodac `overrides.import-in-the-middle` w package.json — Sentry/Next 16 compat
- [ ] DROP `idx_ledger_stripe_refund_id` (redundantny nieunikalny index) — OBS-07
- [ ] Faza B: `payout_batches`, `event_inbox`, `accounting_periods`
- [ ] Faza C: materialized views + reconciliation jobs

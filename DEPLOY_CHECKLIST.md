# Pre-Deploy Checklist — student2work.pl

> Wersja: v1 (2026-03-24) | Owner: Claude + Codex
> Ostatnia aktualizacja po: KROK 3 Codexa + conformity audit v1

---

## 🔴 GATE 0 — EPERM / Build Verification

**DO NOT PROCEED** to any live deployment until this gate passes.

- [ ] Push branch do GitHub
- [ ] Vercel Preview deployment uruchomiony automatycznie
- [ ] Vercel Preview build: **zielony** (bez błędów TS / ESLint)
- [ ] Jeśli czerwony: naprawić błędy przed kontynuacją (EPERM lokalny = nie blokuje Vercel)

---

## 🔴 GATE 1 — Drift Resolution

Przed deploy rozwiązać znane drifty z `supabase/migrations/README.md`:

- [ ] **DRIFT-01**: Duplikaty UPDATE policies na `applications` — zweryfikować i usunąć po zatwierdzeniu Codexa
- [ ] **DRIFT-02**: `deliverables` bucket — ustawić `file_size_limit` i `allowed_mime_types`
- [ ] **DRIFT-03**: `idx_ledger_stripe_refund_v3` — DROP po zatwierdzeniu Codexa

---

## 🟡 GATE 2 — Środowisko Produkcyjne (Vercel)

Wszystkie poniższe zmienne muszą być ustawione w Vercel → Settings → Environment Variables dla środowiska **Production**:

- [ ] `STRIPE_SECRET_KEY` = `sk_live_...` _(zastąpić sk_test)_
- [ ] `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` = `pk_live_...` _(zastąpić pk_test)_
- [ ] `STRIPE_WEBHOOK_SECRET` = `whsec_...` _(nowy, z produkcyjnego endpointu webhook)_
- [ ] `NEXT_PUBLIC_SUPABASE_URL` = URL produkcyjnej instancji Supabase
- [ ] `SUPABASE_SERVICE_ROLE_KEY` = service_role key produkcji
- [ ] `NEXT_PUBLIC_SITE_URL` = `https://student2work.pl`
- [ ] `CRON_SECRET` = losowy string ≥64 znaki (wygenerować: `openssl rand -hex 32`)
- [ ] **Weryfikacja**: żadna zmienna `sk_live_` / `service_role` NIE jest w `NEXT_PUBLIC_*`

---

## 🟡 GATE 3 — Stripe Konfiguracja

- [ ] Stripe Dashboard → przełącznik na **Live mode**
- [ ] Webhooks → Add endpoint: `https://student2work.pl/api/stripe/webhook`
- [ ] Zdarzenia webhook: `checkout.session.completed`, `charge.refunded`, `refund.created`
- [ ] Skopiować **Signing secret** nowego endpointu → wkleić jako `STRIPE_WEBHOOK_SECRET` w Vercel
- [ ] Utrzymać **osobny endpoint testowy** dla Vercel Preview (z test keys)
- [ ] Replay test: `checkout.session.completed` przez Stripe webhook tester (test mode)

---

## 🟡 GATE 4 — Supabase Produkcja

- [ ] Wszystkie migracje z `supabase/migrations/` zastosowane (brak drift)
- [ ] RLS włączone: `financial_ledger`, `accounting_*`, `profiles`, `contracts`, `applications`
- [ ] Storage buckets privacy:
  - `cvs` = **private** ✅ (potwierdzone)
  - `documents` = **private** ✅ (potwierdzone)
  - `deliverables` = **private** ✅ (potwierdzone)
  - `portfolio` = public ✅
  - `chat-attachments` = public ✅
  - `offer_attachments` = public ✅
- [ ] `service_role` key NIE jest dostępny po stronie klienta
- [ ] `deliverables` bucket: file_size_limit i allowed_mime_types ustawione (DRIFT-02)

---

## 🟢 GATE 5A — Smoke Testy (test-mode, WYMAGANE przed launch)

Wykonać w kolejności. Każdy musi przejść zanim idziemy dalej.

- [ ] **1. Rejestracja + onboarding**: nowy student → profil | nowa firma → profil + oferta
- [ ] **2. Application flow**: student aplikuje → firma akceptuje → kontrakt draft
- [ ] **3. Checkout + webhook**: firma płaci (Stripe test) → webhook `checkout.session.completed` → `verify-payment` → kontrakt `active`
- [ ] **4. Stripe Webhook Signature**: potwierdzić że `STRIPE_WEBHOOK_SECRET` jest poprawnie wczytywany (test replay + brak 400)
- [ ] **5. Deliverable + milestone**: student dodaje deliverable → firma akceptuje milestone → escrow_release w ledgerze
- [ ] **6. Payout path**: admin oznacza payout → `student_payout` w `financial_ledger` + `amount_minor` poprawny
- [ ] **7. Partial refund**: refund przez Stripe test Dashboard → webhook `charge.refunded` → DB status → `stripe_refund` w ledgerze
- [ ] **8. Full refund**: kontrakt cancelled → `escrow_release` reversed → ledger kompletny
- [ ] **9. Admin exports**: GET `/api/admin/export/pit-csv` → CSV bez 500 | GET `/api/admin/export/invoices-zip` → CSV bez 500
- [ ] **10. Service order funding**: service_order opłacony → `stripe_payment` w ledgerze

---

## 🔵 GATE 5B — Smoke Testy Live (opcjonalne, tylko po autoryzacji Bartosza)

Wykonać TYLKO po przejściu wszystkich testów 5A.

- [ ] Autoryzacja Bartosza: TAK / NIE
- [ ] Mała transakcja live (1 PLN) z realną kartą (NIE karta 4242 — to karta testowa)
- [ ] Potwierdzenie w Stripe Dashboard: payment w **Live mode**
- [ ] Zero błędów 500 w logach Vercel przez pierwsze 30 minut

---

## 🔵 GATE 6 — Go/No-Go Decision

- [ ] Wszystkie GATE 0–5A: ✅ zielone
- [ ] Zero 500 errors w Vercel logs podczas smoke testów
- [ ] Codex: finalne **deploy-safe / not-safe** na podstawie wyników

---

## ⚡ Rollback Plan

| Problem | Akcja |
|---------|-------|
| Vercel build/runtime error | Redeploy poprzedni deployment (1 klik w Vercel Dashboard) |
| Stripe webhook nie działa | Przełączyć webhook endpoint na poprzedni / wyłączyć live mode |
| Supabase migracja zepsuta flow | Nowa migracja `down_*.sql` (nie reset!) |
| Krytyczny błąd finansowy | Feature flag: wyłączyć checkout, kontakt Stripe support |

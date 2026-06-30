# ADR: Stripe Connect account model dla studentow - 2026-06-27

## Status

Proposed. Produkcyjne wyplaty live pozostaja `NO-GO`, dopoki decyzja nie zostanie podpisana i oznaczona w env przez `STRIPE_CONNECT_MODEL_APPROVED=true`.

## Kontekst

Obecny pilot tworzy konta studentow przez v1 Connect:

- `stripe.accounts.create({ type: "express", country: "PL", capabilities: { transfers: { requested: true } } })`,
- onboarding idzie przez `stripe.accountLinks.create({ type: "account_onboarding" })`,
- readiness sprawdza `details_submitted`, `payouts_enabled` i `capabilities.transfers === "active"`,
- payouty ida pozniej przez `stripe.transfers.create({ destination: stripe_account_id })`.

Ten model dziala z aktualnym kodem i danymi `student_profiles.stripe_account_id`, ale jest legacy-style dla nowych platform. Zgodnie z lokalnymi wytycznymi Stripe dla nowych marketplace'ow preferowany jest Accounts v2 (`/v2/core/accounts`) z jawnymi konfiguracjami odpowiedzialnosci, dashboardu i capability.

## Decyzja rekomendowana

Na pilot/staging utrzymujemy obecny model v1 Express, ale traktujemy go jako kompatybilnosciowy, nie jako automatyczna zgode na produkcje live.

Przed publicznym go-live wybieramy jedna z dwoch sciezek:

1. Migracja nowych kont studentow do Accounts v2 jako `recipient`.
2. Formalne zatwierdzenie pozostania przy v1 Express dla pilota/live, z opisaniem powodow i ograniczen.

## Preferowana sciezka: Accounts v2 recipient

Docelowy student jest odbiorca srodkow, nie merchant of record. Dla obecnego modelu Checkout + ledger + pozniejszy transfer odpowiada temu konfiguracja `recipient`, a nie `merchant`.

Docelowa konfiguracja powinna:

- tworzyc konto przez `stripe.v2.core.accounts.create`,
- uzywac `configuration.recipient.capabilities.stripe_balance.stripe_transfers.requested = true`,
- zapewnic onboarding przez `stripe.v2.core.accountLinks.create` z `use_case.type = "account_onboarding"` i `configurations = ["recipient"]`,
- nie mieszac tego w jednym PR z migracja charge type albo manual-capture escrow,
- zapisac w DB wersje modelu konta, np. `stripe_account_api_version = 'v2_core_recipient'`, zanim zaczniemy mieszac konta v1 i v2,
- dopasowac readiness check do v2 requirements/capabilities zamiast v1 `payouts_enabled`.

## Minimalne kryteria akceptacji

- Student moze przejsc onboarding w test mode.
- `test:mvp-scenarios` ma gotowy testowy Stripe account i przechodzi payout evidence.
- Payout nie uruchamia sie, jesli konto nie ma aktywnej mozliwosci przyjmowania transferow.
- Webhook `account.updated` albo v2 event/reconciliation aktualizuje stan onboardingu.
- Produkcja wymaga `STRIPE_CONNECT_MODEL_APPROVED=true`.

## Obecne ograniczenia

- Istniejace profile przechowuja tylko `stripe_account_id`, bez wersji modelu konta.
- Payout worker uzywa v1 Transfers i readiness dla v1 `Stripe.Account`.
- Stripe SDK ma namespace `stripe.v2.core.accounts`, ale zmiana wymaga testow z prawdziwym Stripe test mode i fixtures.

## Konsekwencje

Ten ADR nie zmienia runtime pilota. Dodaje natomiast release gate: produkcja live nie moze przejsc bez swiadomej decyzji Connect. Najbezpieczniejsza kolejna implementacja to migracja danych `student_profiles` o wersje modelu konta oraz osobny feature flag dla tworzenia nowych kont przez Accounts v2 na stagingu.

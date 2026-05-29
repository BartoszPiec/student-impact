# Student2Work MVP Pilot Runbook

Cel: uruchomic pilot dla 5-10 pierwszych uzytkownikow na Vercel Preview, z platnosciami w Stripe test mode.

## Srodowisko

- Aktualny deploy pilota: https://student-impact-6t719vlcq-bartoszs-projects-216e6600.vercel.app
- Deploy: Vercel Preview.
- Baza: zlinkowany projekt Supabase `Antygravity`.
- Stripe: tylko test mode (`sk_test_...`, `pk_test_...`).
- Transfery: testowe Stripe Connect, bez live money.

Wymagane env dla Preview:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PAYOUTS_ENABLED=true
STRIPE_WEBHOOK_PROCESS_INLINE=true
CRON_SECRET=
NEXT_PUBLIC_APP_URL=
```

`NEXT_PUBLIC_APP_URL` moze zostac puste na preview, jesli Vercel ustawia `VERCEL_URL`.

## Stripe Sandbox

Webhook testowy Stripe powinien wskazywac:

```text
https://<preview-url>/api/stripe/webhook
```

Aktualny webhook pilota:

```text
we_1TaeRNLYZs1gNRrDBqOQbomZ
https://student-impact-6t719vlcq-bartoszs-projects-216e6600.vercel.app/api/stripe/webhook
```

Eventy:

- `checkout.session.completed`
- `checkout.session.expired`
- `account.updated`
- `charge.refunded`
- `refund.created`

Karta testowa Stripe:

```text
4242 4242 4242 4242
Dowolna przyszla data waznosci
Dowolny CVC
Dowolny kod pocztowy
```

## Konta Pilota

Uzywaj oznaczen `Pilot Sandbox`, zeby odroznic dane od realnych.

Minimalny zestaw:

- admin: do kontroli panelu i payoutow,
- firma: sklada zamowienie Quick Task,
- student: przyjmuje i realizuje zlecenie.

Student musi przejsc Stripe Connect onboarding w test mode przed platnoscia, jesli `STRIPE_PAYOUTS_ENABLED=true`.

Seed danych pilota:

```bash
node scripts/seed-pilot-sandbox.mjs
```

Reset hasel kont pilota:

```bash
RESET_PILOT_PASSWORDS=true node scripts/seed-pilot-sandbox.mjs
```

Aktualny pakiet pilota w Supabase:

```text
Pilot Sandbox - Quick Task
```

## Scenariusz E2E

1. Firma loguje sie na preview.
2. Firma wybiera aktywna usluge systemowa Quick Task.
3. Firma wypelnia brief i tworzy zlecenie.
4. Student widzi zlecenie, status i nastepna akcje.
5. Student przyjmuje zlecenie.
6. System generuje umowy A/B.
7. Firma akceptuje umowe A, student akceptuje umowe B.
8. Firma oplaca zlecenie przez Stripe Checkout test card.
9. Webhook zapisuje event i przetwarza kolejke inline.
10. Kontrakt przechodzi do realizacji bez recznych zmian w DB.
11. Student dostarcza wynik.
12. Firma akceptuje wynik.
13. System tworzy payout i wykonuje testowy transfer albo zapisuje jasny status oczekiwania, gdy konto Stripe studenta nie ma jeszcze aktywnej capability `transfers`.
14. Firma i student widza finalny status oraz dokumenty.

Jesli payout zostanie w statusie `pending` przez brak gotowosci konta Connect, student powinien dokonczyc Stripe onboarding w test mode, a admin moze ponowic wyplate z panelu `/app/admin/payouts`.

## Reczne Uruchomienie Cron

Preview nie polega na Vercel Cron. W razie potrzeby endpointy mozna wywolac recznie:

```bash
curl -H "Authorization: Bearer <CRON_SECRET>" https://<preview-url>/api/cron/process-stripe-events
curl -H "Authorization: Bearer <CRON_SECRET>" https://<preview-url>/api/cron/auto-accept
curl -H "Authorization: Bearer <CRON_SECRET>" https://<preview-url>/api/cron/cleanup-expired-sessions
```

## Go / No-Go

Go:

- `npm.cmd run build` przechodzi.
- Preview deploy konczy sie sukcesem.
- `/`, `/auth`, `/app/profile`, katalog uslug i widok realizacji laduja sie bez 500.
- Stripe webhook test mode dochodzi do aplikacji.
- Pelny flow E2E przechodzi bez recznych zmian w bazie po rozpoczeciu zlecenia.
- Uzytkownicy nie widza surowych UUID, JSON bledow, nazw tabel ani technicznych statusow w glownym flow.

No-go:

- Platnosc testowa wymaga recznej korekty DB.
- Umowy nie blokuja checkoutu przed akceptacja obu stron.
- Po akceptacji pracy nie powstaje payout.
- Widoki firmy lub studenta pokazuja stack trace, JSON albo techniczne dane integracji.
- Brakuje testowego webhooka Stripe dla aktualnego preview URL.

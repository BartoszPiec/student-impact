# ADR: model platnosci i go-live path Student2Work - 2026-06-27

## Status

Proposed. Nie jest to jeszcze zgoda na publiczny go-live platnosci live.

## Kontekst

Obecny pilot uzywa Stripe Checkout w trybie `mode: "payment"` oraz wewnetrznego ledger/release flow:

- firma placi przez Checkout Session,
- webhook Stripe zapisuje i przetwarza platnosc,
- kontrakt/milestone przechodzi w stan aktywny po funding,
- release do studenta jest pozniejszym Stripe Transfer,
- payout jest blokowany guardami kontraktu, milestone, payment status i dispute.

Ten model jest operacyjnie utwardzany w kodzie, ale nie jest klasycznym manual-capture escrow z `capture_method = "manual"` ani destination charge z `application_fee_amount` i `transfer_data.destination` na etapie autoryzacji. Publiczne copy, umowy i czesc paneli nadal uzywaja slowa "escrow", wiec przed go-live trzeba formalnie zatwierdzic model finansowy albo zmienic copy na model faktyczny.

## Decyzja rekomendowana

Na pilot/staging utrzymujemy obecny model:

- Checkout + ledger + pozniejszy transfer,
- release dopiero po akceptacji, auto-accept albo decyzji admina,
- dispute blokuje transfer,
- wszystkie kwoty sa pobierane server-side z DB,
- Stripe i service-role pozostaja server-only.

Na publiczny go-live wybieramy jedna z dwoch sciezek:

1. Docelowe escrow/manual-capture, jesli legal/finance potwierdza taka konstrukcje.
2. Formalnie zatwierdzony model "platnosc do platformy + ledger liability + release transferem", z usunieciem albo precyzyjnym zdefiniowaniem slowa "escrow" w copy i dokumentach.

Do czasu decyzji produkcja platnosci live pozostaje `NO-GO`.

## Migration path A: manual-capture escrow

Zakres techniczny:

- przeprojektowac Stripe flow z Checkout/PaymentIntent pod `capture_method = "manual"`,
- ustalic, czy uzywamy destination charge, separate charges and transfers, czy platform balance custody,
- dodac `application_fee_amount` i/lub osobny sposob naliczania prowizji zgodnie z wybranym modelem,
- dopasowac webhooki do autoryzacji, capture, cancel, refund i transfer events,
- dodac expiry/cancel dla niezaakceptowanych prac oraz manual/admin capture path,
- zmigrowac statusy DB do jednoznacznych stanow: `awaiting_funding`, `funded`, `delivered`, `accepted`, `released`, `disputed`, `refunded`.

Kryteria akceptacji:

- payment cannot be captured before both contract timestamps exist,
- capture cannot happen during dispute,
- replay webhook nie tworzy drugiego ledger entry,
- partial/full refund ma test i zapis ledger,
- `test:mvp-scenarios` przechodzi 26/26 z gotowym Connect account.

## Migration path B: zatwierdzony Checkout + ledger

Zakres techniczny:

- zachowac obecny Checkout + ledger + transfer flow,
- doprecyzowac nazwy w UI: "depozyt Student2Work", "srodki zabezpieczone", "release po akceptacji", bez sugerowania bankowego rachunku escrow, jesli prawnie nie jest to escrow,
- zaktualizowac umowy A/B i klauzule PDF tak, aby opisywaly faktyczny przeplyw srodkow,
- dopelnic refund/dispute/admin release tests,
- doprowadzic student Stripe Connect account do stanu gotowego do transferow.

Kryteria akceptacji:

- copy publiczne, modal platnosci, dokumenty i admin finance uzywaja tego samego slownika,
- `check:production` przechodzi na live env,
- `STRIPE_PAYOUTS_ENABLED=true` jest ustawione dopiero po pozytywnym teście payout,
- brak publicznego endpointu lub komponentu pozwalajacego zasymulowac platnosc bez Stripe.

## Release gates

Go-live platnosci live jest zablokowany, dopoki nie przejda:

- `npm run check:production`,
- `npm run test:mvp-scenarios`,
- live/staging Stripe webhook dla rzeczywistego HTTPS app URL,
- gotowy Stripe Connect account studenta,
- realne `PLATFORM_LEGAL_*`,
- podpisana decyzja: path A albo path B.

## Konsekwencje

Obecny pilot moze byc dalej testowany i utwardzany, ale marketing, regulamin, umowy i UI nie powinny obiecywac mechaniki escrow wykraczajacej poza zatwierdzony model. Najbezpieczniejszy nastepny PR to copy/legal alignment po wyborze path A albo path B.

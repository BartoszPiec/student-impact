# Private Proposals Foundation v1 — QA Checklist

## Gate 0

1. Potwierdzić, że migracja `20260331143000_private_proposals_foundation_v1.sql` jest zaaplikowana.
2. Potwierdzić, że student widzi `/app/services/proposals/new?packageId=...`.
3. Potwierdzić, że istnieje przynajmniej jedna firma kwalifikujaca sie do prywatnej propozycji.
4. Jeśli którykolwiek punkt nie przechodzi, run oznaczamy `BLOCKED`.

## Scenario 1 — Student compose flow

1. Student wchodzi z `Moje uslugi` do prywatnej propozycji.
2. Wybiera firme z listy eligible companies.
3. Uzupelnia:
   - cel wspolpracy
   - oczekiwany rezultat
   - zakres i plan realizacji
   - czas realizacji
   - proponowana kwote
   - wiadomosc do firmy
4. Wysyla formularz.
5. Oczekiwany wynik:
   - brak bledu runtime
   - redirect do `/app/services/dashboard/[id]`
   - detail pokazuje prywatna propozycje, nie stary blob briefu

## Scenario 2 — Student detail rendering

1. Student otwiera detail nowej prywatnej propozycji.
2. Oczekiwany wynik:
   - badge lub czytelny sygnal, ze to prywatna propozycja
   - poprawny render:
     - cel wspolpracy
     - oczekiwany rezultat
     - zakres
     - firma docelowa
     - kwota / timeline
     - wiadomosc
   - historia wyceny pokazuje student offer

## Scenario 3 — Company receiving surface

1. Firma otwiera `/app/company/orders`.
2. Oczekiwany wynik:
   - nowy order pojawia sie bez nowego inboxu
   - order da sie odroznic od klasycznego company request
   - detail `/app/company/orders/[id]` renderuje prywatna propozycje poprawnie
   - CTA negocjacyjne dzialaja logicznie

## Scenario 4 — Chat routing

1. Student otwiera czat z detailu prywatnej propozycji.
2. Firma otwiera czat z detailu tego samego orderu.
3. Oczekiwany wynik:
   - obie strony trafiaja do tego samego threadu
   - thread odpowiada tylko temu service orderowi
   - brak pomieszania z wczesniejszymi orderami tej samej firmy lub tego samego pakietu

## Scenario 5 — Legacy fallback

1. Otworzyc starszy `service_order` bez `service_order_id` na conversation i bez private proposal source.
2. Oczekiwany wynik:
   - detail dalej dziala
   - preview dalej dziala
   - deliverables / chat nie dostaja regresji

## Scenario 6 — Company response loop

1. Firma akceptuje albo kontruje prywatna propozycje.
2. Student widzi wynik po swojej stronie.
3. Oczekiwany wynik:
   - status przechodzi poprawnie
   - historia wyceny jest spójna
   - po akceptacji dalej dziala ten sam flow `deliverables -> escrow`

## Acceptance Criteria

- Prywatna propozycja zapisuje sie jako wariant `service_orders`, nie osobna domena.
- Eligible-company guard dziala i nie pozwala wysylac propozycji do dowolnej firmy.
- Company receiving odbywa sie w `/app/company/orders`.
- `student_private_proposal` renderuje sie jako odrebny brief shape po obu stronach.
- Chat jest routowany po `service_order_id` i nie miesza watkow.
- Stare rekordy dalej dzialaja przez fallback.

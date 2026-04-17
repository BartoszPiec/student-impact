# Quote Snapshot Phase — Repo-Grounded Plan

## Cel

Uporządkować service quote flow tak, żeby `service_orders` przestało polegać wyłącznie na płaskim `requirements` blobie, a zaczęło przechowywać:

- **`request_snapshot`** — strukturalny snapshot zapytania od firmy
- **`quote_snapshot`** — strukturalny snapshot wyceny / kontr-oferty / zaakceptowanej stawki

To jest faza pomiędzy:
- zamkniętym `Student Service Ops Cockpit v1`
- a przyszłymi `private proposals` student -> firma

## Potwierdzony stan repo

### Source of truth

- `service_packages` — katalog usług studenta
- `service_orders` — workflow SoT
- `conversations` — transport rozmowy
- `contracts` / `deliverables` — dalsza realizacja po akceptacji

### Co działa dziś

- firma może utworzyć `service_order`
- student może wysłać wycenę
- firma może zaakceptować lub skontrować
- student może zaakceptować kontrofertę
- `ensure_contract_for_service_order()` tworzy kontrakt i milestone po akceptacji

### Najważniejsza obserwacja techniczna

Aktualna funkcja [ensure_contract_for_service_order()](/C:/Users/Bartosz%20i%20Natalia/Desktop/Student-impact-antygraviti/supabase/migrations/20260325210000_variable_commission_model_v1.sql#L370) **nie używa** `requirements` jako danych kontraktowych.

Korzysta tylko z:
- `service_order_id`
- `company_id`
- `student_id`
- `amount`
- `package_id` dla prowizji

To oznacza, że wejście w snapshoty jest bezpieczne:
- nie dublujemy danych używanych dziś do tworzenia kontraktu
- możemy najpierw poprawić model workflow, a dopiero potem świadomie zdecydować, czy snapshot ma wejść do PDF / contract snapshot

## Problem do rozwiązania

Aktualny [createOrder()](/C:/Users/Bartosz%20i%20Natalia/Desktop/Student-impact-antygraviti/app/app/orders/create/%5BpackageId%5D/_actions.ts) składa wszystko do jednego tekstu:

- email kontaktowy
- strona firmy
- odpowiedzi dynamiczne `q_*`
- dodatkowe informacje

To ląduje w `service_orders.requirements` jako jeden blob.

Konsekwencje:
- UI nie wie, które dane są briefem, a które kontaktem
- quote flow nie ma struktury pod późniejszą umowę / finanse
- trudno bezpiecznie dodać private proposals i lepszy company-side order management

## Minimalny scope tej fazy

### 1. Schema extension

Do `service_orders` dodajemy dwa nullable `jsonb`:

- `request_snapshot`
- `quote_snapshot`

Bez usuwania:
- `requirements`
- `contact_email`
- `company_website`

To faza addytywna, nie breaking.

### 2. Request snapshot przy tworzeniu zamówienia

W [createOrder()](/C:/Users/Bartosz%20i%20Natalia/Desktop/Student-impact-antygraviti/app/app/orders/create/%5BpackageId%5D/_actions.ts):

- dalej zapisujemy legacy `requirements` dla backward compatibility
- jednocześnie zapisujemy `request_snapshot`

Proponowany kształt:

```json
{
  "source": "company_order_form",
  "package_id": "uuid",
  "package_title": "Strona Landing Page w React/Tailwind",
  "contact": {
    "email": "firma@example.com",
    "website": "https://firma.pl"
  },
  "form_answers": [
    { "id": "deadline", "label": "Preferowany termin", "value": "2026-04-20" },
    { "id": "brandbook", "label": "Czy masz brandbook?", "value": "Tak" }
  ],
  "additional_info": "Potrzebujemy landing page dla SaaS...",
  "submitted_at": "ISO timestamp"
}
```

### 3. Quote snapshot przy negocjacji

W:
- [proposeServicePriceAction()](/C:/Users/Bartosz%20i%20Natalia/Desktop/Student-impact-antygraviti/app/app/services/_actions.ts)
- [counterServiceProposalAction()](/C:/Users/Bartosz%20i%20Natalia/Desktop/Student-impact-antygraviti/app/app/services/_actions.ts)
- [acceptServiceProposalAction()](/C:/Users/Bartosz%20i%20Natalia/Desktop/Student-impact-antygraviti/app/app/services/_actions.ts)
- [acceptServiceCounterAction()](/C:/Users/Bartosz%20i%20Natalia/Desktop/Student-impact-antygraviti/app/app/services/_actions.ts)

trzeba utrzymywać `quote_snapshot`.

Minimalnie:

```json
{
  "state": "proposal_sent",
  "student_offer": {
    "amount": 950,
    "message": "Mogę dostarczyć w 10 dni",
    "created_at": "ISO timestamp"
  },
  "company_counter": {
    "amount": 850,
    "created_at": "ISO timestamp"
  },
  "accepted_amount": 850,
  "accepted_by": "student",
  "accepted_at": "ISO timestamp"
}
```

Nie trzeba jeszcze robić pełnego event-sourcingu. W tej fazie chodzi o czytelny snapshot bieżąco uzgodnionych warunków.

### 4. Read path w UI

UI nie powinno od razu przestać wspierać legacy records.

Zasada:
- jeśli `request_snapshot` istnieje -> renderuj strukturę
- jeśli nie istnieje -> fallback do `requirements`

Dotyczy:
- `/app/services/dashboard`
- `/app/services/dashboard/[id]`
- ewentualnie przyszłego company-side surface

### 5. Bez zmian w tej fazie

Celowo **nie** wchodzi teraz:
- zmiana `ensure_contract_for_service_order()`
- private proposals student -> firma
- company-side order management surface
- nowe PDF templates
- decyzje prawne dot. NDA / IP transfer dla service quote flow

## Proponowany batch implementacyjny

### Batch A — snapshot foundation

1. dodać `request_snapshot jsonb` i `quote_snapshot jsonb`
2. zapisywać `request_snapshot` w `createOrder`
3. zapisywać / aktualizować `quote_snapshot` w service negotiation actions
4. dodać helpery do odczytu snapshotów z fallbackiem do blobu
5. wyrenderować structured request summary w dashboard detail

To jest najlepszy pierwszy batch, bo:
- nie rusza kontraktów
- nie wymaga decyzji prawnych
- redukuje główny debt potwierdzony przez Claude

## SQL / schema guidance

Zgodnie z dobrymi praktykami Supabase/Postgres:
- zaczynamy od nullable columns
- bez GIN indeksów na start, bo nie ma jeszcze query patternu filtrującego po polach z JSONB
- nie usuwamy legacy `requirements`, dopóki read path nie będzie w pełni przełączony i przetestowany

## Acceptance criteria dla tej fazy

- nowy `service_order` zapisuje `request_snapshot`
- nowa wycena / kontroferta aktualizuje `quote_snapshot`
- detail studenta pokazuje structured brief zamiast surowego blobu, jeśli snapshot istnieje
- stare rekordy nadal działają przez fallback
- `ensure_contract_for_service_order()` działa bez zmian

## Następny krok po tej fazie

Po zamknięciu snapshotów:

1. `company-side order management`
2. `private proposals` tylko dla firm z historią współpracy
3. decyzja, czy któryś fragment snapshotów ma trafić do contract snapshot / PDF

# Claude QA Instructions — Private Proposals Foundation v1

## Context

Codex wdrozyl `Private Proposals Foundation v1`.

Ta faza:
- NIE tworzy osobnej domeny
- wykorzystuje istniejacy `service_orders` engine
- dodaje nowy entry point: student -> prywatna propozycja -> firma

Najwazniejsze zmiany:
- `service_orders.entry_point`
- `service_orders.initiated_by`
- `conversations.service_order_id`
- `request_snapshot.source = student_private_proposal`
- nowy compose route: `/app/services/proposals/new?packageId=...`

## Read First

1. `C:\Users\Bartosz i Natalia\Desktop\Student-impact-antygraviti\PRIVATE_PROPOSALS_FOUNDATION_QA_CHECKLIST.md`
2. `C:\Users\Bartosz i Natalia\Desktop\Student-impact-antygraviti\app\app\services\proposals\new\page.tsx`
3. `C:\Users\Bartosz i Natalia\Desktop\Student-impact-antygraviti\app\app\services\_actions.ts`
4. `C:\Users\Bartosz i Natalia\Desktop\Student-impact-antygraviti\app\app\services\dashboard\[id]\page.tsx`
5. `C:\Users\Bartosz i Natalia\Desktop\Student-impact-antygraviti\app\app\company\orders\[id]\page.tsx`
6. `C:\Users\Bartosz i Natalia\Desktop\Student-impact-antygraviti\lib\services\service-order-snapshots.ts`
7. `C:\Users\Bartosz i Natalia\Desktop\Student-impact-antygraviti\lib\services\service-order-conversations.ts`
8. `C:\Users\Bartosz i Natalia\Desktop\Student-impact-antygraviti\SPRINT_LIVE_BOARD.md`
9. `C:\Users\Bartosz i Natalia\Desktop\Student-impact-antygraviti\AGENT_NOTEBOOK.md`
10. `C:\Users\Bartosz i Natalia\Desktop\Student-impact-antygraviti\CHAT_REPORT_TEMPLATES.md`

## Task

Przygotuj krotki evidence-based verification audit dla `Private Proposals Foundation v1`.

## What To Verify

1. Czy migracja jest zaaplikowana i compose flow otwiera sie bez bledu.
2. Czy student moze wyslac prywatna propozycje tylko do eligible company.
3. Czy po submit:
   - nie ma runtime error
   - jest redirect do detail page
   - detail nie renderuje starego briefu company-order-form
4. Czy `/app/company/orders` przyjmuje ten order bez nowego inboxu.
5. Czy company detail renderuje prywatna propozycje poprawnie.
6. Czy chat routing trafia do wlasciwego watku dla tego konkretnego `service_order_id`.
7. Czy stary service-order flow dalej dziala bez regresji.
8. Czy po company accept / counter prywatna propozycja dalej wpada do tego samego flow negocjacji i realizacji.

## Rules

- dzialasz tylko przez browser / chrome extension
- raportujesz tylko to, co realnie widzisz
- nie zgadujesz stanu bazy
- jesli migracja nie jest zaaplikowana, zatrzymaj run i oznacz `BLOCKED`
- oddziel UX debt od prawdziwych blockerow workflow
- jesli znajdziesz blocker, nazwij go jako `primary blocker`

## Output Format

Dla kazdego sprawdzenia zapisz:
- route
- rola
- expected result
- actual result
- PASS / FAIL / BLOCKED
- screenshot albo dokladny opis widocznego bledu

Na koncu wybierz dokladnie jedno:
- `TARGET: PRIVATE PROPOSALS POLISH FIRST`
- `TARGET: PRIVATE PROPOSALS PHASE COMPLETE`
- `TARGET: PRIVATE PROPOSALS FIX FIRST`

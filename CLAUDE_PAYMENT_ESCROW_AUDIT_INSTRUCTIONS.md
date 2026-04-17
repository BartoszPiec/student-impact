Pracujemy dalej tylko z Codexem. Antigravity pozostaje wylaczone.

Przeczytaj:
1. C:\Users\Bartosz i Natalia\Desktop\Student-impact-antygraviti\PAYMENT_ESCROW_FLOW_AUDIT_PLAN.md
2. C:\Users\Bartosz i Natalia\Desktop\Student-impact-antygraviti\QA_MARKETPLACE_DOCUMENTS_PLAYBOOK.md
3. C:\Users\Bartosz i Natalia\Desktop\Student-impact-antygraviti\SPRINT_LIVE_BOARD.md
4. C:\Users\Bartosz i Natalia\Desktop\Student-impact-antygraviti\AGENT_NOTEBOOK.md
5. C:\Users\Bartosz i Natalia\Desktop\Student-impact-antygraviti\CHAT_REPORT_TEMPLATES.md

Twoje zadanie:
Przygotuj krotki evidence-based audit dla `Payment / Escrow Flow First`.

Sprawdz browserowo:
- gdzie realnie zatrzymuje sie user po accepted service order albo accepted application
- jak wyglada wejscie w checkout / platnosc
- co widzi firma po platnosci lub przy braku platnosci
- czy UI jasno komunikuje status escrow
- czy po funding event widac jakakolwiek zmiane w deliverables albo documents
- czy company invoice pojawia sie gdziekolwiek w UI
- czy blocker jest:
  - brak test payment path
  - broken webhook / verification
  - UI not refreshing
  - missing invoice/document surface

Wazne zasady:
- dzialasz tylko przez browser / chrome extension
- raportujesz tylko to, co realnie widzisz
- nie zgadujesz stanu bazy
- jesli nie masz mozliwosci przejsc przez platnosc testowa, nazwij to wprost
- oddzielasz UX debt od prawdziwych blockerow workflow
- jesli znajdziesz blocker, nazwij go jako primary blocker

Dla kazdego sprawdzenia zapisz:
- route
- rola
- expected result
- actual result
- PASS / FAIL / BLOCKED
- screenshot albo dokladny opis bledu

Na koncu wybierz dokladnie jedno:
- TARGET: PAYMENT IMPLEMENTATION BATCH
- TARGET: WEBHOOK/STATUS DEBUG FIRST
- TARGET: QA/ACCESS UNBLOCK FIRST

Raport ma byc krotki, konkretny i zgodny z template.

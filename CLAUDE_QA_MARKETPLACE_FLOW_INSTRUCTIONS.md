Pracujemy dalej tylko z Codexem. Antigravity pozostaje wylaczone.

Przeczytaj:
1. C:\Users\Bartosz i Natalia\Desktop\Student-impact-antygraviti\QA_MARKETPLACE_DOCUMENTS_PLAYBOOK.md
2. C:\Users\Bartosz i Natalia\Desktop\Student-impact-antygraviti\QA_RUN_TEMPLATE.md
3. C:\Users\Bartosz i Natalia\Desktop\Student-impact-antygraviti\SPRINT_LIVE_BOARD.md
4. C:\Users\Bartosz i Natalia\Desktop\Student-impact-antygraviti\AGENT_NOTEBOOK.md
5. C:\Users\Bartosz i Natalia\Desktop\Student-impact-antygraviti\CHAT_REPORT_TEMPLATES.md

Zadanie:
Przejdz browserowo przez QA run dla flow:
`company create offer -> public offer -> student apply -> company accept -> workspace -> documents`.

Reguly:
- dzialasz tylko przez browser / chrome extension
- raportujesz tylko to, co realnie widzisz
- nie zgadujesz stanu bazy ani tego, co "pewnie sie zapisalo"
- zatrzymujesz sie na pierwszym prawdziwym blockerze flow
- oddzielasz problemy `UX copy/style` od `data/runtime`
- jesli payment webhook nie jest dostepny, oznaczasz `Scenario 6` jako `BLOCKED BY PAYMENT TRIGGER`, nie jako fail implementacji

Dla kazdego scenariusza zapisz:
- route
- rola
- expected result
- actual result
- `PASS | FAIL | BLOCKED`
- screenshot lub dokladny opis widocznego bledu
- ostatni krok, ktory przeszedl

Scenariusze:
1. Create Offer UX and Save
2. Time Branch and Warnings
3. Public Offer Detail
4. Application and Acceptance
5. Contract Documents
6. Company Invoice
7. Student Receipt

Na koncu przygotuj raport zgodny z `QA_RUN_TEMPLATE.md`.

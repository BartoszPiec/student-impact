Pracujemy dalej tylko z Codexem. Antigravity pozostaje wylaczone.

Przeczytaj:
1. C:\Users\Bartosz i Natalia\Desktop\Student-impact-antygraviti\FINAL_FUNDED_QA_CHECKLIST.md
2. C:\Users\Bartosz i Natalia\Desktop\Student-impact-antygraviti\PRE_SPRINT_CLOSEOUT_CHECKLIST.md
3. C:\Users\Bartosz i Natalia\Desktop\Student-impact-antygraviti\SPRINT_LIVE_BOARD.md
4. C:\Users\Bartosz i Natalia\Desktop\Student-impact-antygraviti\AGENT_NOTEBOOK.md
5. C:\Users\Bartosz i Natalia\Desktop\Student-impact-antygraviti\CHAT_REPORT_TEMPLATES.md

Wazny kontekst:
- service-order deliverables sa naprawione i live
- escrow checkout hotfix jest na produkcji od commit `952febe`
- poprzedni audit dal `PASS WITH QA GAP`
- teraz celem jest ostatni funded QA run przed nowym sprintem

Twoje zadanie:
Przygotuj krotki live evidence-based verification audit dla finalnego funded path.

Sprawdz browserowo:
1. czy firma przy accepted service order moze wejsc do `Panel realizacji`
2. czy firma widzi CTA do zasilenia escrow
3. czy klik CTA nie konczy sie juz bledem checkoutu
4. czy flow dochodzi do Stripe checkout albo poprawnego redirectu
5. jesli test payment jest mozliwy:
   - czy escrow wall znika po platnosci
   - czy status sie odswieza
   - czy `invoice_company` pojawia sie w odpowiednich surfaces
6. czy student widzi spojny funded state po tej samej platnosci
7. czy application-based deliverables nie dostaly regresji

Wazne zasady:
- dzialasz tylko przez browser / chrome extension
- raportujesz tylko to, co realnie widzisz
- nie zgadujesz stanu bazy
- jesli nie masz firmy lub test payment jest niemozliwy, napisz to wprost
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
- TARGET: READY FOR NEXT SPRINT
- TARGET: QA/ACCESS UNBLOCK FIRST
- TARGET: PAYMENT/ESCROW POLISH FIRST

Raport ma byc krotki, konkretny i zgodny z template.

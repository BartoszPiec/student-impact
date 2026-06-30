Pracujemy dalej tylko z Codexem. Antigravity pozostaje wylaczone.

Przeczytaj:
1. C:\Users\Bartosz i Natalia\Desktop\Student-impact-antygraviti\SPRINT_LIVE_BOARD.md
2. C:\Users\Bartosz i Natalia\Desktop\Student-impact-antygraviti\AGENT_NOTEBOOK.md
3. C:\Users\Bartosz i Natalia\Desktop\Student-impact-antygraviti\CHAT_REPORT_TEMPLATES.md
4. C:\Users\Bartosz i Natalia\Desktop\Student-impact-antygraviti\CONTRACT_PDF_LIFECYCLE_PLAN.md

Zadanie:
Przygotuj krotki evidence-based audit dla lifecycle umow PDF i Legal Vault completeness.

Sprawdz:
- gdzie w kodzie kontrakt powstaje i jakie sa wszystkie sciezki tworzenia kontraktu
- czy `generateContractDocuments()` jest wywolywane automatycznie, czy tylko recznie
- czy obecne wywolania generatora siedza tylko w deliverables/workspace UI
- jaki powinien byc kanoniczny moment generacji PDF:
  - contract creation
  - terms agreed
  - inny moment
- czy `documents_generated_at` jest spojne z `contract_documents`
- czy brakujace PDF-y wynikaja z:
  - braku triggera
  - braku backfillu
  - braku storage upload
  - czy mieszanki tych problemow
- czy istnieje ryzyko duplikatow dokumentow, jesli generator mozna odpalic wielokrotnie z workspace

Na koncu wybierz dokladnie jedno:
- TARGET: AUTOMATE PDF GENERATION
- TARGET: MANUAL GENERATION BUT EXPLICIT STATE
- TARGET: BACKFILL / REPAIR FIRST

Raport ma byc krotki, konkretny i zgodny z template.

TITLE: Claude Instructions - Documents Dashboard Sprint (Repo Aligned)

STATUS: READY
SCOPE: student documents, company documents, admin document polish, company profile completion
CLASSIFICATION: EXECUTION HANDOFF
OWNER: Codex
DATE: 2026-03-28

READ FIRST
- [SPRINT_DOCUMENTS_DASHBOARD_REPO_ALIGNED.md](/C:/Users/Bartosz%20i%20Natalia/Desktop/Student-impact-antygraviti/SPRINT_DOCUMENTS_DASHBOARD_REPO_ALIGNED.md)
- [SPRINT_LIVE_BOARD.md](/C:/Users/Bartosz%20i%20Natalia/Desktop/Student-impact-antygraviti/SPRINT_LIVE_BOARD.md)
- [AGENT_NOTEBOOK.md](/C:/Users/Bartosz%20i%20Natalia/Desktop/Student-impact-antygraviti/AGENT_NOTEBOOK.md)
- [CHAT_REPORT_TEMPLATES.md](/C:/Users/Bartosz%20i%20Natalia/Desktop/Student-impact-antygraviti/CHAT_REPORT_TEMPLATES.md)

GLOBAL CONTEXT
- `contract_documents` is the master source for legal and invoice-like document visibility
- `invoices` remains the master source for invoice numbering and finance metadata
- `deliverables` bucket is private and all downloads should use signed URLs
- recent admin/vault work already stabilized signed downloads and contract PDF lifecycle repair

IMPORTANT REALITY CHECKS BEFORE WRITING ANY REPORT
- `/app/admin/contracts` already exists
- `/app/admin/contracts/[id]` already exists
- `/app/admin/finance/invoices` already exists
- `/app/profile/page.tsx` already handles `role === "company"`
- student receipt generation already exists in [lib/pdf/generate-invoice.ts](/C:/Users/Bartosz%20i%20Natalia/Desktop/Student-impact-antygraviti/lib/pdf/generate-invoice.ts) as `generateStudentInvoice()`

DO NOT RECOMMEND AS GREENFIELD
- creating admin contracts page from zero
- creating admin invoices page from zero
- building company profile editing from absolute zero unless you first prove the current profile flow cannot support company UX
- writing a brand new student receipt flow without first auditing `generateStudentInvoice()`

WHAT CLAUDE SHOULD TREAT AS TRUE GREENFIELD
- `/app/company/documents`
- student documents tab inside `/app/finances`

WHAT CLAUDE SHOULD TREAT AS POLISH / REFRAME
- admin contracts = existing surface, document completeness and UX polish
- admin invoices = existing surface, PDF preview/download polish
- company profile = existing role-aware profile flow that may need a dedicated company UX pass

DEFAULT EXPECTATION FOR REPORTS
- if a page already exists, say that explicitly
- if the original sprint doc assumed it was missing, correct that assumption directly
- distinguish:
  - `greenfield`
  - `extend existing`
  - `polish existing`
  - `refactor existing`

READY-TO-PASTE MASTER PROMPT FOR CLAUDE

Pracujemy dalej tylko z Codexem. Antigravity pozostaje wylaczone.

Przeczytaj:
1. C:\Users\Bartosz i Natalia\Desktop\Student-impact-antygraviti\SPRINT_DOCUMENTS_DASHBOARD_REPO_ALIGNED.md
2. C:\Users\Bartosz i Natalia\Desktop\Student-impact-antygraviti\SPRINT_LIVE_BOARD.md
3. C:\Users\Bartosz i Natalia\Desktop\Student-impact-antygraviti\AGENT_NOTEBOOK.md
4. C:\Users\Bartosz i Natalia\Desktop\Student-impact-antygraviti\CHAT_REPORT_TEMPLATES.md

Zadanie:
Przygotuj evidence-based execution audit dla sprintu dokumentowego, ale pod aktualny stan repo, nie pod pierwotne zalozenia dokumentu.

Sprawdz:
- ktore zadania sa nadal greenfield
- ktore zadania juz istnieja i powinny byc tylko rozszerzone albo dopolerowane
- czy `generateStudentInvoice()` jest wystarczajaco dobre jako baza dla G-1, czy wymaga wydzielenia / refactoru
- czy `/app/profile/page.tsx` wystarcza jako baza pod F-2 dla firmy
- jaki jest najlepszy start po stronie Claude po tym, jak Codex zrobi S-2 i G-1

Na koncu:
- oznacz kazde zadanie jako jedno z:
  - GREENFIELD
  - EXTEND EXISTING
  - POLISH EXISTING
  - REFACTOR EXISTING
- wybierz jeden najlepszy pierwszy target dla Claude po zakonczeniu S-2 i G-1

Raport ma byc krotki, konkretny i zgodny z template.

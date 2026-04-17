TITLE: Post Contract Cross-Link Audit

STATUS: READY
SCOPE: contract detail / vault / disputes / next admin workflow
CLASSIFICATION: ARCHITECTURE | DECISION
OWNER: Claude
DATE: 2026-03-27

GOAL
- wskazac jeden najlepszy kolejny batch po wdrozeniu cross-linkow do `/app/admin/contracts/[id]`

CHECKLIST
- przeczytaj `SPRINT_LIVE_BOARD.md`
- przeczytaj `AGENT_NOTEBOOK.md`
- sprawdz aktualne implementacje:
  - `/app/admin/contracts/[id]`
  - `components/admin/contracts-table.tsx`
  - `components/admin/disputes-table.tsx`
  - `components/admin/vault-table.tsx`
  - `/app/admin/users/[id]`

ANSWER THESE
- czy `contract detail` potrzebuje teraz drobnego polishu o realnym ROI
- czy wiekszy ROI ma kolejny contract-adjacent workflow
- czy najlepszy nastepny batch przeniosl sie juz poza ten obszar

OUTPUT RULES
- raport ma byc krotki i evidence-based
- podawaj referencje do plikow
- zakoncz wyborem jednej opcji:
  - `TARGET: CONTRACT DETAIL POLISH`
  - `TARGET: CONTRACT-ADJACENT WORKFLOW`
  - `TARGET: DIFFERENT ADMIN ROI`

TITLE: Contract Cross-Link Audit

STATUS: READY
SCOPE: vault / disputes / contract detail v1
CLASSIFICATION: ARCHITECTURE
OWNER: Claude
DATE: 2026-03-27

GOAL
- ocenic najlepszy kolejny batch po wdrozeniu `/app/admin/contracts/[id]`
- wybrac najwlasciwszy entrypoint do cross-linkow w kierunku contract detail

CHECKLIST
- przeczytaj aktualny stan w `SPRINT_LIVE_BOARD.md`
- przeczytaj guardraile i stan architektury w `AGENT_NOTEBOOK.md`
- sprawdz implementacje:
  - `/app/admin/contracts/[id]`
  - `components/admin/vault-table.tsx`
  - `components/admin/disputes-table.tsx`
- potwierdz, czy `contract detail v1` ma juz wszystko, czego potrzebuje jako target

ANSWER THESE
- czy najwiekszy ROI ma teraz `vault -> contract detail`
- czy najwiekszy ROI ma teraz `disputes -> contract detail`
- czy najlepiej zrobic oba naraz
- czy pattern powinien byc oparty o link na contract ID, row action, czy oba

OUTPUT RULES
- raport ma byc krotki i evidence-based
- podawaj referencje do plikow
- nie proponuj migracji, jesli nie sa absolutnie konieczne
- zakoncz wyborem jednej opcji:
  - `TARGET: VAULT LINK-FIRST`
  - `TARGET: DISPUTES LINK-FIRST`
  - `TARGET: BOTH CROSS-LINKS NOW`
  - `TARGET: CONTRACT DETAIL POLISH FIRST`

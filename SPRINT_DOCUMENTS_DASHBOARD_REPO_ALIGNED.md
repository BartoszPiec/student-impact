TITLE: Sprint Dashboard Dokumentow v2 - Repo Aligned

STATUS: READY
SCOPE: documents surfaces, student receipts, company documents, admin document polish
CLASSIFICATION: WORKFLOW | DOCUMENTS | FINANCE | ADMIN
OWNER: Codex
DATE: 2026-03-28

SUMMARY
- Oryginalny dokument sprintowy jest kierunkowo dobry, ale wymaga korekty pod realny stan repo.
- Najwazniejsze rozroznienie: czesc scope jest greenfield (`/app/company/documents`, student documents tab), a czesc juz istnieje i powinna byc potraktowana jako polish albo refactor, nie budowa od zera.
- Priorytet pozostaje sensowny: zaczynamy od wspolnych typow i komponentow dokumentow oraz od student receipt flow, ale `G-1` to teraz audit/refactor istniejącej implementacji, nie greenfield.

SECTION 1 - AKTUALNY STAN REPO

Already exists:
- `/app/admin/contracts` i `/app/admin/contracts/[id]`
- `/app/admin/finance/invoices`
- `/app/profile/page.tsx` obsluguje `role === "company"`
- `generateStudentInvoice()` istnieje w [lib/pdf/generate-invoice.ts](/C:/Users/Bartosz%20i%20Natalia/Desktop/Student-impact-antygraviti/lib/pdf/generate-invoice.ts)
- trigger student receipt juz istnieje w [app/app/deliverables/_actions.ts](/C:/Users/Bartosz%20i%20Natalia/Desktop/Student-impact-antygraviti/app/app/deliverables/_actions.ts)
- `contract_documents` jest ustabilizowany jako master source dla legal docs i invoice docs

Missing or clearly incomplete:
- reuseable `types/documents.ts`
- reuseable `components/documents/DocumentCard.tsx`
- reuseable student documents hook
- `/app/company/documents`
- student-facing documents tab in `/app/finances`
- stronger company-profile editing UX dedicated to company needs
- admin invoice PDF preview/download polish on existing finance invoices page

SECTION 2 - SINGLE SOURCE OF TRUTH

Master source rules:
- `contract_documents` = canonical source dla:
  - `contract_a`
  - `contract_b`
  - `invoice_company`
  - `invoice_student`
- `invoices` = canonical source dla numeracji, amount fields i invoice metadata
- wszystkie UI surfaces powinny czytac dokumenty z tych samych tabel i tych samych `storage_path`
- bucket `deliverables` pozostaje prywatny; dostep tylko przez signed URL

Repo-aligned implication:
- nie tworzymy osobnych tabel "documents_dashboard"
- nie duplikujemy invoice metadata do osobnych widokow
- nie budujemy nowego admin contracts page od zera

SECTION 3 - REPO-ALIGNED TASK MAP

S-2 - Codex - GREENFIELD
What it really is:
- shared document types + helper layer + `DocumentCard`
- foundation for student and company document surfaces

Deliverables:
- `types/documents.ts`
- `components/documents/DocumentCard.tsx`
- `hooks/useStudentDocuments.ts`
- optional small helper for signed URL generation if it improves reuse

Notes:
- hook moze byc student-specific, ale typy i `DocumentCard` powinny byc neutralne i reuseable
- this is still the best first step

G-1 - Codex - REFACTOR / VERIFY, NOT GREENFIELD
What it really is:
- audit and clean extraction of existing `generateStudentInvoice()`
- verify that numbering, storage path, DB inserts and trigger are all correct
- optionally split to:
  - `lib/pdf/generate-student-receipt.ts`
  - `lib/pdf/student-receipt-template.tsx`
  while keeping compatibility wrapper in `generate-invoice.ts`

Existing evidence:
- `generateStudentInvoice()` already:
  - generates `RCH/YYYY/NNNNN`
  - uploads PDF to `deliverables`
  - inserts `invoices` with `invoice_type = "student"`
  - inserts `contract_documents` with `document_type = "invoice_student"`
  - is already called from deliverables acceptance flow

Actual success criteria:
- no duplicate logic
- clearer naming and file boundaries
- verified trigger path
- optional idempotency or duplicate guard if missing

S-1 - Claude - GREENFIELD ON EXISTING PAGE
What it really is:
- add documents tab to existing `/app/finances`
- consume S-2 abstractions

Deliverables:
- documents tab on [app/app/finances/page.tsx](/C:/Users/Bartosz%20i%20Natalia/Desktop/Student-impact-antygraviti/app/app/finances/page.tsx)
- student-only private surface
- no leakage into public profile

F-1 - Claude - GREENFIELD
What it really is:
- create `/app/company/documents`
- show only company-visible docs:
  - `contract_a`
  - `invoice_company`
- reuse S-2 display components where possible

F-2 - Claude - EXTEND EXISTING COMPANY PROFILE
What it really is:
- do not create company profile from zero unless repo forces it
- first inspect [app/app/profile/page.tsx](/C:/Users/Bartosz%20i%20Natalia/Desktop/Student-impact-antygraviti/app/app/profile/page.tsx)
- likely target is better company-profile editing UX and missing fields polish

Deliverables:
- company profile completion
- stronger company-specific form treatment
- optional widget linking to `/app/company/documents`

A-1 - Claude - EXISTING ADMIN CONTRACTS, POLISH NOT GREENFIELD
What it really is:
- existing `/app/admin/contracts` and `/app/admin/contracts/[id]` already exist
- task should be reframed as admin contracts document completeness / preview polish

Recommended scope:
- ensure contract detail clearly exposes all available docs and invoices
- if needed add inline signed links or document-state polish
- do not rebuild the contracts table from scratch

A-2 - Claude - EXISTING ADMIN INVOICES, POLISH NOT GREENFIELD
What it really is:
- existing `/app/admin/finance/invoices` already exists
- task should be reframed as:
  - direct PDF access polish
  - optional preview/download UX
  - optional monthly stats refinement

Do not:
- create `/app/admin/invoices` from zero unless there is a strong IA decision first

SECTION 4 - RECOMMENDED ORDER

Phase 1 - Codex
1. S-2 - shared document types, hook and card
2. G-1 - audit/refactor existing student receipt generator

Phase 2 - Claude
3. S-1 - student `/app/finances` documents tab
4. F-1 - `/app/company/documents`
5. A-2 - polish existing admin invoice document handling
6. A-1 - polish existing admin contracts document surface

Phase 3 - Claude
7. F-2 - company profile completion

SECTION 5 - TASK STATUS MATRIX

| Task | Original doc assumption | Real repo state | Correct treatment |
|---|---|---|---|
| S-1 | existing page, add tab | accurate | proceed |
| S-2 | new shared types/card/hook | accurate | proceed |
| F-1 | company documents missing | accurate | proceed |
| F-2 | company profile missing | inaccurate | extend existing profile flow |
| A-1 | admin contracts missing | inaccurate | polish existing contracts views |
| A-2 | admin invoices missing | inaccurate | polish existing finance invoices |
| G-1 | student receipt generator missing | inaccurate | refactor/verify existing generator |

SECTION 6 - CLAUDE/CODEX GUARDRAILS

- `contract_documents` and `invoices` remain the only accepted document sources
- no shadow tables for dashboards
- no route sprawl unless there is a strong IA reason
- do not rebuild existing admin pages from scratch just because the sprint doc originally assumed they were missing
- prefer additive UI work over new schema unless RLS actually blocks the feature
- keep private documents inside authenticated surfaces only

SECTION 7 - FIRST EXECUTION TARGETS

Codex start now:
- S-2
- G-1 (repo-aligned audit/refactor version)

Claude start after handoff:
- S-1
- F-1

SUCCESS CRITERIA
- one shared typed document layer reused by student and company surfaces
- student documents visible in `/app/finances`
- company documents visible in `/app/company/documents`
- student receipt flow is verified and no longer treated as unknown or missing
- admin document pages are polished instead of duplicated

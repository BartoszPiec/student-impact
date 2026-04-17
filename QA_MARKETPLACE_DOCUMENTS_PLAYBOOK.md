TITLE: QA Marketplace to Documents Playbook

STATUS: ACTIVE
SCOPE: company offer creation -> public offer -> student apply -> contract/workspace -> documents -> admin surfaces
CLASSIFICATION: QA | WORKFLOW | DOCUMENTS
OWNER: Codex + Claude
DATE: 2026-03-28

## Goal

This playbook is the canonical regression path for the marketplace-to-documents flow.

It exists so future QA runs do not depend on memory or ad-hoc notes.

## Source of Truth

- `offers` stores the collaboration brief and offer metadata
- `contract_documents` remains the single source of truth for document visibility
- `invoice_company` is expected only after a Stripe payment or equivalent payment trigger
- `invoice_student` is expected after milestone acceptance

## Ownership Split

- Codex: build, schema truth, data-flow verification, bug triage after blockers
- Claude: browser walkthrough, route-by-route evidence, screenshots, UX/runtime notes
- Bartosz: final environment approval, payment-trigger availability, manual acceptance of priorities

## Pre-Run Rules

1. Run first on local/dev.
2. Apply `20260328170000_offer_brief_v2_minimal.sql` before the QA run.
3. Use dedicated QA accounts only:
   - one company account
   - one student account
4. Never skip a blocked step by manually patching data in the middle of a run.
5. If a scenario blocks, stop there and log the exact last passing step.

## Deterministic Test Data

Use these names unless a specific run needs another fixture:

- Offer A title: `QA Micro Days 2026-03-28`
- Offer B title: `QA Micro Date 2026-03-28`
- `cel_wspolpracy`: `Zweryfikowac czy nowy brief pomaga kandydatowi szybko zrozumiec sens zlecenia.`
- `oczekiwany_rezultat`: `Gotowa publikowalna dostawa zgodna z opisem i zakresem oferty.`
- `kryteria_akceptacji`: `Material ma byc kompletny, zgodny z briefem i gotowy do odbioru bez brakow formalnych.`
- `osoba_prowadzaca`: `QA Owner`
- `obligations`: one https link plus one uploaded file if upload is available

## Gate 0 - Environment

Every QA run must pass all five checks before scenarios start:

1. Offer Brief v2 migration applied on local/dev.
2. `cmd /c npm run build` passes.
3. Company and student test accounts can log in.
4. Storage bucket `deliverables` is reachable from the app.
5. Company test account can open the create-offer page.

If any item fails, mark the whole run `BLOCKED`.

## Scenario Order

### Scenario 1 - Create Offer UX and Save

Actor: company
Route: `/app/company/jobs/new`

Checks:
- create a `micro` offer
- choose `czas_realizacji_typ = days`
- confirm `planowany_start` is not visible
- confirm the copy says expected days, not guaranteed deadline
- confirm visual consistency: category field border, `PLN` prefix, readable typography, no mojibake
- fill the brief fields and formal yes/no decisions
- save successfully without runtime error

PASS when the offer is created and the screen remains coherent.

### Scenario 2 - Time Branch and Warnings

Actor: company
Route: `/app/company/jobs/new`

Checks:
- create or edit a second offer
- choose `czas_realizacji_typ = date`
- confirm `planowany_start` appears only in this branch and stays optional
- confirm warning copy for `UoP` and `Staz`
- confirm the UI does not imply a guaranteed legal workflow for those types

PASS when both time branches behave exactly as intended.

### Scenario 3 - Public Offer Detail

Actor: student
Route: `/app/offers/[id]`

Checks:
- the new brief is visible and readable
- no company identity duplication beyond what the public offer already exposes
- no tax data leaks
- no personal-party data leaks
- the candidate can understand business goal, expected outcome and acceptance logic from the offer itself

PASS when the public offer uses the new brief well and does not leak Warstwa C data.

### Scenario 4 - Application and Acceptance

Actor: student, then company
Routes:
- `/app/offers/[id]`
- company application review surface

Checks:
- student applies successfully
- company sees the application
- company accepts the application
- a contract/workspace is created and reachable

PASS when the flow reaches workspace without manual intervention.

### Scenario 5 - Contract Documents

Actors: student, company, admin
Routes:
- `/app/finances`
- `/app/company/documents`
- `/app/admin/vault`
- `/app/admin/contracts/[id]`

Checks:
- `contract_a` and `contract_b` exist after the contract is agreed
- student sees only `contract_b` and later `invoice_student`
- company sees only `contract_a` and later `invoice_company`
- admin vault can download the legal documents
- admin contract detail clearly distinguishes document types

PASS when role visibility is correct and downloads work.

### Scenario 6 - Company Invoice

Actor: system/admin/payment trigger
Routes:
- Stripe payment trigger path
- `/app/company/documents`
- `/app/admin/finance/invoices`
- `/app/admin/vault`

Checks:
- only run after a real test payment or equivalent webhook trigger
- expect `invoice_company` in `invoices`
- expect matching `invoice_company` in `contract_documents`
- expect visibility in company documents, admin invoices and admin vault

If payment is not available, mark `BLOCKED BY PAYMENT TRIGGER`, not `FAIL`.

### Scenario 7 - Student Receipt

Actor: company/admin in workspace milestone flow
Route: `/app/deliverables/[id]`

Checks:
- accept a milestone
- confirm `generateStudentInvoice()` does not duplicate on retry
- confirm `invoice_student` exists in `invoices`
- confirm matching `invoice_student` exists in `contract_documents`
- confirm receipt visibility for student and admin

PASS when the receipt is generated once and remains visible everywhere it should.

## Claude Browser Hand-Off

Claude should use the browser only.

For every step Claude must record:

- route
- role
- expected result
- actual result
- `PASS`, `FAIL` or `BLOCKED`
- screenshot or exact visible error

Claude must stop on the first real blocker.

Claude must separate:

- `UX copy/style`
- `data/runtime`
- `environment/payment trigger`

## Exit Criteria

The QA run is considered complete only if:

1. Gate 0 passes or is explicitly marked blocked with reason.
2. Scenarios 1-5 pass.
3. Scenario 6 is either `PASS` or `BLOCKED BY PAYMENT TRIGGER`.
4. Scenario 7 passes.
5. Every blocker has a route, screenshot or visible error, and last known passing step.

## Known Non-Fail Classification

- Missing payment trigger in local/dev is `BLOCKED`, not a product fail.
- A stopped run after a blocker is valid QA behavior.
- Cosmetic issues may be logged separately from flow blockers if they do not stop progression.

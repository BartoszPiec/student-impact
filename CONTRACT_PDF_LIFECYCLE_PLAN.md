TITLE: Contract PDF Lifecycle Stabilization Plan

STATUS: PROPOSED
SCOPE: contract generation, PDF lifecycle, Legal Vault completeness, invoice/contract download consistency
CLASSIFICATION: DATA | LEGAL | WORKFLOW
OWNER: Codex
DATE: 2026-03-27

SUMMARY
- Admin-side downloads are now stable, but contract PDFs are not consistently present for all contracts.
- Code evidence shows that legal PDF generation exists, yet it is triggered from workspace flow rather than guaranteed automatically at contract creation.
- The next sprint should answer one core question first: what is the canonical generation moment for legal PDFs?

CURRENT VERIFIED STATE
- `contract_documents` exists and stores `storage_path`, `file_name`, `document_type`
- `contracts` stores:
  - `documents_generated_at`
  - `company_contract_accepted_at`
  - `student_contract_accepted_at`
- `generateContractDocuments()` exists in:
  - `app/app/deliverables/_actions.ts`
- `generateContractDocuments()` is called from workspace-facing deliverables UI:
  - `app/app/deliverables/[id]/tabs/negotiation/DraftViewer.tsx`
  - `app/app/deliverables/[id]/tabs/ContractDocumentsCard.tsx`
- `Legal Vault` now reads canonical document records and exposes explicit signed links
- `contract detail` and `finance/invoices` now expose PDF download links when `storage_path` exists
- contract creation itself appears to happen through contract-ensuring flows such as:
  - `ensure_contract_for_application`
  - `ensure_contract_for_service_order`
  invoked from negotiation/chat acceptance paths rather than from PDF generation code

CONFIRMED GAP
- PDF generation is not guaranteed for every contract by default
- This is why some rows still show `Brak umow PDF` even after fixing the admin download UI
- the remaining failures are now more likely lifecycle / trigger / backfill problems than broken download buttons

SPRINT GOAL
- make legal document lifecycle predictable and auditable
- ensure the admin can answer:
  - should this contract already have PDFs?
  - if not, why not?
  - if yes, where were they generated and stored?

RECOMMENDED IMPLEMENTATION ORDER
1. Audit canonical trigger moment
   - choose one:
   - at contract creation
   - at terms agreed
   - at first workspace entry / manual generation

2. Audit current trigger coverage
   - identify every code path that creates contracts
   - identify whether each path triggers `generateContractDocuments()`
   - identify whether `documents_generated_at` is always updated consistently
   - identify whether duplicate generations are currently possible from repeated workspace actions

3. Choose desired lifecycle
   - if automation is intended:
   - move PDF generation into the canonical contract-finalization path
   - if manual generation is intended:
   - expose that state clearly in admin and workspace UI

4. Add observability
   - make missing-PDF state explicit in admin
   - distinguish:
   - `not generated yet`
   - `generated but storage missing`
   - `generated and downloadable`

5. Only after lifecycle is clear:
   - consider admin-side regeneration action
   - consider ZIP or batch legal export

DECISION GATES FOR THE SPRINT
- if contracts are considered legally stable at creation time:
  - prefer `TARGET: AUTOMATE PDF GENERATION`
- if contracts are mutable until both sides agree exact terms or milestones:
  - prefer generation on the first stable post-negotiation point, not immediately on creation
- if current production data is too inconsistent to automate safely in one move:
  - prefer `TARGET: BACKFILL / REPAIR FIRST` before changing trigger logic

WHAT SHOULD BE VERIFIED EXPLICITLY
- whether every contract with `documents_generated_at IS NOT NULL` has matching `contract_documents`
- whether some `contract_documents` rows point to missing storage objects
- whether service-order contracts and application contracts behave the same way
- whether manual workspace generation can create duplicate A/B documents for the same contract

DO NOT DO FIRST
- do not add more ad hoc download buttons before trigger logic is defined
- do not force finance URL consolidation into this sprint
- do not assume missing PDFs are only a UI bug

FIRST CONCRETE TARGET
- evidence-based audit of contract creation -> agreement -> PDF generation flow

SUCCESS CRITERIA
- one documented canonical trigger for legal PDF generation
- one documented explanation for every `Brak umow PDF` case
- admin can reliably open PDFs wherever `contract_documents.storage_path` exists
- next sprint scope is small enough to ship in one batch without mixing lifecycle decisions with unrelated admin polish

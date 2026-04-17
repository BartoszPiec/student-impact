# Agent Notebook

This file is a persistent notebook for future chats and agents.

Use it for:
- future expansion ideas
- deferred solutions
- architectural direction
- non-blocking product opportunities
- decisions that should stay visible across chats

Do not use it for:
- minute-by-minute sprint status
- temporary implementation notes
- replacing `SPRINT_LIVE_BOARD.md`

`SPRINT_LIVE_BOARD.md` remains the canonical live state.
This notebook is the long-lived memory layer for what we may want to build next.

## How To Write In This File

Rules:
- keep entries short and high-signal
- separate `CONFIRMED`, `PLANNED`, `DEFERRED`, `INFERENCE`
- note whether something is repo-ready, data-ready or needs migrations
- prefer decision-level notes over raw brainstorming
- if a topic becomes active work, link or move it into sprint files

## Confirmed Baseline

- security hardening for Batch S1 is closed
- repo and runtime parity for Step 0 + S1 is closed
- admin shell is canonicalized around `/app/admin`
- Phase A admin panels are live in repo:
  - `/app/admin/users`
  - `/app/admin/contracts`
  - `/app/admin/disputes`
- current finance source of truth: `contracts.commission_rate`
- current production dependency audit baseline: `npm audit --omit=dev` returns `0 vulnerabilities`

## Confirmed Product Direction

- Student Impact connects students with companies for micro-jobs and scoped service work
- the business model combines marketplace discovery with platform-managed settlement
- students are the execution layer
- the platform handles coordination and financial flow for companies
- overqualified freelancers are part of the market problem this product addresses

## Confirmed Admin Architecture Direction

- admin should grow in phases, not as one large batch
- current canonical admin areas:
  - Overview
  - Marketplace
  - Finance
  - Legal
  - Platform
- `users`, `contracts`, `disputes` were intentionally added before deeper finance/settings work
- `disputes` is currently a filtered contracts view, not a dedicated table/domain

## Planned Next Expansion

### Phase B - Finance Module

Status: planned

Likely first read-only panels:
- ledger view
- invoices view
- accounting periods or payout batches

Why:
- accounting foundations already exist in DB
- exports and payouts already exist in admin
- this is the highest-value next admin expansion after Phase A

Constraints:
- prefer read-first surfaces before adding write-heavy finance controls
- avoid duplicating logic already represented in `financial_ledger`, `accounting_entries`, `accounting_book_lines_v1`, `payouts`, `pit_withholdings`

Current implementation direction:
- first panel should be a read-only ledger explorer based on `accounting_book_lines_v1`
- second panel should be a read-only invoices view based on `invoices`
- additive finance routes are preferred over changing stable admin URLs
- likely structure:
  - `/app/admin/finance`
  - `/app/admin/finance/ledger`
  - `/app/admin/finance/invoices`
  - `/app/admin/finance/periods`

Why ledger first:
- canonical accounting view already exists in DB
- highest signal-to-effort ratio
- directly aligned with accounting analytics baseline
- gives admin a finance-native read surface beyond exports and payouts

Important finance formatting note:
- do not reuse `*_minor` money formatters for `invoices`
- `invoices.amount_net`, `amount_gross`, `platform_fee` are PLN numerics, not grosze

Important finance periods note:
- `periods` currently means accounting periods based on `accounting_book_lines_v1.month_bucket`
- first pass may include a separate PIT section inside the same page, but not a merged accounting/PIT aggregation
- separate `pit-periods` route only makes sense once there are multiple distinct periods and drill-down value

Finance URL consolidation:
- planned, trigger-based
- do not move `payouts`, `pit`, `exports` only for symmetry
- move them only in an atomic batch that also updates `_actions.ts` revalidation paths and adds redirects

Next batch decision rule:
- after the current finance read-only milestone, compare finance consolidation against Phase C analytics and settings discovery
- default bias is toward the option with the highest business ROI, not the cleanest URL structure

### Phase C - Advanced Analytics

Status: active

Candidate work:
- analytics event pipeline
- funnel pages
- retention / cohort analysis
- revenue-quality-user analytics

Constraint:
- do not start advanced analytics UI before event tracking is explicitly modeled

Current confirmed scope:
- Phase C should start from deeper exposure of existing `get_admin_stats()`
- zero new migrations and zero new RPC are preferred in the first batch
- first batch should expose:
  - `metrics.avg_completion_days`
  - `financials.paid_out_pln`
  - `financials.refunded_pln`
  - `categories[]`
  - `recent[]`

Guardrail:
- `event_inbox` is not a substitute for behavioral analytics tracking
- cohort / retention work should stay deferred until explicit product event taxonomy exists

Phase C close note:
- current dashboard is data-exhausted against `get_admin_stats()`
- separate analytics sub-panels are low ROI on the current data foundation
- next operational ROI moved to marketplace panel usability

Marketplace next focus:
- `/app/admin/users` should support role filtering and quick search
- `/app/admin/contracts` should support status filtering and sorting
- client-side interactivity is sufficient until dataset size makes URL/server filtering necessary

Operational next focus:
- after marketplace interactivity and commission editing, the next likely ROI sits in admin triage surfaces
- `disputes` and `vault` are the next candidates for operability-focused improvements

## Deferred Ideas

### Dedicated Disputes Domain

Status: deferred

Current choice:
- disputes use `contracts.status IN ('disputed', 'cancelled')`

Future option:
- dedicated `disputes` table and workflow

When to revisit:
- when disputes need comments, ownership, SLA, resolution states or evidence artifacts

### Shared Admin Table System

Status: deferred

Current choice:
- simple page-level tables first

Future option:
- extract reusable admin table primitives once more admin panels stabilize

## Confirmed 2026-03-31 Closeout

- current product cycle is closed with `PASS WITH QA GAP`
- the gap is accepted as non-product:
  - missing dedicated company QA account
- this does not block opening the next sprint

## Planned Next Sprint Direction

### Private Proposals Phase

Status: planned

Why now:
- service order negotiation is already working
- quote snapshots provide the missing structured context layer
- company-side order management and deliverables path already exist
- next business value comes from allowing targeted student -> company proposals

Guardrail:
- private proposals should converge into the same service-order / escrow / invoice path
- do not create a separate settlement workflow just for proposals

Sprint day 0 hygiene:
- create a dedicated QA company account before the next release-sensitive QA cycle

Current implementation hypothesis:
- use `service_orders` as the source of truth
- add only minimal origin metadata first
- extend `request_snapshot` with a `student_private_proposal` shape
- reuse `/app/company/orders` as the first receiving surface

Main architecture watchout:
- repeated proposal threads make the current conversation lookup more fragile
- `conversations.service_order_id` is the most likely hardening step if ambiguity becomes blocking

When to revisit:
- after multiple finance/admin panels share the same table interaction pattern

### Settings Module

Status: deferred

Potential scope:
- admin configuration
- commission defaults
- platform toggles
- notification controls
- document / invoice policy controls

Constraint:
- only after finance module structure is stable

Next discovery rule:
- before any settings UI, identify one concrete source-of-truth model
- settings work should start only from a narrow MVP, not from a generic control panel

Commission control note:
- editable commission rates are better treated as admin operations on existing entities than as a generic settings module
- current safest path is inline editing on `offers` and `service_packages`
- global commission defaults should stay deferred until a real config schema exists

### Admin Operations Surfaces

Status: active pattern

What works now:
- `users` supports quick filtering and search for day-to-day admin lookup
- `contracts` and `disputes` share one interactive table pattern with search, status filtering and sort controls
- `vault` now has its own interactive table with search, status filtering, sort controls and contract-level document visibility

Why this matters:
- the next ROI in admin is operability on top of existing data, not new schema
- admin surfaces should become easier to scan before they become more mutation-heavy

Current rule:
- prefer focused interactive tables over new workflow state machines
- reuse shared patterns only where data shape is already aligned
- do not force `vault` into the same abstraction as `contracts` until row actions and data density clearly match
- when legal/admin rows already map to existing tables, prefer showing operational counts and acceptance state before inventing new workflows

Disputes next-step rule:
- treat `/app/admin/disputes` as a triage surface, not as a generic contracts mirror
- prefer dispute-specific signals and ordering before adding mutation-heavy workflow actions
- only split out a dedicated disputes table if the shared contracts surface becomes too generic to carry dispute cues cleanly

Disputes implementation note:
- `disputes` now uses a dedicated table patterned after `vault`, not the shared contracts table
- default ordering should reflect time without movement, not contract creation date
- stale-age and simplified status filtering are more valuable here than generic marketplace controls

Disputes workflow note:
- the next ROI in `disputes` is contextual handoff, not heavy admin mutation
- prefer row-level access to the related workspace or case context over inventing new dispute states
- do not prioritize finance URL consolidation while it still delivers structure-only value and carries `revalidatePath` risk
- use existing `application_id` / `service_order_id` linkage before considering any new dispute routing model

Payouts operations note:
- `payouts` now follows the dark admin shell instead of the legacy light layout
- search and sort belong here before any finance URL consolidation
- the next finance consolidation trigger should still be real work on `payouts`, `pit` or `exports` behavior, not route cleanup alone
- disputes-to-vault linkage remains a nice-to-have and should wait for the next vault-focused batch

PIT operations note:
- `pit` now has search and a dark admin shell aligned with the newer admin surfaces
- action-bearing finance panels are now visually and operationally aligned without touching URL consolidation
- `exports` remains low-ROI cleanup until it receives a stronger workflow need or a new feature

Exports and consolidation note:
- `exports` is now the main remaining finance panel with legacy light styling and older error handling
- if we want one more low-risk finance polish batch without migrations, `exports` is the next logical target
- finance URL consolidation still requires an atomic batch with `revalidatePath` updates and redirects, and still does not beat direct workflow value

Post-exports note:
- `exports` now matches the newer dark admin shell and uses toast-based download feedback
- current finance panels are visually aligned, but route consolidation is still not automatically justified
- the next decision should explicitly compare structural consolidation against any remaining workflow ROI, inside or outside finance

Admin drill-down note:
- `/app/admin/users/[id]` is now the first dedicated admin detail view and should act as the pattern for future drill-downs
- user detail should stay discovery-first: profile, contracts and role-specific finance context before any heavier mutations
- the most natural next drill-down after this is contract detail, not finance URL consolidation

Contract detail note:
- contract detail should be the next admin drill-down candidate after user detail
- v1 should aggregate context from existing finance and legal tables before introducing any new admin workflows
- contract detail is more likely to succeed as a read-first context page than as a control center
- `/app/admin/contracts/[id]` now exists as a stacked detail view built from existing joins and parallel finance or legal reads
- the first cross-links into contract detail should come from the contracts list and the contracts section inside `/app/admin/users/[id]`
- vault and disputes links into contract detail remain useful follow-ups, but they should land after the core v1 drill-down is stable
- the next audit should decide whether `vault`, `disputes`, or both should link into the same contract detail route next
- contract detail should remain the canonical contract context page even when more cross-links are added
- `vault` and `disputes` now both route into `/app/admin/contracts/[id]`, so contract detail is the shared admin context hub for contracts
- context-aware back-linking inside contract detail remains optional Phase 2 polish, not a blocker for navigation completeness
- `finance/invoices` now also routes into `/app/admin/contracts/[id]`, completing the missing navigation path from invoice review into full contract context
- contract detail should stay read-first; minor readability polish is acceptable, but mutations still belong in dedicated operational panels
- `finance/invoices` now has search, status filtering and sorting, so the major admin tables share the same minimum operability baseline
- after invoices operability lands, the next meaningful decision should move beyond baseline table controls and choose a new product-facing direction
- after the operability baseline closes, the next audit should compare a new detail view against a new workflow and a new product area rather than re-litigating already-closed table polish
- dense admin top navigation should prefer readability over squeezing every tab into a rigid row
- the current desktop admin nav now uses stronger contrast, tighter pills and horizontal overflow instead of compressing labels into unreadable tabs
- `/app/admin/offers/[id]` now gives admins the upstream offer context that leads into applications, contracts and payout footprint without requiring migrations
- `payouts` and `pit` now cross-link into `/app/admin/contracts/[id]`, so finance-side investigation no longer dead-ends outside contract context
- after offer detail landed, the next step should be chosen by fresh ROI rather than by reopening already-closed baseline or route-cleanup work
- runtime schema currently treats `profiles` as a minimal auth-role table (`user_id`, `role`, `created_at`, consent fields), so admin display names must come from `student_profiles` or `company_profiles`, not from `profiles.public_name`
- runtime `payouts` does not expose `student_id`, so student-specific payout views must resolve through contract ownership rather than direct payout filtering
- admin legal/download flows should use canonical `contract_documents.storage_path` records instead of inferring files by listing the storage folder
- `Legal Vault` should prefer explicit per-document links (for example `Umowa A` / `Umowa B`) over popup-style multi-download actions, because signed URLs are more reliable and make missing documents visible row by row
- analytics visual language is now being aligned to the darker admin shell rather than keeping an isolated light-theme dashboard
- contract PDF generation is the next high-value audit topic: downloads are now stable, but lifecycle automation is still not canonicalized
- missing contract PDFs should be treated as a lifecycle / trigger problem until proven otherwise, not only as a rendering issue
- the current evidence points to `generateContractDocuments()` being reachable from deliverables or workspace tabs rather than from the canonical contract-creation path
- next sprint planning around Legal Vault should separate two questions:
  - are downloads broken?
  - or were the PDFs never generated?
  the first question is now mostly closed; the second remains open
- `generateContractDocuments()` is now guarded against duplicate A/B inserts for contracts that already have canonical `contract_documents`
- service-order contracts now have a dedicated title lookup path for PDF generation instead of falling back to a generic `Zlecenie`
- `Legal Vault` now exposes an admin-side backfill action for missing contract PDFs, but the backfill should be run deliberately rather than implicitly during unrelated admin browsing
- single-contract PDF repair should treat `NEXT_REDIRECT` as a successful navigation outcome, not as a repair failure
- `Legal Vault` should explicitly mark `draft` and `awaiting_funding` contracts without PDFs as `ustalanie kontraktu`, so missing documents do not look like the same class of problem as broken completed contracts
- `analytics` and `system-services` have now been brought closer to the darker admin shell, so remaining visual cleanup should focus on specific low-contrast details rather than a wholesale theme mismatch
- the documents-dashboard sprint should now be planned against actual repo state, not against the earlier assumption that admin contracts, admin invoices and company profile were missing
- `generateStudentInvoice()` already exists and is already wired into deliverables acceptance flow, so the receipt task should start as `refactor/verify`, not greenfield
- the highest-value greenfield document surfaces remain the student documents tab in `/app/finances` and the new `/app/company/documents` page
- `S-2` is now repo-ready: reusable document types live in `types/documents.ts`, the student hook lives in `hooks/use-student-documents.ts`, and the shared card lives in `components/documents/document-card.tsx`
- `G-1` is now partially closed as a refactor: `generateStudentInvoice()` has an idempotency guard on `(milestone_id, invoice_type='student')` and syncs a missing `contract_documents` row when an invoice already exists
- next documents sprint handoff should treat student/company document pages as consumers of the shared layer above, not as places to reinvent document typing or download UI
- `S-1` is now landed on top of the shared layer: `/app/finances` includes a dedicated student documents section that reads grouped `contract_b` + `invoice_student` documents through `useStudentDocuments()`
- the next validation step for the documents sprint should focus on real student-facing visibility and RLS behavior in `/app/finances`, not just build-time correctness
- `F-1` is now landed too: `/app/company/documents` exists, uses `useCompanyDocuments()`, and reuses the same `DocumentCard` on top of `contract_documents`
- `DocumentCard` is now visually neutral/light instead of admin-dark, so the shared documents surfaces do not fight the light student/company pages
- `F-2` is now functionally activated: company users can reach `/app/company/documents` from both the main app navbar and the company profile surface
- the company profile form now exposes `linkedin_url`, so the profile no longer displays a field that cannot be edited
- post-F-2 verification confirms the company documents surface is no longer orphaned and has two valid entry points
- `A-2` should now be treated as effectively closed in repo state: `/app/admin/finance/invoices` already exposes inline signed-PDF download from `storage_path`
- next documents-sprint admin target should therefore bias toward `A-1` contract document polish unless a new audit finds a more valuable blocker
- `A-1` is now effectively closed as well: `/app/admin/contracts/[id]` distinguishes agreement vs invoice document types with admin-readable labels, completeness badges and direct signed-PDF download
- the documents sprint is now functionally closed across student, company and admin read surfaces; remaining work is optional visual cleanup or future workflow expansion, not missing core capability
- QA should now be treated as a first-class priority for marketplace-to-documents flows, not only as ad-hoc verification after batches
- the next high-value product surface is `company/jobs/new`: current offer creation works, but the UI typography is inconsistent and the brief data model is still thinner than the later collaboration/document flows need
- offer creation planning should explicitly separate:
  - fields that belong in `offers`
  - fields that belong in `company_profiles`
  - fields that should only become part of application/contract snapshots
  - fields that imply legal/compliance review rather than direct self-serve publishing
- `contract_type` options in offer creation should not be expanded further until we verify whether every displayed option is really supported by downstream workflow and legal responsibility
- quick UX polish for `app/app/company/jobs/new` is now closed:
  - cleaner typography and ASCII-safe copy
  - micro materials copy no longer frames company-provided assets as performer obligations
  - `UoP` / `Staz` now show warning copy instead of silently overpromising workflow coverage
- `createOffer()` still treats `contract_type` as offer metadata only; it does not currently drive contract generation or PDF templates
- Offer Brief v2 is now partially landed as an intentional migration-backed batch:
  - `cel_wspolpracy`
  - `oczekiwany_rezultat`
  - `kryteria_akceptacji`
  - `osoba_prowadzaca`
  - `planowany_start`
  - structured time planning (`czas_realizacji_typ`, `czas_realizacji_dni`, `czas_realizacji_data`)
  - `tryb_pracy`
- the current create-offer flow now separates:
  - collaboration brief fields stored on `offers`
  - formal/legal review signals stored on `offers` as soft flags
  - company identity / tax / party data that should still stay in profiles and later contract snapshots
- the formal/legal flags in offer creation are intentionally framed as review aids, not as proof that the full legal/compliance workflow is automated end-to-end
- public offer details now surface the new brief fields, so the added creation-form data improves candidate understanding instead of living only in the company UI
- follow-up UX decision:
  - `planowany_start` should stay optional because companies often know the delivery window before they know the exact kickoff date
  - formal/legal signals in step 3 should use explicit yes/no controls, not toggle-like cards, to avoid ambiguity about the currently selected state
- `app/app/company/packages/_actions.ts` had a real bug and is now fixed: `contract_type` inserts use `"B2B"` instead of lowercase `"b2b"`
- QA now has a canonical package for the marketplace-to-documents flow:
  - `QA_MARKETPLACE_DOCUMENTS_PLAYBOOK.md` is the stable regression checklist
  - `QA_RUN_TEMPLATE.md` is the required per-run report format
  - `CLAUDE_QA_MARKETPLACE_FLOW_INSTRUCTIONS.md` is the browser hand-off for Claude
- QA run order is now fixed:
  - Gate 0 first
  - then scenarios 1-7 in order
  - stop on first real blocker
  - classify missing Stripe payment trigger as `BLOCKED BY PAYMENT TRIGGER`, not as a product fail
- for future runs, use deterministic QA offer names (`QA Micro Days ...`, `QA Micro Date ...`) so traces are easy to follow across UI, contracts and documents
- first live QA run immediately exposed the current primary blocker:
  - Offer Brief v2 UI is deployed, but the local/dev DB still lacks the `offers` columns from `20260328170000_offer_brief_v2_minimal.sql`
  - until that migration is applied, the marketplace-to-documents QA run cannot pass Gate 0 / Scenario 1
- post-QA UX follow-up for create-offer:
  - budget placeholder should never look like a prefilled value
  - time-mode branch switching should preserve user input in local state
  - only the active time branch should be persisted on submit/server side

## Product Opportunities To Explore Later

- richer admin route grouping under finance without changing current stable URLs too early
- invoice PDF packaging and ZIP export completion
- payout batch workflow beyond the current payouts table
- accounting book explorer based on `accounting_book_lines_v1`
- better legal/document audit views on top of vault
- operational dashboards for disputed and cancelled contracts
- event-driven analytics for acquisition, conversion and retention

## Technical Opportunities To Explore Later

- broader lint and dev-toolchain maintenance pass
- normalization of older amount fields vs `*_minor` fields
- continued refactor of large action files
- progressive consolidation of shared admin UI primitives
- review of old standalone SQL helper files outside canonical migration flow

## Current Guardrails

- do not reopen closed security topics without evidence
- do not add migrations for product convenience when a filtered view is enough
- do not let ZIP ambition outrun existing data foundations
- prefer additive, read-first admin panels before workflow-heavy mutations
- keep main workspace repo state as the source of truth over side worktrees

## Suggested Update Pattern

When a new idea appears, log it like this:

```md
### [Idea Name]

Status: planned | deferred | confirmed

Why it matters:
- ...

What already exists:
- ...

What is missing:
- ...

When to revisit:
- ...
```

### User-Facing Document Downloads

Status: confirmed

Why it matters:
- user-facing surfaces must fulfill the same document-delivery promise as admin
- if `contract_documents` points at real files but student/company still see `Brak pliku`, the documents sprint is not actually complete

What already exists:
- admin-side downloads work because they sign `deliverables` files server-side with the admin client
- user-facing hooks now route downloads through `/api/documents/download`
- the route authenticates the current user, verifies contract ownership, checks document-type visibility by role, then creates the signed URL server-side

What is missing:
- fresh browser verification after the route change to confirm Scenario 5 no longer shows `Brak pliku` for valid user-owned documents

When to revisit:
- immediately after the next Claude rerun for the user-facing document scenario

### Service Marketplace Expansion

Status: planned

Why it matters:
- the service area is already commercially important, but the product model is split between listing, inquiry, quote, chat and realization surfaces
- adding new capabilities like student->company proposals before workflow cleanup would multiply confusion and edge cases

What already exists:
- students can create public `service_packages`
- companies can browse them and initiate requests
- `service_orders` already carries real negotiation/execution state
- accepted service negotiations already create or connect to contracts and deliverables

What is missing:
- one clean, explicit workflow model for the service area
- a true student ops cockpit for incoming company requests and negotiations
- a deliberate private-proposal model limited to companies with prior collaboration
- structured legal/financial quote data strong enough for future contracting and payment logic

When to revisit:
- immediately after Claude confirms whether the current foundation is strong enough for the student ops cockpit as the next implementation batch

### Student Service Ops Cockpit v1

Status: confirmed

Why it matters:
- the highest-ROI improvement after the audit was not a new table, but a clearer operating surface for students handling incoming company demand
- the old dashboard forced students to scan one flat list and infer which orders required action vs which were just waiting on the company

What already exists:
- `service_orders` is still the workflow source of truth
- `/app/services/dashboard` now groups visible work into three operational buckets:
  - `Wymaga reakcji`
  - `Czeka na firmę`
  - `Aktywne i historia`
- `service-order-status.ts` centralizes labels, bucket membership and badge styling so list and detail no longer drift apart
- counteroffers are now visible both on list cards and in `/app/services/dashboard/[id]`
- the detail action bar explains the counteroffer state in plain language and gives the student a direct accept path

What is missing:
- the company-side management surface is still not first-class and should be handled as a follow-up, not folded into cockpit v1
- `service_orders.requirements` is still an unstructured text blob, so quote/acceptance scope is not yet contract-grade
- conversation lookup still depends on `package_id + company_id + student_id` instead of `service_order_id`

When to revisit:
- after browser verification of the new cockpit
- then before Phase 3, when we introduce `request_snapshot` / `quote_snapshot` and later private student-to-company proposals

### Quote Snapshot Phase

Status: planned

Why it matters:
- the main remaining weakness in the service marketplace is no longer navigation, but data shape
- current service-order negotiation still collapses request context into `requirements`, which makes the UI noisy and leaves quote scope too weak for future legal/finance work

What already exists:
- `createOrder()` already has all the raw ingredients for a structured request snapshot:
  - package context
  - contact email / website
  - dynamic `q_*` answers
  - additional notes
- service negotiation actions already have the transitions needed for a structured quote snapshot:
  - student proposal
  - company counter
  - acceptance of original quote
  - acceptance of counter-offer
- `ensure_contract_for_service_order()` currently does not depend on `requirements`, so snapshots can be added without breaking contract creation

What is missing:
- `service_orders.request_snapshot`
- `service_orders.quote_snapshot`
- a structured read path in dashboard/detail with fallback to legacy `requirements`
- an agreed snapshot shape before the next implementation batch begins

When to revisit:
- immediately after Claude validates `QUOTE_SNAPSHOT_PHASE_PLAN.md`
- then in the next real implementation batch, before any work on private proposals

### Quote Snapshot Phase Batch A

Status: implemented

Why it matters:
- service quote flow needed a structured source of truth before we add private proposals or stronger legal/finance handling
- the old `requirements` text blob was readable enough for emergency fallback, but too weak for clean UI and future contract-grade scope capture

What now exists:
- `service_orders` has additive snapshot columns via `supabase/migrations/20260328221500_service_order_quote_snapshots_v1.sql`:
  - `request_snapshot jsonb`
  - `quote_snapshot jsonb`
- `lib/services/service-order-snapshots.ts` centralizes:
  - request extraction from dynamic order forms
  - request snapshot shape
  - quote snapshot shape
  - snapshot evolution across student proposal / company counter / acceptance / rejection
  - preview helpers and type guards
- `createOrder()` now writes:
  - legacy `requirements`
  - structured `request_snapshot`
- negotiation actions now maintain `quote_snapshot` instead of relying only on scalar amount/status fields
- student dashboard list and detail read snapshots first, then fall back to `requirements` for legacy orders

What stays intentionally unchanged:
- `ensure_contract_for_service_order()` still does not consume request/quote snapshots in this phase
- company-side service order management is still a follow-up
- private student->company proposals remain deferred until snapshots have been exercised in QA

When to revisit:
- immediately after browser verification of new snapshot-backed service orders
- then before designing `proposal_scope` / `target_company_id` for private proposals

### Company Order Management v1

Status: implemented

Why it matters:
- after snapshot phase, the biggest remaining gap in the service marketplace was not student-side anymore, but the missing company surface
- backend actions for accept / counter / reject already existed, but company users had no operational UI to use them, which broke the negotiation loop in practice

What now exists:
- `/app/company/orders` gives companies a dedicated order management cockpit with three company-perspective buckets:
  - `Wymaga Twojej decyzji`
  - `Czeka na studenta`
  - `Aktywne i historia`
- `/app/company/orders/[id]` gives a structured detail view:
  - request snapshot rendering for new orders
  - legacy `requirements` fallback for old orders
  - quote history summary
  - student profile context
- company detail actions now expose the already-existing service workflow server actions:
  - accept student offer
  - send counteroffer
  - reject negotiation
  - go to realization once accepted
- company navigation now includes a direct entry point to service order management from the main app navbar

What remains open:
- `/app/deliverables/[id]` for accepted service orders still has its own pre-existing issue and should be handled separately from this batch
- private student->company proposals are still deferred until the company-facing management loop has been browser-verified
- conversation lookup is still package/company/student based rather than `service_order_id` based

When to revisit:
- immediately after browser verification of the new company order cockpit and detail flow
- then before implementing `proposal_scope` / `target_company_id` for private proposals

### Service-order Deliverables Fix

Status: implemented

Why it mattered:
- after company order management went live, both sides could finally reach `accepted` and click `Panel realizacji`
- the next blocker in the real service marketplace path was `/app/deliverables/[id]`, which incorrectly showed `Nie znaleziono zlecenia` for accepted service orders

Root cause:
- `app/app/deliverables/[id]/page.tsx` queried `service_orders.amount_minor` during the service-order lookup
- the service-order workflow and `ensure_contract_for_service_order()` do not rely on that column
- the failed select caused the service-order branch to return no record, so the page behaved as if the order did not exist

What changed:
- removed `amount_minor` from the `service_orders` select in the deliverables page
- preserved the existing minor-unit fallback:
  - use `amount_minor` if a typed object exposes it
  - otherwise compute minor units from `amount`

What this unblocks:
- student path: `/app/services/dashboard/[id]` -> `Panel realizacji`
- company path: `/app/company/orders/[id]` -> `Panel realizacji`
- the service marketplace can now proceed from negotiation to realization without falling over on the first deliverables screen

When to revisit:
- immediately after browser verification of the deliverables page for accepted service orders
- then before starting private student->company proposals

### Deliverables Polish Follow-up

Status: implemented

What was polished after the first deliverables verification:
- service-order realization back navigation now returns users to the right operational lists:
  - company -> `/app/company/orders`
  - student -> `/app/services/dashboard`
- the deliverables header badge now renders a visible `Oczekuje` label for the initial service-order realization state (`pending`)

What was additionally confirmed:
- `ensure_contract_for_service_order` exists in repo migration sources, so the remaining risk called out by Claude is about runtime deployment state, not about the function being absent from the product design

What still remains outside code-only confirmation:
- live runtime confirmation that the deployed Supabase instance has the latest `ensure_contract_for_service_order` definition available to the app

### Pre-Sprint Closeout

Status: prepared

Why it matters:
- the product can now reach accepted negotiation, documents, and deliverables
- the next sprint should not open until the only remaining major blocker in the live path is understood and narrowed

What was prepared:
- `PRE_SPRINT_CLOSEOUT_CHECKLIST.md` to separate:
  - must-close blockers
  - QA hygiene
  - lower-priority UX debt
- `PAYMENT_ESCROW_FLOW_AUDIT_PLAN.md` to focus the next investigation on the funded path
- `CLAUDE_PAYMENT_ESCROW_AUDIT_INSTRUCTIONS.md` so Claude can immediately verify the browser side of checkout / escrow behavior

Current recommendation:
- do not open the next major feature sprint yet
- first audit and narrow the `Payment / Escrow` path
- then run a short QA loop once the funded path is understood or fixed

### Payment / Escrow Fix

Status: implemented

Why it mattered:
- the product already reached the escrow wall correctly, but service-order funding was failing before Stripe checkout could even start
- Claude traced the blocker to the UI handoff: service-order realizations were still sending `applicationId` instead of `serviceOrderId`

What changed:
- `app/components/payment-modal.tsx`
  - added `serviceOrderId`
  - Stripe checkout now works when either `applicationId` or `serviceOrderId` is present
  - request body now includes `serviceOrderId`
- `app/app/deliverables/[id]/tabs/StatusTab.tsx`
  - passes `serviceOrderId` for service-order paths
  - preserves `applicationId` for classic application flow
- `app/api/stripe/create-checkout/route.ts`
  - application-id mismatch is only enforced when the contract actually belongs to an application
  - existing `serviceOrderId -> contract_id` validation remains the authoritative guard for service orders

What this should unblock:
- company-side escrow funding for accepted service orders
- transition from `Wymagane Zasilenie Escrow` toward funded contract state
- downstream verification of `invoice_company` and post-payment UI state
## 2026-03-30 - Final funded QA handoff

- Prepared a final funded QA pack focused on the first full escrow-funded service-order path.
- Added a dedicated checklist plus a Claude handoff prompt for the last company + student verification pass.
- Goal is now explicit: do one funded run, confirm invoice and status transitions, then start the next sprint only if no product blocker remains.

### Private Proposals Foundation v1

Status: implemented

Why it matters:
- the marketplace can now accept a second entry point into the same `service_orders -> contracts -> deliverables -> escrow` engine
- students are no longer limited to waiting for public requests; they can initiate a structured proposal to a company with prior cooperation history
- the old chat routing risk is addressed in the same batch instead of being deferred

What changed:
- additive schema foundation:
  - `service_orders.entry_point`
  - `service_orders.initiated_by`
  - `conversations.service_order_id`
- snapshot layer now supports two request sources:
  - `company_order_form`
  - `student_private_proposal`
- new student compose page:
  - `/app/services/proposals/new?packageId=...`
  - eligibility is resolved from `contracts` history server-side
- new `createPrivateProposalAction()`:
  - validates package ownership
  - validates prior cooperation
  - inserts `service_orders` with structured private-proposal request data
  - initializes `quote_snapshot` as `proposal_sent`
  - creates a dedicated `conversations` thread bound to `service_order_id`
- existing company-order flow was upgraded too:
  - company-created service orders now also get `entry_point`, `initiated_by`, and their own `service_order_id` conversation
- detail and workspace surfaces now look up conversations by `service_order_id` first and fall back only for old records
- company/student order detail pages now render the private-proposal brief shape directly instead of forcing everything through the old contact/form-answer layout

Important implementation decisions:
- private proposals remain a variant of `service_orders`, not a separate domain
- prior-cooperation eligibility is currently based on `contracts.status in ('awaiting_funding','active','delivered','completed')`
- `conversations.service_order_id` was treated as mandatory in this phase, matching Claude's audit

Recommended next step:
- browser QA for:
  - student compose flow
  - company receiving in `/app/company/orders`
  - correct chat threading per `service_order_id`

QA handoff prepared:
- `PRIVATE_PROPOSALS_FOUNDATION_QA_CHECKLIST.md`
- `CLAUDE_PRIVATE_PROPOSALS_FOUNDATION_QA_INSTRUCTIONS.md`

### Private Proposals RLS Fix

Status: prepared

What Claude found after the first live QA run:
- deploy was correct
- migration foundation was correct
- compose route loaded and eligible companies rendered
- submit failed at `service_orders` insert because current RLS only allows company-created inserts

What was added:
- `supabase/migrations/20260401171000_private_proposals_student_insert_rls.sql`

Policy intent:
- allow only authenticated students to insert private proposals for themselves
- constrain that insert to:
  - `initiated_by = 'student'`
  - `entry_point = 'student_private_proposal'`
  - `package_id` belonging to the same authenticated student

Next verification target:
- rerun private proposal QA after this migration is applied

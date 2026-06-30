# Sprint Live Board

This is the canonical live status file for the current sprint.
If you want one file to watch for progress, use this one.

## Current Sprint State

- Date: 2026-03-26
- Owner: Codex
- Status: active
- Baseline branch: `codex/predeploy-backup-20260324`
- Baseline closeout commit: `b3c11d6`

## Canonical Reference Files

- `SPRINT_COMMAND_CENTER_2026-03-26.md`
- `CHAT_REPORT_TEMPLATES.md`
- `CLAUDE_COLLAB_INSTRUCTIONS.md`
- `BATCH_C3_GUIDELINES.md`
- `PHASE_A_IMPLEMENTATION_PLAN.md`
- `CLAUDE_PHASE_A_INSTRUCTIONS.md`
- `PHASE_B_FINANCE_PLAN.md`
- `CLAUDE_PHASE_B_FINANCE_INSTRUCTIONS.md`
- `NEXT_BATCH_DECISION_PLAN.md`
- `CLAUDE_NEXT_BATCH_INSTRUCTIONS.md`
- `SETTINGS_DISCOVERY_PLAN.md`
- `CLAUDE_SETTINGS_DISCOVERY_INSTRUCTIONS.md`
- `OPERATIONS_TRIAGE_PLAN.md`
- `CLAUDE_OPERATIONS_TRIAGE_INSTRUCTIONS.md`
- `AGENT_NOTEBOOK.md`
- `SPRINT_LIVE_BOARD.md`

## Closed Context

Treat these as closed unless a new confirmed regression appears:

- previous UX polish sprint
- Vercel as an active blocker
- repo-side variable commission baseline
- repo-side accounting analytics baseline

## Step 0 Before Product Expansion

Status: closed

Completed:

1. Applied `supabase/migrations/20260325203000_admin_accounting_analytics_v1.sql`
2. Applied `supabase/migrations/20260325210000_variable_commission_model_v1.sql`
3. Verified DB/runtime parity after apply

## Active Batch

### Batch S1 - Security Triage And Remediation Plan

Status: closed

Scope:
- finance RPC authorization model
- notification abuse path
- contract documents / invoices insert permissions

Current outcome:
- findings confirmed in repo review
- repo-side mitigations added
- remaining direct notification callsites in Stripe routes also migrated to shared helper
- repo-side notifications RLS reviewed: insert is not granted to authenticated in repo model
- Claude applied and verified Step 0 + S1 runtime changes
- runtime grants are restricted to `postgres` and `service_role` for protected RPCs
- repo parity migration added to persist `REVOKE FROM PUBLIC` and remove undocumented runtime RLS drift on future re-apply:
  `supabase/migrations/20260326190000_batch_s1_runtime_parity_v1.sql`
- parity confirmed: repo and runtime aligned after final apply

### Batch C1 - Cleanup Quick Wins

Status: closed

Scope:
- remove dev / example / test routes from production surface
- reduce route noise in build output
- keep build green after cleanup

Current outcome:
- removed `app/test-ceidg`
- removed `app/sentry-example-page`
- removed `app/api/sentry-example-api`
- removed `app/app/seed-benchmark`
- removed `app/app/debug-badge`
- removed `app/app/debug-experience`
- removed `app/app/debug-projects`
- removed `app/app/debug/services`
- production build passes after cleanup

### Batch C2 - Admin Consolidation And Helper Cleanup

Status: closed

Scope:
- remove orphaned admin dashboard
- centralize admin auth for server actions
- remove redundant page-level admin guards
- consolidate browser/admin Supabase helper usage
- remove root-level test files

Current outcome:
- removed `app/app/admin/dashboard`
- added shared admin auth helper in `lib/admin/auth.ts`
- admin layout now uses shared guard
- removed redundant page-level admin guards from analytics, offers and PIT pages
- replaced inline admin checks in payouts, system-services, PIT, vault and offers actions
- replaced webhook inline service-role client with `createAdminClient()`
- consolidated browser client imports onto `lib/supabase/client.ts`
- removed `lib/supabase/browser.ts`
- removed root test files `test-api-negotiation.ts` and `test-e2e-api.ts`
- production build passes after cleanup

## Next Queue

1. Operations triage decision: disputes vs vault
2. Finance consolidation when triggered by payout/PIT/export work
3. Broader package maintenance pass

## Ownership

### Codex

- owns implementation in main workspace
- owns integration and final decisions
- owns this board

### Claude

- owns planning / verification / audits
- should use `CLAUDE_COLLAB_INSTRUCTIONS.md`
- current task: operations triage audit preparation

### Antigravity

- excluded from the current sprint batch unless re-enabled later

## 2026-03-31 75 - Sprint closeout and next sprint decision

- Final funded QA result: `PASS WITH QA GAP`
- Gap classified as non-product:
  - no dedicated QA company account for the full funded browser run
- Current cycle is considered closed
- Added `SPRINT_CLOSEOUT_2026-03-31.md`
- Added `NEXT_SPRINT_PROPOSAL_2026-03-31.md`
- Recommended next sprint:
  - Day 0 hygiene: create dedicated QA company account
  - Main theme: `Private Proposals Phase`

## 2026-03-31 76 - Private proposals kickoff

- Added `PRIVATE_PROPOSALS_PHASE_PLAN.md`
- Added `CLAUDE_PRIVATE_PROPOSALS_AUDIT_INSTRUCTIONS.md`
- Confirmed current architecture bias:
  - private proposals should converge into `service_orders`, not create a parallel settlement domain
- Main open design question before implementation:
  - whether `conversations.service_order_id` should be part of the same foundation batch

## Highest-Priority Confirmed Risks

Critical:
- privileged finance RPCs appear to rely on `SECURITY DEFINER` without explicit caller authorization in repo migration logic

High:
- notification creation path appears too open and may support arbitrary outbound notifications/emails
- `contract_documents` and `invoices` insert permissions appear too open for non-admin actors

## Highest-ROI Cleanup Items

- remove or gate dev/example/test routes
- remove debug traces from offer flow
- decide fate of orphaned admin dashboard
- centralize admin/service-role helpers
- reduce lint debt in top offender files

## Update Log

### 2026-03-26 1

Prepared sprint operating files:
- `SPRINT_COMMAND_CENTER_2026-03-26.md`
- `CHAT_REPORT_TEMPLATES.md`
- `CLAUDE_COLLAB_INSTRUCTIONS.md`
- `SPRINT_LIVE_BOARD.md`

Prepared repo hygiene:
- `.gitignore` now ignores `.claude/worktrees/`

Evidence gathered:
- ZIP vs repo gap mapped
- cleanup ROI mapped
- security findings triaged

### 2026-03-26 2

Batch S1 repo changes prepared:
- new migrations for document/invoice insert lock-down
- new migration for create_notification service-role restriction
- new migration for finance RPC caller guards + execute revoke
- server-side notification helper added in `lib/notifications/server.ts`
- server action callsites moved off user-context notification RPC
- notification email HTML now escapes dynamic payload values

Verification:
- `cmd /c npm run build` PASS

Follow-up QA pack:
- added `PRIVATE_PROPOSALS_FOUNDATION_QA_CHECKLIST.md`
- added `CLAUDE_PRIVATE_PROPOSALS_FOUNDATION_QA_INSTRUCTIONS.md`
- next step is browser verification of:
  - student compose flow
  - company receiving in `/app/company/orders`
  - chat routing by `service_order_id`

### 2026-04-01 76 - Private proposals RLS unblock

- Claude QA found one primary blocker after deploy: student-side insert into `service_orders` was rejected by RLS during private proposal submit.
- root cause:
  - existing `INSERT` policies on `public.service_orders` only permit company-created rows
  - private proposals insert as `student_id = auth.uid()` and `company_id = target company`
- added a dedicated additive migration:
  - `supabase/migrations/20260401171000_private_proposals_student_insert_rls.sql`
- the new policy allows insert only when all of the following are true:
  - `auth.uid() = student_id`
  - `initiated_by = 'student'`
  - `entry_point = 'student_private_proposal'`
  - `package_id` belongs to the authenticated student's own `service_packages`

Next step:
- apply the RLS migration in Supabase
- rerun Claude QA from Scenario 1 onward

### 2026-03-30 72

Pre-sprint closeout preparation:
- created `PRE_SPRINT_CLOSEOUT_CHECKLIST.md` to define what must be closed before opening the next sprint
- explicitly marked `Payment / Escrow` as the only major remaining blocker in the live user path
- created `PAYMENT_ESCROW_FLOW_AUDIT_PLAN.md` as the next repo-grounded investigation target
- created `CLAUDE_PAYMENT_ESCROW_AUDIT_INSTRUCTIONS.md` so Claude can immediately start browser-side evidence gathering for the funded path

Verification:
- planning/documentation batch only; no build required

### 2026-03-30 73

Payment / escrow implementation batch:
- fixed service-order checkout handoff so escrow funding no longer depends on `applicationId` being present
- updated `app/components/payment-modal.tsx`:
  - accepts optional `serviceOrderId`
  - allows Stripe checkout when either `applicationId` or `serviceOrderId` is present
  - sends `serviceOrderId` to `/api/stripe/create-checkout`
- updated `app/app/deliverables/[id]/tabs/StatusTab.tsx`:
  - passes `serviceOrderId` for service-order realizations
  - keeps `applicationId` only for classic application flow
- hardened `app/api/stripe/create-checkout/route.ts`:
  - only validates `applicationId` mismatch when the contract actually has a non-null `application_id`
  - keeps the existing `serviceOrderId -> contract_id` validation path intact

Verification:
- `cmd /c npm run build` PASS

### 2026-03-28 69

Company Order Management v1:
- added a real company-side service order surface at `app/app/company/orders/page.tsx`
  - mirrors the student cockpit, but with company bucket logic:
    - `Wymaga Twojej decyzji`
    - `Czeka na studenta`
    - `Aktywne i historia`
- added shared company status semantics in `app/app/company/orders/company-order-status.ts` so the company dashboard and detail view speak the same workflow language as the existing backend actions
- added `app/app/company/orders/[id]/page.tsx`:
  - structured request snapshot rendering for new orders
  - legacy `requirements` fallback for older rows
  - quote history summary for proposal / counter / accepted states
  - student profile side panel for execution context
- added `app/app/company/orders/[id]/company-order-detail-actions.tsx`:
  - `Akceptuj ofertę`
  - `Złóż kontrofertę`
  - `Odrzuć`
  - `Panel realizacji` for post-acceptance states
- wired navigation entry points in `app/app/app-navbar.tsx` so company users can now reach service-order management directly from the main app shell
- intentionally kept this batch UI-only over the already existing backend actions:
  - `acceptServiceProposalAction`
  - `counterServiceProposalAction`
  - `rejectServiceProposalAction`
  so the missing loop on the company side is now closed without introducing new workflow tables

Verification:
- `cmd /c npm run build` PASS
- `cmd /c npm run build` PASS after final Stripe-route notification consistency pass

### 2026-03-26 3

Claude runtime verification:
- applied `20260325203000_admin_accounting_analytics_v1.sql`
- applied `20260325210000_variable_commission_model_v1.sql`
- applied `20260326183000_restrict_document_invoice_insert_v1.sql`
- applied `20260326184000_notification_rpc_service_role_v1.sql`
- applied `20260326185000_finance_rpc_service_role_v1.sql`
- verified grants for `create_notification`, `process_stripe_payment_v4`, `process_stripe_refund_v4`, `process_payout_paid_v1`
- verified runtime parity for `notifications`, `contract_documents`, `invoices`

Runtime note:
- missing `REVOKE FROM PUBLIC` had to be corrected in runtime
- positive RLS drift existed on `contract_documents` and `invoices`

Repo follow-up prepared:
- added `20260326190000_batch_s1_runtime_parity_v1.sql` to encode runtime parity in migration history

### 2026-03-26 4

Cleanup quick wins - phase 1:
- removed dev/test/example routes that still appeared in production build output
- deleted CEIDG test page
- deleted Sentry example page and API route
- deleted seed benchmark route
- deleted debug pages for badge, experience, projects and services

Verification:
- `cmd /c npm run build` PASS
- removed routes no longer appear in build output

Open follow-up:
- build warnings remain for `baseline-browser-mapping`
- dependency mismatch warning remains for `import-in-the-middle`

### 2026-03-26 5

Claude final runtime confirmation:
- `20260326190000_batch_s1_runtime_parity_v1.sql` applied
- grants clean for `create_notification`, `process_stripe_payment_v4`, `process_stripe_refund_v4`, `process_payout_paid_v1`
- `contract_documents` insert is service-role only
- `invoices` insert is service-role only
- previous runtime drift removed

Result:
- Step 0 closed
- Batch S1 closed
- repo and runtime are in full parity for this batch

### 2026-03-26 6

Cleanup phase 2:
- removed orphaned `/app/admin/dashboard`
- introduced shared `requireAdmin()` helper in `lib/admin/auth.ts`
- deduplicated admin auth checks across server actions
- removed redundant page guards where admin layout already protects the segment
- consolidated browser Supabase imports onto `lib/supabase/client.ts`
- replaced webhook inline admin client with shared `createAdminClient()`
- removed root test files

Verification:
- `cmd /c npm run build` PASS
- `/app/admin/dashboard` no longer appears in build output

Open follow-up:
- build warnings remain for `baseline-browser-mapping`
- dependency mismatch warning remains for `import-in-the-middle`

### 2026-03-26 7

Prepared next-batch guidance:
- added `BATCH_C3_GUIDELINES.md`
- defined scope for canonical admin shell and route map
- prepared ready-to-send prompt for Claude for the next audit/plan step

### 2026-03-26 8

Batch C3 shell prereq implemented:
- added canonical `/app/admin` route as redirect to `/app/admin/analytics`
- extracted shared admin navigation into `components/admin/admin-nav.tsx`
- wired admin navigation in both desktop navbar and mobile sheet
- added missing admin links for `pit` and `system-services`
- updated admin logo/home path to point to `/app/admin`
- removed residual inline auth guard from `app/app/admin/system-services/page.tsx`

Implementation decisions:
- `AdminNav` is handled now, not deferred
- `disputes` should start as a filtered contracts view in Phase A, without migrations

Verification:
- `cmd /c npm run build` PASS
- `/app/admin` now appears in build output as canonical route

### 2026-03-26 9

Prepared Phase A delivery docs:
- added `PHASE_A_IMPLEMENTATION_PLAN.md`
- added `CLAUDE_PHASE_A_INSTRUCTIONS.md`
- defined implementation order for `users`, `contracts`, `disputes`
- documented that `disputes` starts as filtered contracts view without migrations

### 2026-03-26 10

Phase A implemented:
- added `/app/admin/users`
- added `/app/admin/contracts`
- added `/app/admin/disputes`
- added shared `components/admin/contracts-table.tsx`
- expanded `components/admin/admin-nav.tsx` with new Marketplace links
- kept `disputes` as filtered contracts view without migrations

Verification:
- `cmd /c npm run build` PASS
- new routes appear in build output:
  `/app/admin/users`
  `/app/admin/contracts`
  `/app/admin/disputes`

### 2026-03-26 11

Security / dependency cleanup pass:
- switched admin export routes to shared `createAdminClient()` helper
- upgraded `baseline-browser-mapping` to latest available repo version
- upgraded `next` to `16.2.1`
- upgraded `eslint-config-next` to `16.2.1`

Verification:
- `cmd /c npm run build` PASS on Next `16.2.1`
- previous build warnings disappeared from build output
- `npm audit --omit=dev` no longer reports `next`

Residual debt:
- `npm audit --omit=dev` still reports transitive issues in `brace-expansion` and `picomatch`
- `import-in-the-middle` remains split across transitive Sentry / OpenTelemetry dependency trees, but no longer emits build warnings after the Next upgrade

### 2026-03-26 12

Dependency maintenance follow-up:
- applied `npm audit fix`
- production audit is now clean

Verification:
- `npm audit --omit=dev` returns `0 vulnerabilities`
- `cmd /c npm run build` PASS on Next `16.2.1`

Note:
- earlier residual `brace-expansion` and `picomatch` findings are cleared for production dependencies
- any remaining audit noise after `npm audit fix` is in dev-toolchain scope, not production runtime scope

### 2026-03-26 13

Persistent memory layer added:
- created `AGENT_NOTEBOOK.md`
- notebook is intended for future chats and agents
- stores expansion ideas, deferred architecture and longer-lived product direction
- `SPRINT_LIVE_BOARD.md` remains the live execution source of truth

### 2026-03-26 14

Phase B finance kickoff:
- added `PHASE_B_FINANCE_PLAN.md`
- added `CLAUDE_PHASE_B_FINANCE_INSTRUCTIONS.md`
- extended `AGENT_NOTEBOOK.md` with Phase B finance direction and guardrails
- added canonical `/app/admin/finance` route as redirect to `/app/admin/finance/ledger`
- added first finance panel at `/app/admin/finance/ledger`
- expanded `components/admin/admin-nav.tsx` with a finance ledger entry

Verification:
- `cmd /c npm run build` PASS
- new routes appear in build output:
  `/app/admin/finance`
  `/app/admin/finance/ledger`

### 2026-03-26 15

Phase B finance - invoices panel:
- Claude confirmed `accounting_book_lines_v1` is sufficient for ledger and recommended `invoices` as the next low-risk panel
- added `/app/admin/finance/invoices`
- expanded `components/admin/admin-nav.tsx` with finance invoices navigation
- extended `AGENT_NOTEBOOK.md` with the confirmed invoice-unit guardrail

Implementation notes:
- `invoices` uses PLN numeric formatting, not `*_minor` conversion
- current query shape is read-only and ordered by `created_at DESC`

### 2026-03-26 16

Phase B finance - periods panel:
- added `/app/admin/finance/periods`
- expanded `components/admin/admin-nav.tsx` with finance periods navigation
- extended `AGENT_NOTEBOOK.md` with the confirmed accounting-vs-PIT period split

Implementation notes:
- `periods` currently aggregates `accounting_book_lines_v1` by `month_bucket`
- the first panel intentionally does not combine `month_bucket` with `pit_withholdings.tax_period`

### 2026-03-26 17

Phase B finance - PIT periods section:
- Claude recommended holding URL consolidation and extending `/app/admin/finance/periods` instead
- added a separate PIT periods section inside `/app/admin/finance/periods`
- extended `AGENT_NOTEBOOK.md` with trigger-based finance URL consolidation guidance

Implementation notes:
- accounting periods still use `month_bucket` with `*_minor` formatting
- PIT periods use `pit_withholdings.tax_period` with PLN numeric formatting
- current page keeps accounting and PIT periods clearly separated

### 2026-03-26 18

Prepared next-batch decision pack:
- added `NEXT_BATCH_DECISION_PLAN.md`
- added `CLAUDE_NEXT_BATCH_INSTRUCTIONS.md`
- updated `AGENT_NOTEBOOK.md` with the decision rule after Phase B finance

Decision scope:
- compare finance consolidation against Phase C analytics and settings discovery
- optimize for business ROI, not only route cleanliness

### 2026-03-26 19

Next batch decision resolved:
- Claude selected `GO PHASE C ANALYTICS`
- finance consolidation remains trigger-based
- settings stays deferred until a real configuration schema exists

Implementation scope opened:
- expose additional fields already returned by `get_admin_stats()`
- avoid new migrations and avoid new RPC work in the first Phase C batch

### 2026-03-27 20

Marketplace operability batch:
- Claude confirmed Phase C analytics is saturated on the current data foundation
- added client-side role filter and quick search to `/app/admin/users`
- upgraded shared `ContractsTable` with status filter and sorting
- `/app/admin/contracts` and `/app/admin/disputes` now inherit the new contract table controls

Implementation notes:
- no new queries, migrations or RPC changes
- current search in users is based on display name, name parts, role and user ID
- contract controls currently support status filtering and sorting by date or amount

### 2026-03-27 21

Prepared settings discovery pack:
- added `SETTINGS_DISCOVERY_PLAN.md`
- added `CLAUDE_SETTINGS_DISCOVERY_INSTRUCTIONS.md`
- updated `AGENT_NOTEBOOK.md` with the rule that settings must start from one concrete source-of-truth model

Decision scope:
- determine whether a real settings MVP exists without speculative UI
- compare configurable candidates against code-only and migration-only policy areas

### 2026-03-27 22

Commission operations batch:
- Claude recommended deferring settings and treating commission control as inline admin operations instead
- added inline commission editing to `/app/admin/offers`
- added inline commission editing to `/app/admin/system-services`
- updated `AGENT_NOTEBOOK.md` to keep global commission defaults deferred until a real config schema exists

Implementation notes:
- supported values are `auto`, `10%`, `15%`, `20%`
- no new migrations and no global defaults refactor in this batch

### 2026-03-27 23

Prepared operations triage pack:
- added `OPERATIONS_TRIAGE_PLAN.md`
- added `CLAUDE_OPERATIONS_TRIAGE_INSTRUCTIONS.md`
- updated `AGENT_NOTEBOOK.md` to point the next ROI search toward `disputes` and `vault`

Decision scope:
- compare the next operational value in `disputes`, `vault`, or a shared operability pattern

### 2026-03-27 24

Operations batch - vault and disputes usability:
- extended shared `ContractsTable` with quick search on top of the existing status filter and sort controls
- added `components/admin/vault-table.tsx` as a dedicated interactive table for legal/document operations
- refactored `/app/admin/vault` to use the new vault table with search, status filtering and sort controls
- updated `AGENT_NOTEBOOK.md` with the confirmed rule to prefer focused operability over premature shared abstractions

Implementation notes:
- `/app/admin/contracts` and `/app/admin/disputes` now both benefit from the richer shared contract table
- `vault` keeps its own table because row actions and offer-title density differ from the contracts/disputes surface
- no new migrations, RPC changes or schema work in this batch

Verification:
- `cmd /c npm run build` PASS

### 2026-03-27 25

Vault operability follow-up:
- extended `/app/admin/vault` query with contract-level document acceptance timestamps
- added per-contract document and invoice summary data to the vault surface
- upgraded `components/admin/vault-table.tsx` to show document readiness and acceptance state next to counts
- replaced `VaultRowActions` with a clean ASCII-safe component to remove broken user-facing copy

Implementation notes:
- `vault` now shows whether PDF documents exist, whether both sides accepted the contract, and how many invoices are linked to the contract
- summary data is derived from existing `contract_documents`, `invoices` and contract acceptance columns
- no migrations, no new RPCs and no new workflow states were introduced

Verification:
- `cmd /c npm run build` PASS

### 2026-03-27 26

Prepared disputes triage pack:
- added `DISPUTES_TRIAGE_PLAN.md`
- added `CLAUDE_DISPUTES_TRIAGE_INSTRUCTIONS.md`
- updated `AGENT_NOTEBOOK.md` with the rule that disputes should evolve as a triage surface, not as a generic contracts mirror

Decision scope:
- determine the best next ROI inside `/app/admin/disputes`
- compare extending the shared contracts table against a dedicated disputes surface or summary-first approach

### 2026-03-27 27

Disputes triage batch:
- Claude selected `TARGET: DEDICATED DISPUTES TABLE`
- added `components/admin/disputes-table.tsx` as a dispute-specific triage surface
- updated `/app/admin/disputes` to fetch `updated_at` and `accepted_at`
- added lightweight summary cards for disputed count, cancelled count and the oldest stale record

Implementation notes:
- disputes now default to sorting by `updated_at ASC`, so the oldest untouched records rise to the top
- the panel now shows idle age, last movement date and a simplified dispute-vs-cancelled filter
- shared `ContractsTable` stays focused on broader marketplace browsing

Verification:
- `cmd /c npm run build` PASS

### 2026-03-27 28

Next-step audit after disputes triage:
- audited lightweight disputes workflow against finance URL consolidation
- confirmed finance consolidation is still lower ROI because `payouts/_actions.ts` and `pit/_actions.ts` still hardcode old `revalidatePath` targets
- confirmed admin nav already groups finance routes visually, so consolidation still adds mostly structure rather than new capability
- confirmed `/app/admin/disputes` has no admin actions or context handoff yet, while `/app/deliverables/[id]` already supports both `application_id` and `service_order_id`

Decision:
- next high-ROI target should be dispute context actions, especially row-level access from disputes into the related workspace
- finance consolidation remains trigger-based and should wait for a batch that already modifies payouts, PIT or exports behavior

### 2026-03-27 29

Dispute workspace handoff batch:
- added `application_id` and `service_order_id` to the disputes admin query
- extended `components/admin/disputes-table.tsx` with a row-level `Otworz workspace` action
- disputes rows now link directly into the existing `/app/deliverables/[id]` workspace context
- added `DISPUTE_WORKSPACE_BATCH_PLAN.md`
- added `CLAUDE_DISPUTE_WORKSPACE_INSTRUCTIONS.md`

Implementation notes:
- workspace routing prefers `application_id` and falls back to `service_order_id`
- this batch adds contextual action without introducing new dispute states or admin mutations
- finance consolidation remains deferred and trigger-based

Verification:
- `cmd /c npm run build` PASS

### 2026-03-27 30

Payouts operability batch:
- Claude selected `TARGET: OTHER ADMIN WORKFLOW` with payouts search, sort and style alignment as the highest ROI
- rebuilt `/app/admin/payouts` around the dark admin shell used by the rest of the panel set
- added client-side search across student name, offer title, milestone title, payout ID and contract ID
- added client-side sort for newest, oldest and highest or lowest net payout value

Implementation notes:
- status filtering still uses the existing server-side `getPayouts()` flow
- no new migrations and no new RPC work were introduced
- finance URL consolidation remains trigger-based rather than part of this batch

Verification:
- `cmd /c npm run build` PASS

### 2026-03-27 31

PIT follow-up batch:
- Claude selected `TARGET: PIT FOLLOW-UP`
- rebuilt `/app/admin/pit` around the dark admin shell used by the rest of the admin suite
- added client-side search across student name, contract ID and tax period
- preserved existing batch selection and mark-paid actions while aligning PIT to the newer admin interaction pattern

Implementation notes:
- no new migrations and no new RPC work were introduced
- PIT keeps its grouped-by-period structure while gaining search and a cleaner admin shell
- exports remains deferred as low-ROI cleanup

Verification:
- `cmd /c npm run build` PASS

### 2026-03-27 32

Finance follow-up audit after PIT:
- audited `exports` against finance URL consolidation after the payouts and PIT operability batches
- confirmed `payouts/_actions.ts` and `pit/_actions.ts` still hardcode old `revalidatePath` targets, so consolidation remains a trigger-based structural task
- confirmed admin nav already groups finance routes coherently, so URL consolidation still adds little operational value by itself
- confirmed `exports` remains the main leftover finance panel with legacy light styling, `alert()`-based errors and stale copy about future ZIP behavior

Decision:
- if we take another no-migration finance batch, the next target should be `exports follow-up`
- finance consolidation remains deferred until a batch already changes payout, PIT or export behavior deeply enough to justify atomic route migration

### 2026-03-27 33

Exports follow-up batch:
- rebuilt `/app/admin/exports` around the dark admin shell used by the rest of the admin suite
- replaced legacy `alert()` download errors with `toast` feedback
- updated page copy to match the current CSV outputs instead of the older "Sprint #2 PDF ZIP" wording
- added `POST_EXPORTS_DECISION_PLAN.md`
- added `CLAUDE_POST_EXPORTS_INSTRUCTIONS.md`

Implementation notes:
- no new migrations and no new export endpoints were introduced
- the current `invoices-zip` endpoint is now described honestly as a CSV-producing export route
- this batch improves clarity and operator experience without changing finance URL structure

Verification:
- `cmd /c npm run build` PASS

### 2026-03-27 34

User detail drill-down batch:
- Claude selected `TARGET: NON-FINANCE ADMIN ROI`
- added `/app/admin/users/[id]` as the first dedicated admin detail view
- updated `components/admin/users-table.tsx` so each row links into the new user detail route
- user detail now aggregates profile context, contracts and student finance snippets without migrations

Implementation notes:
- the drill-down uses existing `profiles`, `student_profiles`, `company_profiles`, `contracts`, `payouts` and `pit_withholdings`
- the page is discovery-first and keeps contract detail as the likely next drill-down after this batch

Verification:
- `cmd /c npm run build` PASS

### 2026-03-27 35

Prepared contract detail planning pack:
- added `CONTRACT_DETAIL_PLAN.md`
- added `CLAUDE_CONTRACT_DETAIL_INSTRUCTIONS.md`
- updated `AGENT_NOTEBOOK.md` with the rule that contract detail should be the next likely drill-down after user detail

Decision scope:
- determine the safest highest-ROI v1 for `/app/admin/contracts/[id]`
- compare direct contract detail against vault-first indirection or deferral

### 2026-03-27 36

Contract detail v1 batch:
- added `/app/admin/contracts/[id]` as the second dedicated admin drill-down after user detail
- updated `components/admin/contracts-table.tsx` so contract rows link into the new detail route
- updated the contracts section inside `/app/admin/users/[id]` to link into the same contract detail view
- contract detail aggregates core contract, milestones, documents, invoices, payouts and PIT context without migrations

Implementation notes:
- the page uses a stacked read-first layout: hero, stat cards, parties, milestones, finance and documents
- workspace handoff reuses existing `application_id` or `service_order_id` linkage instead of introducing a new routing model
- next natural follow-up is cross-linking from vault and disputes into the same contract detail route

Verification:
- `cmd /c npm run build` PASS

### 2026-03-27 37

Prepared contract cross-link planning pack:
- added `CONTRACT_CROSSLINK_PLAN.md`
- added `CLAUDE_CONTRACT_CROSSLINK_INSTRUCTIONS.md`
- updated `AGENT_NOTEBOOK.md` so the next audit compares `vault`, `disputes` and dual cross-linking into contract detail

Decision scope:
- determine the best next cross-link target for `/app/admin/contracts/[id]`
- decide whether the next batch should start from `vault`, `disputes`, both, or a small contract-detail polish pass

### 2026-03-27 38

Contract cross-link batch:
- updated `components/admin/disputes-table.tsx` so each dispute row now exposes `Szczegoly` for `/app/admin/contracts/[id]`
- preserved `Otworz workspace` as a parallel action in disputes when workspace context exists
- updated `components/admin/vault-table.tsx` so contract IDs now link into the same contract detail route
- promoted `/app/admin/contracts/[id]` to the shared contract context hub for contracts, users, disputes and vault

Implementation notes:
- no new migrations and no new RPC work were introduced
- disputes no longer has a hard dead end when workspace context is missing
- contract detail back-link context awareness remains optional Phase 2 polish

Verification:
- `cmd /c npm run build` PASS

### 2026-03-27 39

Prepared post-contract-crosslink audit pack:
- added `POST_CONTRACT_CROSSLINK_AUDIT_PLAN.md`
- added `CLAUDE_POST_CONTRACT_CROSSLINK_INSTRUCTIONS.md`
- queued the next decision around contract-detail polish vs contract-adjacent workflow vs a different admin ROI target

### 2026-03-27 40

Admin nav readability hotfix:
- updated `components/admin/admin-nav.tsx` to improve contrast, spacing and desktop overflow behavior for dense admin tabs
- updated `app/app/app-navbar.tsx` so the center nav gets flexible width instead of being squeezed between the brand block and right-side controls
- kept the existing admin route map intact while making the top-level tabs easier to scan and use

Verification:
- `cmd /c npm run build` PASS

### 2026-03-27 41

Invoices-to-contract drill-down batch:
- updated `/app/admin/finance/invoices` so invoice rows now link directly to `/app/admin/contracts/[id]`
- completed the missing navigation direction from finance invoice review into full contract context
- refreshed `/app/admin/contracts/[id]` readability with truncated payout IDs and milestone status badges
- rewrote the contract detail page into a clean ASCII-safe version while keeping the same read-first scope

Implementation notes:
- no new migrations and no new RPC work were introduced
- contract detail remains a read-first context hub rather than a mutation center
- remaining contract-detail polish is now incidental rather than a standalone blocker

Verification:
- `cmd /c npm run build` PASS

### 2026-03-27 42

Invoices operability batch:
- added `components/admin/invoices-table.tsx` as the interactive client-side table for `/app/admin/finance/invoices`
- added search across invoice number, recipient, issuer and short ID
- added status filtering and sorting by creation date, payment date and gross amount
- kept `/app/admin/finance/invoices/page.tsx` as a server component that fetches data and passes it into the interactive table

Implementation notes:
- no new migrations and no new RPC work were introduced
- finance invoices now matches the operability baseline already present in users, contracts, disputes, vault, payouts and PIT
- this closes the last major read-heavy admin table without basic search or filtering

Verification:
- `cmd /c npm run build` PASS

### 2026-03-27 43

Prepared post-baseline decision pack:
- added `POST_BASELINE_DECISION_PLAN.md`
- added `CLAUDE_POST_BASELINE_INSTRUCTIONS.md`
- updated `AGENT_NOTEBOOK.md` so the next audit compares new drill-down vs new workflow vs different product area after baseline closure

Decision scope:
- choose the first non-baseline batch after the main admin tables reached search/filter/sort parity
- explicitly keep finance consolidation as a comparison point rather than a default next step

### 2026-03-27 44

Offer detail drill-down batch:
- added `/app/admin/offers/[id]` as the upstream marketplace detail view for one offer
- connected the offers list into the new detail route from `admin-offers-table.tsx`
- added payouts -> contract and PIT -> contract cross-links as companion completeness items
- kept the new offer detail read-first and migration-free by joining existing offers, applications, contracts and payouts data

Implementation notes:
- no new migrations and no new RPC work were introduced
- the admin discovery chain now reaches upstream from contracts into the originating offer context
- finance consolidation remains deferred because this batch added capability rather than URL cleanup

Verification:
- `cmd /c npm run build` PASS

### 2026-03-27 45

Admin stability and document-access batch:
- fixed `/app/admin/users` to use runtime-safe `profiles` fields plus role-specific names from `student_profiles` and `company_profiles`
- fixed `/app/admin/disputes` to use contract acceptance timestamps that actually exist at runtime
- fixed admin document download flow so `vault` reads canonical `contract_documents` rows instead of guessing PDFs by storage folder listing
- added signed PDF download access in contract detail and finance invoices
- introduced a darker admin shell wrapper and refreshed the offers admin surface for better readability

Verification:
- runtime smoke checks on `profiles`, `student_profiles`, `company_profiles`, disputed-contract acceptance fields and storage signed URLs PASS
- `cmd /c npm run build` PASS

### 2026-03-27 46

Analytics and vault readability batch:
- refreshed analytics entry surfaces so `/app/admin/analytics` now uses darker header and funnel components aligned with the rest of admin
- replaced the fragile popup-based vault PDF action with explicit signed links for legal contract documents
- `Legal Vault` now shows concrete `Umowa A` / `Umowa B` download targets when legal PDFs exist and a clear disabled state when they do not

Verification:
- `cmd /c npm run build` PASS

### 2026-03-27 47

Prepared contract PDF lifecycle pack:
- added `CONTRACT_PDF_LIFECYCLE_PLAN.md`
- added `CLAUDE_CONTRACT_PDF_LIFECYCLE_INSTRUCTIONS.md`
- updated notebook memory so the next audit focuses on legal PDF generation trigger logic rather than more UI-only changes

Decision scope:
- determine the canonical moment for contract PDF generation
- explain why some contracts still have no legal PDFs despite stable admin downloads

### 2026-03-27 48

Refined next-sprint handoff for Legal Vault and contract PDF lifecycle:
- expanded `CONTRACT_PDF_LIFECYCLE_PLAN.md` with verified evidence from deliverables workspace triggers and contract creation paths
- tightened `CLAUDE_CONTRACT_PDF_LIFECYCLE_INSTRUCTIONS.md` so the next audit explicitly checks trigger location, state consistency and duplicate-generation risk
- recorded the current working assumption that missing legal PDFs are now primarily a lifecycle/backfill problem, not a broken admin download surface

### 2026-03-28 49

Contract PDF repair and idempotency batch:
- added an idempotency guard around contract PDF generation so existing `contract_a` / `contract_b` records are not blindly duplicated
- added a service-order title lookup path for PDF generation instead of always falling back to a generic offer title
- added explicit error handling for `documents_generated_at` updates after document creation
- added an admin-side `Napraw brakujace PDF` action in `Legal Vault` that backfills missing contract PDFs and reports repaired vs failed records

Verification:
- `cmd /c npm run build` PASS

### 2026-03-28 50

Admin polish and vault follow-through batch:
- fixed the false `NEXT_REDIRECT` error path in single-contract PDF repair so successful repairs no longer show a failure banner
- added explicit `Status: ustalanie kontraktu` messaging in `Legal Vault` for `draft` and `awaiting_funding` rows that still have no PDFs
- finished a broader dark-shell alignment pass for `analytics` cards and `system-services`

Implementation notes:
- current Legal Vault failures should now represent real generation problems rather than redirect noise
- `system-services` no longer stands out as a legacy light-theme admin surface
- analytics readability is now closer to the same contrast model used across the rest of admin

Verification:
- `cmd /c npm run build` PASS

### 2026-03-28 51

Prepared repo-aligned documents sprint pack:
- added `SPRINT_DOCUMENTS_DASHBOARD_REPO_ALIGNED.md`
- added `CLAUDE_SPRINT_DOCUMENTS_REPO_ALIGNED_INSTRUCTIONS.md`
- corrected the original sprint assumptions against current repo state before handing new work to Claude

Alignment notes:
- `G-1` is now treated as refactor/verify of existing `generateStudentInvoice()` rather than greenfield
- `A-1` and `A-2` are reframed as polish of existing admin contracts and invoices surfaces, not missing pages
- `F-2` is reframed as company-profile completion on top of existing `/app/profile`

### 2026-03-28 52

Documents shared-layer and receipt-idempotency batch:
- added `types/documents.ts` as the shared contract/invoice document typing layer for the sprint
- added `hooks/use-student-documents.ts` so student-facing surfaces can load grouped `contract_b` and `invoice_student` documents without re-deriving joins in each page
- added `components/documents/document-card.tsx` as the reusable dark-shell document card with download CTA
- refactored `generateStudentInvoice()` so retries no longer blindly create duplicate student receipts for the same milestone

Verification:
- `cmd /c npm run build` PASS

### 2026-03-28 53

Student documents surface batch:
- added `app/app/finances/student-documents-panel.tsx` as the first consumer of the shared documents layer
- `/app/finances` now exposes a dedicated documents section for the logged-in student
- the section groups documents per contract and shows `contract_b` plus `invoice_student` with signed download links

Verification:
- `cmd /c npm run build` PASS

### 2026-03-28 54

Company documents surface batch:
- added `hooks/use-company-documents.ts` as the company-side analogue of the student hook
- added `/app/company/documents` with grouped company-visible `contract_a` and `invoice_company` documents
- updated the shared `DocumentCard` to a light neutral style so it fits both student and company surfaces

Verification:
- `cmd /c npm run build` PASS

### 2026-03-28 55

Company profile completion and documents activation batch:
- added a company-facing `Dokumenty` entry point in `app/app/app-navbar.tsx`
- added a documents widget/link inside the company branch of `app/app/profile/page.tsx`
- added editable `linkedin_url` field to the company profile form so displayed company social data is now editable in-place

Verification:
- `cmd /c npm run build` PASS

### 2026-03-28 56

Post-F-2 verification alignment:
- confirmed `saveCompanyProfile()` already persists `linkedin_url`, so the new company profile field is end-to-end wired
- confirmed `/app/company/documents` is now reachable from both navbar and company profile
- confirmed `A-2` is already present in repo state: `/app/admin/finance/invoices` pre-signs invoice PDFs and renders inline `Pobierz PDF`

Decision note:
- do not spend another batch on `A-2`
- next likely documents-sprint target is `A-1` contract document polish unless a newer audit surfaces a stronger blocker

### 2026-03-28 57

Admin contract documents polish batch:
- upgraded `/app/admin/contracts/[id]` so the contract detail surface now clearly distinguishes `contract_a`, `contract_b`, company invoices and student receipts
- added document summary badges in the contract-side acceptance panel so admin can see agreement and invoice completeness without scanning the whole page
- replaced raw document-type strings in the contract documents section with user-facing labels and short descriptions
- added invoice-type badges in the finance subsection so company vs student accounting documents are visually separate
- normalized the shared document group typing by introducing neutral `DocumentGroup` / `CompanyDocumentGroup` aliases and removing the misleading `StudentDocumentGroup` usage from the company hook
- strengthened `DocumentCard` badge contrast on light backgrounds so the student/company document surfaces are visually finished, not just functionally complete

Verification:
- `cmd /c npm run build` PASS

### 2026-03-28 58

Offer-creation planning kickoff:
- added `OFFER_CREATION_UX_AND_DATA_PLAN.md` as the repo-grounded plan for company offer-creation UX, brief fields and legal/workflow data separation
- added `CLAUDE_OFFER_CREATION_AUDIT_INSTRUCTIONS.md` for an evidence-based audit of which fields are safe now vs which require migration or legal/workflow decisions
- elevated QA to explicit priority for the flow `offer -> application -> contract -> documents`

Current direction:
- phase 1: quick UX polish of `app/app/company/jobs/new`
- phase 2: evidence audit for Offer Brief v2 and contract-data completeness

### 2026-03-28 59

Company offer-creation UX polish:
- rebuilt `app/app/company/jobs/new/new-offer-form.tsx` with lighter typography, cleaner step copy and more consistent field spacing so the form now reads like the rest of the company area instead of a one-off wizard
- renamed the micro-offer materials section in UI from obligations-style language to "Materialy i zasoby od firmy" while preserving the current `obligations` storage field for backward compatibility
- added explicit warning copy around `UoP` / `Staz` so the form no longer implies full downstream workflow support where the product has not yet earned that promise
- aligned `app/app/company/jobs/new/_actions.ts` validation and error messages with the new ASCII-safe UI copy and normalized the uploaded-file marker to `[ZALACZONY PLIK]:`
- fixed `app/app/company/packages/_actions.ts` to insert `contract_type: "B2B"` instead of the broken lowercase `"b2b"`

Verification:
- `cmd /c npm run build` PASS

### 2026-03-28 60

Offer Brief v2 and creation-flow hardening:
- added safe collaboration fields to `app/app/company/jobs/new/new-offer-form.tsx`: `cel_wspolpracy`, `oczekiwany_rezultat`, `kryteria_akceptacji`, `osoba_prowadzaca`
- upgraded step 3 so both micro and job flows now collect `planowany_start` plus structured time planning as either `days from contract` or a concrete deadline date
- replaced the micro-budget dollar icon with a clear `PLN` prefix and fixed the category picker to use the same bordered shell as the rest of the form controls
- added `tryb_pracy` plus light formal-review signals (`wymagana_poufnosc`, IP transfer, portfolio visibility, company-material legality) with explicit copy that these are review aids, not automatic legal automation
- updated `app/app/company/jobs/new/_actions.ts` to validate and persist the new offer-brief fields and structured time/work metadata
- added `supabase/migrations/20260328170000_offer_brief_v2_minimal.sql` for the new nullable offer-brief columns and safe check constraints
- exposed the new collaboration brief on `app/app/offers/[id]/page.tsx` so candidates can actually see the added context instead of it staying hidden in the create form

Verification:
- `cmd /c npm run build` PASS

### 2026-03-28 61

Offer creation UX clarification follow-up:
- made `planowany_start` optional in both the company create-offer form and server validation, so offers can be published even when the project kickoff date is still unknown
- replaced ambiguous clickable legal cards with explicit `Tak / Nie` decision controls in step 3 for confidentiality, IP transfer, portfolio visibility and legality of company materials
- kept the same stored fields, but made their meaning clearer so the formal-review block reads as a short questionnaire instead of four visually similar tiles

Verification:
- `cmd /c npm run build` PASS

### 2026-03-28 62

Marketplace-to-documents QA framework:
- added `QA_MARKETPLACE_DOCUMENTS_PLAYBOOK.md` as the canonical regression checklist for `offer -> application -> contract/workspace -> documents -> admin surfaces`
- added `QA_RUN_TEMPLATE.md` so each QA pass now has a fixed evidence format with gate checks, scenario results and decision requests
- added `CLAUDE_QA_MARKETPLACE_FLOW_INSTRUCTIONS.md` so Claude can run browser-first verification without guessing hidden DB state
- locked the QA split:
  - Codex owns build/schema/data truth and blocker triage
  - Claude owns browser walkthrough, screenshots and route-level pass/fail evidence
- formalized the payment-trigger rule: company invoice verification is part of QA, but lack of Stripe trigger in local/dev is `BLOCKED BY PAYMENT TRIGGER`, not an implementation fail

Verification:
- docs-only batch; no build rerun required

### 2026-03-28 63

First QA run fallout from Claude:
- browser verification confirmed the main blocker is still operational, not UX: `20260328170000_offer_brief_v2_minimal.sql` is not applied in the current local/dev database, so create-offer fails on missing `offers.cel_wspolpracy`
- fixed the misleading micro-budget placeholder in `app/app/company/jobs/new/new-offer-form.tsx` from a value-like `500` to `np. 500`
- fixed the create-offer time-mode UX so switching between `days` and `date` no longer wipes the user-entered value in local component state
- hardened submit normalization in `app/app/company/jobs/new/new-offer-form.tsx` and `app/app/company/jobs/new/_actions.ts` so only the active time branch is persisted:
  - `days` mode clears `planowany_start` and `czas_data`
  - `date` mode clears `czas_dni`
- migration application remains the one real blocker before the next full QA rerun

Verification:
- `cmd /c npm run build` passes and `/api/documents/download` is present in build output

### 2026-03-28 65

Service marketplace planning after documents sprint:
- mapped the current student-services area against the real repo, not just screenshots
- confirmed the foundation already exists across:
  - `service_packages` for listing/publishing
  - `service_orders` for quote/order/execution workflow
  - `conversations` for negotiation transport
  - `contracts` + `deliverables` for realization after acceptance
- identified the main product issue as model sprawl, not missing raw features:
  - public service listing, inquiry flow, quote flow and execution already exist, but are split across too many surfaces and partial conventions
- created `SERVICE_MARKETPLACE_EXPANSION_PLAN.md` to lock the recommended direction:
  - `service_orders` should become the canonical workflow record
  - student ops cockpit should be the next highest-ROI implementation batch
  - private student->company proposals should come only after workflow consolidation, and only for companies with proven prior collaboration
- created `CLAUDE_SERVICE_MARKETPLACE_AUDIT_INSTRUCTIONS.md` so Claude can validate the service workflow and confirm the best first batch from a browser/product perspective

Verification:
- planning batch only; no build required

### 2026-03-28 70

Service-order deliverables lookup fix:
- fixed `/app/deliverables/[id]` for accepted service orders by removing `amount_minor` from the `service_orders` select in `app/app/deliverables/[id]/page.tsx`
- root cause: the service-order lookup was querying a column that the service-order flow does not use, which caused the record fetch to fail and the page to fall through to `Nie znaleziono zlecenia`
- kept the existing amount fallback logic intact:
  - prefer `amount_minor` if ever present on a typed object
  - otherwise derive minor units from `amount`
- this specifically unblocks the post-acceptance path reached from:
  - student service dashboard
  - company service orders
  - `Panel realizacji` CTA after negotiation closes

Verification:
- `cmd /c npm run build` PASS

### 2026-03-29 71

Deliverables polish after Claude verification:
- improved `/app/deliverables/[id]` navigation so service-order realizations return to the correct operational surfaces:
  - company -> `/app/company/orders`
  - student -> `/app/services/dashboard`
- added a visible status badge label for fresh accepted service-order realizations:
  - `pending` -> `Oczekuje`
- confirmed in repo migrations that `ensure_contract_for_service_order` is defined in source SQL (`20260206_fix_contract_negotiation_flow.sql` and `20260325210000_variable_commission_model_v1.sql`), so the remaining uncertainty is runtime deployment state rather than missing design

Verification:
- `cmd /c npm run build` PASS

### 2026-03-28 68

Quote Snapshot Phase Batch A:
- added a real additive migration at `supabase/migrations/20260328221500_service_order_quote_snapshots_v1.sql`
  - `service_orders.request_snapshot jsonb`
  - `service_orders.quote_snapshot jsonb`
- created `lib/services/service-order-snapshots.ts` as the shared source for:
  - extracting structured form answers from dynamic `q_*` fields
  - building `request_snapshot`
  - maintaining `quote_snapshot` across proposal / counter / accept / reject transitions
  - generating a safe preview fallback for dashboard cards
- upgraded `app/app/orders/create/[packageId]/_actions.ts`:
  - package title now comes from DB select
  - order creation stores both the legacy `requirements` blob and the new `request_snapshot`
- finished `quote_snapshot` wiring in `app/app/services/_actions.ts`:
  - `proposeServicePriceAction()` now performs read-modify-write with `quote_snapshot`
  - company accept / company reject / company counter / student accept-counter all keep snapshot state in sync
- upgraded read paths:
  - `app/app/services/dashboard/page.tsx` now selects snapshot columns
  - `app/app/services/dashboard/dashboard-client.tsx` uses `request_snapshot -> requirements` preview fallback instead of always showing the raw blob
  - `app/app/services/dashboard/[id]/page.tsx` now renders structured request details and quote history for new orders, with legacy blob fallback for older rows
- this batch keeps `ensure_contract_for_service_order()` untouched on purpose; service contracts still rely on existing ids/amount flow while snapshots harden the request/quote layer ahead of private proposals

Verification:
- `cmd /c npm run build` PASS

### 2026-03-28 66

Student Service Ops Cockpit v1:
- turned `/app/services/dashboard` from one flat order list into an operational cockpit with three explicit buckets:
  - `Wymaga reakcji`
  - `Czeka na firmę`
  - `Aktywne i historia`
- added a shared service-order status model in `app/app/services/dashboard/service-order-status.ts` so dashboard cards and detail view now use the same labels, bucket rules and badge semantics
- expanded the dashboard query to include `counter_amount`, then surfaced counteroffers directly on list cards so students can see when a company returned with a new rate without opening every detail page
- upgraded `/app/services/dashboard/[id]` so the detail page explains `countered` state clearly and shows the current counter amount vs the student's earlier proposal
- refreshed `order-detail-actions.tsx` so the `countered` branch reads like an actionable next step instead of a raw status:
  - clearer counteroffer explanation
  - stronger accept CTA
  - cleaner copy for sent proposals and negotiation dialogs
- updated `lib/types/services.ts` so the type layer reflects the real workflow vocabulary (`inquiry`, `proposal_sent`, `countered`, `accepted`, `delivered`, etc.) instead of the old truncated union

Verification:
- `cmd /c npm run build` PASS

### 2026-03-28 67

Quote Snapshot Phase planning:
- confirmed via `supabase/migrations/20260325210000_variable_commission_model_v1.sql` that `ensure_contract_for_service_order()` does **not** consume `service_orders.requirements`; it only needs ids, amount and package-derived commission context
- this means the next service-marketplace phase can safely add structured `request_snapshot` and `quote_snapshot` to `service_orders` without changing the current contract creation path
- created `QUOTE_SNAPSHOT_PHASE_PLAN.md` as the repo-grounded implementation plan for:
  - `request_snapshot` at order creation
  - `quote_snapshot` across student offer / company counter / acceptance transitions
  - UI fallback strategy `snapshot -> requirements blob`
- created `QUOTE_SNAPSHOT_PHASE_SCHEMA_DRAFT.sql` as a draft additive schema extension (not yet a live migration)
- created `CLAUDE_QUOTE_SNAPSHOT_AUDIT_INSTRUCTIONS.md` so Claude can validate whether the proposed scope is safe before we start the implementation batch
- current recommendation remains:
  - implement snapshots first
  - keep company-side order management as a follow-up
  - keep private proposals deferred until after snapshots

Verification:
- planning batch only; no build required

### 2026-03-28 64

User-facing document download fix:
- replaced client-side `createSignedUrl()` in `use-student-documents.ts` and `use-company-documents.ts` with app-local download routes so student/company surfaces no longer depend on browser-side storage signing permissions
- added `app/api/documents/download/route.ts`:
  - authenticates the current user
  - verifies contract ownership against the requested `contract_documents` row
  - enforces role-to-document visibility (`contract_a` / `invoice_company` for company, `contract_b` / `invoice_student` for student)
  - signs the `deliverables` file with the admin client and redirects to the signed URL
- this directly addresses the QA finding where files existed in storage and admin could download them, but user-facing pages showed `Brak pliku`

Verification:
- pending build rerun after code changes
## 2026-03-30 74 - Final funded QA pack

- Added `FINAL_FUNDED_QA_CHECKLIST.md` as the last release gate before the next sprint.
- Added `CLAUDE_FINAL_FUNDED_QA_INSTRUCTIONS.md` for one explicit company-funded escrow verification run.
- Tightened pre-sprint closeout wording: next sprint is blocked until funded path is verified or only a non-product QA access gap remains.

## 2026-03-31 75 - Private Proposals Foundation v1

- Added the first additive schema foundation for private proposals in `supabase/migrations/20260331143000_private_proposals_foundation_v1.sql`:
  - `service_orders.entry_point`
  - `service_orders.initiated_by`
  - `conversations.service_order_id`
  - index on `conversations.service_order_id`
- Extended `lib/services/service-order-snapshots.ts` to support a second structured request variant:
  - `source: "student_private_proposal"`
  - proposal goal, expected result, scope summary, timeline, proposed amount, message, target company
  - safe preview rendering for list cards
  - legacy text fallback generation for old surfaces and chat context
- Added `lib/services/private-proposals.ts` as the server-side eligibility guard based on prior `contracts` history; current allowed prior-cooperation statuses are:
  - `awaiting_funding`
  - `active`
  - `delivered`
  - `completed`
- Added a new student compose route at `/app/services/proposals/new`:
  - package-scoped private proposal form
  - eligible-company picker built from real contract history
  - inserts a `service_orders` row directly into the existing negotiation engine
- Added `createPrivateProposalAction()` in `app/app/services/_actions.ts`:
  - validates package ownership
  - validates prior cooperation server-side
  - writes `request_snapshot`, `quote_snapshot`, `entry_point`, `initiated_by`
  - creates a dedicated conversation row with `service_order_id`
  - sends the company notification and redirects student to the order detail
- Upgraded company-initiated `createOrder()` in `app/app/orders/create/[packageId]/_actions.ts`:
  - now writes `entry_point = company_request`
  - now writes `initiated_by = company`
  - now creates a dedicated `conversations` row per order with `service_order_id`
- Replaced fragile package/company/student chat lookup in the service-order engine with `service_order_id` first, old fallback second:
  - `lib/services/service-order-conversations.ts`
  - `app/app/services/_actions.ts`
  - `app/app/services/dashboard/[id]/page.tsx`
  - `app/app/company/orders/[id]/page.tsx`
  - `app/app/deliverables/[id]/page.tsx`
- Reworked both order detail surfaces so private proposals render as a true proposal brief instead of being forced through the old company-order-form layout.

Verification:
- `cmd /c npm run build` PASS

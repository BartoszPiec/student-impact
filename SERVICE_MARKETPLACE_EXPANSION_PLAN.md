# Service Marketplace Expansion Plan

Date: 2026-03-28
Status: planning
Scope: student services creation, company ordering/quote flow, student-to-company proposals, service request management, legal/financial handling

## Summary

Repo already has a working foundation for student services:
- students can create `service_packages`
- companies can browse them in `/app/services` and order or ask for a quote
- service negotiations already live in `service_orders` plus `conversations`
- accepted service negotiations already transition into `contracts` and `deliverables` through `ensure_contract_for_service_order`

The main issue is not lack of raw features. It is that the product model is split across too many surfaces and two partially overlapping workflow shapes:
- public service catalog / package order
- inquiry + negotiation + service order flow

Before adding more power, we need to decide that one record is the workflow source of truth.

## Current Repo State

### What already exists

1. Student service creation
- `app/app/services/_components/service-form.tsx`
- `app/app/services/_actions.ts`
- `app/app/services/my/page.tsx`

Current package fields already include:
- title
- description
- price / price_max
- delivery_time_days
- requirements
- categories
- gallery_urls
- portfolio_items
- form_schema for custom quote questions

2. Company browsing and ordering
- `app/app/services/page.tsx`
- `app/app/services/catalog-client.tsx`
- `app/app/orders/create/[packageId]/page.tsx`
- `app/app/orders/create/[packageId]/order-form.tsx`
- `app/app/orders/create/[packageId]/_actions.ts`

Company can:
- browse student services and system services
- open a package detail / order flow
- send quote details and dynamic form answers

3. Student-side incoming orders dashboard
- `app/app/services/dashboard/page.tsx`
- `app/app/services/dashboard/[id]/page.tsx`
- `app/app/services/dashboard/order-actions.tsx`
- `app/app/services/dashboard/order-detail-actions.tsx`

Student already has an operations dashboard driven by `service_orders`.

4. Negotiation -> contract -> workspace already exists
- `app/app/services/_actions.ts`
- `app/app/chat/_actions.ts`
- `app/app/deliverables/[id]/page.tsx`
- `app/app/deliverables/_actions.ts`

Important fact:
- accepted service proposals already call `ensure_contract_for_service_order`
- service orders already land in the deliverables / contract world

## Core Architectural Decision

### Recommended source of truth

Use this split consistently:

1. `service_packages`
- source of truth for the student's public service listing
- what the student offers in the catalog

2. `service_orders`
- source of truth for the workflow
- request, quote, negotiation, acceptance, execution, completion

3. `conversations`
- transport layer for messaging only
- not the workflow source

4. `contracts`
- source of truth after quote acceptance / execution start

### Why this matters

Today some flows still create side context in `offers` or rely on chat/package matching.
That makes the service area harder to reason about than the job/applications flow.

Recommended direction:
- do not expand service workflows by adding more sidecar `offers`
- expand `service_orders` instead

## Product Gaps To Solve

### A. Student service creation

Current student service creation is usable, but still weak as a commercial product object.

What is missing:
- clearer distinction between:
  - fixed-price service
  - quote-required service
  - custom/project service
- fields that help pricing and contracting downstream
- visibility model for:
  - public service
  - private proposal to a known company

### B. Process from creation to acceptance

Current flow works, but product logic is scattered:
- company starts from public catalog
- student responds from dashboard
- contract appears after acceptance

Weak points:
- `requirements` is still a flattened text blob
- `amount`, `counter_amount`, `agreed_amount` are workable, but not rich enough for a quote history
- workflow statuses are functional but not yet product-polished or formally documented

### C. Student -> known company proposal

This feature does not exist yet and should be added deliberately.

Recommended rule:
- student can propose a service only to companies with a real prior collaboration

Recommended eligibility sources:
- completed `contracts` where student and company were counterparties
- completed `service_orders`

Do not use:
- chat-only history
- offer views
- generic company discovery

### D. Quote handling under legal / contract / finance logic

This is the most important structural gap.

Right now quote logic exists, but it is not yet a first-class commercial artifact.

What is missing:
- structured request brief snapshot
- structured quote snapshot
- acceptance snapshot
- explicit terms needed for later contract and payment interpretation

### E. Student management view for incoming company requests

The dashboard exists, but the user intent now is bigger:
- not just "see orders"
- but manage demand, proposals, counters, accepted work, and company-specific opportunities

That should become a proper student ops cockpit.

## Recommended Product Model

### Track 1: Public student service

Intent:
- a student publishes a public service in the catalog
- any company can discover it

Flow:
1. student creates `service_package`
2. company discovers package in `/app/services`
3. company either:
   - submits a fixed-price order
   - or requests a quote / custom scope
4. this creates `service_order`
5. negotiation lives on `service_order`
6. acceptance creates/links contract
7. workspace / escrow / docs continue as today

### Track 2: Private proposal to a known company

Intent:
- a student proposes a service directly to a company they already worked with

Recommended flow:
1. student picks one of their existing services or creates a new one
2. student chooses an eligible company from prior-collaboration list
3. system creates a private `service_order` seed or a private proposal record linked to `service_package`
4. company sees it in:
   - dedicated "Propozycje od studentow" inbox
   - and optionally a highlighted block inside student services area
5. company can:
   - ignore
   - ask for revision
   - open chat
   - request quote refinement
   - accept and continue to contract

Important:
- do not expose these private proposals in the public catalog

## Data Strategy

## Safe to keep as-is

- `service_packages` for listing metadata
- `service_orders` for workflow progression
- `contracts` + `deliverables` for execution and documents
- `conversations` for communication

## Needs normalization

### 1. Request / quote brief

Current state:
- contact info and answers are flattened into `requirements`

Recommended direction:
- keep human-readable text
- add structured data for machine-safe later use

Recommended new storage for service workflow brief:
- `request_snapshot` JSONB on `service_orders`
- `quote_snapshot` JSONB on `service_orders`
- or equivalent nullable columns if you want a narrower scope first

Contents should include:
- project goal
- deliverables expected
- acceptance criteria
- materials from company
- expected timeline type
- expected timeline value
- legal flags relevant to service execution

### 2. Proposal state

Recommended explicit states for service workflow:
- `inquiry`
- `quote_requested`
- `proposal_sent`
- `countered`
- `accepted`
- `awaiting_funding`
- `in_progress`
- `delivered`
- `completed`
- `rejected`
- `cancelled`

Even if the DB already stores a subset, the product should standardize this vocabulary.

### 3. Private proposal targeting

Needs a deliberate model.

Recommended minimal fields if implemented:
- `proposal_scope`: `public` | `private_company`
- `target_company_id` nullable
- `source_relationship`: optional informational marker

## Legal / Financial Guardrails

### What can be safely supported now

- service request / quote exchange
- negotiated agreed amount
- contract generation after accepted quote
- workspace execution
- student-side receipt generation later in execution flow

### What should not be implied without more logic

- automatic NDA handling
- explicit transfer of IP beyond current contract templates
- access/data-processing commitments without dedicated fields and contract clauses
- company procurement promises or formal SLA semantics

### Minimum legal/finance additions for the service quote area

Before scaling this area, add a structured place to capture:
- what exactly is being delivered
- on what acceptance basis
- whether company materials are legal to use
- whether public portfolio usage is allowed

Those do not all have to be user-facing at once, but they need a real home in the workflow model.

## Recommended Execution Order

### Phase 1 — Service workflow consolidation

Goal:
- stabilize the existing service model before expanding capabilities

Scope:
- document and standardize `service_order` statuses
- remove ambiguous UI language
- make the student dashboard clearly represent:
  - new requests
  - quote sent
  - counter received
  - accepted / awaiting funding
  - active execution
- ensure one obvious route from service request to workspace

Why first:
- it improves what already exists
- it lowers risk before adding private proposals

### Phase 2 — Student ops cockpit

Goal:
- make `/app/services/dashboard` a true command center

Scope:
- segmented lists:
  - new requests
  - awaiting your quote
  - waiting for company response
  - accepted / awaiting funding
  - active work
  - completed history
- per-order structured summary instead of raw text blob
- better action model:
  - send quote
  - counter
  - reject
  - open company context
  - jump to workspace

Why second:
- visible ROI for students
- directly addresses the management need from the request

### Phase 3 — Quote brief v2 for services

Goal:
- make service requests commercially and contractually usable

Scope:
- structured request brief
- structured quote data
- acceptance criteria snapshot
- timeline model
- materials snapshot

This phase likely needs migration work.

### Phase 4 — Private proposals to prior companies

Goal:
- let students proactively sell to trusted companies

Scope:
- derive eligible companies from prior completed collaborations
- student picks a target company
- company receives private proposal
- proposal appears in a dedicated company inbox / section

Why after phase 1-3:
- private proposals should sit on a stable workflow model
- otherwise you multiply edge cases before the base is clean

### Phase 5 — Company-side service request management polish

Goal:
- clean company handling of student services

Scope:
- "student services" tab and inbox become clearer
- direct CTA differences:
  - order now
  - request quote
  - review private proposal
- show legal / financial readiness per request

## Highest-ROI First Batch

Recommended first implementation batch:

### Target: Student Service Ops Cockpit

Why this first:
- biggest visible value without inventing an entirely new model
- already backed by `service_orders`
- reduces current product confusion
- creates the foundation for private proposals later

Minimum scope:
- redesign `/app/services/dashboard`
- split requests by workflow stage
- replace raw requirements wall with structured summary cards where possible
- add stronger state labels and action affordances
- keep contract/workspace jump obvious

## What needs Claude

Claude is most useful for a browser-first verification / product audit of the current services flow:
- student creates a service
- company discovers it
- company requests a quote
- student responds
- company accepts
- workflow reaches workspace

Claude should not define the architecture. Claude should validate where the existing UX breaks and where the current wording is misleading.

## Decision Recommendations

1. Treat `service_orders` as the workflow master record.
2. Do not expand service workflows by leaning further on sidecar `offers`.
3. Build the student ops cockpit before adding private company proposals.
4. Add private proposals only for companies with proven prior collaboration.
5. Plan a migration-backed service quote brief before deeper legal/financial promises.

## Proposed Next Actions

1. Run a focused audit of the current services flow using Claude.
2. Lock the target status model and dashboard segmentation.
3. Implement the student ops cockpit batch.
4. Then design private proposals to previous companies on top of the stabilized model.

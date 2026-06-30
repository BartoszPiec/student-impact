# Next Sprint Proposal — 2026-03-31

## Recommendation
Open the next sprint with one small hygiene item first, then move into the next product area.

## Step 1 — Sprint Day 0 Hygiene
Owner: Bartosz / Ops

Task:
- create a dedicated QA company account
- store the credentials in a secure project-owned location

Why first:
- this removes the only recurring non-product blocker from the current cycle
- it makes future release-sensitive QA much faster and more reliable

## Proposed Main Sprint Theme
### Private Proposals Phase

Why this is the best next product area now:
- service negotiation loop is already working
- quote snapshots now give a structured base for request and pricing context
- company-side order management is already in place
- deliverables and escrow entry path are no longer the first blocker

This means the platform is finally in a good place to add:
- student -> company private proposals
- restricted proposal targeting based on prior cooperation
- quote-like proposal acceptance into the existing service order flow

## Proposed Sprint Goals

### Goal A — Private proposals foundation
- allow a student to initiate a private proposal to an eligible company
- eligibility rule:
  - only companies that have already worked with that student

### Goal B — Company proposal inbox
- give companies a dedicated surface for incoming student proposals
- reuse service-order negotiation patterns where possible

### Goal C — Proposal data model
- add the minimum metadata required for:
  - proposal scope
  - target company
  - proposal origin
  - conversion into a standard service order / contract flow

### Goal D — Legal / finance alignment
- keep proposal acceptance inside the already-proven service-order / contract / escrow path
- avoid inventing a second financial workflow

## Guardrails
- do not build private proposals as a parallel bespoke workflow
- proposals should converge into the same post-acceptance path:
  - contract
  - deliverables
  - escrow
  - invoices
- prefer additive schema changes over rewiring stable marketplace logic

## Suggested Order
1. QA company account hygiene task
2. Private proposals audit and exact scope decision
3. Minimal schema / workflow batch
4. Company inbox / student send surface
5. Browser QA for proposal -> negotiation -> acceptance

## Not Recommended As Primary Theme

### Payment / Escrow polish
Reason:
- important, but no longer the highest blocker
- remaining issues are polish and QA hygiene, not core flow breakage

### Broad deliverables redesign
Reason:
- current flow is stable enough
- ROI is lower than opening the next acquisition / conversion path

## Decision
Recommended next sprint:
- `Private Proposals Phase`, with `QA company account` as sprint day 0 hygiene.

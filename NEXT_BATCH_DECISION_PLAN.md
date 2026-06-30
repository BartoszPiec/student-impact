# Next Batch Decision Plan

This file defines the decision fork after the current Phase B finance read-only rollout.

## Current Baseline

Already live in repo:
- `/app/admin/finance/ledger`
- `/app/admin/finance/invoices`
- `/app/admin/finance/periods`

Important confirmed constraints:
- finance URL consolidation is trigger-based, not mandatory now
- `payouts`, `pit`, `exports` still live on stable legacy URLs
- accounting periods and PIT periods must stay separate in logic and formatting
- security baseline is closed and should not be reopened without evidence

## Decision To Make

Choose the highest-value next batch between:

### Option A - Finance Consolidation Batch

Goal:
- consolidate finance-adjacent admin routes into a single canonical subtree

Likely scope:
- move `/app/admin/payouts` -> `/app/admin/finance/payouts`
- move `/app/admin/pit` -> `/app/admin/finance/pit`
- move `/app/admin/exports` -> `/app/admin/finance/exports`
- update all related `revalidatePath(...)`
- add redirects from old URLs
- optionally improve finance nav icon clarity

Pros:
- cleaner information architecture
- one coherent finance subtree
- easier future finance growth

Cons:
- low business value if no feature changes ship with it
- requires atomic route + action updates
- mostly structural cleanup, not net-new capability

### Option B - Phase C Strategy Batch

Goal:
- define and prioritize the next business-facing expansion after finance read surfaces

Candidate directions:
- analytics expansion
- settings module
- deeper finance workflows

Questions to resolve:
- whether analytics is data-ready beyond current admin stats
- whether settings has enough confirmed data foundations
- whether the next value lies in observability or operational control

Pros:
- unlocks the next product-facing phase
- reduces risk of building the wrong module next
- higher strategic value than cosmetic route cleanup

Cons:
- requires careful scoping and evidence gathering
- may reveal missing event/data foundations

## Current Recommendation

Default recommendation:
- prefer Option B first

Why:
- current finance IA is already coherent in navigation
- finance consolidation is safer when bundled with changes to `payouts`, `pit`, or `exports`
- the repo now needs a higher-level prioritization step more than another structural cleanup

## What Claude Should Audit

Claude should produce one short evidence-based comparison covering:
- whether consolidation should happen now or stay trigger-based
- whether analytics is truly data-ready for a Phase C delivery batch
- whether settings has enough existing schema/app foundations to start without migrations
- which direction gives the highest ROI for the next implementation batch

## Expected Output

Claude should recommend one of:
- `GO FINANCE CONSOLIDATION`
- `GO PHASE C ANALYTICS`
- `GO SETTINGS DISCOVERY FIRST`

And include:
- evidence
- risks
- a proposed batch order
- the first concrete panel or module to implement next

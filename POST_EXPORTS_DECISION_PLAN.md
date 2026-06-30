# Post Exports Decision Plan

This file defines the next decision checkpoint after the exports follow-up batch.

## Goal

Choose the single highest-ROI next admin batch after the finance surfaces have been aligned visually and operationally without migrations.

## Current State

Already stabilized:
- `payouts` has search, sort and the dark admin shell
- `pit` has search, grouped period handling and the dark admin shell
- `exports` now has the dark admin shell, toast-based download feedback and copy aligned with the current CSV outputs
- finance URL consolidation is still deferred and trigger-based

## What Should Be Re-evaluated

### 1. Finance Consolidation

Question:
- after aligning all finance-adjacent panels, is there now enough value to justify an atomic URL consolidation batch?

Reminder:
- consolidation still requires `revalidatePath` updates and redirects
- it should only win if structure and future maintainability now outweigh direct workflow value

### 2. Remaining Finance Workflow ROI

Question:
- is there one finance workflow gap still worth addressing before consolidation?

Examples:
- deeper exports behavior
- finance cross-links
- payout/PIT/export coordination cues

### 3. Non-Finance ROI

Question:
- after these finance follow-ups, has the next best ROI moved back outside finance?

Examples:
- `vault` follow-up
- `disputes` to `vault` cross-linking
- another admin operations surface already present in repo

## Guardrails

- do not propose migrations unless there is a real blocker
- do not recommend consolidation only because the route tree "looks cleaner"
- prefer workflow value over structural neatness

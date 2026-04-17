# Disputes Triage Plan

This file defines the next implementation planning step after the latest `vault` operability improvements.

## Goal

Identify the smallest high-ROI upgrade for `/app/admin/disputes` that improves real admin triage without introducing speculative workflow states or new schema.

## Current State

Already in place:
- `/app/admin/disputes` exists as a filtered contracts view
- it reuses `components/admin/contracts-table.tsx`
- the table already supports:
  - quick search
  - status filter
  - sort by date or amount

Current limitation:
- the page is still mostly a contract list
- it lacks dispute-specific cues that help an admin decide what needs attention first

## Why This Batch

The current admin ROI sits in operational clarity:
- `vault` now surfaces document readiness and acceptance state
- `disputes` should now surface dispute-relevant context instead of staying a generic contract table

## What Should Be Audited

### 1. Existing Dispute-Relevant Data

Check whether current repo and DB already expose useful triage signals, for example:
- contract status vs terms status
- source type
- amount / commission
- timestamps that can indicate age or delay
- acceptance timestamps or other contract-level readiness fields
- any existing relations that can be safely joined without migration

### 2. Highest-ROI UI Upgrade

Determine whether the next useful step is:
- extra badges
- priority grouping
- age / stale indicators
- dispute-specific summary cards
- richer row metadata
- or lightweight row actions that already map to existing safe behavior

### 3. Shared Pattern Question

Decide whether `disputes` should:
- continue using the shared `ContractsTable`
- get a dedicated `DisputesTable`
- or use a light wrapper around the shared table

## Desired Output

Claude should produce one short evidence-based report that:
- identifies the single highest-ROI next implementation target
- explains why it can be done without migrations, if true
- recommends whether to extend `ContractsTable` or split into a dedicated disputes surface

## Guardrails

- do not propose a new disputes schema unless there is a real blocker
- prefer additive triage signals over new mutation flows
- do not convert legal or finance controls into dispute settings
- optimize for daily admin usefulness, not architectural purity

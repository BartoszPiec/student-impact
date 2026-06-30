# Operations Triage Plan

This file defines the next audit batch after commission editing landed in admin.

## Goal

Identify the highest-ROI operational improvements for admin triage surfaces without adding speculative workflows.

## Scope

Focus on existing read-mostly panels:
- `/app/admin/disputes`
- `/app/admin/vault`

## Why This Batch

Current state:
- finance read surfaces are in place
- analytics are saturated on current data foundations
- commission editing is now available inline on offers and system services

Operational admin gaps now likely sit in:
- dispute triage usability
- document / contract audit usability

## What Should Be Audited

### 1. Disputes Panel

Questions:
- whether `disputes` needs more than the current filtered contracts table
- whether missing filters, badges, or triage metadata reduce usefulness
- whether there are already enough fields in repo/DB to improve it without migrations

### 2. Vault Panel

Questions:
- whether `vault` should gain search, filtering, or sort controls
- whether document access / download actions are already sufficient
- whether the current table shape is missing obvious operational cues

### 3. Shared Operability

Questions:
- whether `disputes` and `vault` now justify a shared operational table pattern
- whether reuse would help or just slow delivery

## Desired Output

Claude should identify:
- the single highest-ROI next implementation target
- whether it belongs in `disputes`, `vault`, or shared operability
- whether it can be done without migrations

## Guardrails

- prefer additive usability over inventing new workflow states
- do not propose new disputes schema unless there is a real blocker
- do not convert legal/security controls into editable UI

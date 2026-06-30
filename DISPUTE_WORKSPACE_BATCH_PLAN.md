# Dispute Workspace Batch Plan

This file defines the admin follow-up batch after dispute triage landed.

## Goal

Move `/app/admin/disputes` from passive triage into contextual action by letting admin open the related workspace directly from each dispute row.

## Why This Batch

Current state:
- disputes already surface stale-age and last movement
- finance consolidation remains trigger-based and lower ROI
- admin still cannot move directly from a dispute row into the workspace where the case context lives

## Scope

### 1. Workspace Linkage

Use existing contract fields:
- `application_id`
- `service_order_id`

Rule:
- if `application_id` exists, link to `/app/deliverables/[application_id]`
- otherwise use `service_order_id`

### 2. Disputes Table

Add a row-level action:
- `Otworz workspace`

The action should:
- work without new schema
- avoid new mutation logic
- act as admin handoff into the existing operational surface

### 3. Keep Finance Consolidation Deferred

This batch should not:
- rename finance URLs
- touch `payouts` or `pit` revalidation logic
- mix structural cleanup with dispute operability

## Desired Next Audit

After this batch, Claude should evaluate:
- whether disputes now need richer context inside the row
- or whether the next ROI has shifted back to finance workflows

## Guardrails

- no new migrations
- no new dispute statuses
- no speculative admin mutation workflow
- prioritize safe navigation into existing case context

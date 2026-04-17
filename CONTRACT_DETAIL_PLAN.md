# Contract Detail Plan

This file defines the next likely admin drill-down after `/app/admin/users/[id]` landed.

## Goal

Design the first contract-centric admin detail view without migrations and without inventing a new workflow model.

## Why This Batch

Current state:
- admin now has a user detail drill-down
- contracts are still visible mostly as list rows across:
  - `/app/admin/contracts`
  - `/app/admin/disputes`
  - `/app/admin/vault`
- the natural next question after user detail is:
  - "show me everything important about this contract in one place"

## Scope

Candidate target:
- `/app/admin/contracts/[id]`

Potential data sources already in repo:
- `contracts`
- `contract_documents`
- `invoices`
- `payouts`
- `pit_withholdings`
- `milestones`
- participant profile joins

## What Should Be Audited

### 1. Minimal Safe Contract Context

Claude should verify what is already available without migrations:
- parties
- status and terms state
- total amount and commission
- milestones
- documents / invoices
- payouts / PIT linkage

### 2. Entry Points

Claude should determine where the new detail view should be linked from first:
- `/app/admin/contracts`
- `/app/admin/disputes`
- `/app/admin/vault`

### 3. First Version Shape

Claude should recommend whether the first version should prioritize:
- summary + tabs
- summary + stacked sections
- summary + finance/legal blocks

## Guardrails

- no migrations unless there is a real blocker
- do not turn contract detail into a mutation-heavy cockpit in v1
- prefer read-first context aggregation over workflow invention

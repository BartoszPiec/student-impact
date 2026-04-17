# Phase A Implementation Plan

This file defines the next implementation batch after Batch C3 shell cleanup.

## Batch Name

Phase A - Admin Panels: Users, Contracts, Disputes

## Goal

Add the first ZIP admin panels on top of the now-canonical admin shell, without introducing new schema work unless a confirmed blocker appears.

## Confirmed Repo Baseline

Admin shell prerequisites already done:
- canonical `/app/admin` exists
- `AdminNav` exists for desktop and mobile
- current admin route map is stabilized

Confirmed data baseline:
- `contracts.status` supports `disputed` and `cancelled`
- `contracts.commission_rate` exists and is the finance source of truth
- `profiles` is already used as the central role/user table across the app

## Scope

In scope:
- `app/app/admin/users/page.tsx`
- `app/app/admin/contracts/page.tsx`
- `app/app/admin/disputes/page.tsx`
- navigation updates in `components/admin/admin-nav.tsx`

Out of scope:
- new migrations by default
- deep edit flows
- admin actions for bulk mutations
- settings panel
- Phase B finance subtree

## Implementation Decisions

1. `users` is a read-first panel backed by `profiles`
2. `contracts` is a read-first panel backed by `contracts`
3. `disputes` starts as a filtered contracts view, not a new table
4. no new URL restructuring inside `/app/admin/*`
5. use server components with `createClient()` and existing admin layout guard

## Panel Specs

### 1. Users Panel

Route:
- `/app/admin/users`

Primary data:
- `profiles`

Recommended columns:
- `user_id`
- `role`
- `public_name`
- `imie`
- `nazwisko`
- `created_at`

Recommended UX:
- table view
- role filter: all / student / company / admin
- sort by newest first
- empty state

Notes:
- keep it read-only in Phase A
- if `public_name` is null, fall back to `imie + nazwisko` or email if already available without extra complexity

### 2. Contracts Panel

Route:
- `/app/admin/contracts`

Primary data:
- `contracts`

Recommended columns:
- `id`
- `status`
- `terms_status`
- `commission_rate`
- `total_amount`
- `created_at`
- `company_id`
- `student_id`

Recommended enrichments if low-risk:
- `company_profiles.nazwa`
- `student_profiles.public_name`
- linked offer title through applications where available

Recommended UX:
- status filter
- commission display as percent
- newest first
- compact summary cards optional, not required

Notes:
- keep `contracts.commission_rate` visible because it is now the canonical finance baseline

### 3. Disputes Panel

Route:
- `/app/admin/disputes`

Primary data:
- `contracts`

Definition for Phase A:
- show contracts where `status IN ('disputed', 'cancelled')`

Recommended columns:
- `id`
- `status`
- `terms_status`
- `created_at`
- `total_amount`
- `commission_rate`
- `company_id`
- `student_id`

Recommended UX:
- tab or filter split: disputed / cancelled / all flagged
- reuse contracts-table pattern where possible

Notes:
- do not create a new `disputes` table in Phase A
- treat this as operational/admin triage surface first

## Proposed Execution Order

### Step 1 - Shared Pattern

- align visual pattern with existing admin pages
- decide whether `users`, `contracts` and `disputes` should share a small table helper or stay independent in Phase A
- prefer simple independent pages first if helper extraction slows delivery

### Step 2 - Users

- implement `/app/admin/users`
- add nav link in `components/admin/admin-nav.tsx`
- verify build

### Step 3 - Contracts

- implement `/app/admin/contracts`
- add nav link
- verify build

### Step 4 - Disputes

- implement `/app/admin/disputes` as filtered contracts view
- add nav link
- verify build

### Step 5 - Final Pass

- run full build
- verify route visibility in admin nav
- update `SPRINT_LIVE_BOARD.md`

## Risks

- profile display fields may be inconsistent across user types
- contract joins can get noisy if we over-enrich the first version
- duplicating a table UI three times is acceptable in Phase A, but only if it keeps delivery simple

## Validation

Required:
- `cmd /c npm run build`
- admin nav shows all new routes
- `/app/admin/users` loads
- `/app/admin/contracts` loads
- `/app/admin/disputes` loads

Nice to have:
- manual smoke check that filters behave as expected

## Definition Of Done

Phase A is done when:
- all 3 routes exist
- all 3 routes are discoverable from admin nav
- no migration was needed
- build passes
- live board is updated

# Sprint Command Center - 2026-03-26

This file is the operating baseline for the new sprint.
It is meant to keep Codex, Claude and Antigravity aligned.

## Coordination Files

Use these as the sprint operating stack:

- `SPRINT_LIVE_BOARD.md` - canonical live status
- `CLAUDE_COLLAB_INSTRUCTIONS.md` - onboarding and communication contract for Claude
- `CHAT_REPORT_TEMPLATES.md` - reporting formats
- this file - strategic baseline and priorities

## Current Baseline

- Branch baseline: `codex/predeploy-backup-20260324`
- Closeout commit: `b3c11d6`
- Local build: `npm run build` PASS
- Previous UX polish sprint: CLOSED
- Vercel pipeline: NOT an active blocker anymore
- Finance source of truth: `contracts.commission_rate`

## Still Pending Before Product Work

These are operational tasks, not repo blockers, but they should be treated as Sprint Step 0:

1. Apply `supabase/migrations/20260325203000_admin_accounting_analytics_v1.sql`
2. Apply `supabase/migrations/20260325210000_variable_commission_model_v1.sql`
3. Verify DB/runtime parity after apply

Do not start wide product work before this parity check is done.

## What Already Exists In Repo

Admin area already exists and is role-guarded in:
- `app/app/admin/layout.tsx`

Live admin/product modules already in repo:
- `app/app/admin/analytics`
- `app/app/admin/offers`
- `app/app/admin/payouts`
- `app/app/admin/exports`
- `app/app/admin/pit`
- `app/app/admin/system-services`
- `app/app/admin/vault`

Accounting and commission foundations already exist in repo:
- `supabase/migrations/20260324210000_accounting_layer.sql`
- `supabase/migrations/20260325203000_admin_accounting_analytics_v1.sql`
- `supabase/migrations/20260325210000_variable_commission_model_v1.sql`
- `lib/commission.ts`

Claude also left a separate worktree with extra admin-related work in:
- `.claude/worktrees/beautiful-pascal`

Treat that worktree as reference material, not as merged truth.

## Evidence-Based Access Map

This section is based on repo state, shared-chat history and handoff artifacts.

### Codex access

- full access to the main workspace
- can implement directly in the repo
- can read the shared chat context through project files and Supabase-backed chat data
- should remain the single integration point for mainline changes

### Claude access

- has a separate local worktree in `.claude/worktrees/beautiful-pascal`
- previously worked through the shared coordination chat
- is strongest when reading repo state, comparing spec vs code, writing audits and preparing handoffs

Practical meaning:
- Claude can help most with audits, plan reviews, spec comparison and safe verification
- Claude should not be treated as the source of truth for merged app state until a change is ported into the main workspace

### Antigravity access

Based on prior sprint evidence, Antigravity was used for:
- Supabase migration/apply work
- Stripe / ledger / payout paths
- runtime drift checks
- Vercel / deployment-side verification

Practical meaning:
- Antigravity is best used for DB, RPC, accounting and ops-heavy tasks
- Antigravity should be used as planner/verifier/implementer for isolated finance or infrastructure slices, not for broad UI batches

## Gap vs ZIP Specs

The ZIP describes a much larger target than the current repo state.

Main missing areas:
- no `/app/admin/users`
- no `/app/admin/contracts`
- no `/app/admin/disputes`
- no `/app/admin/settings`
- no `/app/admin/finance/*` structure from the spec
- no event-tracking layer like `analytics_events`
- no real funnel/cohort/retention/path/live analytics stack

Conclusion:
- current repo has an admin MVP foundation
- ZIP is a phase-based expansion plan, not something already implemented

## Sprint Priorities

### Priority 1 - Code Optimization

Focus first on cleanup with high ROI and low product risk:

1. Remove or lock down debug/test surfaces
2. Reduce repo noise and dead branches of implementation
3. Normalize finance field usage (`*_minor` vs old amount fields)
4. Break down oversized pages/actions with the highest churn
5. Remove duplicate or orphaned admin entry points

Known cleanup hotspots:
- `app/app/debug*`
- `app/test-ceidg`
- `app/sentry-example-page`
- `app/api/sentry-example-api`
- `app/app/seed-benchmark`
- `app/app/chat/_actions.ts`
- `app/app/deliverables/_actions.ts`
- `app/app/profile/page.tsx`
- `app/app/company/packages/page.tsx`
- `app/app/admin/dashboard/page.tsx` vs newer admin routes
- repo-root `test-api-negotiation.ts`
- repo-root `test-e2e-api.ts`

Recommended cleanup batching:

Quick wins:
- remove or gate dev/test/example routes
- remove debug traces from user-facing offer flow
- keep `.claude/worktrees/` out of main git noise
- decide whether orphaned admin dashboard stays or goes

Safe removals:
- unused example pages and ad-hoc root test files
- duplicated Supabase client helpers if truly equivalent
- packages with no repo usage after verification

Refactors:
- centralize admin auth/service-role helpers
- split oversized action files and state-heavy pages
- reduce lint debt starting from the highest-error clusters

### Priority 2 - Security Hardening

Security work should focus on real runtime risk, not generic checklisting:

1. Lock down privileged finance RPC execution paths
2. Lock down notification creation and outbound mail abuse paths
3. Lock down document/invoice inserts for non-admin users
4. Verify all admin routes/actions require admin on the server path
5. Review public debug/test routes and shut down anything not needed
6. Review remaining storage and export endpoints for least-privilege access

Immediate security triage from repo review:

Critical:
- `SECURITY DEFINER` finance RPCs appear to lack explicit caller authorization in `supabase/migrations/20260324220000_unification_hardening_phase_a.sql`

High:
- `create_notification` appears callable in a way that can target arbitrary users, which becomes much worse if the notifications webhook is live
- RLS for `contract_documents` and `invoices` appears to allow inserts that should be restricted to trusted actors

Security implementation rule for this sprint:
- fix permission model first
- only then build more admin/accounting surface area on top of it

### Priority 3 - Panels From ZIP

Build these in phases, on top of the existing foundation:

Phase A:
- unify admin shell/navigation
- promote one canonical admin landing page
- add `users`, `contracts`, `disputes`

Phase B:
- add finance module structure
- ledger view
- invoices view
- accounting periods / payout batches

Phase C:
- add analytics event pipeline
- add funnel pages
- add revenue/quality/user analytics

Do not start with advanced live analytics before event tracking exists.

## Team Operating Model

### Codex

Owner of the sprint.

Responsibilities:
- final prioritization
- implementation in the main workspace
- integration of findings from other chats
- build verification
- final go/no-go decisions per batch

### Claude

Best use:
- planning
- verification
- UX / flow / security audits
- structured handoff reports
- reading the separate Claude worktree and comparing it to main repo

Claude should avoid implementing in the same file scope that Codex is actively editing.
Claude is strongest as planner + verifier + reporter.

### Antigravity

Best use:
- Supabase / SQL / migration apply
- Stripe / payout / ledger / accounting validation
- environment and deployment checks
- drift checks between repo and database/runtime

Antigravity should avoid broad UI work unless explicitly assigned.
It is best used for DB/ops/finance-heavy slices.

## Required Workflow For Major Changes

For new features, migrations and large refactors:

1. Planner prepares the plan
2. Verifier reviews the plan
3. Codex approves or sends back corrections
4. Only then implementation starts

Suggested assignment:
- UI/panel feature: Claude plans, Antigravity verifies, Codex implements
- DB/finance feature: Antigravity plans, Claude verifies, Codex implements/integrates
- Security hardening: Claude plans, Antigravity cross-checks DB/runtime, Codex executes

## First Recommended Execution Order

1. DB apply + parity verification
2. security triage on RPC/RLS notification/document flows
3. cleanup pass for debug/test/orphaned admin surfaces
4. canonical admin shell + route map
5. users/contracts/disputes panels
6. finance submodule structure
7. analytics event pipeline

## Definition Of Done For This Sprint

This sprint is done when:

- DB parity is confirmed
- cleanup removes the highest-risk repo noise
- security review findings are either fixed or explicitly deferred
- admin panel has one canonical information architecture
- ZIP panels are being added on top of stable data sources, not duplicate logic
- every major batch has a short written report in the agreed template

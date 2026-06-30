# Sprint Closeout - 2026-03-26

This document is the concise handoff baseline for starting the next sprint in a new chat.

## Sprint Status

- Repo status: ready for sprint closure
- Build status: `npm run build` passes locally
- Branch: `codex/predeploy-backup-20260324`
- Team sync: Claude received baseline correction on the internal chat

## What Was Closed

### 1. Release / deployment recovery

- Vercel auto-deploy was unblocked by fixing the Hobby cron schedule mismatch in `vercel.json`
- Preview and production deployments resumed reacting to new commits
- "Vercel pipeline broken" is no longer an active blocker for the next sprint baseline

### 2. Core app-flow and UX polish

- `/app/auth` now redirects to `/auth`
- landing/auth/onboarding/jobs/profile/services/chat/notifications received targeted polish
- jobs list supports a server-side limit and "Pokaż więcej ofert"
- profile and service flows now provide clearer success feedback
- job creation has stronger server-side validation

### 3. Finance / accounting hardening

- active Stripe flows use resolved commission instead of assuming a fixed 5%
- checkout, verify-payment, and webhook all use the new commission-aware path
- deliverables invoice generation reads actual payout values instead of recomputing 5%
- admin analytics uses accounting-backed data instead of heuristic `* 0.05` estimates
- legal clauses no longer state that the platform fee is always 5%

### 4. Variable commission model

Current repo default mapping:

- standard application/job: `10%`
- micro / service order: `15%`
- platform/system service: `20%`

Primary source files:

- `lib/commission.ts`
- `supabase/migrations/20260325210000_variable_commission_model_v1.sql`

The intended runtime source of truth is `contracts.commission_rate`.

## Still Pending (Operational, Not Repo-Blocking)

- Apply `supabase/migrations/20260325203000_admin_accounting_analytics_v1.sql`
- Apply `supabase/migrations/20260325210000_variable_commission_model_v1.sql`
- Verify DB/runtime parity after migration apply

These are the main items to pick up first in the next sprint.

## Non-Blocking Warnings

- `baseline-browser-mapping` is outdated
- telemetry dependency warning around `import-in-the-middle`

These do not currently block build or sprint closure.

## Guardrails For The Next Sprint

- Do not reopen already-closed UX polish work unless a new bug is confirmed
- Do not treat old historical `0.05` literals in superseded migrations as the active model
- Ignore `.claude/worktrees/` as workspace noise
- Start from DB apply + parity verification before launching into new product changes

## Recommended First Task In The New Chat

1. Apply pending accounting/commission migrations
2. Verify DB parity
3. Confirm or refine the business commission matrix
4. Only then begin the next product sprint

# Handover for Claude: Sprint Closure and Next-Sprint Baseline

This file is the current repo-side source of truth for closing the previous sprint and starting the next one without reopening resolved work.

## 1. Current State

- Build status: `npm run build` passes locally.
- Release pipeline: Vercel auto-deploy was unblocked by correcting the Hobby cron schedule in `vercel.json`.
- UX polish: the main student/company journey received multiple low-risk fixes across landing, auth, onboarding, jobs, profile, services, chat, notifications, and offer creation.
- Accounting/admin analytics: repo contains a new analytics layer over accounting data.
- Variable commission model: repo now supports commission rates that depend on engagement type instead of a fixed 5%.

## 2. Closed / Verified Areas

### App flow and UX

- `/app/auth` now redirects cleanly to `/auth`.
- Student jobs list shows only published offers.
- Profile save flow has success feedback instead of silent revalidation.
- Jobs list supports a server-side limit plus "Pokaż więcej ofert".
- Company job creation has stronger server-side validation.
- Service creation/update flow supports success feedback and cleaner validation.
- Chat and notifications got empty-state and copy improvements.

### Finance and accounting

- `process_stripe_payment_v4`, checkout, verify-payment, and webhook flows now use resolved commission instead of assuming a flat fee.
- Deliverables invoice generation reads the real payout values instead of recomputing a fixed 5%.
- Admin analytics no longer estimates revenue with `* 0.05`.
- Contract/legal copy no longer claims that the platform fee is always 5%.

## 3. Commission Model (Current Assumption)

Current repo defaults are:

- standard application/job: `10%`
- micro / service order: `15%`
- platform service / system service: `20%`

Source files:

- `lib/commission.ts`
- `supabase/migrations/20260325210000_variable_commission_model_v1.sql`

The contract-level `commission_rate` is intended to be the frozen source of truth for financial processing.

## 4. Pending Operational Steps

These are not repo blockers, but they are still pending execution:

- Apply `supabase/migrations/20260325203000_admin_accounting_analytics_v1.sql`
- Apply `supabase/migrations/20260325210000_variable_commission_model_v1.sql`
- Verify DB/runtime parity after apply

Until those migrations are applied, the repo-side model is ready, but the database may not expose the new analytics and variable commission columns/functions everywhere yet.

## 5. Non-Blocking Known Warnings

- `baseline-browser-mapping` package age warnings during build
- `import-in-the-middle` version mismatch warnings in telemetry dependencies

These are currently non-blocking and should not be escalated as product regressions.

## 6. Important Guardrails for the Next Sprint

- Do not reopen the previous "fixed 5%" assumption as if it were still the active runtime model.
- Do not treat old historical migrations with `0.05` literals as the current source of truth if they are superseded by newer accounting/commission logic.
- Ignore `.claude/worktrees/` as non-product workspace noise.
- Prefer verification of DB apply / environment parity over rewriting already-closed UI polish work.

## 7. Recommended Starting Point for the New Sprint

Start from one of these, in order:

1. Apply and verify the two pending accounting/commission migrations.
2. Confirm environment parity for preview/production.
3. Define the exact business matrix for which engagement types should use `10%`, `15%`, or `20%` if the defaults need refinement.
4. Only then move into new product work.

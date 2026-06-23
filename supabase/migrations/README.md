# supabase/migrations - Source of Truth

## Process rule

Every database change must exist as a SQL file in the repo before, or at the same time as, apply.

```
BAD:  apply in DB first, write file later
GOOD: write .sql file -> commit -> apply -> verify
```

If something was changed directly in DB without a file, stop and backfill the repo immediately.

## Naming

```
YYYYMMDDHHMMSS_descriptive_name.sql
```

Example:

```
20260324190312_security_hardening_rls_privilege_escalation.sql
```

## Current production status

State as of 2026-06-20:

- local migration versions: `104`
- remote migration versions: `104`
- local-only versions: `0`
- remote-only versions: `0`
- remote dry-run result: `Remote database is up to date.`
- production readiness RPC: no missing critical tables, functions, or RLS coverage

### 2026-06-20 reconciliation

The repository and the linked official Supabase project were reconciled in this
order:

1. Fetched 44 historical remote migration files that had been applied outside
   the current repository history.
2. Archived 22 ambiguous eight-digit legacy migration files under
   `supabase/_archive/legacy-migrations/`; they are no longer part of the CLI
   migration pipeline.
3. Repaired 24 migration-history versions only after checking that their schema,
   RLS, RPC, constraint, or data effect already existed remotely.
4. Applied and verified the five genuinely missing migrations:

| Version | Name | DB status |
|---|---|---|
| 20260418121500 | sync_service_package_price_bounds_from_variants | APPLIED |
| 20260418195500 | deduplicate_conversations_and_enforce_uniques | APPLIED |
| 20260418224000 | sync_platform_offer_pricing_from_packages | APPLIED |
| 20260509103000 | pilot_mvp_chat_and_conversation_constraints | APPLIED |
| 20260614110000 | security_audit_hardening | APPLIED |

Preflight found no duplicate rows requiring deletion. Postflight confirmed zero
duplicate groups, zero package price-bound mismatches, private document buckets,
the canonical profile SELECT policy set, and no production-readiness findings.

## Historical production-facing migration groups

State originally recorded on 2026-03-24; statuses below reflect the reconciled
2026-06-20 production history.

### Security / ledger hardening

| Version | Name | DB status |
|--------|------|-----------|
| 20260324172434 | harden_storage_rls_v2 | APPLIED |
| 20260324173450 | harden_ledger_idempotency_v1 | APPLIED |
| 20260324173500 | harden_ledger_refund_rpc_v1 | APPLIED |
| 20260324173518 | harden_ledger_refund_index_v1 | APPLIED |
| 20260324190312 | security_hardening_rls_privilege_escalation | APPLIED |
| 20260324190429 | security_hardening_storage_and_financial_tables | APPLIED |
| 20260324190650 | fix_stripe_refund_idempotency_and_accounting_rls | APPLIED |

### Amount minor / accounting scale (Phase A)

| Version | Name | DB status |
|--------|------|-----------|
| 20260324195154 | financial_ledger_unit_unification_v1 | APPLIED |
| 20260324195248 | payouts_platform_fee_minor_v1 | APPLIED |
| 20260324195327 | apps_and_orders_unit_unification_v1 | APPLIED |
| 20260324195341 | pit_withholdings_unit_unification_v1 | APPLIED |
| 20260324195427 | accounting_scale_tables_v1 | APPLIED |
| 20260324195523 | accounting_materialized_views_v2 | APPLIED |
| 20260324204443 | unification_hardening_phase_a | APPLIED |

### Accounting analytics / reporting

| Version | Name | DB status |
|--------|------|-----------|
| 20260325203000 | admin_accounting_analytics_v1 | APPLIED |
| 20260325210000 | variable_commission_model_v1 | APPLIED |

## Drift status

### Resolved on 2026-03-24

#### DRIFT-01 - applications policies
- Legacy policies were removed by `20260324221000_fix_database_drifts.sql`
- Canonical `applications_update_company` is explicitly captured in `20260324223000_canonicalize_applications_update_company.sql`

#### DRIFT-02 - deliverables bucket limits
- `file_size_limit = 104857600`
- `allowed_mime_types` set in `20260324221000_fix_database_drifts.sql`

#### DRIFT-03 - refund index cleanup
- Redundant `idx_ledger_stripe_refund_v3` removed in `20260324221000_fix_database_drifts.sql`

## Applications policy source of truth

The effective applications policy set is defined by:

- `supabase/release-2025-12-20.sql`
- `supabase/backfill_applications_policy.sql`
- `supabase/migrations/20260324221000_fix_database_drifts.sql`
- `supabase/migrations/20260324223000_canonicalize_applications_update_company.sql`

Any future policy cleanup must update this section.

## Rollback rule

Rollback means a new reversing migration.

Do not use destructive resets such as `supabase db reset` on shared environments.

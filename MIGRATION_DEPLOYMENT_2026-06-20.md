# Supabase migration reconciliation — 2026-06-20

## Outcome

The repository migration history and the linked official Supabase project are
fully aligned: 104 local versions and 104 remote versions, with no local-only or
remote-only entries.

## Executed plan

1. Inventoried canonical migrations, archived SQL, Git branches, Claude notes,
   Codex notes, and the linked Supabase migration table.
2. Restored missing migration source files from the remote history table.
3. Moved 22 repeated eight-digit legacy files out of the deployable pipeline.
4. Verified remote effects before repairing 24 manually applied migration
   versions in `supabase_migrations.schema_migrations`.
5. Ran a dry-run that returned exactly five missing migrations.
6. Applied those five migrations in timestamp order.
7. Re-ran history parity, schema/RLS/RPC checks, duplicate checks, pricing
   checks, and `production_readiness_report_v1()`.

## Applied migrations

- `20260418121500_sync_service_package_price_bounds_from_variants.sql`
- `20260418195500_deduplicate_conversations_and_enforce_uniques.sql`
- `20260418224000_sync_platform_offer_pricing_from_packages.sql`
- `20260509103000_pilot_mvp_chat_and_conversation_constraints.sql`
- `20260614110000_security_audit_hardening.sql`

Before deployment, the security migration was corrected to remove all legacy
profile SELECT policies regardless of historical names, remove the active public
offer-attachment read policy, and preserve strict deliverables upload checks.

## Verification evidence

- Supabase dry-run: remote database up to date.
- Migration history: local `104`, remote `104`, differences `0/0`.
- Duplicate groups: conversations, saved offers, and reviews all `0`.
- Package variant price mismatches: `0`.
- Open platform offers missing price or commission: `0`.
- Production readiness: no missing critical tables, missing functions, or RLS
  issues.
- Security checks: canonical profile policies and public views exist; four
  sensitive buckets are private; PIT calculation RPC is service-role only.

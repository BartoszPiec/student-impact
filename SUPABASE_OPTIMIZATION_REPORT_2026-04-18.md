# Supabase Optimization Report - 2026-04-18

## Scope
- Full audit of live Supabase public schema exposure (tables, foreign-key map, row counts).
- Check for duplicated business records and split source-of-truth fields.
- Deploy safe live cleanup where possible through REST (service role).
- Prepare persistent migration + app-level hardening to prevent future duplication.

## Access Confirmation
- Live Supabase connectivity was confirmed via service-role REST calls on 2026-04-18.
- Read + write data operations were available (select/update/delete on public tables).
- Direct DDL execution was not available through the current runtime path (no direct SQL execution endpoint/CLI credentials in this session), so schema hardening is prepared as a migration file in repo.

## Before (Snapshot)
- `conversations`: 39 rows.
- `messages`: 305 rows.
- Detected invalid duplicate/self conversations:
  - `97f5f704-a036-44fd-8efc-fa5f6fa9197a`
  - `9e6cfaa7-850e-4be0-8564-d2120c14fb62`
  - `1b4c278e-8d33-435c-85fc-bacb6c4da6c6`
- All three above were `type='inquiry'`, `company_id = student_id`, no `application_id`, no `service_order_id`, no `offer_id`, no `package_id`, and no messages.
- Additional consistency checks passed (no mismatches):
  - `applications.agreed_stawka` vs `agreed_stawka_minor`
  - `service_orders.agreed_amount` vs `agreed_amount_minor`
  - `contracts.total_amount` vs `total_amount_minor`
  - payout/PIT numeric + minor columns
  - no duplicates for `conversations.application_id`, `conversations.service_order_id`, `saved_offers(student_id,offer_id)`, `reviews(context,reviewer)`

## Live Changes Applied
- Deleted the 3 invalid self-chat conversation rows listed above directly on live Supabase.

## After (Snapshot)
- `conversations`: 36 rows.
- `messages`: 305 rows (unchanged).
- `self_chats_after`: 0.
- `dup_conversations_application_after`: 0.
- `dup_conversations_service_order_after`: 0.
- `dup_saved_offers_after`: 0.
- `dup_reviews_application_reviewer_after`: 0.
- `dup_reviews_service_order_reviewer_after`: 0.

## Code Hardening Introduced
- Idempotent conversation creation switched from `insert` to `upsert` on canonical process keys (`application_id` or `service_order_id`) in critical flows:
  - `app/app/applications/_actions.ts`
  - `app/app/cancel/[id]/_actions.ts`
  - `app/app/chat/_actions.ts`
  - `app/app/company/applications/_actions.ts`
  - `app/app/company/packages/_actions.ts`
  - `app/app/offers/[id]/_actions.ts`
  - `app/app/orders/create/[packageId]/_actions.ts`
  - `app/app/services/_actions.ts`
- Saved offers write path made idempotent (`upsert` with `onConflict`) in:
  - `app/app/offers/[id]/saved-actions.ts`
- Added guard against ordering own service package in:
  - `app/app/orders/create/[packageId]/_actions.ts`
  - `app/app/company/packages/_actions.ts`

## Migration Prepared (Schema-Level Protection)
- File:
  - `supabase/migrations/20260418195500_deduplicate_conversations_and_enforce_uniques.sql`
- What it does:
  1. Cleans legacy empty self-inquiry conversations.
  2. Deduplicates conversations by `application_id` and `service_order_id` (relinks messages to canonical thread before delete).
  3. Deduplicates `saved_offers` and `reviews` by business key.
  4. Adds check constraint to block self-participant conversations.
  5. Adds unique indexes to block future duplicate writes for:
     - `conversations(application_id)` (not null)
     - `conversations(service_order_id)` (not null)
     - `saved_offers(student_id, offer_id)`
     - `reviews(application_id, reviewer_id)` (not null)
     - `reviews(service_order_id, reviewer_id)` (not null)

## Additional Optimization (Price Source-of-Truth)
- Problem:
  - System/service package price can drift from copied `offers.stawka` when package price changes later.
  - One creation path for system offers did not persist `service_package_id`, which blocked safe package-to-offer sync.
- Code fix applied:
  - `app/app/services/_actions.ts`
    - `createOfferFromSystemPackage` now saves:
      - `service_package_id`
      - `typ: "projekt"`
- New migration prepared:
  - `supabase/migrations/20260418224000_sync_platform_offer_pricing_from_packages.sql`
  - Adds:
    1. `BEFORE INSERT/UPDATE` trigger on `offers` to auto-fill missing `stawka` and `commission_rate` from linked `service_packages` for platform offers.
    2. `AFTER UPDATE` trigger on `service_packages` to propagate `price` and `commission_rate` into linked open/public platform offers **only when offer values were still derived from the old package values** (safe guard for custom/variant pricing).
    3. Safe backfill for null `offers.stawka` / null `offers.commission_rate` on linked platform offers.
    4. Support index on `offers(service_package_id)` for platform-sync updates.
- Live diagnostic snapshot (2026-04-18):
  - `MISSING_SERVICE_PACKAGE_ID_COUNT` (for `is_platform_service=true`): `0`
  - `PLATFORM_LINKED_OFFERS`: `6`
  - `OPEN_PLATFORM_LINKED_OFFERS` (`published|active|draft`, non-private): `0`
  - `PRICE_DRIFT_OPEN_COUNT`: `0`

## Rollback / Recovery Notes
- Data cleanup rollback for deleted conversation rows requires restoring from backup/PITR (the deleted rows had no messages and no business links).
- App-level changes can be reverted by restoring the modified files listed above.
- Schema rollback should be done as a new reverse migration (drop added indexes/constraint), not by reset.

## Deployment Note
- Live data cleanup was executed.
- Schema-level migrations are ready in repo and should be applied in your normal Supabase migration pipeline to fully enforce protections at DB level:
  - `20260418195500_deduplicate_conversations_and_enforce_uniques.sql`
  - `20260418224000_sync_platform_offer_pricing_from_packages.sql`

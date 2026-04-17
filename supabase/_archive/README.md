# Supabase Root SQL Archive

This folder stores historical ad-hoc SQL scripts that are **not** part of the Supabase migration pipeline.

## What belongs in migrations

Only timestamped files in `supabase/migrations/` matching:

`<timestamp>_name.sql`

are considered deployable migrations.

## Why this archive exists

Over time, many one-off scripts (CHECK/FIX/DEBUG/FORCE/AUTO_FIX) accumulated in `supabase/` root.
Keeping them in root increases drift/audit risk and may be confused with real migrations.

## Kept in root intentionally

The following root files remain as reference entrypoints:

- `supabase/release.sql`
- `supabase/release-2025-12-20.sql`
- `supabase/COMPLETE_DB_SETUP.sql`

Everything else was moved here for historical traceability.
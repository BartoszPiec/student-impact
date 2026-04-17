# AUDIT RLS STATUS

Date: 2026-04-17  
Environment: linked Supabase project `klxsxtumrkxfdrkessrg`

## Query used

```sql
SELECT t.tablename, t.rowsecurity, COALESCE(p.policy_count,0) AS policy_count
FROM pg_tables t
LEFT JOIN (
  SELECT tablename, COUNT(*)::int AS policy_count
  FROM pg_policies
  WHERE schemaname='public'
  GROUP BY tablename
) p ON p.tablename=t.tablename
WHERE t.schemaname='public'
ORDER BY t.rowsecurity, t.tablename;
```

## Snapshot

| Table | RLS enabled | Policy count |
|---|---:|---:|
| invoice_counters | false | 0 |
| accounting_accounts | true | 1 |
| accounting_entries | true | 2 |
| accounting_journals | true | 1 |
| accounting_ledger_items | true | 1 |
| accounting_periods | true | 1 |
| applications | true | 6 |
| audit_log | true | 1 |
| company_profiles | true | 9 |
| company_reviews | true | 2 |
| contract_documents | true | 2 |
| contract_term_versions | true | 1 |
| contracts | true | 1 |
| conversations | true | 4 |
| deliverables | true | 7 |
| disputes | true | 1 |
| draft_versions | true | 1 |
| education_entries | true | 4 |
| event_inbox | true | 1 |
| experience_entries | true | 3 |
| financial_ledger | true | 5 |
| invoices | true | 1 |
| messages | true | 4 |
| milestone_drafts | true | 1 |
| milestone_snapshots | true | 1 |
| milestone_versions | true | 2 |
| milestones | true | 2 |
| notifications | true | 2 |
| offers | true | 9 |
| payment_intents | true | 1 |
| payments | true | 5 |
| payout_batches | true | 1 |
| payouts | true | 1 |
| pit_annual | true | 2 |
| pit_withholdings | true | 2 |
| profiles | true | 3 |
| project_resources | true | 3 |
| project_secrets | true | 3 |
| reviews | true | 3 |
| saved_offers | true | 6 |
| service_orders | true | 9 |
| service_packages | true | 7 |
| student_profiles | true | 5 |

## Action taken

- Added migration `20260417101000_enable_rls_all_tables.sql`:
  - enables RLS for any `public` table with `rowsecurity=false`
  - adds deny-all policy for `invoice_counters` (`SECURITY DEFINER` RPC access only)

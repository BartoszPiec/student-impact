# Runbook: 20260509114500_system_service_milestone_templates

## Cel
Bezpieczne wdrożenie migracji szablonów milestone'ów dla `service_orders` systemowych bez uszkodzenia istniejących zamówień.

## Preflight (remote, read-only)
1. Policz:
   - `service_orders` bez milestone'ów,
   - `service_orders.variant_key IS NULL` (lub brak kolumny),
   - kontrakty `active/in_progress` bez milestone'ów.
2. Sprawdź dane ryzykowne:
   - `service_orders` bez `student_id`,
   - `service_orders` bez `package_id`,
   - rekordy runtime (`accepted/completed/in_progress/active`) bez milestone'ów.

## Decyzja wdrożeniowa
Wdrażaj tylko jeśli:
- brak kontraktów `active/in_progress` bez milestone'ów,
- brak braków integralności (`package_id` references),
- ewentualne braki milestone'ów dotyczą głównie statusów przed-kontraktowych.

## Wdrożenie (kontrolowane)
1. Uruchom plik migracji:
   - `supabase db query --linked -f supabase/migrations/20260509114500_system_service_milestone_templates.sql`
2. Zarejestruj wersję:
   - `supabase migration repair --status applied 20260509114500`

## Backfill (minimalny, bezpieczny)
Backfill tylko dla rekordów runtime:
- `status in ('accepted','completed','in_progress','active')`
- `student_id IS NOT NULL`
- brak milestone'a (`contract_id IS NULL` lub brak milestone dla contract_id)

Akcja:
- `ensure_contract_for_service_order(service_order_id)` dla każdego rekordu spełniającego kryteria.

## Weryfikacja po wdrożeniu
1. `variant_key` istnieje na `service_orders`.
2. Powstała tabela `service_package_milestone_templates`.
3. Powstały template'y domyślne dla aktywnych pakietów system/platform.
4. Kontrakty `active/in_progress` bez milestone'ów = `0`.
5. Rekordy runtime bez milestone'ów = `0`.

## Rollback strategy
Używać wyłącznie jeśli pojawi się regresja logiczna:
1. Zatrzymaj ruch write (okno serwisowe).
2. Cofnij skutek backfillu tylko dla rekordów dotkniętych w tej rundzie:
   - usuń milestone utworzone przez backfill dla wskazanych `contract_id`,
   - odłącz `contract_id` w `service_orders`,
   - usuń kontrakty utworzone przez backfill, jeśli nie mają powiązanych płatności/dokumentów.
3. Cofnij obiekty migracji (jeśli konieczne):
   - przywróć poprzednią definicję `ensure_contract_for_service_order(uuid)`,
   - usuń polityki i tabelę `service_package_milestone_templates`,
   - usuń kolumnę `service_orders.variant_key` (tylko jeśli brak zależności runtime).
4. Oznacz migrację jako reverted:
   - `supabase migration repair --status reverted 20260509114500`

## Rekordy do manualnej naprawy (po wdrożeniu)
- Tylko rekordy ze stanem biznesowo końcowym/runtime bez studenta lub bez kontraktu.
- Rekordy przed-kontraktowe (`pending`, `proposal_sent`, `pending_selection`, `pending_student_confirmation`) nie wymagają automatycznej naprawy w tej rundzie.

-- Phase 10: PIT Withholdings minor columns
ALTER TABLE public.pit_withholdings ADD COLUMN IF NOT EXISTS amount_gross_minor bigint;
ALTER TABLE public.pit_withholdings ADD COLUMN IF NOT EXISTS amount_net_minor bigint;
ALTER TABLE public.pit_withholdings ADD COLUMN IF NOT EXISTS pit_amount_minor bigint;
ALTER TABLE public.pit_withholdings ADD COLUMN IF NOT EXISTS taxable_base_minor bigint;

UPDATE public.pit_withholdings SET
    amount_gross_minor = (amount_gross * 100)::bigint,
    amount_net_minor = (amount_net * 100)::bigint,
    pit_amount_minor = (pit_amount * 100)::bigint,
    taxable_base_minor = (taxable_base * 100)::bigint
WHERE amount_gross_minor IS NULL;
;

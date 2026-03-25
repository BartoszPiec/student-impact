-- Security Hardening: Accounting Tables RLS and Refund Index Fix
-- Reconstructed from database state to resolve repository drift

-- 1. Refund Index Fix
DROP INDEX IF EXISTS idx_ledger_stripe_refund_unique_notnull;
CREATE UNIQUE INDEX idx_ledger_stripe_refund_unique_notnull 
ON public.financial_ledger USING btree (stripe_refund_id) 
WHERE (stripe_refund_id IS NOT NULL);

-- 2. Accounting Tables RLS
ALTER TABLE public.accounting_accounts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "admin_all_accounting_accounts" ON public.accounting_accounts;
CREATE POLICY "admin_all_accounting_accounts" ON public.accounting_accounts 
FOR ALL TO authenticated 
USING (EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'admin'))
WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'admin'));

ALTER TABLE public.accounting_journals ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "admin_all_accounting_journals" ON public.accounting_journals;
CREATE POLICY "admin_all_accounting_journals" ON public.accounting_journals 
FOR ALL TO authenticated 
USING (EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'admin'))
WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'admin'));

ALTER TABLE public.accounting_entries ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "admin_all_accounting_entries" ON public.accounting_entries;
CREATE POLICY "admin_all_accounting_entries" ON public.accounting_entries 
FOR ALL TO authenticated 
USING (EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'admin'))
WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'admin'));

DROP POLICY IF EXISTS "participants_view_own_accounting_entries" ON public.accounting_entries;
CREATE POLICY "participants_view_own_accounting_entries" ON public.accounting_entries 
FOR SELECT TO authenticated 
USING (
    (reference_id IS NOT NULL) AND 
    (EXISTS (SELECT 1 FROM public.contracts c WHERE c.id = accounting_entries.reference_id AND (c.company_id = auth.uid() OR c.student_id = auth.uid())))
);

ALTER TABLE public.accounting_ledger_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "admin_all_accounting_ledger_items" ON public.accounting_ledger_items;
CREATE POLICY "admin_all_accounting_ledger_items" ON public.accounting_ledger_items 
FOR ALL TO authenticated 
USING (EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'admin'))
WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'admin'));

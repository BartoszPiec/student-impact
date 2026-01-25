-- Migration: 20260122_fix_contracts_rls.sql
-- Purpose: Allow public (or authenticated) access to Completed Contracts for Portfolio display.

-- 1. Create Policy for Public Visibility of Completed Work
CREATE POLICY "contracts_view_public_completed" ON public.contracts
FOR SELECT USING (
  status IN ('completed', 'delivered', 'accepted')
);

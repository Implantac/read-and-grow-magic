-- Hardening Wave: SECURITY DEFINER and RLS Final Polish

-- 1. Hardening SECURITY DEFINER functions (revoking EXECUTE from PUBLIC/authenticated)
-- We target known internal functions that should only be called by the system (service_role) or through controlled paths.

REVOKE EXECUTE ON FUNCTION public.recalc_bank_balance(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.recalc_bank_balance(uuid) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.recalc_bank_balance(uuid) TO service_role;

REVOKE EXECUTE ON FUNCTION public.fn_setup_new_company_fiscal() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.fn_setup_new_company_fiscal() FROM authenticated;
GRANT EXECUTE ON FUNCTION public.fn_setup_new_company_fiscal() TO service_role;

-- 2. Finalizing RLS for high-risk tables (multi-tenancy enforcement)
-- Ensuring all core tables have company_id isolation via get_user_company_id(auth.uid())

-- Bank Transactions
ALTER TABLE public.bank_transactions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "bank_transactions_select_policy" ON public.bank_transactions;
CREATE POLICY "bank_transactions_select_policy" ON public.bank_transactions FOR SELECT TO authenticated USING (company_id = get_user_company_id(auth.uid()));

-- Financial Ledger (if not already strictly enforced)
ALTER TABLE public.financial_ledger ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "financial_ledger_select_policy" ON public.financial_ledger;
CREATE POLICY "financial_ledger_select_policy" ON public.financial_ledger FOR SELECT TO authenticated USING (company_id = get_user_company_id(auth.uid()));

-- 3. Revoking Anonymous access to business-critical tables
REVOKE ALL ON public.bank_transactions FROM anon;
REVOKE ALL ON public.financial_ledger FROM anon;
REVOKE ALL ON public.production_orders FROM anon;

-- Ensuring authenticated users have minimal required access
GRANT SELECT ON public.bank_transactions TO authenticated;
GRANT SELECT ON public.financial_ledger TO authenticated;
GRANT SELECT ON public.production_orders TO authenticated;

-- Service role full access
GRANT ALL ON public.bank_transactions TO service_role;
GRANT ALL ON public.financial_ledger TO service_role;
GRANT ALL ON public.production_orders TO service_role;


-- 1. Consolidação de RLS: Stock Balances
DROP POLICY IF EXISTS "Auth users can manage own stock_balances" ON public.stock_balances;
DROP POLICY IF EXISTS "Users can see their company stock balances" ON public.stock_balances;
DROP POLICY IF EXISTS "stock_balances_isolation" ON public.stock_balances;
DROP POLICY IF EXISTS "stock_balances_tenant_select" ON public.stock_balances;
DROP POLICY IF EXISTS "stock_balances_tenant_write" ON public.stock_balances;

CREATE POLICY "stock_balances_tenant_select" ON public.stock_balances FOR SELECT TO authenticated 
USING (company_id = get_user_company_id(auth.uid()) OR check_hierarchy_access(auth.uid(), company_id));

CREATE POLICY "stock_balances_tenant_write" ON public.stock_balances FOR ALL TO authenticated 
USING (company_id = get_user_company_id(auth.uid()))
WITH CHECK (company_id = get_user_company_id(auth.uid()));

-- 2. Consolidação de RLS: Financial Ledger
DROP POLICY IF EXISTS "financial_ledger_select_policy" ON public.financial_ledger;
DROP POLICY IF EXISTS "ledger_tenant_delete" ON public.financial_ledger;
DROP POLICY IF EXISTS "ledger_tenant_insert" ON public.financial_ledger;
DROP POLICY IF EXISTS "ledger_tenant_select" ON public.financial_ledger;
DROP POLICY IF EXISTS "ledger_tenant_update" ON public.financial_ledger;

CREATE POLICY "financial_ledger_tenant_select" ON public.financial_ledger FOR SELECT TO authenticated 
USING (company_id = get_user_company_id(auth.uid()) OR check_hierarchy_access(auth.uid(), company_id));

CREATE POLICY "financial_ledger_tenant_insert" ON public.financial_ledger FOR INSERT TO authenticated 
WITH CHECK (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "financial_ledger_tenant_update" ON public.financial_ledger FOR UPDATE TO authenticated 
USING (company_id = get_user_company_id(auth.uid()) AND (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role)))
WITH CHECK (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "financial_ledger_tenant_delete" ON public.financial_ledger FOR DELETE TO authenticated 
USING (company_id = get_user_company_id(auth.uid()) AND has_role(auth.uid(), 'admin'::app_role));

-- 3. Hardening de Funções: search_path rigoroso para o linter
ALTER FUNCTION public.enforce_inventory_policy() SET search_path = public;
ALTER FUNCTION public.audit_stock_integrity(uuid) SET search_path = public;
ALTER FUNCTION public.check_operational_anomalies() SET search_path = public;
ALTER FUNCTION public.process_stock_transfer() SET search_path = public;
ALTER FUNCTION public.on_movement_status_change() SET search_path = public;
ALTER FUNCTION public.enforce_stock_ledger_immutability() SET search_path = public;
ALTER FUNCTION public.handle_updated_at() SET search_path = public;

-- 4. Revogar EXECUTE public em SECURITY DEFINER sensíveis
REVOKE EXECUTE ON FUNCTION public.audit_stock_integrity(uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.audit_stock_integrity(uuid) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.run_financial_audit(text) FROM public;
GRANT EXECUTE ON FUNCTION public.run_financial_audit(text) TO authenticated;

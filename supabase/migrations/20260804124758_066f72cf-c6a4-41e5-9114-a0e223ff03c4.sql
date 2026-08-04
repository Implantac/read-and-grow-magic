-- Global RLS Hardening (Core Tables)
-- Ensuring company_id isolation on Financial, PCP, and WMS core entities.

-- 1. Financial Ledger (Primary financial table)
DROP POLICY IF EXISTS "financial_ledger_select_policy" ON public.financial_ledger;
CREATE POLICY "financial_ledger_select_policy" ON public.financial_ledger FOR SELECT TO authenticated USING (company_id = get_user_company_id(auth.uid()));

-- 2. Stock Movements (WMS)
DROP POLICY IF EXISTS "stock_movements_select_policy" ON public.stock_movements;
CREATE POLICY "stock_movements_select_policy" ON public.stock_movements FOR SELECT TO authenticated USING (company_id = get_user_company_id(auth.uid()));

-- 3. Production Orders (PCP)
DROP POLICY IF EXISTS "production_orders_select_policy" ON public.production_orders;
CREATE POLICY "production_orders_select_policy" ON public.production_orders FOR SELECT TO authenticated USING (company_id = get_user_company_id(auth.uid()));

-- 4. Suppliers (Core)
DROP POLICY IF EXISTS "suppliers_select_policy" ON public.suppliers;
CREATE POLICY "suppliers_select_policy" ON public.suppliers FOR SELECT TO authenticated USING (company_id = get_user_company_id(auth.uid()));

-- 5. Revoke 'anon' access to sensitive tables
REVOKE ALL ON public.financial_ledger FROM anon;
REVOKE ALL ON public.stock_movements FROM anon;
REVOKE ALL ON public.production_orders FROM anon;
REVOKE ALL ON public.suppliers FROM anon;

GRANT SELECT ON public.financial_ledger TO authenticated;
GRANT SELECT ON public.stock_movements TO authenticated;
GRANT SELECT ON public.production_orders TO authenticated;
GRANT SELECT ON public.suppliers TO authenticated;

GRANT ALL ON public.financial_ledger TO service_role;
GRANT ALL ON public.stock_movements TO service_role;
GRANT ALL ON public.production_orders TO service_role;
GRANT ALL ON public.suppliers TO service_role;

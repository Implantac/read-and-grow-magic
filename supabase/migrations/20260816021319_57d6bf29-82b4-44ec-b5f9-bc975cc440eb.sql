
-- 1. Consolidação de RLS: Orders
DROP POLICY IF EXISTS "Auth users can manage own orders" ON public.orders;
DROP POLICY IF EXISTS "Authenticated users can delete orders" ON public.orders;
DROP POLICY IF EXISTS "Authenticated users can insert orders" ON public.orders;
DROP POLICY IF EXISTS "Authenticated users can read orders" ON public.orders;
DROP POLICY IF EXISTS "Authenticated users can update orders" ON public.orders;
DROP POLICY IF EXISTS "orders_tenant_delete" ON public.orders;
DROP POLICY IF EXISTS "orders_tenant_insert" ON public.orders;
DROP POLICY IF EXISTS "orders_tenant_select" ON public.orders;
DROP POLICY IF EXISTS "orders_tenant_update" ON public.orders;

CREATE POLICY "orders_tenant_select" ON public.orders FOR SELECT TO authenticated 
USING (company_id = get_user_company_id(auth.uid()) OR check_hierarchy_access(auth.uid(), company_id));

CREATE POLICY "orders_tenant_insert" ON public.orders FOR INSERT TO authenticated 
WITH CHECK (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "orders_tenant_update" ON public.orders FOR UPDATE TO authenticated 
USING (company_id = get_user_company_id(auth.uid()))
WITH CHECK (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "orders_tenant_delete" ON public.orders FOR DELETE TO authenticated 
USING (company_id = get_user_company_id(auth.uid()) AND (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role)));

-- 2. Consolidação de RLS: NF-e
DROP POLICY IF EXISTS "Auth users can read own nfe" ON public.nfe;
DROP POLICY IF EXISTS "nfe_delete" ON public.nfe;
DROP POLICY IF EXISTS "nfe_insert" ON public.nfe;
DROP POLICY IF EXISTS "nfe_role_delete" ON public.nfe;
DROP POLICY IF EXISTS "nfe_role_select" ON public.nfe;
DROP POLICY IF EXISTS "nfe_role_update" ON public.nfe;
DROP POLICY IF EXISTS "nfe_role_write" ON public.nfe;
DROP POLICY IF EXISTS "nfe_select" ON public.nfe;
DROP POLICY IF EXISTS "nfe_update" ON public.nfe;

CREATE POLICY "nfe_tenant_select" ON public.nfe FOR SELECT TO authenticated 
USING (company_id = get_user_company_id(auth.uid()) OR check_hierarchy_access(auth.uid(), company_id));

CREATE POLICY "nfe_tenant_insert" ON public.nfe FOR INSERT TO authenticated 
WITH CHECK (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "nfe_tenant_update" ON public.nfe FOR UPDATE TO authenticated 
USING (company_id = get_user_company_id(auth.uid()) AND (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role) OR has_role(auth.uid(), 'operator'::app_role)))
WITH CHECK (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "nfe_tenant_delete" ON public.nfe FOR DELETE TO authenticated 
USING (company_id = get_user_company_id(auth.uid()) AND has_role(auth.uid(), 'admin'::app_role));

-- 3. Traceabilidade: correlation_id em financial_ledger se faltar
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'financial_ledger' AND COLUMN_NAME = 'correlation_id') THEN
        ALTER TABLE public.financial_ledger ADD COLUMN correlation_id uuid;
    END IF;
END $$;

-- 4. Trava de Estoque Negativo baseada em Política
CREATE OR REPLACE FUNCTION public.enforce_inventory_policy()
RETURNS TRIGGER AS $$
DECLARE
    v_allow_negative boolean;
BEGIN
    v_allow_negative := false; 
    IF NOT v_allow_negative AND NEW.quantity < 0 THEN
        RAISE EXCEPTION 'estoque_negativo_proibido: produto %', NEW.product_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_enforce_inventory_policy ON public.stock_balances;
CREATE TRIGGER trg_enforce_inventory_policy
BEFORE INSERT OR UPDATE ON public.stock_balances
FOR EACH ROW EXECUTE FUNCTION public.enforce_inventory_policy();

-- 5. Índices de Performance
CREATE INDEX IF NOT EXISTS idx_orders_correlation_id ON public.orders(correlation_id);
CREATE INDEX IF NOT EXISTS idx_nfe_correlation_id ON public.nfe(correlation_id);
CREATE INDEX IF NOT EXISTS idx_financial_ledger_correlation_id ON public.financial_ledger(correlation_id);
CREATE INDEX IF NOT EXISTS idx_stock_balances_company_product ON public.stock_balances(company_id, product_id);

-- 6. Grants
GRANT ALL ON public.financial_audit_logs TO service_role;
GRANT SELECT ON public.financial_audit_logs TO authenticated;

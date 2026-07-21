
-- Helper: loja padrão do usuário logado
CREATE OR REPLACE FUNCTION public.get_user_branch_id(_user_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(default_branch_id, branch_id)
  FROM public.profiles
  WHERE id = _user_id
$$;

-- Helper: acesso consolidado (matriz)?
CREATE OR REPLACE FUNCTION public.is_matriz_viewer(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    public.has_role(_user_id, 'admin_matriz'::public.app_role)
    OR public.has_role(_user_id, 'admin'::public.app_role)
    OR public.has_role(_user_id, 'manager'::public.app_role)
    OR public.has_role(_user_id, 'diretor'::public.app_role)
    OR public.has_role(_user_id, 'system_admin'::public.app_role)
$$;

REVOKE EXECUTE ON FUNCTION public.get_user_branch_id(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.is_matriz_viewer(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_user_branch_id(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_matriz_viewer(uuid) TO authenticated, service_role;

-- Orders: SELECT filtrado por loja
DROP POLICY IF EXISTS orders_tenant_select ON public.orders;
CREATE POLICY orders_tenant_select ON public.orders
FOR SELECT TO authenticated
USING (
  company_id = public.get_user_company_id(auth.uid())
  AND (
    public.is_matriz_viewer(auth.uid())
    OR branch_id IS NULL
    OR branch_id = public.get_user_branch_id(auth.uid())
  )
);

-- Stock balances: SELECT filtrado por loja, escrita mantida por company
DROP POLICY IF EXISTS stock_balances_tenant_isolation ON public.stock_balances;
CREATE POLICY stock_balances_tenant_select ON public.stock_balances
FOR SELECT TO authenticated
USING (
  company_id = public.get_user_company_id(auth.uid())
  AND (
    public.is_matriz_viewer(auth.uid())
    OR branch_id IS NULL
    OR branch_id = public.get_user_branch_id(auth.uid())
  )
);
CREATE POLICY stock_balances_tenant_write ON public.stock_balances
FOR ALL TO authenticated
USING (company_id = public.get_user_company_id(auth.uid()))
WITH CHECK (company_id = public.get_user_company_id(auth.uid()));

-- Financial ledger: SELECT filtrado por loja para operacional
DROP POLICY IF EXISTS ledger_tenant_select ON public.financial_ledger;
CREATE POLICY ledger_tenant_select ON public.financial_ledger
FOR SELECT TO authenticated
USING (
  company_id = public.get_user_company_id(auth.uid())
  AND (
    public.is_matriz_viewer(auth.uid())
    OR public.has_role(auth.uid(), 'financeiro'::public.app_role)
    OR public.has_role(auth.uid(), 'viewer'::public.app_role)
    OR branch_id IS NULL
    OR branch_id = public.get_user_branch_id(auth.uid())
  )
);

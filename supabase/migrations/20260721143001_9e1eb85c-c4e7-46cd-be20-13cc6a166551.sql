
-- S-Multi-7: Option B — tighten branch scoping.
-- Operators/viewers without a branch assigned no longer see rows with NULL branch_id.
-- Matriz viewers (admin/manager/admin_matriz/diretor/system_admin) keep full visibility.
-- Special roles keep their cross-branch exceptions (financeiro on ledger).

DROP POLICY IF EXISTS orders_tenant_select ON public.orders;
CREATE POLICY orders_tenant_select ON public.orders
FOR SELECT USING (
  company_id = get_user_company_id(auth.uid())
  AND (
    is_matriz_viewer(auth.uid())
    OR branch_id = get_user_branch_id(auth.uid())
  )
);

DROP POLICY IF EXISTS stock_balances_tenant_select ON public.stock_balances;
CREATE POLICY stock_balances_tenant_select ON public.stock_balances
FOR SELECT USING (
  company_id = get_user_company_id(auth.uid())
  AND (
    is_matriz_viewer(auth.uid())
    OR branch_id = get_user_branch_id(auth.uid())
  )
);

DROP POLICY IF EXISTS ledger_tenant_select ON public.financial_ledger;
CREATE POLICY ledger_tenant_select ON public.financial_ledger
FOR SELECT USING (
  company_id = get_user_company_id(auth.uid())
  AND (
    is_matriz_viewer(auth.uid())
    OR has_role(auth.uid(), 'financeiro'::app_role)
    OR branch_id = get_user_branch_id(auth.uid())
  )
);


-- commissions: split ALL policy into read-any-tenant + write-admin/manager
DROP POLICY IF EXISTS commissions_tenant_isolation ON public.commissions;

CREATE POLICY commissions_tenant_select ON public.commissions
  FOR SELECT TO authenticated
  USING (company_id = public.get_user_company_id(auth.uid()));

CREATE POLICY commissions_tenant_insert ON public.commissions
  FOR INSERT TO authenticated
  WITH CHECK (
    company_id = public.get_user_company_id(auth.uid())
    AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager'))
  );

CREATE POLICY commissions_tenant_update ON public.commissions
  FOR UPDATE TO authenticated
  USING (
    company_id = public.get_user_company_id(auth.uid())
    AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager'))
  )
  WITH CHECK (
    company_id = public.get_user_company_id(auth.uid())
    AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager'))
  );

CREATE POLICY commissions_tenant_delete ON public.commissions
  FOR DELETE TO authenticated
  USING (
    company_id = public.get_user_company_id(auth.uid())
    AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager'))
  );

-- financial_categories
DROP POLICY IF EXISTS financial_categories_tenant_all ON public.financial_categories;

CREATE POLICY financial_categories_tenant_select ON public.financial_categories
  FOR SELECT TO authenticated
  USING (company_id IS NOT NULL AND company_id = public.get_user_company_id(auth.uid()));

CREATE POLICY financial_categories_tenant_insert ON public.financial_categories
  FOR INSERT TO authenticated
  WITH CHECK (
    company_id IS NOT NULL
    AND company_id = public.get_user_company_id(auth.uid())
    AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager'))
  );

CREATE POLICY financial_categories_tenant_update ON public.financial_categories
  FOR UPDATE TO authenticated
  USING (
    company_id IS NOT NULL
    AND company_id = public.get_user_company_id(auth.uid())
    AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager'))
  )
  WITH CHECK (
    company_id IS NOT NULL
    AND company_id = public.get_user_company_id(auth.uid())
    AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager'))
  );

CREATE POLICY financial_categories_tenant_delete ON public.financial_categories
  FOR DELETE TO authenticated
  USING (
    company_id IS NOT NULL
    AND company_id = public.get_user_company_id(auth.uid())
    AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager'))
  );

-- financial_operations_log: tighten inserts to trusted roles (admin/manager/operator)
DROP POLICY IF EXISTS "Insert fin ops by company" ON public.financial_operations_log;
DROP POLICY IF EXISTS "auth insert ops" ON public.financial_operations_log;

CREATE POLICY financial_operations_log_insert ON public.financial_operations_log
  FOR INSERT TO authenticated
  WITH CHECK (
    company_id = public.get_user_company_id(auth.uid())
    AND (
      public.has_role(auth.uid(), 'admin')
      OR public.has_role(auth.uid(), 'manager')
      OR public.has_role(auth.uid(), 'operator')
    )
  );

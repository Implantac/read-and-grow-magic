
-- Companies: remove cross-tenant admin access
DROP POLICY IF EXISTS companies_select_own ON public.companies;
CREATE POLICY companies_select_own ON public.companies
  FOR SELECT TO authenticated
  USING (id = public.get_user_company_id(auth.uid()));

DROP POLICY IF EXISTS companies_update_scoped ON public.companies;
CREATE POLICY companies_update_scoped ON public.companies
  FOR UPDATE TO authenticated
  USING (
    id = public.get_user_company_id(auth.uid())
    AND (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'manager'::app_role))
  )
  WITH CHECK (
    id = public.get_user_company_id(auth.uid())
    AND (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'manager'::app_role))
  );

-- Tenants: scope to user's tenant
DROP POLICY IF EXISTS "Tenants are visible to authenticated users" ON public.tenants;
CREATE POLICY "Tenants are visible to own members" ON public.tenants
  FOR SELECT TO authenticated
  USING (
    id = (SELECT tenant_id FROM public.companies WHERE id = public.get_user_company_id(auth.uid()))
  );

-- Subscriptions: remove cross-tenant admin
DROP POLICY IF EXISTS "Company members view own subscription" ON public.subscriptions;
CREATE POLICY "Company members view own subscription" ON public.subscriptions
  FOR SELECT TO authenticated
  USING (company_id = public.get_user_company_id(auth.uid()));

-- Usage tracking: remove cross-tenant admin
DROP POLICY IF EXISTS "Company members view own usage" ON public.usage_tracking;
CREATE POLICY "Company members view own usage" ON public.usage_tracking
  FOR SELECT TO authenticated
  USING (company_id = public.get_user_company_id(auth.uid()));

-- Plan features: restrict to authenticated users whose subscription is active (still readable but scoped via subscription)
DROP POLICY IF EXISTS plan_features_read_authenticated ON public.plan_features;
CREATE POLICY plan_features_read_authenticated ON public.plan_features
  FOR SELECT TO authenticated
  USING (
    plan_id IN (
      SELECT plan_id FROM public.subscriptions
      WHERE company_id = public.get_user_company_id(auth.uid())
    )
  );

-- AI brain memory: restrict global scope to admins only
DROP POLICY IF EXISTS ai_brain_memory_select ON public.ai_brain_memory;
CREATE POLICY ai_brain_memory_select ON public.ai_brain_memory
  FOR SELECT TO authenticated
  USING (
    ((scope = 'user') AND (user_id = auth.uid()))
    OR ((scope = 'company') AND (company_id = public.get_user_company_id(auth.uid())))
    OR ((scope = 'global') AND public.has_role(auth.uid(), 'admin'::app_role))
  );

-- Open finance connections: restrict to admin/manager only
DROP POLICY IF EXISTS open_finance_connections_tenant_isolation ON public.open_finance_connections;
CREATE POLICY open_finance_connections_admin_only ON public.open_finance_connections
  FOR ALL TO authenticated
  USING (
    company_id = public.get_user_company_id(auth.uid())
    AND (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'manager'::app_role))
  )
  WITH CHECK (
    company_id = public.get_user_company_id(auth.uid())
    AND (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'manager'::app_role))
  );

-- View: force security_invoker
ALTER VIEW public.vw_organizational_hierarchy SET (security_invoker = true);

-- Revoke anon EXECUTE from internal SECURITY DEFINER functions
REVOKE EXECUTE ON FUNCTION public.get_consolidated_company_ids(uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.check_hierarchy_access(uuid, uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.get_consolidated_revenue(uuid, uuid, uuid, date, date) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.get_consolidated_company_ids(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_hierarchy_access(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_consolidated_revenue(uuid, uuid, uuid, date, date) TO authenticated;


-- Restrict open_finance_connections to admin only (remove manager)
DROP POLICY IF EXISTS open_finance_connections_admin_only ON public.open_finance_connections;
CREATE POLICY open_finance_connections_admin_only ON public.open_finance_connections
  FOR ALL
  USING (company_id = get_user_company_id(auth.uid()) AND has_role(auth.uid(), 'admin'::app_role, get_user_company_id(auth.uid())))
  WITH CHECK (company_id = get_user_company_id(auth.uid()) AND has_role(auth.uid(), 'admin'::app_role, get_user_company_id(auth.uid())));

-- ai_brain_memory: scope global requires admin in user's company; tighten select/update/delete
DROP POLICY IF EXISTS ai_brain_memory_select ON public.ai_brain_memory;
CREATE POLICY ai_brain_memory_select ON public.ai_brain_memory
  FOR SELECT
  USING (
    ((scope = 'user'::text) AND (user_id = auth.uid()))
    OR ((scope = 'company'::text) AND (company_id = get_user_company_id(auth.uid())))
    OR ((scope = 'global'::text) AND (company_id = get_user_company_id(auth.uid())) AND has_role(auth.uid(), 'admin'::app_role, get_user_company_id(auth.uid())))
  );

DROP POLICY IF EXISTS ai_brain_memory_update ON public.ai_brain_memory;
CREATE POLICY ai_brain_memory_update ON public.ai_brain_memory
  FOR UPDATE
  USING (
    ((scope = 'user'::text) AND (user_id = auth.uid()))
    OR ((scope = ANY (ARRAY['company'::text,'global'::text])) AND (company_id = get_user_company_id(auth.uid())) AND has_role(auth.uid(), 'admin'::app_role, get_user_company_id(auth.uid())))
  );

DROP POLICY IF EXISTS ai_brain_memory_delete ON public.ai_brain_memory;
CREATE POLICY ai_brain_memory_delete ON public.ai_brain_memory
  FOR DELETE
  USING (
    ((scope = 'user'::text) AND (user_id = auth.uid()))
    OR ((scope = ANY (ARRAY['company'::text,'global'::text])) AND (company_id = get_user_company_id(auth.uid())) AND has_role(auth.uid(), 'admin'::app_role, get_user_company_id(auth.uid())))
  );

-- delivery_tracking: remove null-company admin fallback
DROP POLICY IF EXISTS delivery_tracking_tenant_select ON public.delivery_tracking;
CREATE POLICY delivery_tracking_tenant_select ON public.delivery_tracking
  FOR SELECT
  USING (company_id = get_user_company_id(auth.uid()));

-- financial_ledger: remove null-company admin fallback
DROP POLICY IF EXISTS ledger_tenant_select ON public.financial_ledger;
CREATE POLICY ledger_tenant_select ON public.financial_ledger
  FOR SELECT
  USING (company_id = get_user_company_id(auth.uid()));

DROP POLICY IF EXISTS ledger_tenant_update ON public.financial_ledger;
CREATE POLICY ledger_tenant_update ON public.financial_ledger
  FOR UPDATE
  USING (company_id = get_user_company_id(auth.uid()) AND (has_role(auth.uid(), 'admin'::app_role, get_user_company_id(auth.uid())) OR has_role(auth.uid(), 'manager'::app_role, get_user_company_id(auth.uid()))));

DROP POLICY IF EXISTS "Admins can delete financial_ledger" ON public.financial_ledger;
CREATE POLICY "Admins can delete financial_ledger" ON public.financial_ledger
  FOR DELETE
  USING (company_id = get_user_company_id(auth.uid()) AND has_role(auth.uid(), 'admin'::app_role, get_user_company_id(auth.uid())));

-- plans: restrict reads to authenticated users; admin-manage uses company-scoped admin check
DROP POLICY IF EXISTS "Anyone can view active plans" ON public.plans;
CREATE POLICY "Authenticated can view active plans" ON public.plans
  FOR SELECT
  TO authenticated
  USING (is_active = true);

DROP POLICY IF EXISTS "Admins manage plans" ON public.plans;
CREATE POLICY "Admins manage plans" ON public.plans
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role, get_user_company_id(auth.uid())))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role, get_user_company_id(auth.uid())));

REVOKE SELECT ON public.plans FROM anon;

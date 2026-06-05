
-- 1. Industry tables: restrict to authenticated + same company
DROP POLICY IF EXISTS "Users can manage their own textile inventory" ON public.textile_yarn_inventory;
CREATE POLICY "textile_yarn_inventory_tenant" ON public.textile_yarn_inventory
  FOR ALL TO authenticated
  USING (company_id = get_user_company_id(auth.uid()))
  WITH CHECK (company_id = get_user_company_id(auth.uid()));

DROP POLICY IF EXISTS "Users can manage their own weaving orders" ON public.textile_weaving_orders;
CREATE POLICY "textile_weaving_orders_tenant" ON public.textile_weaving_orders
  FOR ALL TO authenticated
  USING (company_id = get_user_company_id(auth.uid()))
  WITH CHECK (company_id = get_user_company_id(auth.uid()));

DROP POLICY IF EXISTS "Users can manage their own lab tests" ON public.pharma_lab_tests;
CREATE POLICY "pharma_lab_tests_tenant" ON public.pharma_lab_tests
  FOR ALL TO authenticated
  USING (company_id = get_user_company_id(auth.uid()))
  WITH CHECK (company_id = get_user_company_id(auth.uid()));

DROP POLICY IF EXISTS "Users can manage their own stores" ON public.retail_chain_stores;
CREATE POLICY "retail_chain_stores_tenant" ON public.retail_chain_stores
  FOR ALL TO authenticated
  USING (company_id = get_user_company_id(auth.uid()))
  WITH CHECK (company_id = get_user_company_id(auth.uid()));

DROP POLICY IF EXISTS "Users can manage their own formulas" ON public.feed_formulas;
CREATE POLICY "feed_formulas_tenant" ON public.feed_formulas
  FOR ALL TO authenticated
  USING (company_id = get_user_company_id(auth.uid()))
  WITH CHECK (company_id = get_user_company_id(auth.uid()));

DROP POLICY IF EXISTS "Users can manage their own routes" ON public.wholesaler_routes;
CREATE POLICY "wholesaler_routes_tenant" ON public.wholesaler_routes
  FOR ALL TO authenticated
  USING (company_id = get_user_company_id(auth.uid()))
  WITH CHECK (company_id = get_user_company_id(auth.uid()));

DROP POLICY IF EXISTS "Users can manage their own holding entities" ON public.holding_entities;
CREATE POLICY "holding_entities_tenant" ON public.holding_entities
  FOR ALL TO authenticated
  USING (holding_company_id = get_user_company_id(auth.uid()))
  WITH CHECK (holding_company_id = get_user_company_id(auth.uid()));

-- 2. has_role: add company-scoped overload
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role, _company_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
      AND (company_id = _company_id OR company_id IS NULL)
  )
$$;

-- 3. pix_webhook_events: enforce company scope
DROP POLICY IF EXISTS "pix_webhook_admin_only" ON public.pix_webhook_events;
CREATE POLICY "pix_webhook_admin_tenant" ON public.pix_webhook_events
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) AND company_id = get_user_company_id(auth.uid()))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) AND company_id = get_user_company_id(auth.uid()));

-- 4. product_supplier_references: add company_id + tenant isolation
ALTER TABLE public.product_supplier_references
  ADD COLUMN IF NOT EXISTS company_id uuid DEFAULT get_user_company_id(auth.uid());

DROP POLICY IF EXISTS "psr_admin_manage" ON public.product_supplier_references;
DROP POLICY IF EXISTS "psr_select_authenticated" ON public.product_supplier_references;

CREATE POLICY "psr_select_tenant" ON public.product_supplier_references
  FOR SELECT TO authenticated
  USING (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "psr_manage_tenant" ON public.product_supplier_references
  FOR ALL TO authenticated
  USING (
    company_id = get_user_company_id(auth.uid())
    AND (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role))
  )
  WITH CHECK (
    company_id = get_user_company_id(auth.uid())
    AND (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role))
  );

-- 5. system_parameters: add company scope to read policy
DROP POLICY IF EXISTS "Read non-sensitive parameters" ON public.system_parameters;
CREATE POLICY "system_parameters_read_tenant" ON public.system_parameters
  FOR SELECT TO authenticated
  USING (
    company_id = get_user_company_id(auth.uid())
    AND ((sensitive = false) OR has_role(auth.uid(), 'admin'::app_role))
  );

-- 6. daily_executive_reports: allow service_role writes + tenant inserts
CREATE POLICY "daily_reports_service_write" ON public.daily_executive_reports
  FOR ALL TO service_role
  USING (true) WITH CHECK (true);

CREATE POLICY "daily_reports_tenant_insert" ON public.daily_executive_reports
  FOR INSERT TO authenticated
  WITH CHECK (company_id = get_user_company_id(auth.uid()));

-- 7. financial_audit_logs: insert policies
CREATE POLICY "financial_audit_logs_service_write" ON public.financial_audit_logs
  FOR ALL TO service_role
  USING (true) WITH CHECK (true);

CREATE POLICY "financial_audit_logs_tenant_insert" ON public.financial_audit_logs
  FOR INSERT TO authenticated
  WITH CHECK (company_id = get_user_company_id(auth.uid()));

-- 8. Realtime tables: enforce company_id NOT NULL with default
ALTER TABLE public.iot_telemetry
  ALTER COLUMN company_id SET DEFAULT get_user_company_id(auth.uid()),
  ALTER COLUMN company_id SET NOT NULL;

ALTER TABLE public.production_machines
  ALTER COLUMN company_id SET DEFAULT get_user_company_id(auth.uid()),
  ALTER COLUMN company_id SET NOT NULL;

ALTER TABLE public.production_logs
  ALTER COLUMN company_id SET DEFAULT get_user_company_id(auth.uid()),
  ALTER COLUMN company_id SET NOT NULL;

ALTER TABLE public.production_events
  ALTER COLUMN company_id SET DEFAULT get_user_company_id(auth.uid()),
  ALTER COLUMN company_id SET NOT NULL;

ALTER TABLE public.outsourcing_orders
  ALTER COLUMN company_id SET DEFAULT get_user_company_id(auth.uid()),
  ALTER COLUMN company_id SET NOT NULL;

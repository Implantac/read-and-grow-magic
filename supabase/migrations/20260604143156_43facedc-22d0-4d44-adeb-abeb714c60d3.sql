
-- 1. delivery_tracking: enforce company on INSERT
DROP POLICY IF EXISTS "Authenticated users can create delivery tracking" ON public.delivery_tracking;
CREATE POLICY "delivery_tracking_tenant_insert" ON public.delivery_tracking
  FOR INSERT TO authenticated
  WITH CHECK (company_id = public.get_user_company_id(auth.uid()));

-- 2. rfid_events: enforce company on INSERT
DROP POLICY IF EXISTS "Auth users can insert rfid_events" ON public.rfid_events;
DROP POLICY IF EXISTS "Authenticated users can insert rfid_events" ON public.rfid_events;
CREATE POLICY "rfid_events_tenant_insert" ON public.rfid_events
  FOR INSERT TO authenticated
  WITH CHECK (company_id = public.get_user_company_id(auth.uid()));

-- 3. product_supplier_references: enable RLS
ALTER TABLE public.product_supplier_references ENABLE ROW LEVEL SECURITY;
CREATE POLICY "psr_select_authenticated" ON public.product_supplier_references
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "psr_admin_manage" ON public.product_supplier_references
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'manager'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'manager'::app_role));

-- 4. Restrict {public} role policies to {authenticated}
DROP POLICY IF EXISTS "Users can access accounting data of their company" ON public.accounting_accounts;
CREATE POLICY "Users can access accounting data of their company" ON public.accounting_accounts
  FOR ALL TO authenticated
  USING (company_id = public.get_user_company_id(auth.uid()))
  WITH CHECK (company_id = public.get_user_company_id(auth.uid()));

DROP POLICY IF EXISTS "Users can access entries data of their company" ON public.accounting_entries;
CREATE POLICY "Users can access entries data of their company" ON public.accounting_entries
  FOR ALL TO authenticated
  USING (company_id = public.get_user_company_id(auth.uid()))
  WITH CHECK (company_id = public.get_user_company_id(auth.uid()));

DROP POLICY IF EXISTS "AI memory access" ON public.ai_enterprise_memory;
CREATE POLICY "AI memory access" ON public.ai_enterprise_memory
  FOR ALL TO authenticated
  USING (company_id = public.get_user_company_id(auth.uid()))
  WITH CHECK (company_id = public.get_user_company_id(auth.uid()));

DROP POLICY IF EXISTS "Users can manage leads of their company" ON public.crm_leads;
CREATE POLICY "Users can manage leads of their company" ON public.crm_leads
  FOR ALL TO authenticated
  USING (company_id = public.get_user_company_id(auth.uid()))
  WITH CHECK (company_id = public.get_user_company_id(auth.uid()));

DROP POLICY IF EXISTS "Users can manage opportunities of their company" ON public.crm_opportunities;
CREATE POLICY "Users can manage opportunities of their company" ON public.crm_opportunities
  FOR ALL TO authenticated
  USING (company_id = public.get_user_company_id(auth.uid()))
  WITH CHECK (company_id = public.get_user_company_id(auth.uid()));

DROP POLICY IF EXISTS "Users can manage pipelines of their company" ON public.crm_pipelines;
CREATE POLICY "Users can manage pipelines of their company" ON public.crm_pipelines
  FOR ALL TO authenticated
  USING (company_id = public.get_user_company_id(auth.uid()))
  WITH CHECK (company_id = public.get_user_company_id(auth.uid()));

DROP POLICY IF EXISTS "Fiscal docs access" ON public.fiscal_documents;
DROP POLICY IF EXISTS "Users can manage their company's fiscal docs" ON public.fiscal_documents;
CREATE POLICY "Users can manage their company's fiscal docs" ON public.fiscal_documents
  FOR ALL TO authenticated
  USING (company_id = public.get_user_company_id(auth.uid()))
  WITH CHECK (company_id = public.get_user_company_id(auth.uid()));

DROP POLICY IF EXISTS "Fiscal rules access" ON public.fiscal_rules;
CREATE POLICY "Fiscal rules access" ON public.fiscal_rules
  FOR ALL TO authenticated
  USING (company_id = public.get_user_company_id(auth.uid()))
  WITH CHECK (company_id = public.get_user_company_id(auth.uid()));

DROP POLICY IF EXISTS "Users can manage their company's tax rules" ON public.fiscal_tax_rules;
CREATE POLICY "Users can manage their company's tax rules" ON public.fiscal_tax_rules
  FOR ALL TO authenticated
  USING (company_id = public.get_user_company_id(auth.uid()))
  WITH CHECK (company_id = public.get_user_company_id(auth.uid()));

DROP POLICY IF EXISTS "PCP access by company" ON public.production_orders_enterprise;
CREATE POLICY "PCP access by company" ON public.production_orders_enterprise
  FOR ALL TO authenticated
  USING (company_id = public.get_user_company_id(auth.uid()))
  WITH CHECK (company_id = public.get_user_company_id(auth.uid()));

DROP POLICY IF EXISTS "WMS waves access by company" ON public.wms_waves;
CREATE POLICY "WMS waves access by company" ON public.wms_waves
  FOR ALL TO authenticated
  USING (company_id = public.get_user_company_id(auth.uid()))
  WITH CHECK (company_id = public.get_user_company_id(auth.uid()));

-- 5. financial_ledger: restrict NULL company_id rows to admins
DROP POLICY IF EXISTS ledger_tenant_select ON public.financial_ledger;
CREATE POLICY ledger_tenant_select ON public.financial_ledger
  FOR SELECT TO authenticated
  USING (
    company_id = public.get_user_company_id(auth.uid())
    OR (company_id IS NULL AND public.has_role(auth.uid(), 'admin'::app_role))
  );

DROP POLICY IF EXISTS ledger_tenant_insert ON public.financial_ledger;
CREATE POLICY ledger_tenant_insert ON public.financial_ledger
  FOR INSERT TO authenticated
  WITH CHECK (
    company_id = public.get_user_company_id(auth.uid())
    AND (public.has_role(auth.uid(), 'admin'::app_role)
         OR public.has_role(auth.uid(), 'manager'::app_role)
         OR public.has_role(auth.uid(), 'operator'::app_role))
  );

-- 6. financial_predictive_alerts: add company_id isolation
DROP POLICY IF EXISTS fpa_insert ON public.financial_predictive_alerts;
CREATE POLICY fpa_insert ON public.financial_predictive_alerts
  FOR INSERT TO authenticated
  WITH CHECK (
    company_id = public.get_user_company_id(auth.uid())
    AND (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'manager'::app_role))
  );

DROP POLICY IF EXISTS fpa_update ON public.financial_predictive_alerts;
CREATE POLICY fpa_update ON public.financial_predictive_alerts
  FOR UPDATE TO authenticated
  USING (
    company_id = public.get_user_company_id(auth.uid())
    AND (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'manager'::app_role))
  )
  WITH CHECK (company_id = public.get_user_company_id(auth.uid()));

-- 7. Admin-managed tables with company_id: add company scope
DROP POLICY IF EXISTS "Admins manage subscriptions" ON public.subscriptions;
CREATE POLICY "Admins manage subscriptions" ON public.subscriptions
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role) AND company_id = public.get_user_company_id(auth.uid()))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role) AND company_id = public.get_user_company_id(auth.uid()));

DROP POLICY IF EXISTS "Admins manage invoices" ON public.saas_invoices;
CREATE POLICY "Admins manage invoices" ON public.saas_invoices
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role) AND company_id = public.get_user_company_id(auth.uid()))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role) AND company_id = public.get_user_company_id(auth.uid()));

DROP POLICY IF EXISTS "Admins manage usage" ON public.usage_tracking;
CREATE POLICY "Admins manage usage" ON public.usage_tracking
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role) AND company_id = public.get_user_company_id(auth.uid()))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role) AND company_id = public.get_user_company_id(auth.uid()));

DROP POLICY IF EXISTS feature_flags_write_admin ON public.feature_flags;
CREATE POLICY feature_flags_write_admin ON public.feature_flags
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role) AND (company_id IS NULL OR company_id = public.get_user_company_id(auth.uid())))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role) AND (company_id IS NULL OR company_id = public.get_user_company_id(auth.uid())));

DROP POLICY IF EXISTS "admin manage charges rules" ON public.financial_charges_rules;
CREATE POLICY "admin manage charges rules" ON public.financial_charges_rules
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role) AND company_id = public.get_user_company_id(auth.uid()))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role) AND company_id = public.get_user_company_id(auth.uid()));

DROP POLICY IF EXISTS "Admins delete parameters" ON public.system_parameters;
CREATE POLICY "Admins delete parameters" ON public.system_parameters
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role) AND company_id = public.get_user_company_id(auth.uid()));

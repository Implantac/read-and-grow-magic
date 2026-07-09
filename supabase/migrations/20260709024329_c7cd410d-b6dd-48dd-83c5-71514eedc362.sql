
-- Restrict REINF writes to admin/manager (fiscal-sensitive)
DROP POLICY IF EXISTS "reinf_events tenant write" ON public.reinf_events;
CREATE POLICY "reinf_events tenant write" ON public.reinf_events
  FOR ALL TO authenticated
  USING (company_id = get_user_company_id(auth.uid()) AND (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role)))
  WITH CHECK (company_id = get_user_company_id(auth.uid()) AND (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role)));

DROP POLICY IF EXISTS "reinf_periods tenant write" ON public.reinf_periods;
CREATE POLICY "reinf_periods tenant write" ON public.reinf_periods
  FOR ALL TO authenticated
  USING (company_id = get_user_company_id(auth.uid()) AND (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role)))
  WITH CHECK (company_id = get_user_company_id(auth.uid()) AND (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role)));

-- Restrict IoT telemetry & production_events writes to admin/manager/operator (system/machine-facing roles)
DROP POLICY IF EXISTS iot_telemetry_tenant_isolation ON public.iot_telemetry;
CREATE POLICY iot_telemetry_tenant_read ON public.iot_telemetry
  FOR SELECT TO authenticated
  USING (company_id = get_user_company_id(auth.uid()));
CREATE POLICY iot_telemetry_tenant_write ON public.iot_telemetry
  FOR ALL TO authenticated
  USING (company_id = get_user_company_id(auth.uid()) AND (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role) OR has_role(auth.uid(), 'operator'::app_role)))
  WITH CHECK (company_id = get_user_company_id(auth.uid()) AND (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role) OR has_role(auth.uid(), 'operator'::app_role)));

DROP POLICY IF EXISTS production_events_tenant_isolation ON public.production_events;
CREATE POLICY production_events_tenant_read ON public.production_events
  FOR SELECT TO authenticated
  USING (company_id = get_user_company_id(auth.uid()));
CREATE POLICY production_events_tenant_write ON public.production_events
  FOR ALL TO authenticated
  USING (company_id = get_user_company_id(auth.uid()) AND (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role) OR has_role(auth.uid(), 'operator'::app_role)))
  WITH CHECK (company_id = get_user_company_id(auth.uid()) AND (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role) OR has_role(auth.uid(), 'operator'::app_role)));

-- Tighten cross_module_events: remove overly-permissive duplicate insert policy
DROP POLICY IF EXISTS cme_role_insert ON public.cross_module_events;

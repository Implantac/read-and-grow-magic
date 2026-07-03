
-- 1) ai_forecast_snapshots: remove NULL bypass on SELECT
DROP POLICY IF EXISTS forecast_snap_select_company ON public.ai_forecast_snapshots;
CREATE POLICY forecast_snap_select_company ON public.ai_forecast_snapshots
  FOR SELECT
  USING (
    (company_id IS NOT NULL AND company_id = get_user_company_id(auth.uid()))
    OR (company_id IS NOT NULL AND has_role(auth.uid(), 'admin'::app_role, company_id))
  );

-- 2) financial_boletos: add role check to WITH CHECK on update
DROP POLICY IF EXISTS boletos_tenant_update ON public.financial_boletos;
CREATE POLICY boletos_tenant_update ON public.financial_boletos
  FOR UPDATE
  USING (
    company_id = get_user_company_id(auth.uid())
    AND (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role))
  )
  WITH CHECK (
    company_id = get_user_company_id(auth.uid())
    AND (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role))
  );

-- 3) wms_docks_insert: use app_role overload scoped to warehouse's company
DROP POLICY IF EXISTS wms_docks_insert ON public.wms_docks;
CREATE POLICY wms_docks_insert ON public.wms_docks
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM warehouses w
      WHERE w.id = wms_docks.warehouse_id
        AND w.company_id = get_user_company_id(auth.uid())
        AND (
          has_role(auth.uid(), 'admin'::app_role, w.company_id)
          OR has_role(auth.uid(), 'manager'::app_role, w.company_id)
        )
    )
  );

-- 4) wms_kpi_cache: explicit deny for client writes (service_role bypasses RLS)
CREATE POLICY wms_kpi_cache_no_client_insert ON public.wms_kpi_cache
  FOR INSERT TO authenticated, anon
  WITH CHECK (false);
CREATE POLICY wms_kpi_cache_no_client_update ON public.wms_kpi_cache
  FOR UPDATE TO authenticated, anon
  USING (false) WITH CHECK (false);
CREATE POLICY wms_kpi_cache_no_client_delete ON public.wms_kpi_cache
  FOR DELETE TO authenticated, anon
  USING (false);

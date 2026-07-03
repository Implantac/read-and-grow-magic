
-- 1) ai_forecast_snapshots: restrict SELECT policy to authenticated
DROP POLICY IF EXISTS forecast_snap_select_company ON public.ai_forecast_snapshots;
CREATE POLICY forecast_snap_select_company
  ON public.ai_forecast_snapshots
  FOR SELECT
  TO authenticated
  USING (
    (company_id IS NOT NULL AND company_id = get_user_company_id(auth.uid()))
    OR (company_id IS NOT NULL AND has_role(auth.uid(), 'admin'::app_role, company_id))
  );

-- 2) financial_boletos: restrict UPDATE policy to authenticated
DROP POLICY IF EXISTS boletos_tenant_update ON public.financial_boletos;
CREATE POLICY boletos_tenant_update
  ON public.financial_boletos
  FOR UPDATE
  TO authenticated
  USING (
    company_id = get_user_company_id(auth.uid())
    AND (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role))
  )
  WITH CHECK (
    company_id = get_user_company_id(auth.uid())
    AND (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role))
  );

-- 3) wms_docks: restrict INSERT policy to authenticated
DROP POLICY IF EXISTS wms_docks_insert ON public.wms_docks;
CREATE POLICY wms_docks_insert
  ON public.wms_docks
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM warehouses w
      WHERE w.id = wms_docks.warehouse_id
        AND w.company_id = get_user_company_id(auth.uid())
        AND (
          has_role(auth.uid(), 'admin'::app_role, w.company_id)
          OR has_role(auth.uid(), 'manager'::app_role, w.company_id)
        )
    )
  );

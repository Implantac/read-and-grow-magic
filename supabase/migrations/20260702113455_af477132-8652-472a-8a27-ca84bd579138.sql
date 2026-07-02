
-- 1) billing_meters: restrict reads to service_role only (global catalog, no tenant scope)
DROP POLICY IF EXISTS meters_read_all_auth ON public.billing_meters;

-- 2) lgpd_data_requests: allow company admins to read/manage requests within their company
ALTER TABLE public.lgpd_data_requests
  ALTER COLUMN company_id SET NOT NULL;

CREATE POLICY lgpd_requests_company_admin_read
  ON public.lgpd_data_requests
  FOR SELECT
  TO authenticated
  USING (
    company_id = get_user_company_id(auth.uid())
    AND (
      has_role(auth.uid(), 'admin'::app_role, company_id)
      OR has_role(auth.uid(), 'system_admin'::app_role, company_id)
    )
  );

CREATE POLICY lgpd_requests_company_admin_update
  ON public.lgpd_data_requests
  FOR UPDATE
  TO authenticated
  USING (
    company_id = get_user_company_id(auth.uid())
    AND (
      has_role(auth.uid(), 'admin'::app_role, company_id)
      OR has_role(auth.uid(), 'system_admin'::app_role, company_id)
    )
  )
  WITH CHECK (
    company_id = get_user_company_id(auth.uid())
    AND (
      has_role(auth.uid(), 'admin'::app_role, company_id)
      OR has_role(auth.uid(), 'system_admin'::app_role, company_id)
    )
  );

-- 3) financial_ledger: standardize on 3-arg has_role(uid, role, company_id) everywhere
DROP POLICY IF EXISTS "Admins can delete financial_ledger" ON public.financial_ledger;
DROP POLICY IF EXISTS ledger_tenant_select ON public.financial_ledger;
DROP POLICY IF EXISTS ledger_tenant_insert ON public.financial_ledger;
DROP POLICY IF EXISTS ledger_tenant_update ON public.financial_ledger;

CREATE POLICY ledger_tenant_select ON public.financial_ledger
  FOR SELECT TO authenticated
  USING (
    company_id = get_user_company_id(auth.uid())
    AND (
      has_role(auth.uid(), 'admin'::app_role, company_id)
      OR has_role(auth.uid(), 'manager'::app_role, company_id)
      OR has_role(auth.uid(), 'operator'::app_role, company_id)
      OR has_role(auth.uid(), 'viewer'::app_role, company_id)
    )
  );

CREATE POLICY ledger_tenant_insert ON public.financial_ledger
  FOR INSERT TO authenticated
  WITH CHECK (
    company_id IS NOT NULL
    AND company_id = get_user_company_id(auth.uid())
    AND (
      has_role(auth.uid(), 'admin'::app_role, company_id)
      OR has_role(auth.uid(), 'manager'::app_role, company_id)
      OR has_role(auth.uid(), 'operator'::app_role, company_id)
    )
  );

CREATE POLICY ledger_tenant_update ON public.financial_ledger
  FOR UPDATE TO authenticated
  USING (
    company_id = get_user_company_id(auth.uid())
    AND (
      has_role(auth.uid(), 'admin'::app_role, company_id)
      OR has_role(auth.uid(), 'manager'::app_role, company_id)
    )
  )
  WITH CHECK (
    company_id = get_user_company_id(auth.uid())
    AND (
      has_role(auth.uid(), 'admin'::app_role, company_id)
      OR has_role(auth.uid(), 'manager'::app_role, company_id)
    )
  );

CREATE POLICY ledger_tenant_delete ON public.financial_ledger
  FOR DELETE TO authenticated
  USING (
    company_id = get_user_company_id(auth.uid())
    AND has_role(auth.uid(), 'admin'::app_role, company_id)
  );

-- 4) production_bom: standardize on 3-arg app_role overload
DROP POLICY IF EXISTS production_bom_insert ON public.production_bom;
DROP POLICY IF EXISTS production_bom_update ON public.production_bom;
DROP POLICY IF EXISTS production_bom_delete ON public.production_bom;

CREATE POLICY production_bom_insert ON public.production_bom
  FOR INSERT TO authenticated
  WITH CHECK (
    company_id = get_user_company_id(auth.uid())
    AND (
      has_role(auth.uid(), 'admin'::app_role, company_id)
      OR has_role(auth.uid(), 'manager'::app_role, company_id)
    )
  );

CREATE POLICY production_bom_update ON public.production_bom
  FOR UPDATE TO authenticated
  USING (
    company_id = get_user_company_id(auth.uid())
    AND (
      has_role(auth.uid(), 'admin'::app_role, company_id)
      OR has_role(auth.uid(), 'manager'::app_role, company_id)
    )
  )
  WITH CHECK (
    company_id = get_user_company_id(auth.uid())
    AND (
      has_role(auth.uid(), 'admin'::app_role, company_id)
      OR has_role(auth.uid(), 'manager'::app_role, company_id)
    )
  );

CREATE POLICY production_bom_delete ON public.production_bom
  FOR DELETE TO authenticated
  USING (
    company_id = get_user_company_id(auth.uid())
    AND (
      has_role(auth.uid(), 'admin'::app_role, company_id)
      OR has_role(auth.uid(), 'manager'::app_role, company_id)
    )
  );

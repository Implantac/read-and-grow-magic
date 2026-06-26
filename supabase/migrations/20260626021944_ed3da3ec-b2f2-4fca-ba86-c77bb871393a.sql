
-- ai_prompt_audit_logs: block client writes (only service_role via SECURITY DEFINER)
DROP POLICY IF EXISTS ai_prompt_audit_service_insert ON public.ai_prompt_audit_logs;
CREATE POLICY ai_prompt_audit_service_insert
ON public.ai_prompt_audit_logs
FOR INSERT
TO service_role
WITH CHECK (true);

REVOKE INSERT, UPDATE, DELETE ON public.ai_prompt_audit_logs FROM authenticated;

-- delivery_tracking: allow tenant admins/managers to update/delete
DROP POLICY IF EXISTS delivery_tracking_tenant_update ON public.delivery_tracking;
CREATE POLICY delivery_tracking_tenant_update
ON public.delivery_tracking
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

DROP POLICY IF EXISTS delivery_tracking_tenant_delete ON public.delivery_tracking;
CREATE POLICY delivery_tracking_tenant_delete
ON public.delivery_tracking
FOR DELETE
TO authenticated
USING (
  company_id = get_user_company_id(auth.uid())
  AND has_role(auth.uid(), 'admin'::app_role)
);

-- financial_risk_profiles: dedupe SELECT + add write policies (admin only, tenant scoped)
DROP POLICY IF EXISTS "admins read risk profiles" ON public.financial_risk_profiles;

DROP POLICY IF EXISTS frp_admin_insert ON public.financial_risk_profiles;
CREATE POLICY frp_admin_insert
ON public.financial_risk_profiles
FOR INSERT
TO authenticated
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role)
  AND company_id = get_user_company_id(auth.uid())
);

DROP POLICY IF EXISTS frp_admin_update ON public.financial_risk_profiles;
CREATE POLICY frp_admin_update
ON public.financial_risk_profiles
FOR UPDATE
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role)
  AND company_id = get_user_company_id(auth.uid())
)
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role)
  AND company_id = get_user_company_id(auth.uid())
);

DROP POLICY IF EXISTS frp_admin_delete ON public.financial_risk_profiles;
CREATE POLICY frp_admin_delete
ON public.financial_risk_profiles
FOR DELETE
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role)
  AND company_id = get_user_company_id(auth.uid())
);

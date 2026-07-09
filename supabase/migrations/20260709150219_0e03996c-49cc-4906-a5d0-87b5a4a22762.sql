
-- credit_audit_logs: only admin/manager can insert
DROP POLICY IF EXISTS "Authenticated can insert credit_audit_logs for own company" ON public.credit_audit_logs;
CREATE POLICY "credit_audit_logs_insert_role_check"
ON public.credit_audit_logs
FOR INSERT
TO authenticated
WITH CHECK (
  company_id IS NOT NULL
  AND company_id = get_user_company_id(auth.uid())
  AND (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role))
);

-- nfce_returns: require operator/manager/admin for insert and update
DROP POLICY IF EXISTS nfce_returns_insert ON public.nfce_returns;
CREATE POLICY nfce_returns_insert
ON public.nfce_returns
FOR INSERT
TO authenticated
WITH CHECK (
  company_id = get_user_company_id(auth.uid())
  AND (
    has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'manager'::app_role)
    OR has_role(auth.uid(), 'operator'::app_role)
  )
);

DROP POLICY IF EXISTS nfce_returns_update ON public.nfce_returns;
CREATE POLICY nfce_returns_update
ON public.nfce_returns
FOR UPDATE
TO authenticated
USING (
  company_id = get_user_company_id(auth.uid())
  AND (
    has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'manager'::app_role)
    OR has_role(auth.uid(), 'operator'::app_role)
  )
)
WITH CHECK (
  company_id = get_user_company_id(auth.uid())
  AND (
    has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'manager'::app_role)
    OR has_role(auth.uid(), 'operator'::app_role)
  )
);

-- orders: require operator/manager/admin for insert and update
DROP POLICY IF EXISTS orders_tenant_insert ON public.orders;
CREATE POLICY orders_tenant_insert
ON public.orders
FOR INSERT
TO authenticated
WITH CHECK (
  company_id = get_user_company_id(auth.uid())
  AND (
    has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'manager'::app_role)
    OR has_role(auth.uid(), 'operator'::app_role)
  )
);

DROP POLICY IF EXISTS orders_tenant_update ON public.orders;
CREATE POLICY orders_tenant_update
ON public.orders
FOR UPDATE
TO authenticated
USING (
  company_id = get_user_company_id(auth.uid())
  AND (
    has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'manager'::app_role)
    OR has_role(auth.uid(), 'operator'::app_role)
  )
)
WITH CHECK (
  company_id = get_user_company_id(auth.uid())
  AND (
    has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'manager'::app_role)
    OR has_role(auth.uid(), 'operator'::app_role)
  )
);

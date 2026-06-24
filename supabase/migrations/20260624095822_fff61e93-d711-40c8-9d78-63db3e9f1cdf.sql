
-- 1) Scope two-arg has_role variants to the user's current company
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = _user_id
      AND ur.role = _role
      AND (
        ur.company_id IS NULL
        OR ur.company_id = public.get_user_company_id(_user_id)
      )
  )
$$;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = _user_id
      AND ur.role::text = _role
      AND (
        ur.company_id IS NULL
        OR ur.company_id = public.get_user_company_id(_user_id)
      )
  );
END;
$$;

-- 2) Notifications INSERT: enforce company_id alignment
DROP POLICY IF EXISTS "Auth users can insert notifications" ON public.notifications;
CREATE POLICY "Auth users can insert notifications"
ON public.notifications
FOR INSERT
TO authenticated
WITH CHECK (
  user_id = auth.uid()
  AND company_id = public.get_user_company_id(auth.uid())
);

-- 3) Restrict sensitive policies to the authenticated role (not public/anon)
DROP POLICY IF EXISTS ledger_tenant_select ON public.financial_ledger;
CREATE POLICY ledger_tenant_select
ON public.financial_ledger
FOR SELECT
TO authenticated
USING (company_id = public.get_user_company_id(auth.uid()));

DROP POLICY IF EXISTS ledger_tenant_update ON public.financial_ledger;
CREATE POLICY ledger_tenant_update
ON public.financial_ledger
FOR UPDATE
TO authenticated
USING (
  company_id = public.get_user_company_id(auth.uid())
  AND (
    public.has_role(auth.uid(), 'admin'::app_role, public.get_user_company_id(auth.uid()))
    OR public.has_role(auth.uid(), 'manager'::app_role, public.get_user_company_id(auth.uid()))
  )
);

DROP POLICY IF EXISTS open_finance_connections_admin_only ON public.open_finance_connections;
CREATE POLICY open_finance_connections_admin_only
ON public.open_finance_connections
FOR ALL
TO authenticated
USING (
  company_id = public.get_user_company_id(auth.uid())
  AND public.has_role(auth.uid(), 'admin'::app_role, public.get_user_company_id(auth.uid()))
)
WITH CHECK (
  company_id = public.get_user_company_id(auth.uid())
  AND public.has_role(auth.uid(), 'admin'::app_role, public.get_user_company_id(auth.uid()))
);

DROP POLICY IF EXISTS delivery_tracking_tenant_select ON public.delivery_tracking;
CREATE POLICY delivery_tracking_tenant_select
ON public.delivery_tracking
FOR SELECT
TO authenticated
USING (company_id = public.get_user_company_id(auth.uid()));

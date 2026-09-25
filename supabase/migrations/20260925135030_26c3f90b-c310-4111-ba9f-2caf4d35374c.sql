DROP POLICY IF EXISTS "Authenticated can read permissions" ON public.permissions;
CREATE POLICY "Users read permissions assigned to their roles"
ON public.permissions
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.role_permissions rp
    JOIN public.user_roles ur
      ON ur.role = rp.role
    WHERE rp.permission_id = permissions.id
      AND ur.user_id = auth.uid()
      AND ur.company_id = public.get_user_company_id(auth.uid())
  )
);

DROP POLICY IF EXISTS "Authenticated can read role_permissions" ON public.role_permissions;
CREATE POLICY "Users read mappings for their roles"
ON public.role_permissions
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
      AND ur.company_id = public.get_user_company_id(auth.uid())
      AND ur.role = role_permissions.role
  )
);

DROP POLICY IF EXISTS "sefaz_status_read_all" ON public.sefaz_status_uf;
CREATE POLICY "Provisioned users read sefaz status"
ON public.sefaz_status_uf
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.company_id IS NOT NULL
      AND p.deleted_at IS NULL
  )
);

DROP POLICY IF EXISTS "Allow read access to authenticated users" ON public.fiscal_cfop_reference;
DROP POLICY IF EXISTS "fiscal_cfop_ref_select" ON public.fiscal_cfop_reference;
CREATE POLICY "Provisioned users read fiscal cfop reference"
ON public.fiscal_cfop_reference
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.company_id IS NOT NULL
      AND p.deleted_at IS NULL
  )
);

DROP POLICY IF EXISTS "Authenticated read meter catalog" ON public.billing_meters;
CREATE POLICY "Subscribed company users read meter catalog"
ON public.billing_meters
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.profiles p
    JOIN public.subscriptions s
      ON s.company_id = p.company_id
    WHERE p.id = auth.uid()
      AND p.deleted_at IS NULL
      AND s.status IN ('active', 'trialing', 'past_due')
  )
);

DROP POLICY IF EXISTS "plan_modules read authenticated" ON public.plan_modules;
CREATE POLICY "Company users read subscribed plan modules"
ON public.plan_modules
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.profiles p
    JOIN public.subscriptions s
      ON s.company_id = p.company_id
    WHERE p.id = auth.uid()
      AND p.deleted_at IS NULL
      AND s.plan_id = plan_modules.plan_id
      AND s.status IN ('active', 'trialing', 'past_due')
  )
);
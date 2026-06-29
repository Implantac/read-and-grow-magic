
-- 1) user_roles: prevent tenant admins from assigning system_admin
DROP POLICY IF EXISTS "Admins insert roles in their company" ON public.user_roles;
CREATE POLICY "Admins insert roles in their company"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role)
  AND company_id = get_user_company_id(auth.uid())
  AND role <> 'system_admin'::app_role
);

DROP POLICY IF EXISTS "Admins update roles in their company" ON public.user_roles;
CREATE POLICY "Admins update roles in their company"
ON public.user_roles
FOR UPDATE
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role)
  AND company_id = get_user_company_id(auth.uid())
  AND role <> 'system_admin'::app_role
)
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role)
  AND company_id = get_user_company_id(auth.uid())
  AND role <> 'system_admin'::app_role
);

DROP POLICY IF EXISTS "Admins delete roles in their company" ON public.user_roles;
CREATE POLICY "Admins delete roles in their company"
ON public.user_roles
FOR DELETE
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role)
  AND company_id = get_user_company_id(auth.uid())
  AND role <> 'system_admin'::app_role
);

-- 2) billing_meters: restrict reads to service_role only
DROP POLICY IF EXISTS "meters_read_all_auth" ON public.billing_meters;
REVOKE SELECT ON public.billing_meters FROM anon, authenticated;
GRANT ALL ON public.billing_meters TO service_role;

CREATE POLICY "meters_read_service_role"
ON public.billing_meters
FOR SELECT
TO service_role
USING (true);

-- 3) Revoke anon EXECUTE on SECURITY DEFINER functions
REVOKE EXECUTE ON FUNCTION public.is_system_admin(uuid) FROM anon, PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_system_admin(uuid) TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.plugin_quota_remaining(uuid) FROM anon, PUBLIC;
GRANT EXECUTE ON FUNCTION public.plugin_quota_remaining(uuid) TO authenticated, service_role;

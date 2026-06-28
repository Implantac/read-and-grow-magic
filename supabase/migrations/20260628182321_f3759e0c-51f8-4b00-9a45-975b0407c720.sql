
-- 1. Restrict permissions catalog read to service_role only (remove cross-tenant admin read)
DROP POLICY IF EXISTS permissions_read_admin ON public.permissions;
DROP POLICY IF EXISTS role_permissions_read_admin ON public.role_permissions;

-- 2. Allow authenticated users to insert their own AI prompt audit logs (scoped to their tenant)
DROP POLICY IF EXISTS ai_prompt_audit_authenticated_insert ON public.ai_prompt_audit_logs;
CREATE POLICY ai_prompt_audit_authenticated_insert
ON public.ai_prompt_audit_logs
FOR INSERT
TO authenticated
WITH CHECK (
  company_id IS NOT NULL
  AND company_id = get_user_company_id(auth.uid())
);

-- 3. Revoke anon/public EXECUTE on the trigger function (only the trigger context needs it)
REVOKE EXECUTE ON FUNCTION public.fn_route_stops_progress() FROM anon, PUBLIC;

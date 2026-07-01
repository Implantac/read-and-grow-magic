
-- Revoke anon EXECUTE from SECURITY DEFINER functions that must not be public
REVOKE EXECUTE ON FUNCTION public.purchase_approval_sla_status(uuid) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.purchase_approvals_metrics(timestamptz, timestamptz) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.purchase_approvals_sla_scan() FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.purchase_submit_for_approval(uuid) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.tg_notify_incident_email() FROM anon, PUBLIC;

GRANT EXECUTE ON FUNCTION public.purchase_approval_sla_status(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.purchase_approvals_metrics(timestamptz, timestamptz) TO authenticated;
GRANT EXECUTE ON FUNCTION public.purchase_approvals_sla_scan() TO authenticated;
GRANT EXECUTE ON FUNCTION public.purchase_submit_for_approval(uuid) TO authenticated;
-- tg_notify_incident_email is a trigger function; no user role needs EXECUTE

-- Add authenticated read policies for permissions catalog tables
DROP POLICY IF EXISTS "Authenticated can read permissions" ON public.permissions;
CREATE POLICY "Authenticated can read permissions"
  ON public.permissions FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Authenticated can read role_permissions" ON public.role_permissions;
CREATE POLICY "Authenticated can read role_permissions"
  ON public.role_permissions FOR SELECT
  TO authenticated
  USING (true);

GRANT SELECT ON public.permissions TO authenticated;
GRANT SELECT ON public.role_permissions TO authenticated;

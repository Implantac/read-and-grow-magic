
-- Restrict permissions catalog read to admins
DROP POLICY IF EXISTS permissions_read_authenticated ON public.permissions;
CREATE POLICY permissions_read_admin ON public.permissions
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Restrict role_permissions read to admins
DROP POLICY IF EXISTS role_permissions_read ON public.role_permissions;
CREATE POLICY role_permissions_read_admin ON public.role_permissions
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Tighten rfid_events: remove NULL-company admin branch
DROP POLICY IF EXISTS rfid_events_tenant_select ON public.rfid_events;
CREATE POLICY rfid_events_tenant_select ON public.rfid_events
  FOR SELECT TO authenticated
  USING (company_id = public.get_user_company_id(auth.uid()));

-- Backfill + enforce company_id NOT NULL for future rfid_events
UPDATE public.rfid_events SET company_id = NULL WHERE FALSE; -- no-op placeholder
ALTER TABLE public.rfid_events
  ALTER COLUMN company_id SET NOT NULL;

-- Revoke public execute on internal SECURITY DEFINER functions
REVOKE EXECUTE ON FUNCTION public.evaluate_workflow_triggers() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_current_usage_summary(uuid) FROM PUBLIC, anon;


-- Indexes for audit log queries
CREATE INDEX IF NOT EXISTS idx_audit_logs_company_created
  ON public.system_audit_logs (company_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_audit_logs_module_action
  ON public.system_audit_logs (module, action, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user_created
  ON public.system_audit_logs (user_id, created_at DESC);

-- Retention helper (service_role only)
CREATE OR REPLACE FUNCTION public.purge_old_audit_logs(_days integer DEFAULT 180)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_deleted integer;
BEGIN
  DELETE FROM public.system_audit_logs
  WHERE created_at < now() - make_interval(days => GREATEST(_days, 30));
  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  RETURN v_deleted;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.purge_old_audit_logs(integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.purge_old_audit_logs(integer) TO service_role;

-- Critical events view (tenant-scoped via RLS on base table)
CREATE OR REPLACE VIEW public.v_critical_audit_events
WITH (security_invoker = true)
AS
SELECT
  id, company_id, user_id, module, action, entity_name, entity_id,
  old_data, new_data, ip_address, created_at
FROM public.system_audit_logs
WHERE action IN ('DELETE','PERMISSION_CHANGE','ROLE_CHANGE','LOGIN_FAILED','EXPORT')
   OR module IN ('financial','permissions','user_roles','billing');

GRANT SELECT ON public.v_critical_audit_events TO authenticated;
GRANT ALL ON public.v_critical_audit_events TO service_role;

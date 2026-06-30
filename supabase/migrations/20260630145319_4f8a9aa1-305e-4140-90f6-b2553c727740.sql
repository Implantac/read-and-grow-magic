-- Fix SUPA_anon_security_definer_function_executable for internal WMS trigger helper
REVOKE EXECUTE ON FUNCTION public.fn_emit_wms_event() FROM anon;
GRANT EXECUTE ON FUNCTION public.fn_emit_wms_event() TO authenticated;
GRANT EXECUTE ON FUNCTION public.fn_emit_wms_event() TO service_role;

-- Keep global RBAC catalogs backend-only; access is via SECURITY DEFINER RPCs.
-- Ensure direct PostgREST access remains unavailable to authenticated/anon callers.
REVOKE SELECT ON public.permissions FROM anon;
REVOKE SELECT ON public.permissions FROM authenticated;
REVOKE SELECT ON public.role_permissions FROM anon;
REVOKE SELECT ON public.role_permissions FROM authenticated;
GRANT ALL ON public.permissions TO service_role;
GRANT ALL ON public.role_permissions TO service_role;
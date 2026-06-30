REVOKE EXECUTE ON FUNCTION public.fn_emit_wms_event() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.fn_emit_wms_event() FROM anon;
GRANT EXECUTE ON FUNCTION public.fn_emit_wms_event() TO authenticated;
GRANT EXECUTE ON FUNCTION public.fn_emit_wms_event() TO service_role;
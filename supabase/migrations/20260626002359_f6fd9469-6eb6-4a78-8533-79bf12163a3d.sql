
-- 1) Fix search_path em 4 funções
ALTER FUNCTION public.handle_updated_at() SET search_path = public;
ALTER FUNCTION public.update_updated_at_column() SET search_path = public;
ALTER FUNCTION public.check_hierarchy_access(uuid, uuid) SET search_path = public;
ALTER FUNCTION public.get_consolidated_revenue(uuid, uuid, uuid, date, date) SET search_path = public;

-- 2) Revogar EXECUTE de anon em SECURITY DEFINER expostas indevidamente
REVOKE EXECUTE ON FUNCTION public.fn_emit_automation_event(uuid, text, jsonb) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.fn_trigger_emit_automation_event() FROM anon, authenticated, public;
-- fn_trigger_emit_automation_event é trigger interno: ninguém precisa invocar diretamente

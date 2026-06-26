
REVOKE EXECUTE ON FUNCTION public.fn_audit_sensitive_mutation() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.fn_emit_automation_event(uuid, text, jsonb) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.check_hierarchy_access(uuid, uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.get_headquarters_branch(uuid) FROM PUBLIC, anon, authenticated;

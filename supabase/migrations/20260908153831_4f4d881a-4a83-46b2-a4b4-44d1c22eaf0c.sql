GRANT EXECUTE ON FUNCTION public.check_hierarchy_access(uuid, uuid) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.check_hierarchy_access(uuid, uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.get_usage_summary() FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.check_quota(text) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.get_usage_summary() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.check_quota(text) TO authenticated, service_role;
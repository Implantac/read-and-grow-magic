-- RESTORE CRITICAL AUTH/AUTHZ GRANTS
GRANT EXECUTE ON FUNCTION public.get_user_role(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_company_id(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_branch_id(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_branch_ids(uuid) TO authenticated;

-- Ensure service_role has them too
GRANT EXECUTE ON FUNCTION public.get_user_role(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role, uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.get_user_company_id(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.get_user_branch_id(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.get_user_branch_ids(uuid) TO service_role;

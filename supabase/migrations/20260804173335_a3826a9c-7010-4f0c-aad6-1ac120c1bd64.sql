-- RESTORE ESSENTIAL GRANTS for UI Rendering
GRANT SELECT ON public.plans TO authenticated;
GRANT SELECT ON public.plan_features TO authenticated;
GRANT SELECT ON public.subscriptions TO authenticated;
GRANT SELECT ON public.usage_tracking TO authenticated;

GRANT SELECT ON public.companies TO authenticated;
GRANT SELECT ON public.branches TO authenticated;
GRANT SELECT ON public.vw_organizational_hierarchy TO authenticated;

GRANT SELECT ON public.profiles TO authenticated;
GRANT SELECT ON public.user_roles TO authenticated;

GRANT EXECUTE ON FUNCTION public.get_current_plan() TO authenticated;

GRANT ALL ON public.plans TO service_role;
GRANT ALL ON public.plan_features TO service_role;
GRANT ALL ON public.subscriptions TO service_role;
GRANT ALL ON public.usage_tracking TO service_role;
GRANT ALL ON public.companies TO service_role;
GRANT ALL ON public.branches TO service_role;
GRANT ALL ON public.vw_organizational_hierarchy TO service_role;
GRANT ALL ON public.profiles TO service_role;
GRANT ALL ON public.user_roles TO service_role;
GRANT ALL ON FUNCTION public.get_current_plan() TO service_role;

-- Restaurar acesso SELECT para o papel authenticated em tabelas críticas de sistema
GRANT SELECT ON public.plans TO authenticated;
GRANT SELECT ON public.plan_features TO authenticated;
GRANT SELECT ON public.plan_modules TO authenticated;
GRANT SELECT ON public.subscriptions TO authenticated;
GRANT SELECT ON public.companies TO authenticated;
GRANT SELECT ON public.branches TO authenticated;
GRANT SELECT ON public.profiles TO authenticated;
GRANT SELECT ON public.vw_organizational_hierarchy TO authenticated;

-- Garantir acesso para o service_role
GRANT ALL ON public.plans TO service_role;
GRANT ALL ON public.plan_features TO service_role;
GRANT ALL ON public.plan_modules TO service_role;
GRANT ALL ON public.subscriptions TO service_role;
GRANT ALL ON public.companies TO service_role;
GRANT ALL ON public.branches TO service_role;
GRANT ALL ON public.profiles TO service_role;
GRANT ALL ON public.vw_organizational_hierarchy TO service_role;

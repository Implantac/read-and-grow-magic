-- RESTORE ESSENTIAL GRANTS for UI Rendering and Core Functionality
-- Following the security hardened baseline, we grant explicit access to core tables and views.

-- 1. Core Planning & Subscription Tables
GRANT SELECT ON public.plans TO authenticated;
GRANT SELECT ON public.plan_features TO authenticated;
GRANT SELECT ON public.subscriptions TO authenticated;
GRANT SELECT ON public.usage_tracking TO authenticated;

GRANT ALL ON public.plans TO service_role;
GRANT ALL ON public.plan_features TO service_role;
GRANT ALL ON public.subscriptions TO service_role;
GRANT ALL ON public.usage_tracking TO service_role;

-- 2. Organizational Hierarchy & Companies
GRANT SELECT ON public.companies TO authenticated;
GRANT SELECT ON public.branches TO authenticated;
GRANT SELECT ON public.vw_organizational_hierarchy TO authenticated;

GRANT ALL ON public.companies TO service_role;
GRANT ALL ON public.branches TO service_role;
GRANT ALL ON public.vw_organizational_hierarchy TO service_role;

-- 3. Identity & Roles
GRANT SELECT ON public.profiles TO authenticated;
GRANT SELECT ON public.user_roles TO authenticated;

GRANT ALL ON public.profiles TO service_role;
GRANT ALL ON public.user_roles TO service_role;

-- 4. Essential RPCs for UI
GRANT EXECUTE ON FUNCTION public.get_current_plan() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_current_plan() TO service_role;

-- Ensure RLS is enabled on these (if not already)
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plan_features ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Note: RLS policies themselves are assumed to be correctly defined 
-- (e.g., checking company_id or being public for plans).

-- Hardening Security: Fix RLS and Trigger Permissions

-- 1. Enable RLS on fiscal_cfop_reference (Audit cleanup)
ALTER TABLE public.fiscal_cfop_reference ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "fiscal_cfop_ref_select" ON public.fiscal_cfop_reference;
CREATE POLICY "fiscal_cfop_ref_select" ON public.fiscal_cfop_reference FOR SELECT TO authenticated USING (true);

-- 2. Revoke public execute on setup function
REVOKE EXECUTE ON FUNCTION public.fn_setup_new_company_fiscal() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.fn_setup_new_company_fiscal() TO service_role;

-- 3. Check for any anonymous-accessible tables that shouldn't be
-- The linter didn't complain about specific tables here, but let's be proactive with common culprits
REVOKE ALL ON public.profiles FROM anon;
GRANT SELECT ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;

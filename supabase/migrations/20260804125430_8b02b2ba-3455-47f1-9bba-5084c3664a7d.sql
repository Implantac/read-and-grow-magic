-- Security Hardening: Revoke EXECUTE and enforce RLS isolation

-- 1. Whitelist (Keep accessible to authenticated for RLS)
GRANT EXECUTE ON FUNCTION public.get_user_company_id(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;

-- 2. Revoke and Restrict
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.fn_setup_new_company_fiscal() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.recalc_bank_balance(uuid) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;
GRANT EXECUTE ON FUNCTION public.fn_setup_new_company_fiscal() TO service_role;
GRANT EXECUTE ON FUNCTION public.recalc_bank_balance(uuid) TO service_role;

-- 3. Enforce strict company_id isolation
-- Ensuring company_id exists and is scoped correctly for SELECT

DO $$
BEGIN
    -- Ensure columns exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='wms_logs' AND column_name='company_id') THEN
        ALTER TABLE public.wms_logs ADD COLUMN company_id UUID REFERENCES public.companies(id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='production_machines' AND column_name='company_id') THEN
        ALTER TABLE public.production_machines ADD COLUMN company_id UUID REFERENCES public.companies(id);
    END IF;

    -- Update policies
    DROP POLICY IF EXISTS "Auth users can read wms_logs" ON public.wms_logs;
    CREATE POLICY "wms_logs_isolation" ON public.wms_logs FOR SELECT TO authenticated USING (company_id = get_user_company_id(auth.uid()));

    DROP POLICY IF EXISTS "Auth users can read machines" ON public.production_machines;
    CREATE POLICY "production_machines_isolation" ON public.production_machines FOR SELECT TO authenticated USING (company_id = get_user_company_id(auth.uid()));
END $$;

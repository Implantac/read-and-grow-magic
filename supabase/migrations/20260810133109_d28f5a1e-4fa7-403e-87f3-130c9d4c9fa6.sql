
-- 1. CRM Hardening
ALTER TABLE public.sales_opportunities ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE;
ALTER TABLE public.follow_ups ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE;
ALTER TABLE public.sales_campaigns ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE;
ALTER TABLE public.seller_daily_targets ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE;

DROP POLICY IF EXISTS "Authenticated users can manage sales_opportunities" ON public.sales_opportunities;
CREATE POLICY "Authenticated users can manage sales_opportunities" ON public.sales_opportunities
    FOR ALL TO authenticated
    USING (company_id = public.get_user_company_id(auth.uid()))
    WITH CHECK (company_id = public.get_user_company_id(auth.uid()));

DROP POLICY IF EXISTS "Authenticated users can manage follow_ups" ON public.follow_ups;
CREATE POLICY "Authenticated users can manage follow_ups" ON public.follow_ups
    FOR ALL TO authenticated
    USING (company_id = public.get_user_company_id(auth.uid()))
    WITH CHECK (company_id = public.get_user_company_id(auth.uid()));

DROP POLICY IF EXISTS "Authenticated users can manage sales_campaigns" ON public.sales_campaigns;
CREATE POLICY "Authenticated users can manage sales_campaigns" ON public.sales_campaigns
    FOR ALL TO authenticated
    USING (company_id = public.get_user_company_id(auth.uid()))
    WITH CHECK (company_id = public.get_user_company_id(auth.uid()));

DROP POLICY IF EXISTS "Authenticated users can manage seller_daily_targets" ON public.seller_daily_targets;
CREATE POLICY "Authenticated users can manage seller_daily_targets" ON public.seller_daily_targets
    FOR ALL TO authenticated
    USING (company_id = public.get_user_company_id(auth.uid()))
    WITH CHECK (company_id = public.get_user_company_id(auth.uid()));

-- 2. WMS/Production Machine Hardening
ALTER TABLE public.production_machines ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE;

DROP POLICY IF EXISTS "Anyone can view machines" ON public.production_machines;
DROP POLICY IF EXISTS "Authenticated can insert machines" ON public.production_machines;
DROP POLICY IF EXISTS "Authenticated can update machines" ON public.production_machines;

CREATE POLICY "Users can view own company machines" ON public.production_machines
    FOR SELECT TO authenticated
    USING (company_id = public.get_user_company_id(auth.uid()));

CREATE POLICY "Admins can insert machines" ON public.production_machines
    FOR INSERT TO authenticated
    WITH CHECK (company_id = public.get_user_company_id(auth.uid()) AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update machines" ON public.production_machines
    FOR UPDATE TO authenticated
    USING (company_id = public.get_user_company_id(auth.uid()) AND public.has_role(auth.uid(), 'admin'))
    WITH CHECK (company_id = public.get_user_company_id(auth.uid()) AND public.has_role(auth.uid(), 'admin'));

-- 3. RBAC/Permissions Hardening
REVOKE ALL ON public.permissions FROM authenticated, anon;
GRANT SELECT ON public.permissions TO authenticated;
REVOKE ALL ON public.role_permissions FROM authenticated, anon;
GRANT SELECT ON public.role_permissions TO authenticated;

-- 4. Function Permissions
REVOKE EXECUTE ON FUNCTION public.has_permission(uuid, uuid, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.has_permission(uuid, uuid, text, text) TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.get_user_company_id(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_user_company_id(uuid) TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, service_role;

-- 5. Audit logs
CREATE TABLE IF NOT EXISTS public.security_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    company_id UUID REFERENCES public.companies(id),
    event_type TEXT NOT NULL,
    resource TEXT,
    details JSONB,
    ip_address TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.security_audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view audit logs" ON public.security_audit_logs
    FOR SELECT TO authenticated
    USING (public.has_role(auth.uid(), 'admin') AND company_id = public.get_user_company_id(auth.uid()));

GRANT INSERT ON public.security_audit_logs TO authenticated;
GRANT ALL ON public.security_audit_logs TO service_role;
GRANT SELECT ON public.security_audit_logs TO authenticated;

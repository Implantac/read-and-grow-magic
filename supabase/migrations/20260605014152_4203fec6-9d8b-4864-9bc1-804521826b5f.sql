
-- 1) financial_boletos: enforce company_id and remove NULL-readable branch
ALTER TABLE public.financial_boletos ALTER COLUMN company_id SET NOT NULL;

DROP POLICY IF EXISTS boletos_tenant_select ON public.financial_boletos;
CREATE POLICY boletos_tenant_select ON public.financial_boletos
  FOR SELECT TO authenticated
  USING (company_id = public.get_user_company_id(auth.uid()));

-- 2) profiles: deny client-side INSERT (trigger handles it via SECURITY DEFINER)
DROP POLICY IF EXISTS "Deny direct profile inserts" ON public.profiles;
CREATE POLICY "Deny direct profile inserts" ON public.profiles
  AS RESTRICTIVE
  FOR INSERT TO authenticated, anon
  WITH CHECK (false);

-- 3) companies: scope delete to own company, drop unrestricted insert
DROP POLICY IF EXISTS companies_delete_admin ON public.companies;
CREATE POLICY companies_delete_admin ON public.companies
  FOR DELETE TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin'::app_role)
    AND id = public.get_user_company_id(auth.uid())
  );

DROP POLICY IF EXISTS companies_insert_admin ON public.companies;
-- No client-side INSERT policy; companies are created via service_role (edge functions / signup trigger).

-- 4) ai_action_logs: add scoped INSERT for authenticated users
DROP POLICY IF EXISTS "Users can insert own action logs" ON public.ai_action_logs;
CREATE POLICY "Users can insert own action logs" ON public.ai_action_logs
  FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND company_id = public.get_user_company_id(auth.uid())
  );

-- 5) system_audit_logs: add scoped INSERT for authenticated users
DROP POLICY IF EXISTS audit_logs_insert_by_company ON public.system_audit_logs;
CREATE POLICY audit_logs_insert_by_company ON public.system_audit_logs
  FOR INSERT TO authenticated
  WITH CHECK (
    company_id IS NOT NULL
    AND company_id = public.get_user_company_id(auth.uid())
  );

-- 6) Revoke anon EXECUTE on SECURITY DEFINER has_role (3-arg, app_role)
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role, uuid) FROM anon, PUBLIC;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role, uuid) TO authenticated, service_role;

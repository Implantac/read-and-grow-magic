
-- 1. Harden has_role variants: drop NULL company_id wildcard.
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = _user_id
      AND ur.role = _role
      AND ur.company_id IS NOT NULL
      AND ur.company_id = public.get_user_company_id(_user_id)
  )
$$;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role text)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = _user_id
      AND ur.role::text = _role
      AND ur.company_id IS NOT NULL
      AND ur.company_id = public.get_user_company_id(_user_id)
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role text, _company_id uuid)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id
      AND role::text = _role
      AND company_id IS NOT NULL
      AND company_id = _company_id
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role, _company_id uuid)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
      AND company_id IS NOT NULL
      AND company_id = _company_id
  );
END;
$$;

-- Enforce NOT NULL going forward
ALTER TABLE public.user_roles ALTER COLUMN company_id SET NOT NULL;

-- 2. plan_modules: restrict to authenticated
DROP POLICY IF EXISTS "plan_modules read public" ON public.plan_modules;
DROP POLICY IF EXISTS "plan_modules admin write" ON public.plan_modules;

CREATE POLICY "plan_modules read authenticated"
  ON public.plan_modules FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "plan_modules admin write"
  ON public.plan_modules FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

REVOKE SELECT ON public.plan_modules FROM anon;

-- 3. financial_security_logs: explicit service_role insert
CREATE POLICY "service role inserts security logs"
  ON public.financial_security_logs FOR INSERT
  TO service_role
  WITH CHECK (true);

GRANT INSERT ON public.financial_security_logs TO service_role;

-- 4. pix_webhook_events: explicit service_role insert
CREATE POLICY "service role inserts pix webhook events"
  ON public.pix_webhook_events FOR INSERT
  TO service_role
  WITH CHECK (true);

GRANT INSERT ON public.pix_webhook_events TO service_role;

-- 5. Revoke anon EXECUTE on internal SECURITY DEFINER helpers
REVOKE EXECUTE ON FUNCTION public.fn_audit_sensitive_mutation() FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.get_headquarters_branch(uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.has_branch_access(uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.has_module_access(text) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.get_current_plan() FROM anon, public;

GRANT EXECUTE ON FUNCTION public.get_headquarters_branch(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_branch_access(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_module_access(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_current_plan() TO authenticated;

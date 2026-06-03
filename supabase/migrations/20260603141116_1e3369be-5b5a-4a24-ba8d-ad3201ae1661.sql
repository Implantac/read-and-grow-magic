
-- 1) Notifications: restrict SELECT to owner only
DROP POLICY IF EXISTS "Users can read own notifications" ON public.notifications;
CREATE POLICY "Users can read own notifications"
  ON public.notifications FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- 2) Open Finance connections: admin-only
DROP POLICY IF EXISTS of_admin_only ON public.open_finance_connections;
CREATE POLICY of_admin_only ON public.open_finance_connections
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- 3) SaaS invoices: require non-null tenant
DROP POLICY IF EXISTS "Company members view own invoices" ON public.saas_invoices;
CREATE POLICY "Company members view own invoices"
  ON public.saas_invoices FOR SELECT TO authenticated
  USING (
    has_role(auth.uid(), 'admin'::app_role)
    OR (
      company_id IS NOT NULL
      AND company_id = get_user_company_id(auth.uid())
    )
  );

-- 4) System parameters: restrict writes; restrict sensitive reads
DROP POLICY IF EXISTS "Auth users can read system_parameters" ON public.system_parameters;
DROP POLICY IF EXISTS "Auth users can insert system_parameters" ON public.system_parameters;
DROP POLICY IF EXISTS "Auth users can update system_parameters" ON public.system_parameters;
DROP POLICY IF EXISTS "Auth users can delete system_parameters" ON public.system_parameters;

CREATE POLICY "Read non-sensitive parameters"
  ON public.system_parameters FOR SELECT TO authenticated
  USING (sensitive = false OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins/managers insert parameters"
  ON public.system_parameters FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role));

CREATE POLICY "Admins/managers update parameters"
  ON public.system_parameters FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role));

CREATE POLICY "Admins delete parameters"
  ON public.system_parameters FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- 5) Fix mutable search_path on cleanup function
ALTER FUNCTION public.cleanup_expired_deleted_orders() SET search_path = public;

-- 6) Lock down SECURITY DEFINER functions
DO $$
DECLARE
  r record;
BEGIN
  FOR r IN
    SELECT p.oid,
           n.nspname,
           p.proname,
           pg_get_function_identity_arguments(p.oid) AS args,
           t.typname AS rettype
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    JOIN pg_type t ON t.oid = p.prorettype
    WHERE n.nspname = 'public' AND p.prosecdef = true
  LOOP
    EXECUTE format('REVOKE EXECUTE ON FUNCTION %I.%I(%s) FROM PUBLIC, anon',
                   r.nspname, r.proname, r.args);
    IF r.rettype = 'trigger' THEN
      EXECUTE format('REVOKE EXECUTE ON FUNCTION %I.%I(%s) FROM authenticated',
                     r.nspname, r.proname, r.args);
    END IF;
  END LOOP;
END$$;

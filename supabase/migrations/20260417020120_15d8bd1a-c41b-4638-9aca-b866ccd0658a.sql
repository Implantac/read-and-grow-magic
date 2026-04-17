
-- Drop all existing permissive policies on companies
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename='companies' LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.companies', r.policyname);
  END LOOP;
END $$;

ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

-- SELECT: own company, or admin sees all
CREATE POLICY companies_select_own ON public.companies
  FOR SELECT TO authenticated
  USING (
    id = public.get_user_company_id(auth.uid())
    OR public.has_role(auth.uid(), 'admin')
  );

-- INSERT: only global admins can create new tenants
CREATE POLICY companies_insert_admin ON public.companies
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- UPDATE: global admin, or admin/manager scoped to own company
CREATE POLICY companies_update_scoped ON public.companies
  FOR UPDATE TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin')
    OR (
      id = public.get_user_company_id(auth.uid())
      AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager'))
    )
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'admin')
    OR (
      id = public.get_user_company_id(auth.uid())
      AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager'))
    )
  );

-- DELETE: only global admin
CREATE POLICY companies_delete_admin ON public.companies
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

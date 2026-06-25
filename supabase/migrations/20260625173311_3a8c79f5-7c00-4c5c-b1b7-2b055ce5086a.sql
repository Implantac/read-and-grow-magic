
-- 1. Lock down global catalog tables
DROP POLICY IF EXISTS "permissions_admin_write" ON public.permissions;
CREATE POLICY "permissions_service_role_write" ON public.permissions
  FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "role_permissions_admin_write" ON public.role_permissions;
CREATE POLICY "role_permissions_service_role_write" ON public.role_permissions
  FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "plan_modules admin write" ON public.plan_modules;
CREATE POLICY "plan_modules_service_role_write" ON public.plan_modules
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- 2. user_permission_overrides: scope admin writes to same company
DROP POLICY IF EXISTS "upo_admin_write" ON public.user_permission_overrides;
CREATE POLICY "upo_admin_write" ON public.user_permission_overrides
  FOR ALL TO authenticated
  USING (
    company_id = public.get_user_company_id(auth.uid())
    AND public.has_role(auth.uid(), 'admin'::app_role, public.get_user_company_id(auth.uid()))
  )
  WITH CHECK (
    company_id = public.get_user_company_id(auth.uid())
    AND public.has_role(auth.uid(), 'admin'::app_role, public.get_user_company_id(auth.uid()))
  );

-- 3. financial_categories: backfill NULLs then enforce NOT NULL
UPDATE public.financial_categories
SET company_id = (SELECT id FROM public.companies ORDER BY created_at ASC LIMIT 1)
WHERE company_id IS NULL;
ALTER TABLE public.financial_categories ALTER COLUMN company_id SET NOT NULL;

DROP POLICY IF EXISTS "financial_categories_tenant_all" ON public.financial_categories;
CREATE POLICY "financial_categories_tenant_all" ON public.financial_categories
  FOR ALL TO authenticated
  USING (company_id = public.get_user_company_id(auth.uid()))
  WITH CHECK (
    company_id IS NOT NULL
    AND company_id = public.get_user_company_id(auth.uid())
  );

-- 4. financial_ledger: backfill NULLs via bank_account, else first company
UPDATE public.financial_ledger l
SET company_id = ba.company_id
FROM public.bank_accounts ba
WHERE l.company_id IS NULL
  AND l.bank_account_id = ba.id
  AND ba.company_id IS NOT NULL;

UPDATE public.financial_ledger
SET company_id = (SELECT id FROM public.companies ORDER BY created_at ASC LIMIT 1)
WHERE company_id IS NULL;

ALTER TABLE public.financial_ledger ALTER COLUMN company_id SET NOT NULL;

DROP POLICY IF EXISTS "ledger_tenant_insert" ON public.financial_ledger;
CREATE POLICY "ledger_tenant_insert" ON public.financial_ledger
  FOR INSERT TO authenticated
  WITH CHECK (
    company_id IS NOT NULL
    AND company_id = public.get_user_company_id(auth.uid())
    AND (
      public.has_role(auth.uid(), 'admin'::app_role, company_id)
      OR public.has_role(auth.uid(), 'manager'::app_role, company_id)
      OR public.has_role(auth.uid(), 'operator'::app_role, company_id)
    )
  );

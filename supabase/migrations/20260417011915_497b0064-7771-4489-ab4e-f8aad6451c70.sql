-- 1. Add company_id columns
ALTER TABLE public.accounts_payable ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES public.companies(id) ON DELETE SET NULL;
ALTER TABLE public.accounts_receivable ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES public.companies(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_accounts_payable_company_id ON public.accounts_payable(company_id);
CREATE INDEX IF NOT EXISTS idx_accounts_receivable_company_id ON public.accounts_receivable(company_id);

-- 2. Auto-fill company_id from user's profile on insert
CREATE OR REPLACE FUNCTION public.set_company_id_from_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.company_id IS NULL AND auth.uid() IS NOT NULL THEN
    NEW.company_id := public.get_user_company_id(auth.uid());
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_company_id_accounts_payable ON public.accounts_payable;
CREATE TRIGGER set_company_id_accounts_payable
  BEFORE INSERT ON public.accounts_payable
  FOR EACH ROW EXECUTE FUNCTION public.set_company_id_from_user();

DROP TRIGGER IF EXISTS set_company_id_accounts_receivable ON public.accounts_receivable;
CREATE TRIGGER set_company_id_accounts_receivable
  BEFORE INSERT ON public.accounts_receivable
  FOR EACH ROW EXECUTE FUNCTION public.set_company_id_from_user();

-- 3. Drop legacy permissive policies
DO $$
DECLARE pol record;
BEGIN
  FOR pol IN SELECT tablename, policyname FROM pg_policies
             WHERE schemaname='public' AND tablename IN ('accounts_payable','accounts_receivable')
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', pol.policyname, pol.tablename);
  END LOOP;
END $$;

ALTER TABLE public.accounts_payable ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounts_receivable ENABLE ROW LEVEL SECURITY;

-- 4. Tenant + role scoped policies for accounts_payable
CREATE POLICY "AP: company members can view"
ON public.accounts_payable FOR SELECT
TO authenticated
USING (
  (company_id IS NOT NULL AND company_id = public.get_user_company_id(auth.uid()))
  OR (company_id IS NULL AND public.has_role(auth.uid(), 'admin'))
);

CREATE POLICY "AP: managers can insert in own company"
ON public.accounts_payable FOR INSERT
TO authenticated
WITH CHECK (
  company_id = public.get_user_company_id(auth.uid())
  AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager') OR public.has_role(auth.uid(), 'operator'))
);

CREATE POLICY "AP: managers can update in own company"
ON public.accounts_payable FOR UPDATE
TO authenticated
USING (
  company_id = public.get_user_company_id(auth.uid())
  AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager') OR public.has_role(auth.uid(), 'operator'))
)
WITH CHECK (
  company_id = public.get_user_company_id(auth.uid())
  AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager') OR public.has_role(auth.uid(), 'operator'))
);

CREATE POLICY "AP: admins can delete in own company"
ON public.accounts_payable FOR DELETE
TO authenticated
USING (
  (company_id = public.get_user_company_id(auth.uid()) OR company_id IS NULL)
  AND public.has_role(auth.uid(), 'admin')
);

-- 5. Tenant + role scoped policies for accounts_receivable
CREATE POLICY "AR: company members can view"
ON public.accounts_receivable FOR SELECT
TO authenticated
USING (
  (company_id IS NOT NULL AND company_id = public.get_user_company_id(auth.uid()))
  OR (company_id IS NULL AND public.has_role(auth.uid(), 'admin'))
);

CREATE POLICY "AR: managers can insert in own company"
ON public.accounts_receivable FOR INSERT
TO authenticated
WITH CHECK (
  company_id = public.get_user_company_id(auth.uid())
  AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager') OR public.has_role(auth.uid(), 'operator'))
);

CREATE POLICY "AR: managers can update in own company"
ON public.accounts_receivable FOR UPDATE
TO authenticated
USING (
  company_id = public.get_user_company_id(auth.uid())
  AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager') OR public.has_role(auth.uid(), 'operator'))
)
WITH CHECK (
  company_id = public.get_user_company_id(auth.uid())
  AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager') OR public.has_role(auth.uid(), 'operator'))
);

CREATE POLICY "AR: admins can delete in own company"
ON public.accounts_receivable FOR DELETE
TO authenticated
USING (
  (company_id = public.get_user_company_id(auth.uid()) OR company_id IS NULL)
  AND public.has_role(auth.uid(), 'admin')
);
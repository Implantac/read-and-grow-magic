-- Harden NFC-e isolation by company and branch.
ALTER TABLE public.nfce
  ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id) ON DELETE RESTRICT,
  ADD COLUMN IF NOT EXISTS branch_id UUID REFERENCES public.branches(id) ON DELETE RESTRICT;

CREATE INDEX IF NOT EXISTS idx_nfce_company_branch
  ON public.nfce(company_id, branch_id, issue_date DESC);

UPDATE public.nfce
SET branch_id = public.get_headquarters_branch(company_id)
WHERE branch_id IS NULL AND company_id IS NOT NULL;

CREATE OR REPLACE FUNCTION public.set_nfce_tenant_context()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NOT NULL THEN
    NEW.company_id := public.get_user_company_id(auth.uid());
    NEW.branch_id := public.get_user_branch_id(auth.uid());
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_nfce_tenant_context ON public.nfce;
CREATE TRIGGER trg_nfce_tenant_context
  BEFORE INSERT ON public.nfce
  FOR EACH ROW
  EXECUTE FUNCTION public.set_nfce_tenant_context();

DROP POLICY IF EXISTS "Auth users can read nfce" ON public.nfce;
DROP POLICY IF EXISTS "Auth users can insert nfce" ON public.nfce;
DROP POLICY IF EXISTS "Auth users can update nfce" ON public.nfce;
DROP POLICY IF EXISTS "Auth users can delete nfce" ON public.nfce;
DROP POLICY IF EXISTS "NFCe isolated by company" ON public.nfce;
DROP POLICY IF EXISTS nfce_select ON public.nfce;
DROP POLICY IF EXISTS nfce_insert ON public.nfce;
DROP POLICY IF EXISTS nfce_update ON public.nfce;
DROP POLICY IF EXISTS nfce_delete ON public.nfce;
DROP POLICY IF EXISTS nfce_role_select ON public.nfce;
DROP POLICY IF EXISTS nfce_role_write ON public.nfce;
DROP POLICY IF EXISTS nfce_role_update ON public.nfce;
DROP POLICY IF EXISTS nfce_role_delete ON public.nfce;

CREATE POLICY nfce_tenant_select ON public.nfce
  FOR SELECT TO authenticated
  USING (
    company_id = public.get_user_company_id(auth.uid())
    AND (
      public.is_matriz_viewer(auth.uid())
      OR branch_id = public.get_user_branch_id(auth.uid())
    )
  );

CREATE POLICY nfce_tenant_insert ON public.nfce
  FOR INSERT TO authenticated
  WITH CHECK (
    company_id = public.get_user_company_id(auth.uid())
    AND (
      public.is_matriz_viewer(auth.uid())
      OR branch_id = public.get_user_branch_id(auth.uid())
    )
  );

CREATE POLICY nfce_tenant_update ON public.nfce
  FOR UPDATE TO authenticated
  USING (
    company_id = public.get_user_company_id(auth.uid())
    AND (
      public.is_matriz_viewer(auth.uid())
      OR branch_id = public.get_user_branch_id(auth.uid())
    )
  )
  WITH CHECK (
    company_id = public.get_user_company_id(auth.uid())
    AND (
      public.is_matriz_viewer(auth.uid())
      OR branch_id = public.get_user_branch_id(auth.uid())
    )
  );

CREATE POLICY nfce_tenant_delete ON public.nfce
  FOR DELETE TO authenticated
  USING (
    company_id = public.get_user_company_id(auth.uid())
    AND (
      public.is_matriz_viewer(auth.uid())
      OR branch_id = public.get_user_branch_id(auth.uid())
    )
  );

DROP POLICY IF EXISTS "Auth users can read nfce_items" ON public.nfce_items;
DROP POLICY IF EXISTS "Auth users can insert nfce_items" ON public.nfce_items;
DROP POLICY IF EXISTS "Auth users can update nfce_items" ON public.nfce_items;
DROP POLICY IF EXISTS "Auth users can delete nfce_items" ON public.nfce_items;
DROP POLICY IF EXISTS "NFCe items isolated by company" ON public.nfce_items;

CREATE POLICY nfce_items_tenant_select ON public.nfce_items
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.nfce WHERE nfce.id = nfce_items.nfce_id));

CREATE POLICY nfce_items_tenant_insert ON public.nfce_items
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.nfce WHERE nfce.id = nfce_items.nfce_id));

CREATE POLICY nfce_items_tenant_update ON public.nfce_items
  FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.nfce WHERE nfce.id = nfce_items.nfce_id))
  WITH CHECK (EXISTS (SELECT 1 FROM public.nfce WHERE nfce.id = nfce_items.nfce_id));

CREATE POLICY nfce_items_tenant_delete ON public.nfce_items
  FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.nfce WHERE nfce.id = nfce_items.nfce_id));
-- Fix CROSS_TENANT_DATA_EXPOSURE on saas_invoices
DROP POLICY IF EXISTS "Company members view own invoices" ON public.saas_invoices;
CREATE POLICY "Company members view own invoices"
ON public.saas_invoices
FOR SELECT
TO authenticated
USING (
  company_id = public.get_user_company_id(auth.uid())
  AND (
    public.has_role(auth.uid(), 'admin'::app_role, public.get_user_company_id(auth.uid()))
    OR public.has_role(auth.uid(), 'manager'::app_role, public.get_user_company_id(auth.uid()))
    OR public.has_role(auth.uid(), 'viewer'::app_role, public.get_user_company_id(auth.uid()))
    OR public.has_role(auth.uid(), 'operator'::app_role, public.get_user_company_id(auth.uid()))
  )
);

-- Fix MISSING_RLS_PROTECTION on ai_brain_memory (global scope insert must be company-scoped admin)
DO $$
DECLARE pol record;
BEGIN
  FOR pol IN
    SELECT policyname FROM pg_policies
    WHERE schemaname='public' AND tablename='ai_brain_memory' AND cmd='INSERT'
  LOOP
    EXECUTE format('DROP POLICY %I ON public.ai_brain_memory', pol.policyname);
  END LOOP;
END$$;

CREATE POLICY "ai_brain_memory_insert_scoped"
ON public.ai_brain_memory
FOR INSERT
TO authenticated
WITH CHECK (
  (
    scope = 'global'::text
    AND company_id = public.get_user_company_id(auth.uid())
    AND public.has_role(auth.uid(), 'admin'::app_role, public.get_user_company_id(auth.uid()))
  )
  OR (
    scope <> 'global'::text
    AND company_id = public.get_user_company_id(auth.uid())
  )
);
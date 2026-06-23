
DROP POLICY IF EXISTS "Company members view own invoices" ON public.saas_invoices;
CREATE POLICY "Company members view own invoices" ON public.saas_invoices
FOR SELECT USING (
  company_id IS NOT NULL AND company_id = get_user_company_id(auth.uid())
);

DROP POLICY IF EXISTS ai_brain_memory_insert ON public.ai_brain_memory;
CREATE POLICY ai_brain_memory_insert ON public.ai_brain_memory
FOR INSERT WITH CHECK (
  ((scope = 'user'::text) AND (user_id = auth.uid()))
  OR ((scope = 'company'::text) AND (company_id = get_user_company_id(auth.uid())) AND has_role(auth.uid(), 'admin'::app_role, get_user_company_id(auth.uid())))
  OR ((scope = 'global'::text) AND (company_id = get_user_company_id(auth.uid())) AND has_role(auth.uid(), 'admin'::app_role, get_user_company_id(auth.uid())))
);

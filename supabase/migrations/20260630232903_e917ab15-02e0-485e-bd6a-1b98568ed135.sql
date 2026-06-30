-- Add tenant-scoped RLS policies for ai_executive_decisions (RLS enabled, no policies)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_executive_decisions TO authenticated;
GRANT ALL ON public.ai_executive_decisions TO service_role;

CREATE POLICY "Tenant can read decisions"
ON public.ai_executive_decisions FOR SELECT TO authenticated
USING (company_id = public.get_user_company_id(auth.uid()));

CREATE POLICY "Tenant admins can insert decisions"
ON public.ai_executive_decisions FOR INSERT TO authenticated
WITH CHECK (
  company_id = public.get_user_company_id(auth.uid())
  AND (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'system_admin'))
);

CREATE POLICY "Tenant admins can update decisions"
ON public.ai_executive_decisions FOR UPDATE TO authenticated
USING (
  company_id = public.get_user_company_id(auth.uid())
  AND (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'system_admin'))
)
WITH CHECK (company_id = public.get_user_company_id(auth.uid()));

CREATE POLICY "Tenant admins can delete decisions"
ON public.ai_executive_decisions FOR DELETE TO authenticated
USING (
  company_id = public.get_user_company_id(auth.uid())
  AND (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'system_admin'))
);
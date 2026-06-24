
-- Fix ai_brain_memory policies: target authenticated role only
DROP POLICY IF EXISTS ai_brain_memory_select ON public.ai_brain_memory;
DROP POLICY IF EXISTS ai_brain_memory_update ON public.ai_brain_memory;
DROP POLICY IF EXISTS ai_brain_memory_delete ON public.ai_brain_memory;

CREATE POLICY ai_brain_memory_select ON public.ai_brain_memory
FOR SELECT TO authenticated
USING (
  ((scope = 'user') AND (user_id = auth.uid()))
  OR ((scope = 'company') AND (company_id = get_user_company_id(auth.uid())))
  OR ((scope = 'global') AND (company_id = get_user_company_id(auth.uid())) AND has_role(auth.uid(), 'admin'::app_role, get_user_company_id(auth.uid())))
);

CREATE POLICY ai_brain_memory_update ON public.ai_brain_memory
FOR UPDATE TO authenticated
USING (
  ((scope = 'user') AND (user_id = auth.uid()))
  OR ((scope = ANY (ARRAY['company','global'])) AND (company_id = get_user_company_id(auth.uid())) AND has_role(auth.uid(), 'admin'::app_role, get_user_company_id(auth.uid())))
);

CREATE POLICY ai_brain_memory_delete ON public.ai_brain_memory
FOR DELETE TO authenticated
USING (
  ((scope = 'user') AND (user_id = auth.uid()))
  OR ((scope = ANY (ARRAY['company','global'])) AND (company_id = get_user_company_id(auth.uid())) AND has_role(auth.uid(), 'admin'::app_role, get_user_company_id(auth.uid())))
);

-- Fix financial_ledger delete policy: target authenticated role only
DROP POLICY IF EXISTS "Admins can delete financial_ledger" ON public.financial_ledger;
CREATE POLICY "Admins can delete financial_ledger" ON public.financial_ledger
FOR DELETE TO authenticated
USING (
  (company_id = get_user_company_id(auth.uid()))
  AND has_role(auth.uid(), 'admin'::app_role, get_user_company_id(auth.uid()))
);

-- Fix feature_flags: restrict writes and reads to company scope; global flags = service_role only
DROP POLICY IF EXISTS feature_flags_write_admin ON public.feature_flags;
DROP POLICY IF EXISTS feature_flags_read_by_company ON public.feature_flags;
DROP POLICY IF EXISTS feature_flags_tenant_read ON public.feature_flags;

-- Authenticated users only see flags for their own company (not global)
CREATE POLICY feature_flags_tenant_read ON public.feature_flags
FOR SELECT TO authenticated
USING (company_id IS NOT NULL AND company_id = get_user_company_id(auth.uid()));

-- Company admins can only manage flags for their own company; global flags excluded
CREATE POLICY feature_flags_write_admin ON public.feature_flags
FOR ALL TO authenticated
USING (
  company_id IS NOT NULL
  AND company_id = get_user_company_id(auth.uid())
  AND has_role(auth.uid(), 'admin'::app_role, get_user_company_id(auth.uid()))
)
WITH CHECK (
  company_id IS NOT NULL
  AND company_id = get_user_company_id(auth.uid())
  AND has_role(auth.uid(), 'admin'::app_role, get_user_company_id(auth.uid()))
);

-- Global feature flags (company_id IS NULL) are accessible only via service_role
CREATE POLICY feature_flags_global_service_role ON public.feature_flags
FOR ALL TO service_role
USING (true) WITH CHECK (true);

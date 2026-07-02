
-- Remove NULL company_id bypass and enforce NOT NULL where safe

-- financial_boletos: tighten INSERT
DROP POLICY IF EXISTS "boletos_tenant_insert" ON public.financial_boletos;
CREATE POLICY "boletos_tenant_insert" ON public.financial_boletos
FOR INSERT TO authenticated
WITH CHECK (
  company_id IS NOT NULL
  AND company_id = get_user_company_id(auth.uid())
  AND (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role) OR has_role(auth.uid(), 'operator'::app_role))
);
UPDATE public.financial_boletos SET company_id = get_user_company_id(auth.uid()) WHERE company_id IS NULL AND false; -- no-op safeguard
ALTER TABLE public.financial_boletos ALTER COLUMN company_id SET NOT NULL;

-- accounts_payable
DROP POLICY IF EXISTS "AP: admins can delete in own company" ON public.accounts_payable;
CREATE POLICY "AP: admins can delete in own company" ON public.accounts_payable
FOR DELETE TO authenticated
USING (company_id = get_user_company_id(auth.uid()) AND has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "AP: company members can view" ON public.accounts_payable;
CREATE POLICY "AP: company members can view" ON public.accounts_payable
FOR SELECT TO authenticated
USING (company_id IS NOT NULL AND company_id = get_user_company_id(auth.uid()));

ALTER TABLE public.accounts_payable ALTER COLUMN company_id SET NOT NULL;

-- accounts_receivable
DROP POLICY IF EXISTS "AR: admins can delete in own company" ON public.accounts_receivable;
CREATE POLICY "AR: admins can delete in own company" ON public.accounts_receivable
FOR DELETE TO authenticated
USING (company_id = get_user_company_id(auth.uid()) AND has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "AR: company members can view" ON public.accounts_receivable;
CREATE POLICY "AR: company members can view" ON public.accounts_receivable
FOR SELECT TO authenticated
USING (company_id IS NOT NULL AND company_id = get_user_company_id(auth.uid()));

ALTER TABLE public.accounts_receivable ALTER COLUMN company_id SET NOT NULL;

-- credit_audit_logs
DROP POLICY IF EXISTS "Authenticated can insert credit_audit_logs for own company" ON public.credit_audit_logs;
CREATE POLICY "Authenticated can insert credit_audit_logs for own company" ON public.credit_audit_logs
FOR INSERT TO authenticated
WITH CHECK (company_id IS NOT NULL AND company_id = get_user_company_id(auth.uid()));

DROP POLICY IF EXISTS "Company admins/managers can read credit_audit_logs" ON public.credit_audit_logs;
CREATE POLICY "Company admins/managers can read credit_audit_logs" ON public.credit_audit_logs
FOR SELECT TO authenticated
USING (
  company_id IS NOT NULL
  AND company_id = get_user_company_id(auth.uid())
  AND (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role))
);

ALTER TABLE public.credit_audit_logs ALTER COLUMN company_id SET NOT NULL;


-- QA-007 / QA-008: tighten clients policies, remove null-company branches
DROP POLICY IF EXISTS clients_tenant_insert ON public.clients;
DROP POLICY IF EXISTS clients_tenant_select ON public.clients;

CREATE POLICY clients_tenant_insert ON public.clients
FOR INSERT TO authenticated
WITH CHECK (
  (has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'manager'::app_role)
    OR has_role(auth.uid(), 'operator'::app_role))
  AND company_id = get_user_company_id(auth.uid())
);

CREATE POLICY clients_tenant_select ON public.clients
FOR SELECT TO authenticated
USING (company_id = get_user_company_id(auth.uid()));

-- QA-009: per-tenant uniqueness of code
ALTER TABLE public.clients   DROP CONSTRAINT IF EXISTS clients_code_key;
ALTER TABLE public.suppliers DROP CONSTRAINT IF EXISTS suppliers_code_key;

CREATE UNIQUE INDEX IF NOT EXISTS clients_company_code_uidx
  ON public.clients (company_id, code) WHERE code IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS suppliers_company_code_uidx
  ON public.suppliers (company_id, code) WHERE code IS NOT NULL;

-- QA-010: per-tenant uniqueness of document (CNPJ/CPF)
CREATE UNIQUE INDEX IF NOT EXISTS clients_company_document_uidx
  ON public.clients (company_id, document)
  WHERE document IS NOT NULL AND document <> '';
CREATE UNIQUE INDEX IF NOT EXISTS suppliers_company_document_uidx
  ON public.suppliers (company_id, document)
  WHERE document IS NOT NULL AND document <> '';

-- QA-011: enforce company_id NOT NULL on suppliers / sales_reps
ALTER TABLE public.suppliers  ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE public.sales_reps ALTER COLUMN company_id SET NOT NULL;

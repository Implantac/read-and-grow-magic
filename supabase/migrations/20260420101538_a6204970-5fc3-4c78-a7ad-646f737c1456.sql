DROP VIEW IF EXISTS public.client_current_account;
DROP VIEW IF EXISTS public.supplier_current_account;

CREATE VIEW public.client_current_account
WITH (security_invoker = true) AS
SELECT
  ar.client_id, ar.client_name,
  ar.id AS document_id, 'receivable'::text AS document_type,
  ar.description, ar.invoice_number,
  ar.due_date AS date,
  ar.amount AS debit, COALESCE(ar.paid_amount,0) AS credit,
  ar.amount - COALESCE(ar.paid_amount,0) AS balance,
  ar.status, ar.created_at
FROM public.accounts_receivable ar
WHERE ar.client_id IS NOT NULL;

CREATE VIEW public.supplier_current_account
WITH (security_invoker = true) AS
SELECT
  ap.supplier AS supplier_name,
  ap.id AS document_id, 'payable'::text AS document_type,
  ap.description, ap.invoice_number,
  ap.due_date AS date,
  ap.amount AS debit, COALESCE(ap.paid_amount,0) AS credit,
  ap.amount - COALESCE(ap.paid_amount,0) AS balance,
  ap.status, ap.created_at
FROM public.accounts_payable ap;

GRANT SELECT ON public.client_current_account TO authenticated;
GRANT SELECT ON public.supplier_current_account TO authenticated;
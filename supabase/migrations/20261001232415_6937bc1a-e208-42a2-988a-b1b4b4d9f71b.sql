CREATE TABLE IF NOT EXISTS public.fiscal_emission_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_type text NOT NULL CHECK (document_type IN ('nfe','nfce','nfse','cte','mdfe')),
  document_id uuid NOT NULL,
  company_id uuid NOT NULL,
  branch_id uuid NOT NULL REFERENCES public.branches(id),
  canal_operacional public.canal_operacional NOT NULL,
  status text NOT NULL DEFAULT 'queued' CHECK (status IN ('queued','processing','authorized','rejected','cancelled')),
  idempotency_key text NOT NULL,
  attempt_count integer NOT NULL DEFAULT 0 CHECK (attempt_count >= 0),
  provider text, protocol text, access_key text,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  last_error text,
  queued_at timestamptz NOT NULL DEFAULT now(),
  started_at timestamptz, completed_at timestamptz,
  created_by uuid REFERENCES auth.users(id),
  UNIQUE (company_id, idempotency_key)
);
CREATE INDEX IF NOT EXISTS idx_fiscal_emission_jobs_queue ON public.fiscal_emission_jobs(status, queued_at) WHERE status IN ('queued','processing');
CREATE INDEX IF NOT EXISTS idx_fiscal_emission_jobs_company ON public.fiscal_emission_jobs(company_id, queued_at DESC);
GRANT SELECT ON public.fiscal_emission_jobs TO authenticated;
GRANT ALL ON public.fiscal_emission_jobs TO service_role;
ALTER TABLE public.fiscal_emission_jobs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS fiscal_emission_jobs_tenant ON public.fiscal_emission_jobs;
DROP POLICY IF EXISTS fiscal_emission_jobs_tenant_select ON public.fiscal_emission_jobs;
CREATE POLICY fiscal_emission_jobs_tenant_select ON public.fiscal_emission_jobs FOR SELECT TO authenticated
  USING (company_id = public.get_user_company_id(auth.uid()) AND
    (branch_id = public.get_user_branch_id(auth.uid()) OR public.is_matriz_viewer(auth.uid())));
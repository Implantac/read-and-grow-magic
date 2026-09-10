-- Fiscal issuance foundation for NF-e, NFC-e, NFS-e, CT-e and MDF-e.
-- The queue is the boundary between document creation and SEFAZ/city-provider transmission.

ALTER TABLE public.nfe
  ADD COLUMN IF NOT EXISTS branch_id uuid REFERENCES public.branches(id),
  ADD COLUMN IF NOT EXISTS canal_operacional public.canal_operacional NOT NULL DEFAULT 'ATACADO_INDUSTRIA';

ALTER TABLE public.nfce
  ADD COLUMN IF NOT EXISTS branch_id uuid REFERENCES public.branches(id),
  ADD COLUMN IF NOT EXISTS canal_operacional public.canal_operacional NOT NULL DEFAULT 'VAREJO_PDV';

ALTER TABLE public.cte
  ADD COLUMN IF NOT EXISTS company_id uuid,
  ADD COLUMN IF NOT EXISTS branch_id uuid REFERENCES public.branches(id),
  ADD COLUMN IF NOT EXISTS canal_operacional public.canal_operacional NOT NULL DEFAULT 'ATACADO_INDUSTRIA';

ALTER TABLE public.mdfe
  ADD COLUMN IF NOT EXISTS company_id uuid,
  ADD COLUMN IF NOT EXISTS branch_id uuid REFERENCES public.branches(id),
  ADD COLUMN IF NOT EXISTS canal_operacional public.canal_operacional NOT NULL DEFAULT 'ATACADO_INDUSTRIA';

CREATE TABLE IF NOT EXISTS public.nfse (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  number text NOT NULL,
  series text NOT NULL DEFAULT '1',
  access_key text,
  protocol text,
  issue_date timestamptz NOT NULL DEFAULT now(),
  authorization_date timestamptz,
  cancellation_date timestamptz,
  cancellation_reason text,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'pending', 'authorized', 'rejected', 'cancelled')),
  provider_name text NOT NULL,
  provider_document text NOT NULL,
  customer_name text NOT NULL,
  customer_document text,
  service_code text NOT NULL,
  service_description text NOT NULL,
  city_code text NOT NULL,
  service_value numeric NOT NULL DEFAULT 0 CHECK (service_value >= 0),
  deductions numeric NOT NULL DEFAULT 0 CHECK (deductions >= 0),
  iss_rate numeric NOT NULL DEFAULT 0 CHECK (iss_rate >= 0),
  iss_value numeric NOT NULL DEFAULT 0 CHECK (iss_value >= 0),
  total numeric NOT NULL DEFAULT 0 CHECK (total >= 0),
  xml_content text,
  company_id uuid NOT NULL,
  branch_id uuid NOT NULL REFERENCES public.branches(id),
  canal_operacional public.canal_operacional NOT NULL DEFAULT 'ATACADO_INDUSTRIA',
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (company_id, series, number)
);

CREATE INDEX IF NOT EXISTS idx_nfse_tenant_status
  ON public.nfse(company_id, branch_id, canal_operacional, status, issue_date DESC);

CREATE TABLE IF NOT EXISTS public.fiscal_emission_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_type text NOT NULL CHECK (document_type IN ('nfe', 'nfce', 'nfse', 'cte', 'mdfe')),
  document_id uuid NOT NULL,
  company_id uuid NOT NULL,
  branch_id uuid NOT NULL REFERENCES public.branches(id),
  canal_operacional public.canal_operacional NOT NULL,
  status text NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'processing', 'authorized', 'rejected', 'cancelled')),
  idempotency_key text NOT NULL,
  attempt_count integer NOT NULL DEFAULT 0 CHECK (attempt_count >= 0),
  provider text,
  protocol text,
  access_key text,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  last_error text,
  queued_at timestamptz NOT NULL DEFAULT now(),
  started_at timestamptz,
  completed_at timestamptz,
  created_by uuid REFERENCES auth.users(id),
  UNIQUE (company_id, idempotency_key)
);

CREATE INDEX IF NOT EXISTS idx_fiscal_emission_jobs_queue
  ON public.fiscal_emission_jobs(status, queued_at)
  WHERE status IN ('queued', 'processing');

CREATE OR REPLACE FUNCTION public.set_fiscal_document_context()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NOT NULL THEN
    IF NEW.company_id IS NULL THEN
      NEW.company_id := public.get_user_company_id(auth.uid());
    END IF;
    IF NEW.branch_id IS NULL THEN
      NEW.branch_id := public.get_user_branch_id(auth.uid());
    END IF;
  END IF;
  IF NEW.company_id IS NULL OR NEW.branch_id IS NULL THEN
    RAISE EXCEPTION 'Contexto fiscal incompleto: empresa e filial são obrigatórias';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_nfe_fiscal_context ON public.nfe;
CREATE TRIGGER trg_nfe_fiscal_context BEFORE INSERT ON public.nfe
FOR EACH ROW EXECUTE FUNCTION public.set_fiscal_document_context();

DROP TRIGGER IF EXISTS trg_nfce_fiscal_context ON public.nfce;
CREATE TRIGGER trg_nfce_fiscal_context BEFORE INSERT ON public.nfce
FOR EACH ROW EXECUTE FUNCTION public.set_fiscal_document_context();

DROP TRIGGER IF EXISTS trg_nfse_fiscal_context ON public.nfse;
CREATE TRIGGER trg_nfse_fiscal_context BEFORE INSERT ON public.nfse
FOR EACH ROW EXECUTE FUNCTION public.set_fiscal_document_context();

DROP TRIGGER IF EXISTS trg_cte_fiscal_context ON public.cte;
CREATE TRIGGER trg_cte_fiscal_context BEFORE INSERT ON public.cte
FOR EACH ROW EXECUTE FUNCTION public.set_fiscal_document_context();

DROP TRIGGER IF EXISTS trg_mdfe_fiscal_context ON public.mdfe;
CREATE TRIGGER trg_mdfe_fiscal_context BEFORE INSERT ON public.mdfe
FOR EACH ROW EXECUTE FUNCTION public.set_fiscal_document_context();

CREATE OR REPLACE FUNCTION public.enqueue_fiscal_emission(
  _document_type text,
  _document_id uuid,
  _payload jsonb DEFAULT '{}'::jsonb
) RETURNS public.fiscal_emission_jobs
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_company uuid := public.get_user_company_id(auth.uid());
  v_branch uuid := public.get_user_branch_id(auth.uid());
  v_document_company uuid;
  v_document_branch uuid;
  v_channel public.canal_operacional;
  v_job public.fiscal_emission_jobs;
  v_key text;
BEGIN
  IF auth.uid() IS NULL OR v_company IS NULL OR v_branch IS NULL THEN
    RAISE EXCEPTION 'Tenant fiscal não resolvido';
  END IF;
  IF _document_type NOT IN ('nfe', 'nfce', 'nfse', 'cte', 'mdfe') THEN
    RAISE EXCEPTION 'Tipo de documento fiscal inválido';
  END IF;

  CASE _document_type
    WHEN 'nfe' THEN
      SELECT company_id, branch_id, canal_operacional INTO v_document_company, v_document_branch, v_channel FROM public.nfe WHERE id = _document_id;
    WHEN 'nfce' THEN
      SELECT company_id, branch_id, canal_operacional INTO v_document_company, v_document_branch, v_channel FROM public.nfce WHERE id = _document_id;
    WHEN 'nfse' THEN
      SELECT company_id, branch_id, canal_operacional INTO v_document_company, v_document_branch, v_channel FROM public.nfse WHERE id = _document_id;
    WHEN 'cte' THEN
      SELECT company_id, branch_id, canal_operacional INTO v_document_company, v_document_branch, v_channel FROM public.cte WHERE id = _document_id;
    WHEN 'mdfe' THEN
      SELECT company_id, branch_id, canal_operacional INTO v_document_company, v_document_branch, v_channel FROM public.mdfe WHERE id = _document_id;
  END CASE;

  IF v_document_company IS NULL OR v_document_company <> v_company THEN
    RAISE EXCEPTION 'Documento fiscal não pertence ao tenant atual';
  END IF;
  IF v_document_branch IS NULL OR (v_document_branch <> v_branch AND NOT public.is_matriz_viewer(auth.uid())) THEN
    RAISE EXCEPTION 'Documento fiscal não pertence à filial atual';
  END IF;

  v_key := _document_type || ':' || _document_id::text;
  INSERT INTO public.fiscal_emission_jobs (
    document_type, document_id, company_id, branch_id, canal_operacional,
    idempotency_key, payload, created_by
  ) VALUES (
    _document_type, _document_id, v_company, v_document_branch, v_channel,
    v_key, COALESCE(_payload, '{}'::jsonb), auth.uid()
  )
  ON CONFLICT (company_id, idempotency_key) DO UPDATE
    SET payload = EXCLUDED.payload
  RETURNING * INTO v_job;

  RETURN v_job;
END;
$$;

CREATE OR REPLACE FUNCTION public.create_nfse_draft(_payload jsonb)
RETURNS public.nfse
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_company uuid := public.get_user_company_id(auth.uid());
  v_branch uuid := public.get_user_branch_id(auth.uid());
  v_nfse public.nfse;
  v_value numeric := COALESCE((_payload->>'service_value')::numeric, 0);
  v_deductions numeric := COALESCE((_payload->>'deductions')::numeric, 0);
  v_iss_rate numeric := COALESCE((_payload->>'iss_rate')::numeric, 0);
BEGIN
  IF auth.uid() IS NULL OR v_company IS NULL OR v_branch IS NULL THEN
    RAISE EXCEPTION 'Tenant fiscal não resolvido';
  END IF;
  IF v_value < 0 OR v_deductions < 0 OR v_deductions > v_value THEN
    RAISE EXCEPTION 'Valor de serviço ou deduções inválido';
  END IF;
  IF NULLIF(trim(_payload->>'provider_name'), '') IS NULL
     OR NULLIF(trim(_payload->>'provider_document'), '') IS NULL
     OR NULLIF(trim(_payload->>'customer_name'), '') IS NULL
     OR NULLIF(trim(_payload->>'service_code'), '') IS NULL
     OR NULLIF(trim(_payload->>'service_description'), '') IS NULL
     OR NULLIF(trim(_payload->>'city_code'), '') IS NULL THEN
    RAISE EXCEPTION 'Dados obrigatórios da NFS-e não informados';
  END IF;

  INSERT INTO public.nfse (
    number, provider_name, provider_document, customer_name, customer_document,
    service_code, service_description, city_code, service_value, deductions,
    iss_rate, iss_value, total, company_id, branch_id, canal_operacional, created_by
  ) VALUES (
    'NFSE-' || to_char(clock_timestamp(), 'YYYYMMDDHH24MISSMS'),
    trim(_payload->>'provider_name'), trim(_payload->>'provider_document'),
    trim(_payload->>'customer_name'), NULLIF(trim(_payload->>'customer_document'), ''),
    trim(_payload->>'service_code'), trim(_payload->>'service_description'),
    trim(_payload->>'city_code'), v_value, v_deductions,
    v_iss_rate, round((v_value - v_deductions) * v_iss_rate / 100, 2),
    v_value - v_deductions, v_company, v_branch, 'ATACADO_INDUSTRIA', auth.uid()
  ) RETURNING * INTO v_nfse;
  RETURN v_nfse;
END;
$$;

CREATE OR REPLACE FUNCTION public.complete_fiscal_emission(
  _job_id uuid,
  _status text,
  _protocol text DEFAULT NULL,
  _access_key text DEFAULT NULL,
  _error text DEFAULT NULL
) RETURNS public.fiscal_emission_jobs
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_job public.fiscal_emission_jobs;
BEGIN
  IF _status NOT IN ('authorized', 'rejected', 'cancelled') THEN
    RAISE EXCEPTION 'Status final de emissão inválido';
  END IF;
  UPDATE public.fiscal_emission_jobs
     SET status = _status,
         protocol = COALESCE(_protocol, protocol),
         access_key = COALESCE(_access_key, access_key),
         last_error = _error,
         completed_at = now()
   WHERE id = _job_id
   RETURNING * INTO v_job;
  IF v_job.id IS NULL THEN RAISE EXCEPTION 'Fila de emissão não encontrada'; END IF;
  RETURN v_job;
END;
$$;

ALTER TABLE public.nfse ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS nfse_tenant_select ON public.nfse;
DROP POLICY IF EXISTS nfse_tenant_write ON public.nfse;
CREATE POLICY nfse_tenant_select ON public.nfse FOR SELECT TO authenticated
  USING (company_id = public.get_user_company_id(auth.uid()) AND
    (branch_id = public.get_user_branch_id(auth.uid()) OR public.is_matriz_viewer(auth.uid())));
CREATE POLICY nfse_tenant_write ON public.nfse FOR ALL TO authenticated
  USING (company_id = public.get_user_company_id(auth.uid()) AND
    (branch_id = public.get_user_branch_id(auth.uid()) OR public.is_matriz_viewer(auth.uid())))
  WITH CHECK (company_id = public.get_user_company_id(auth.uid()) AND
    (branch_id = public.get_user_branch_id(auth.uid()) OR public.is_matriz_viewer(auth.uid())));

ALTER TABLE public.fiscal_emission_jobs ENABLE ROW LEVEL SECURITY;
CREATE POLICY fiscal_emission_jobs_tenant ON public.fiscal_emission_jobs FOR ALL TO authenticated
  USING (company_id = public.get_user_company_id(auth.uid()) AND
    (branch_id = public.get_user_branch_id(auth.uid()) OR public.is_matriz_viewer(auth.uid())))
  WITH CHECK (company_id = public.get_user_company_id(auth.uid()) AND
    (branch_id = public.get_user_branch_id(auth.uid()) OR public.is_matriz_viewer(auth.uid())));

REVOKE ALL ON FUNCTION public.complete_fiscal_emission(uuid, text, text, text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.complete_fiscal_emission(uuid, text, text, text, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.enqueue_fiscal_emission(text, uuid, jsonb) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.create_nfse_draft(jsonb) TO authenticated, service_role;
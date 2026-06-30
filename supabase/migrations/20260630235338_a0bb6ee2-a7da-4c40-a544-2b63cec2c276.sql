CREATE TABLE IF NOT EXISTS public.reinf_periods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  competencia DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'aberto' CHECK (status IN ('aberto','fechado','reaberto')),
  closed_at TIMESTAMPTZ,
  closed_by UUID,
  totals JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (company_id, competencia)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.reinf_periods TO authenticated;
GRANT ALL ON public.reinf_periods TO service_role;
ALTER TABLE public.reinf_periods ENABLE ROW LEVEL SECURITY;
CREATE POLICY "reinf_periods tenant read" ON public.reinf_periods
  FOR SELECT TO authenticated USING (company_id = public.get_user_company_id(auth.uid()));
CREATE POLICY "reinf_periods tenant write" ON public.reinf_periods
  FOR ALL TO authenticated
  USING (company_id = public.get_user_company_id(auth.uid()))
  WITH CHECK (company_id = public.get_user_company_id(auth.uid()));

CREATE TABLE IF NOT EXISTS public.reinf_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  period_id UUID NOT NULL REFERENCES public.reinf_periods(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN ('R-2010','R-4020','R-2099','R-4099')),
  status TEXT NOT NULL DEFAULT 'gerado' CHECK (status IN ('gerado','validado','assinado','transmitido','erro','cancelado')),
  cnpj_prestador TEXT,
  cnpj_beneficiario TEXT,
  cpf_beneficiario TEXT,
  source_table TEXT,
  source_id UUID,
  nota_fiscal TEXT,
  serie TEXT,
  data_emissao DATE,
  vr_bruto NUMERIC(15,2) NOT NULL DEFAULT 0,
  vr_base_inss NUMERIC(15,2) DEFAULT 0,
  vr_ret_inss NUMERIC(15,2) DEFAULT 0,
  vr_base_ir NUMERIC(15,2) DEFAULT 0,
  vr_ret_ir NUMERIC(15,2) DEFAULT 0,
  vr_base_csll NUMERIC(15,2) DEFAULT 0,
  vr_ret_csll NUMERIC(15,2) DEFAULT 0,
  vr_base_pis NUMERIC(15,2) DEFAULT 0,
  vr_ret_pis NUMERIC(15,2) DEFAULT 0,
  vr_base_cofins NUMERIC(15,2) DEFAULT 0,
  vr_ret_cofins NUMERIC(15,2) DEFAULT 0,
  cod_serv TEXT,
  cod_receita TEXT,
  xml_payload TEXT,
  validation_errors JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_reinf_events_company_period ON public.reinf_events(company_id, period_id);
CREATE INDEX IF NOT EXISTS idx_reinf_events_type ON public.reinf_events(event_type);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.reinf_events TO authenticated;
GRANT ALL ON public.reinf_events TO service_role;
ALTER TABLE public.reinf_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "reinf_events tenant read" ON public.reinf_events
  FOR SELECT TO authenticated USING (company_id = public.get_user_company_id(auth.uid()));
CREATE POLICY "reinf_events tenant write" ON public.reinf_events
  FOR ALL TO authenticated
  USING (company_id = public.get_user_company_id(auth.uid()))
  WITH CHECK (company_id = public.get_user_company_id(auth.uid()));

DROP TRIGGER IF EXISTS trg_reinf_periods_updated ON public.reinf_periods;
CREATE TRIGGER trg_reinf_periods_updated BEFORE UPDATE ON public.reinf_periods
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
DROP TRIGGER IF EXISTS trg_reinf_events_updated ON public.reinf_events;
CREATE TRIGGER trg_reinf_events_updated BEFORE UPDATE ON public.reinf_events
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.reinf_open_period(p_competencia DATE)
RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_company UUID := public.get_user_company_id(auth.uid()); v_id UUID;
BEGIN
  IF v_company IS NULL THEN RAISE EXCEPTION 'tenant_not_resolved'; END IF;
  INSERT INTO public.reinf_periods(company_id, competencia)
  VALUES (v_company, date_trunc('month', p_competencia)::date)
  ON CONFLICT (company_id, competencia) DO UPDATE SET updated_at = now()
  RETURNING id INTO v_id;
  RETURN v_id;
END; $$;
REVOKE ALL ON FUNCTION public.reinf_open_period(DATE) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.reinf_open_period(DATE) TO authenticated;

CREATE OR REPLACE FUNCTION public.reinf_generate_r2010(p_competencia DATE)
RETURNS INTEGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_company UUID := public.get_user_company_id(auth.uid()); v_period UUID; v_count INTEGER := 0;
BEGIN
  IF v_company IS NULL THEN RAISE EXCEPTION 'tenant_not_resolved'; END IF;
  v_period := public.reinf_open_period(p_competencia);
  DELETE FROM public.reinf_events
   WHERE company_id=v_company AND period_id=v_period AND event_type='R-2010' AND status IN ('gerado','erro');
  INSERT INTO public.reinf_events(
    company_id, period_id, event_type, status, cnpj_prestador, source_table, source_id,
    nota_fiscal, data_emissao, vr_bruto, vr_base_inss, vr_ret_inss, cod_serv)
  SELECT v_company, v_period, 'R-2010', 'gerado',
    s.cnpj_cpf, 'accounts_payable', ap.id, ap.document_number, ap.issue_date,
    COALESCE(ap.amount,0), COALESCE(ap.amount,0), ROUND(COALESCE(ap.amount,0)*0.11,2), '100000170'
  FROM public.accounts_payable ap
  JOIN public.suppliers s ON s.id = ap.supplier_id
  WHERE ap.company_id = v_company
    AND date_trunc('month', ap.issue_date) = date_trunc('month', p_competencia)
    AND COALESCE(ap.metadata->>'retencao_inss','false') = 'true';
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END; $$;
REVOKE ALL ON FUNCTION public.reinf_generate_r2010(DATE) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.reinf_generate_r2010(DATE) TO authenticated;

CREATE OR REPLACE FUNCTION public.reinf_generate_r4020(p_competencia DATE)
RETURNS INTEGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_company UUID := public.get_user_company_id(auth.uid()); v_period UUID; v_count INTEGER := 0;
BEGIN
  IF v_company IS NULL THEN RAISE EXCEPTION 'tenant_not_resolved'; END IF;
  v_period := public.reinf_open_period(p_competencia);
  DELETE FROM public.reinf_events
   WHERE company_id=v_company AND period_id=v_period AND event_type='R-4020' AND status IN ('gerado','erro');
  INSERT INTO public.reinf_events(
    company_id, period_id, event_type, status, cnpj_beneficiario, source_table, source_id,
    nota_fiscal, data_emissao, vr_bruto,
    vr_base_ir, vr_ret_ir, vr_base_csll, vr_ret_csll,
    vr_base_pis, vr_ret_pis, vr_base_cofins, vr_ret_cofins, cod_receita)
  SELECT v_company, v_period, 'R-4020', 'gerado',
    s.cnpj_cpf, 'accounts_payable', ap.id, ap.document_number, ap.issue_date,
    COALESCE(ap.amount,0),
    COALESCE(ap.amount,0), ROUND(COALESCE(ap.amount,0)*0.015,2),
    COALESCE(ap.amount,0), ROUND(COALESCE(ap.amount,0)*0.01,2),
    COALESCE(ap.amount,0), ROUND(COALESCE(ap.amount,0)*0.0065,2),
    COALESCE(ap.amount,0), ROUND(COALESCE(ap.amount,0)*0.03,2),
    '5952'
  FROM public.accounts_payable ap
  JOIN public.suppliers s ON s.id = ap.supplier_id
  WHERE ap.company_id = v_company
    AND date_trunc('month', ap.issue_date) = date_trunc('month', p_competencia)
    AND COALESCE(ap.metadata->>'retencao_pcc_ir','false') = 'true';
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END; $$;
REVOKE ALL ON FUNCTION public.reinf_generate_r4020(DATE) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.reinf_generate_r4020(DATE) TO authenticated;

CREATE OR REPLACE FUNCTION public.reinf_close_period(p_competencia DATE)
RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_company UUID := public.get_user_company_id(auth.uid()); v_period UUID; v_totals JSONB;
BEGIN
  IF v_company IS NULL THEN RAISE EXCEPTION 'tenant_not_resolved'; END IF;
  v_period := public.reinf_open_period(p_competencia);
  SELECT jsonb_build_object(
    'r2010_qtd', COUNT(*) FILTER (WHERE event_type='R-2010'),
    'r2010_inss', COALESCE(SUM(vr_ret_inss) FILTER (WHERE event_type='R-2010'),0),
    'r4020_qtd', COUNT(*) FILTER (WHERE event_type='R-4020'),
    'r4020_ir',     COALESCE(SUM(vr_ret_ir)     FILTER (WHERE event_type='R-4020'),0),
    'r4020_csll',   COALESCE(SUM(vr_ret_csll)   FILTER (WHERE event_type='R-4020'),0),
    'r4020_pis',    COALESCE(SUM(vr_ret_pis)    FILTER (WHERE event_type='R-4020'),0),
    'r4020_cofins', COALESCE(SUM(vr_ret_cofins) FILTER (WHERE event_type='R-4020'),0))
  INTO v_totals FROM public.reinf_events
  WHERE company_id=v_company AND period_id=v_period;
  DELETE FROM public.reinf_events
   WHERE company_id=v_company AND period_id=v_period AND event_type IN ('R-2099','R-4099');
  INSERT INTO public.reinf_events(company_id, period_id, event_type, status, vr_bruto) VALUES
    (v_company, v_period, 'R-2099', 'gerado', (v_totals->>'r2010_inss')::numeric),
    (v_company, v_period, 'R-4099', 'gerado',
       ((v_totals->>'r4020_ir')::numeric + (v_totals->>'r4020_csll')::numeric
      + (v_totals->>'r4020_pis')::numeric + (v_totals->>'r4020_cofins')::numeric));
  UPDATE public.reinf_periods SET status='fechado', closed_at=now(), closed_by=auth.uid(), totals=v_totals
   WHERE id=v_period;
  RETURN v_period;
END; $$;
REVOKE ALL ON FUNCTION public.reinf_close_period(DATE) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.reinf_close_period(DATE) TO authenticated;

CREATE OR REPLACE FUNCTION public.reinf_reopen_period(p_period_id UUID)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_company UUID := public.get_user_company_id(auth.uid());
BEGIN
  IF v_company IS NULL THEN RAISE EXCEPTION 'tenant_not_resolved'; END IF;
  UPDATE public.reinf_periods SET status='reaberto', closed_at=NULL, closed_by=NULL
   WHERE id=p_period_id AND company_id=v_company;
END; $$;
REVOKE ALL ON FUNCTION public.reinf_reopen_period(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.reinf_reopen_period(UUID) TO authenticated;
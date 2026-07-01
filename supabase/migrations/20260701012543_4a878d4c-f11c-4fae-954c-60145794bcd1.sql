
-- 1) Expandir constraint para R-2020
ALTER TABLE public.reinf_events DROP CONSTRAINT IF EXISTS reinf_events_event_type_check;
ALTER TABLE public.reinf_events ADD CONSTRAINT reinf_events_event_type_check
  CHECK (event_type = ANY (ARRAY['R-2010'::text, 'R-2020'::text, 'R-4020'::text, 'R-2099'::text, 'R-4099'::text]));

-- 2) RPC geradora R-2020 (INSS sobre serviços PRESTADOS pela empresa)
CREATE OR REPLACE FUNCTION public.reinf_generate_r2020(p_competencia date)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_company UUID := public.get_user_company_id(auth.uid());
  v_period  UUID;
  v_count   INTEGER := 0;
BEGIN
  IF v_company IS NULL THEN RAISE EXCEPTION 'tenant_not_resolved'; END IF;
  v_period := public.reinf_open_period(p_competencia);

  DELETE FROM public.reinf_events
   WHERE company_id = v_company
     AND period_id  = v_period
     AND event_type = 'R-2020'
     AND status IN ('gerado','erro');

  INSERT INTO public.reinf_events(
    company_id, period_id, event_type, status,
    cnpj_beneficiario,       -- CNPJ do cliente (tomador que reteve)
    cnpj_prestador,          -- CNPJ da própria empresa (opcional)
    source_table, source_id,
    nota_fiscal, data_emissao,
    vr_bruto, vr_base_inss, vr_ret_inss, cod_serv
  )
  SELECT
    v_company, v_period, 'R-2020', 'gerado',
    c.cnpj_cpf,
    (SELECT cnpj FROM public.companies WHERE id = v_company),
    'accounts_receivable', ar.id,
    ar.document_number, ar.issue_date,
    COALESCE(ar.amount, 0),
    COALESCE(ar.amount, 0),
    ROUND(COALESCE(ar.amount, 0) * 0.11, 2),
    '100000170'
  FROM public.accounts_receivable ar
  JOIN public.clients c ON c.id = ar.client_id
  WHERE ar.company_id = v_company
    AND date_trunc('month', ar.issue_date) = date_trunc('month', p_competencia)
    AND COALESCE(ar.metadata->>'retencao_inss','false') = 'true';

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

REVOKE ALL ON FUNCTION public.reinf_generate_r2020(date) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.reinf_generate_r2020(date) TO authenticated, service_role;

-- 3) Atualizar reinf_close_period para consolidar R-2020 nos totals
CREATE OR REPLACE FUNCTION public.reinf_close_period(p_competencia date)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_company UUID := public.get_user_company_id(auth.uid());
  v_period  UUID;
  v_totals  jsonb;
BEGIN
  IF v_company IS NULL THEN RAISE EXCEPTION 'tenant_not_resolved'; END IF;

  SELECT id INTO v_period
    FROM public.reinf_periods
   WHERE company_id = v_company
     AND competencia = date_trunc('month', p_competencia)::date;

  IF v_period IS NULL THEN RAISE EXCEPTION 'period_not_open'; END IF;

  SELECT jsonb_build_object(
    'r2010_qtd',   COUNT(*) FILTER (WHERE event_type='R-2010'),
    'r2010_inss',  COALESCE(SUM(vr_ret_inss) FILTER (WHERE event_type='R-2010'),0),
    'r2020_qtd',   COUNT(*) FILTER (WHERE event_type='R-2020'),
    'r2020_inss',  COALESCE(SUM(vr_ret_inss) FILTER (WHERE event_type='R-2020'),0),
    'r4020_qtd',   COUNT(*) FILTER (WHERE event_type='R-4020'),
    'r4020_ir',    COALESCE(SUM(vr_ret_ir) FILTER (WHERE event_type='R-4020'),0),
    'r4020_csll',  COALESCE(SUM(vr_ret_csll) FILTER (WHERE event_type='R-4020'),0),
    'r4020_pis',   COALESCE(SUM(vr_ret_pis) FILTER (WHERE event_type='R-4020'),0),
    'r4020_cofins',COALESCE(SUM(vr_ret_cofins) FILTER (WHERE event_type='R-4020'),0)
  ) INTO v_totals
  FROM public.reinf_events
  WHERE company_id = v_company AND period_id = v_period;

  -- Emitir/atualizar R-2099 (fechamento INSS) e R-4099 (fechamento demais retenções)
  DELETE FROM public.reinf_events
   WHERE company_id=v_company AND period_id=v_period
     AND event_type IN ('R-2099','R-4099');

  INSERT INTO public.reinf_events(company_id, period_id, event_type, status, data_emissao, vr_bruto)
  VALUES
    (v_company, v_period, 'R-2099', 'gerado', p_competencia,
     COALESCE((v_totals->>'r2010_inss')::numeric,0) + COALESCE((v_totals->>'r2020_inss')::numeric,0)),
    (v_company, v_period, 'R-4099', 'gerado', p_competencia,
     COALESCE((v_totals->>'r4020_ir')::numeric,0)
     + COALESCE((v_totals->>'r4020_csll')::numeric,0)
     + COALESCE((v_totals->>'r4020_pis')::numeric,0)
     + COALESCE((v_totals->>'r4020_cofins')::numeric,0));

  UPDATE public.reinf_periods
     SET status='fechado', closed_at=now(), closed_by=auth.uid(), totals=v_totals, updated_at=now()
   WHERE id=v_period;

  RETURN v_period;
END;
$$;

REVOKE ALL ON FUNCTION public.reinf_close_period(date) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.reinf_close_period(date) TO authenticated, service_role;

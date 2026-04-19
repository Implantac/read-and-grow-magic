-- ================================================================
-- FASE 3: Cenários de caixa, DRE dinâmica, alertas, classificação
-- ================================================================

-- 1) ALERTAS FINANCEIROS INTELIGENTES
CREATE TABLE IF NOT EXISTS public.financial_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_type text NOT NULL CHECK (alert_type IN ('negative_balance_forecast','revenue_drop','expense_spike','overdue_concentration','low_liquidity','custom')),
  severity text NOT NULL DEFAULT 'warning' CHECK (severity IN ('info','warning','critical')),
  title text NOT NULL,
  description text,
  metric_name text,
  metric_value numeric,
  threshold_value numeric,
  reference_date date,
  bank_account_id uuid REFERENCES public.bank_accounts(id) ON DELETE CASCADE,
  payload jsonb DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open','acknowledged','resolved','expired')),
  acknowledged_at timestamptz,
  acknowledged_by uuid,
  resolved_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_financial_alerts_status ON public.financial_alerts(status, severity);
CREATE INDEX IF NOT EXISTS idx_financial_alerts_created ON public.financial_alerts(created_at DESC);

ALTER TABLE public.financial_alerts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth read fin alerts" ON public.financial_alerts FOR SELECT TO authenticated USING (true);
CREATE POLICY "admin manage fin alerts" ON public.financial_alerts FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TRIGGER trg_fin_alerts_updated BEFORE UPDATE ON public.financial_alerts
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2) SUGESTÃO AUTOMÁTICA DE CATEGORIA
CREATE TABLE IF NOT EXISTS public.financial_category_suggestions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  party_name text NOT NULL,
  party_kind text NOT NULL CHECK (party_kind IN ('supplier','client')),
  category_id uuid,
  category_name text,
  usage_count integer NOT NULL DEFAULT 1,
  confidence numeric NOT NULL DEFAULT 0,
  last_used_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(party_name, party_kind, category_id)
);

CREATE INDEX IF NOT EXISTS idx_cat_sugg_party ON public.financial_category_suggestions(party_kind, party_name);

ALTER TABLE public.financial_category_suggestions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth read cat sugg" ON public.financial_category_suggestions FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth write cat sugg" ON public.financial_category_suggestions FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth update cat sugg" ON public.financial_category_suggestions FOR UPDATE TO authenticated USING (true);

-- ================================================================
-- 3) RPC: get_cashflow_scenarios
-- ================================================================
CREATE OR REPLACE FUNCTION public.get_cashflow_scenarios(_days integer DEFAULT 30)
RETURNS TABLE(
  day date,
  inflow_real numeric,
  outflow_real numeric,
  inflow_optimistic numeric,
  outflow_pessimistic numeric,
  balance_real numeric,
  balance_optimistic numeric,
  balance_pessimistic numeric
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_start_balance numeric;
  v_real numeric := 0;
  v_opt numeric := 0;
  v_pes numeric := 0;
  v_in_r numeric; v_out_r numeric; v_in_o numeric; v_out_p numeric;
  d date;
BEGIN
  SELECT COALESCE(SUM(balance),0) INTO v_start_balance FROM public.bank_accounts WHERE active = true;
  v_real := v_start_balance; v_opt := v_start_balance; v_pes := v_start_balance;

  FOR d IN SELECT generate_series(CURRENT_DATE, CURRENT_DATE + (_days - 1), '1 day'::interval)::date LOOP
    -- Realista: vencimentos do dia
    SELECT COALESCE(SUM(open_amount),0) INTO v_in_r
      FROM public.accounts_receivable
     WHERE due_date = d AND status IN ('pending','partial','overdue');
    SELECT COALESCE(SUM(open_amount),0) INTO v_out_r
      FROM public.accounts_payable
     WHERE due_date = d AND status IN ('pending','partial','overdue');

    -- Otimista: 100% recebimentos + 95% despesas
    v_in_o  := v_in_r * 1.0;
    -- Pessimista: 70% recebimentos + 110% despesas
    v_out_p := v_out_r * 1.10;

    v_real := v_real + v_in_r - v_out_r;
    v_opt  := v_opt  + v_in_o - (v_out_r * 0.95);
    v_pes  := v_pes  + (v_in_r * 0.70) - v_out_p;

    day := d;
    inflow_real := v_in_r;
    outflow_real := v_out_r;
    inflow_optimistic := v_in_o;
    outflow_pessimistic := v_out_p;
    balance_real := v_real;
    balance_optimistic := v_opt;
    balance_pessimistic := v_pes;
    RETURN NEXT;
  END LOOP;
END;
$$;

-- ================================================================
-- 4) RPC: get_dre_dynamic
-- ================================================================
CREATE OR REPLACE FUNCTION public.get_dre_dynamic(
  _from date,
  _to date,
  _cost_center_id uuid DEFAULT NULL,
  _channel text DEFAULT NULL
)
RETURNS TABLE(
  section text,
  category_id uuid,
  category_name text,
  total numeric
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT
    COALESCE(fc.dre_section, CASE WHEN l.type='inflow' THEN 'revenue' ELSE 'operating_expense' END) AS section,
    fc.id, COALESCE(fc.name,'Sem categoria'),
    SUM(CASE WHEN l.type='inflow' THEN l.amount ELSE -l.amount END)
  FROM public.financial_ledger l
  LEFT JOIN public.financial_categories fc ON fc.id = l.category_id
  LEFT JOIN public.accounts_receivable ar ON ar.id = l.source_id AND l.source = 'receivable'
  LEFT JOIN public.accounts_payable ap ON ap.id = l.source_id AND l.source = 'payable'
  WHERE l.entry_date BETWEEN _from AND _to
    AND (_cost_center_id IS NULL OR ap.cost_center_id = _cost_center_id OR ar.category = _channel)
    AND (_channel IS NULL OR COALESCE(ar.category, ap.category, '') ILIKE '%' || _channel || '%')
  GROUP BY fc.id, fc.name, fc.dre_section, l.type
  ORDER BY 1, 3;
$$;

-- ================================================================
-- 5) RPC: suggest_category
-- ================================================================
CREATE OR REPLACE FUNCTION public.suggest_category(_party_name text, _party_kind text)
RETURNS TABLE(category_id uuid, category_name text, confidence numeric, usage_count integer)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT category_id, category_name, confidence, usage_count
    FROM public.financial_category_suggestions
   WHERE party_kind = _party_kind
     AND party_name ILIKE '%' || _party_name || '%'
   ORDER BY usage_count DESC, last_used_at DESC
   LIMIT 5;
$$;

-- Trigger: atualiza sugestões a partir de novas contas com category_id
CREATE OR REPLACE FUNCTION public.learn_category_from_account()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_party text;
  v_kind text;
  v_cat_name text;
BEGIN
  IF NEW.category_id IS NULL THEN RETURN NEW; END IF;

  IF TG_TABLE_NAME = 'accounts_payable' THEN
    v_party := NEW.supplier; v_kind := 'supplier';
  ELSE
    v_party := NEW.client_name; v_kind := 'client';
  END IF;

  IF v_party IS NULL OR v_party = '' THEN RETURN NEW; END IF;

  SELECT name INTO v_cat_name FROM public.financial_categories WHERE id = NEW.category_id;

  INSERT INTO public.financial_category_suggestions (party_name, party_kind, category_id, category_name, usage_count, confidence, last_used_at)
  VALUES (v_party, v_kind, NEW.category_id, v_cat_name, 1, 0.5, now())
  ON CONFLICT (party_name, party_kind, category_id) DO UPDATE SET
    usage_count = financial_category_suggestions.usage_count + 1,
    confidence = LEAST(0.99, financial_category_suggestions.confidence + 0.05),
    last_used_at = now(),
    category_name = EXCLUDED.category_name;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_learn_category_payable ON public.accounts_payable;
CREATE TRIGGER trg_learn_category_payable AFTER INSERT OR UPDATE OF category_id ON public.accounts_payable
FOR EACH ROW EXECUTE FUNCTION public.learn_category_from_account();

DROP TRIGGER IF EXISTS trg_learn_category_receivable ON public.accounts_receivable;
CREATE TRIGGER trg_learn_category_receivable AFTER INSERT OR UPDATE OF category_id ON public.accounts_receivable
FOR EACH ROW EXECUTE FUNCTION public.learn_category_from_account();

-- ================================================================
-- 6) RPC: detect_financial_alerts
-- ================================================================
CREATE OR REPLACE FUNCTION public.detect_financial_alerts()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  r RECORD;
  v_created int := 0;
  v_curr_rev numeric;
  v_prev_rev numeric;
  v_curr_exp numeric;
  v_prev_exp numeric;
  v_drop numeric;
  v_spike numeric;
BEGIN
  -- Marcar alertas resolvidos como expirados se >30d
  UPDATE public.financial_alerts SET status='expired'
   WHERE status='open' AND created_at < now() - INTERVAL '30 days';

  -- A) Saldo negativo projetado em 30d por conta
  FOR r IN
    SELECT * FROM public.get_cashflow_scenarios(30)
     WHERE balance_real < 0
     LIMIT 5
  LOOP
    INSERT INTO public.financial_alerts (alert_type, severity, title, description,
      metric_name, metric_value, threshold_value, reference_date, payload)
    SELECT 'negative_balance_forecast', 'critical',
      'Saldo negativo projetado em ' || to_char(r.day,'DD/MM'),
      'O fluxo realista projeta saldo de R$ ' || to_char(r.balance_real,'FM999G999G990D00') || ' no dia ' || to_char(r.day,'DD/MM/YYYY'),
      'projected_balance', r.balance_real, 0, r.day,
      jsonb_build_object('day', r.day, 'inflow', r.inflow_real, 'outflow', r.outflow_real)
    WHERE NOT EXISTS (
      SELECT 1 FROM public.financial_alerts
       WHERE alert_type='negative_balance_forecast' AND reference_date=r.day AND status='open'
    );
    v_created := v_created + 1;
  END LOOP;

  -- B) Queda de receita (mês atual vs anterior)
  SELECT COALESCE(SUM(amount),0) INTO v_curr_rev
    FROM public.financial_ledger
   WHERE type='inflow' AND entry_date >= date_trunc('month', CURRENT_DATE)::date;
  SELECT COALESCE(SUM(amount),0) INTO v_prev_rev
    FROM public.financial_ledger
   WHERE type='inflow'
     AND entry_date >= (date_trunc('month', CURRENT_DATE) - INTERVAL '1 month')::date
     AND entry_date <  date_trunc('month', CURRENT_DATE)::date;

  IF v_prev_rev > 0 THEN
    v_drop := (v_prev_rev - v_curr_rev) / v_prev_rev * 100;
    IF v_drop > 20 THEN
      INSERT INTO public.financial_alerts (alert_type, severity, title, description, metric_name, metric_value, threshold_value, payload)
      SELECT 'revenue_drop',
        CASE WHEN v_drop > 40 THEN 'critical' ELSE 'warning' END,
        'Queda de receita: ' || round(v_drop,1) || '% vs mês anterior',
        'Receita atual R$ ' || to_char(v_curr_rev,'FM999G999G990D00') || ' contra R$ ' || to_char(v_prev_rev,'FM999G999G990D00'),
        'revenue_drop_pct', v_drop, 20,
        jsonb_build_object('current', v_curr_rev, 'previous', v_prev_rev)
      WHERE NOT EXISTS (
        SELECT 1 FROM public.financial_alerts
         WHERE alert_type='revenue_drop' AND status='open' AND created_at::date = CURRENT_DATE
      );
      v_created := v_created + 1;
    END IF;
  END IF;

  -- C) Aumento de despesas
  SELECT COALESCE(SUM(amount),0) INTO v_curr_exp
    FROM public.financial_ledger
   WHERE type='outflow' AND entry_date >= date_trunc('month', CURRENT_DATE)::date;
  SELECT COALESCE(SUM(amount),0) INTO v_prev_exp
    FROM public.financial_ledger
   WHERE type='outflow'
     AND entry_date >= (date_trunc('month', CURRENT_DATE) - INTERVAL '1 month')::date
     AND entry_date <  date_trunc('month', CURRENT_DATE)::date;

  IF v_prev_exp > 0 THEN
    v_spike := (v_curr_exp - v_prev_exp) / v_prev_exp * 100;
    IF v_spike > 25 THEN
      INSERT INTO public.financial_alerts (alert_type, severity, title, description, metric_name, metric_value, threshold_value, payload)
      SELECT 'expense_spike',
        CASE WHEN v_spike > 50 THEN 'critical' ELSE 'warning' END,
        'Aumento de despesas: +' || round(v_spike,1) || '% vs mês anterior',
        'Despesa atual R$ ' || to_char(v_curr_exp,'FM999G999G990D00') || ' contra R$ ' || to_char(v_prev_exp,'FM999G999G990D00'),
        'expense_spike_pct', v_spike, 25,
        jsonb_build_object('current', v_curr_exp, 'previous', v_prev_exp)
      WHERE NOT EXISTS (
        SELECT 1 FROM public.financial_alerts
         WHERE alert_type='expense_spike' AND status='open' AND created_at::date = CURRENT_DATE
      );
      v_created := v_created + 1;
    END IF;
  END IF;

  RETURN jsonb_build_object('ok', true, 'created', v_created, 'executed_at', now());
END;
$$;
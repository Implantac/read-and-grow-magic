-- =========================================
-- 1. PIX CHARGES
-- =========================================
CREATE TABLE IF NOT EXISTS public.pix_charges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  external_id text UNIQUE,
  txid text UNIQUE,
  receivable_id uuid REFERENCES public.accounts_receivable(id) ON DELETE SET NULL,
  client_id uuid REFERENCES public.clients(id) ON DELETE SET NULL,
  client_name text,
  client_document text,
  amount numeric(14,2) NOT NULL CHECK (amount > 0),
  description text,
  qr_code text,
  qr_code_image text,
  copy_paste text,
  expires_at timestamptz,
  paid_at timestamptz,
  payer_name text,
  payer_document text,
  end_to_end_id text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','paid','expired','cancelled','refunded')),
  bank_account_id uuid REFERENCES public.bank_accounts(id) ON DELETE SET NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_pix_charges_status ON public.pix_charges(status);
CREATE INDEX IF NOT EXISTS idx_pix_charges_receivable ON public.pix_charges(receivable_id);
CREATE INDEX IF NOT EXISTS idx_pix_charges_external ON public.pix_charges(external_id);

ALTER TABLE public.pix_charges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pix_charges_select" ON public.pix_charges FOR SELECT TO authenticated USING (true);
CREATE POLICY "pix_charges_insert" ON public.pix_charges FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'manager') OR public.has_role(auth.uid(),'operator'));
CREATE POLICY "pix_charges_update" ON public.pix_charges FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'manager') OR public.has_role(auth.uid(),'operator'));
CREATE POLICY "pix_charges_delete" ON public.pix_charges FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(),'admin'));

-- =========================================
-- 2. PIX WEBHOOK EVENTS (auditoria + idempotência)
-- =========================================
CREATE TABLE IF NOT EXISTS public.pix_webhook_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id text UNIQUE,
  txid text,
  end_to_end_id text,
  payload jsonb NOT NULL,
  processed boolean NOT NULL DEFAULT false,
  processed_at timestamptz,
  error_message text,
  signature text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_pix_webhook_txid ON public.pix_webhook_events(txid);
CREATE INDEX IF NOT EXISTS idx_pix_webhook_processed ON public.pix_webhook_events(processed);

ALTER TABLE public.pix_webhook_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pix_webhook_admin_only" ON public.pix_webhook_events FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- =========================================
-- 3. OPEN FINANCE CONNECTIONS
-- =========================================
CREATE TABLE IF NOT EXISTS public.open_finance_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bank_account_id uuid REFERENCES public.bank_accounts(id) ON DELETE CASCADE,
  provider text NOT NULL,
  bank_name text,
  consent_id text,
  access_token_encrypted text,
  refresh_token_encrypted text,
  token_expires_at timestamptz,
  last_sync_at timestamptz,
  last_sync_status text DEFAULT 'never',
  sync_frequency_minutes int DEFAULT 60,
  active boolean NOT NULL DEFAULT true,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.open_finance_connections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "of_admin_only" ON public.open_finance_connections FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'manager'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'manager'));

-- =========================================
-- 4. FINANCIAL HEALTH SCORES
-- =========================================
CREATE TABLE IF NOT EXISTS public.financial_health_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reference_date date NOT NULL DEFAULT CURRENT_DATE,
  score_total int NOT NULL CHECK (score_total BETWEEN 0 AND 100),
  score_grade text NOT NULL CHECK (score_grade IN ('A','B','C','D','E')),
  liquidity_score int,
  delinquency_score int,
  cashflow_score int,
  growth_score int,
  current_ratio numeric,
  cash_runway_days int,
  delinquency_rate numeric,
  recommendations jsonb DEFAULT '[]'::jsonb,
  details jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_fhs_date ON public.financial_health_scores(reference_date DESC);
ALTER TABLE public.financial_health_scores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "fhs_read" ON public.financial_health_scores FOR SELECT TO authenticated USING (true);
CREATE POLICY "fhs_write" ON public.financial_health_scores FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'manager'));

-- =========================================
-- 5. PREDICTIVE ALERTS
-- =========================================
CREATE TABLE IF NOT EXISTS public.financial_predictive_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_type text NOT NULL,
  severity text NOT NULL DEFAULT 'medium' CHECK (severity IN ('low','medium','high','critical')),
  title text NOT NULL,
  description text,
  predicted_date date,
  predicted_amount numeric,
  recommended_action text,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','acknowledged','resolved','dismissed')),
  acknowledged_at timestamptz,
  acknowledged_by uuid,
  resolved_at timestamptz,
  details jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_fpa_status ON public.financial_predictive_alerts(status, severity);
ALTER TABLE public.financial_predictive_alerts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "fpa_read" ON public.financial_predictive_alerts FOR SELECT TO authenticated USING (true);
CREATE POLICY "fpa_update" ON public.financial_predictive_alerts FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'manager'));
CREATE POLICY "fpa_insert" ON public.financial_predictive_alerts FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'manager'));

-- =========================================
-- 6. FUNCTION: match_bank_transaction
-- =========================================
CREATE OR REPLACE FUNCTION public.match_bank_transaction(_bank_tx_id uuid)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  tx record;
  match record;
BEGIN
  SELECT * INTO tx FROM bank_transactions WHERE id = _bank_tx_id;
  IF tx.id IS NULL THEN RETURN jsonb_build_object('ok',false,'reason','tx_not_found'); END IF;
  IF tx.matched_entry_id IS NOT NULL THEN RETURN jsonb_build_object('ok',true,'already_matched',true); END IF;

  SELECT l.* INTO match
    FROM financial_ledger l
   WHERE abs(l.amount - tx.amount) < 0.01
     AND l.entry_date BETWEEN (tx.date::date - 3) AND (tx.date::date + 3)
     AND ((tx.type='credit' AND l.type='inflow') OR (tx.type='debit' AND l.type='outflow'))
     AND NOT EXISTS (SELECT 1 FROM bank_transactions bt2 WHERE bt2.matched_entry_id = l.id)
   ORDER BY abs(EXTRACT(EPOCH FROM (l.entry_date::timestamptz - tx.date::timestamptz)))
   LIMIT 1;

  IF match.id IS NULL THEN
    UPDATE bank_transactions SET status='unmatched' WHERE id = tx.id;
    RETURN jsonb_build_object('ok',false,'reason','no_match');
  END IF;

  UPDATE bank_transactions SET matched_entry_id = match.id, status='matched' WHERE id = tx.id;
  UPDATE financial_ledger SET reconciled = true, bank_transaction_id = tx.id WHERE id = match.id;
  RETURN jsonb_build_object('ok',true,'matched_entry_id',match.id);
END; $$;

-- =========================================
-- 7. FUNCTION: process_pix_payment
-- =========================================
CREATE OR REPLACE FUNCTION public.process_pix_payment(_pix_charge_id uuid, _payer_name text, _payer_doc text, _e2e_id text)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  charge record;
  v_total numeric;
  v_paid numeric;
BEGIN
  SELECT * INTO charge FROM pix_charges WHERE id = _pix_charge_id FOR UPDATE;
  IF charge.id IS NULL THEN RETURN jsonb_build_object('ok',false,'reason','charge_not_found'); END IF;
  IF charge.status = 'paid' THEN RETURN jsonb_build_object('ok',true,'already_paid',true); END IF;

  UPDATE pix_charges
     SET status='paid', paid_at=now(), payer_name=_payer_name,
         payer_document=_payer_doc, end_to_end_id=_e2e_id, updated_at=now()
   WHERE id = _pix_charge_id;

  IF charge.receivable_id IS NOT NULL THEN
    SELECT amount, COALESCE(paid_amount,0) INTO v_total, v_paid
      FROM accounts_receivable WHERE id = charge.receivable_id FOR UPDATE;
    v_paid := v_paid + charge.amount;
    UPDATE accounts_receivable
       SET paid_amount = v_paid,
           open_amount = GREATEST(v_total - v_paid, 0),
           status = CASE WHEN v_total - v_paid <= 0.009 THEN 'paid' ELSE 'pending' END,
           payment_date = now(),
           payment_method = 'pix',
           updated_at = now()
     WHERE id = charge.receivable_id;
  END IF;

  INSERT INTO financial_ledger (
    entry_date, type, amount, description, bank_account_id,
    source, source_id, payment_method, reference
  ) VALUES (
    CURRENT_DATE, 'inflow', charge.amount,
    'PIX recebido — ' || COALESCE(charge.client_name,_payer_name,'pagador'),
    charge.bank_account_id, 'pix', charge.id, 'pix', _e2e_id
  );

  RETURN jsonb_build_object('ok',true,'amount',charge.amount,'receivable_id',charge.receivable_id);
END; $$;

-- =========================================
-- 8. FUNCTION: calculate_financial_health_score
-- =========================================
CREATE OR REPLACE FUNCTION public.calculate_financial_health_score()
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_cash numeric;
  v_receivable_30 numeric;
  v_payable_30 numeric;
  v_overdue numeric;
  v_total_recv numeric;
  v_avg_burn numeric;
  v_runway int;
  v_current_ratio numeric;
  v_delinq numeric;
  v_liq int; v_del int; v_cf int; v_grw int; v_total int;
  v_grade text;
  v_recs jsonb := '[]'::jsonb;
BEGIN
  SELECT COALESCE(SUM(balance),0) INTO v_cash FROM bank_accounts WHERE active=true;
  SELECT COALESCE(SUM(open_amount),0) INTO v_receivable_30
    FROM accounts_receivable WHERE status IN ('pending','partial') AND due_date <= CURRENT_DATE + 30;
  SELECT COALESCE(SUM(open_amount),0) INTO v_payable_30
    FROM accounts_payable WHERE status IN ('pending','partial') AND due_date <= CURRENT_DATE + 30;
  SELECT COALESCE(SUM(open_amount),0) INTO v_overdue
    FROM accounts_receivable WHERE status IN ('overdue','pending') AND due_date < CURRENT_DATE;
  SELECT COALESCE(SUM(amount),0) INTO v_total_recv
    FROM accounts_receivable WHERE created_at >= CURRENT_DATE - 90;

  SELECT COALESCE(AVG(daily),0) INTO v_avg_burn FROM (
    SELECT entry_date, SUM(CASE WHEN type='outflow' THEN amount ELSE 0 END) daily
      FROM financial_ledger WHERE entry_date >= CURRENT_DATE - 30 GROUP BY entry_date
  ) x;
  v_runway := CASE WHEN v_avg_burn > 0 THEN floor(v_cash / v_avg_burn)::int ELSE 999 END;
  v_current_ratio := CASE WHEN v_payable_30 > 0 THEN (v_cash + v_receivable_30) / v_payable_30 ELSE 99 END;
  v_delinq := CASE WHEN v_total_recv > 0 THEN (v_overdue / v_total_recv) * 100 ELSE 0 END;

  v_liq := LEAST(100, GREATEST(0, (v_current_ratio * 40)::int));
  v_del := GREATEST(0, 100 - (v_delinq * 2)::int);
  v_cf  := LEAST(100, GREATEST(0, v_runway * 2));
  v_grw := 70; -- placeholder, refinado depois com tendências

  v_total := ((v_liq + v_del + v_cf + v_grw) / 4)::int;
  v_grade := CASE
    WHEN v_total >= 85 THEN 'A' WHEN v_total >= 70 THEN 'B'
    WHEN v_total >= 55 THEN 'C' WHEN v_total >= 40 THEN 'D' ELSE 'E' END;

  IF v_runway < 30 THEN v_recs := v_recs || jsonb_build_object('priority','high','msg', format('Caixa para apenas %s dias - acelere recebimentos', v_runway)); END IF;
  IF v_delinq > 10 THEN v_recs := v_recs || jsonb_build_object('priority','high','msg', format('Inadimplência em %.1f%% - intensifique cobrança', v_delinq)); END IF;
  IF v_current_ratio < 1 THEN v_recs := v_recs || jsonb_build_object('priority','critical','msg','Liquidez corrente abaixo de 1.0 - risco de inadimplência'); END IF;

  INSERT INTO financial_health_scores(
    reference_date, score_total, score_grade,
    liquidity_score, delinquency_score, cashflow_score, growth_score,
    current_ratio, cash_runway_days, delinquency_rate, recommendations,
    details
  ) VALUES (
    CURRENT_DATE, v_total, v_grade,
    v_liq, v_del, v_cf, v_grw,
    v_current_ratio, v_runway, v_delinq, v_recs,
    jsonb_build_object('cash',v_cash,'receivable_30',v_receivable_30,'payable_30',v_payable_30,'overdue',v_overdue,'avg_daily_burn',v_avg_burn)
  );

  RETURN jsonb_build_object('score',v_total,'grade',v_grade,'runway_days',v_runway);
END; $$;

-- =========================================
-- 9. FUNCTION: detect_cashflow_risks (alertas preditivos)
-- =========================================
CREATE OR REPLACE FUNCTION public.detect_cashflow_risks()
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_cash numeric;
  v_running numeric;
  d date;
  v_alerts int := 0;
  v_critical_date date;
  v_critical_balance numeric;
BEGIN
  SELECT COALESCE(SUM(balance),0) INTO v_cash FROM bank_accounts WHERE active=true;
  v_running := v_cash;

  FOR d IN SELECT generate_series(CURRENT_DATE, CURRENT_DATE + 30, '1 day'::interval)::date LOOP
    SELECT v_running
      + COALESCE((SELECT SUM(open_amount) FROM accounts_receivable WHERE due_date = d AND status IN ('pending','partial')),0)
      - COALESCE((SELECT SUM(open_amount) FROM accounts_payable WHERE due_date = d AND status IN ('pending','partial')),0)
    INTO v_running;
    IF v_running < 0 AND v_critical_date IS NULL THEN
      v_critical_date := d;
      v_critical_balance := v_running;
    END IF;
  END LOOP;

  IF v_critical_date IS NOT NULL THEN
    -- evita duplicar alerta ativo
    IF NOT EXISTS (SELECT 1 FROM financial_predictive_alerts WHERE alert_type='cashflow_negative' AND status='active' AND predicted_date=v_critical_date) THEN
      INSERT INTO financial_predictive_alerts(alert_type, severity, title, description, predicted_date, predicted_amount, recommended_action, details)
      VALUES ('cashflow_negative','critical',
              'Saldo negativo previsto em ' || to_char(v_critical_date,'DD/MM'),
              format('Projeção indica saldo de R$ %.2f em %s. Ação imediata necessária.', v_critical_balance, to_char(v_critical_date,'DD/MM/YYYY')),
              v_critical_date, v_critical_balance,
              'Acelerar recebimentos pendentes ou negociar adiamento de pagamentos',
              jsonb_build_object('current_cash',v_cash,'projected_balance',v_critical_balance));
      v_alerts := v_alerts + 1;
    END IF;
  END IF;

  RETURN jsonb_build_object('alerts_created',v_alerts,'critical_date',v_critical_date,'projected_balance',v_critical_balance);
END; $$;
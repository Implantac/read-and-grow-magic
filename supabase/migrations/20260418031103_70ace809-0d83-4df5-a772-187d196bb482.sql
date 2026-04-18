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
  v_grw := 70;

  v_total := ((v_liq + v_del + v_cf + v_grw) / 4)::int;
  v_grade := CASE
    WHEN v_total >= 85 THEN 'A' WHEN v_total >= 70 THEN 'B'
    WHEN v_total >= 55 THEN 'C' WHEN v_total >= 40 THEN 'D' ELSE 'E' END;

  IF v_runway < 30 THEN
    v_recs := v_recs || jsonb_build_object('priority','high','msg', 'Caixa para apenas ' || v_runway || ' dias - acelere recebimentos');
  END IF;
  IF v_delinq > 10 THEN
    v_recs := v_recs || jsonb_build_object('priority','high','msg', 'Inadimplência em ' || round(v_delinq,1) || '% - intensifique cobrança');
  END IF;
  IF v_current_ratio < 1 THEN
    v_recs := v_recs || jsonb_build_object('priority','critical','msg','Liquidez corrente abaixo de 1.0 - risco de inadimplência');
  END IF;

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
    IF NOT EXISTS (SELECT 1 FROM financial_predictive_alerts WHERE alert_type='cashflow_negative' AND status='active' AND predicted_date=v_critical_date) THEN
      INSERT INTO financial_predictive_alerts(alert_type, severity, title, description, predicted_date, predicted_amount, recommended_action, details)
      VALUES ('cashflow_negative','critical',
              'Saldo negativo previsto em ' || to_char(v_critical_date,'DD/MM'),
              'Projeção indica saldo de R$ ' || round(v_critical_balance,2) || ' em ' || to_char(v_critical_date,'DD/MM/YYYY') || '. Ação imediata necessária.',
              v_critical_date, v_critical_balance,
              'Acelerar recebimentos pendentes ou negociar adiamento de pagamentos',
              jsonb_build_object('current_cash',v_cash,'projected_balance',v_critical_balance));
      v_alerts := v_alerts + 1;
    END IF;
  END IF;

  RETURN jsonb_build_object('alerts_created',v_alerts,'critical_date',v_critical_date,'projected_balance',v_critical_balance);
END; $$;
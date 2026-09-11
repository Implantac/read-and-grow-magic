CREATE OR REPLACE FUNCTION public.batch_pay_payables(
  _payable_ids uuid[],
  _bank_account_id uuid,
  _payment_method text,
  _payment_date date DEFAULT CURRENT_DATE,
  _notes text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_company_id uuid := public.get_user_company_id(auth.uid());
  v_payable record;
  v_paid_count integer := 0;
  v_total numeric := 0;
  v_settle_id uuid;
  v_open numeric;
BEGIN
  IF auth.uid() IS NULL OR v_company_id IS NULL THEN RAISE EXCEPTION 'Usuário ou empresa não identificados'; END IF;
  IF _bank_account_id IS NULL THEN RAISE EXCEPTION 'Conta bancária obrigatória'; END IF;
  IF array_length(_payable_ids, 1) IS NULL THEN RAISE EXCEPTION 'Nenhuma conta selecionada'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.bank_accounts WHERE id = _bank_account_id AND company_id = v_company_id) THEN
    RAISE EXCEPTION 'Conta bancária não pertence à empresa ativa';
  END IF;

  FOR v_payable IN
    SELECT * FROM public.accounts_payable
     WHERE id = ANY(_payable_ids) AND company_id = v_company_id
       AND status IN ('pending', 'overdue', 'partial')
     FOR UPDATE
  LOOP
    v_open := GREATEST(v_payable.amount - COALESCE(v_payable.paid_amount, 0), 0);
    IF v_open <= 0 THEN CONTINUE; END IF;

    INSERT INTO public.financial_settlements (
      source_type, source_id, amount, total_settled, settlement_date,
      payment_method, bank_account_id, notes, status, company_id, created_by
    ) VALUES (
      'payable', v_payable.id, v_open, v_open, _payment_date,
      _payment_method, _bank_account_id, COALESCE(_notes, 'Pagamento em lote'),
      'active', v_company_id, auth.uid()
    ) RETURNING id INTO v_settle_id;

    UPDATE public.accounts_payable
       SET paid_amount = v_payable.amount, open_amount = 0, status = 'paid',
           payment_date = _payment_date, payment_method = _payment_method,
           bank_account_id = _bank_account_id, updated_at = now()
     WHERE id = v_payable.id AND company_id = v_company_id;

    INSERT INTO public.financial_ledger (
      entry_date, type, amount, description, bank_account_id,
      source, source_id, payment_method, reference, company_id, created_by
    ) VALUES (
      _payment_date, 'outflow', v_open,
      'Pagamento lote: ' || v_payable.description || ' — ' || v_payable.supplier,
      _bank_account_id, 'batch_pay', v_payable.id, _payment_method,
      v_settle_id::text, v_company_id, auth.uid()
    );

    v_paid_count := v_paid_count + 1;
    v_total := v_total + v_open;
  END LOOP;

  INSERT INTO public.financial_operations_log(
    operation_type, entity_type, entity_id, amount, payload, user_id, company_id
  ) VALUES (
    'batch_pay', 'payable', NULL, v_total,
    jsonb_build_object('count', v_paid_count, 'ids', _payable_ids), auth.uid(), v_company_id
  );

  RETURN jsonb_build_object('ok', true, 'paid_count', v_paid_count, 'total', v_total);
END;
$$;

CREATE OR REPLACE FUNCTION public.reverse_settlement(_settlement_id uuid, _reason text DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_company_id uuid := public.get_user_company_id(auth.uid());
  v_settlement record;
BEGIN
  IF auth.uid() IS NULL OR v_company_id IS NULL THEN RAISE EXCEPTION 'Usuário ou empresa não identificados'; END IF;

  SELECT * INTO v_settlement FROM public.financial_settlements
   WHERE id = _settlement_id AND company_id = v_company_id FOR UPDATE;
  IF v_settlement.id IS NULL THEN RAISE EXCEPTION 'Baixa não encontrada'; END IF;
  IF v_settlement.status = 'reversed' THEN RAISE EXCEPTION 'Baixa já estornada'; END IF;

  IF v_settlement.ledger_id IS NOT NULL THEN
    INSERT INTO public.financial_ledger (
      entry_date, type, amount, description, bank_account_id, source,
      source_id, payment_method, notes, company_id, created_by
    )
    SELECT CURRENT_DATE, CASE WHEN type = 'inflow' THEN 'outflow' ELSE 'inflow' END,
           amount, 'ESTORNO: ' || description, bank_account_id, 'reversal',
           v_settlement.id, payment_method, COALESCE(_reason, 'Estorno de baixa'),
           v_company_id, auth.uid()
      FROM public.financial_ledger
     WHERE id = v_settlement.ledger_id AND company_id = v_company_id;
  END IF;

  IF v_settlement.source_type = 'receivable' THEN
    UPDATE public.accounts_receivable
       SET paid_amount = GREATEST(COALESCE(paid_amount, 0) - v_settlement.total_settled, 0),
           open_amount = LEAST(amount, COALESCE(open_amount, 0) + v_settlement.total_settled),
           status = 'pending', payment_date = NULL, updated_at = now()
     WHERE id = v_settlement.source_id AND company_id = v_company_id;
  ELSIF v_settlement.source_type = 'payable' THEN
    UPDATE public.accounts_payable
       SET paid_amount = GREATEST(COALESCE(paid_amount, 0) - v_settlement.total_settled, 0),
           open_amount = LEAST(amount, COALESCE(open_amount, 0) + v_settlement.total_settled),
           status = 'pending', payment_date = NULL, updated_at = now()
     WHERE id = v_settlement.source_id AND company_id = v_company_id;
  END IF;

  UPDATE public.financial_settlements
     SET status = 'reversed', reversed_at = now(), reversed_by = auth.uid(),
         notes = COALESCE(notes, '') || ' | ESTORNO: ' || COALESCE(_reason, 'sem motivo')
   WHERE id = _settlement_id AND company_id = v_company_id;

  INSERT INTO public.financial_operations_log(
    operation_type, entity_type, entity_id, amount, payload, user_id, company_id
  ) VALUES (
    'settlement_reversed', v_settlement.source_type, v_settlement.source_id,
    v_settlement.total_settled,
    jsonb_build_object('settlement_id', _settlement_id, 'reason', _reason),
    auth.uid(), v_company_id
  );

  RETURN jsonb_build_object('ok', true, 'reversed', _settlement_id);
END;
$$;

CREATE OR REPLACE FUNCTION public.evaluate_transaction_risk(
  _amount numeric,
  _entity_type text DEFAULT NULL,
  _entity_id uuid DEFAULT NULL,
  _source text DEFAULT NULL,
  _payment_method text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_company_id uuid := public.get_user_company_id(auth.uid());
  v_score integer := 0;
  v_decision text := 'allow';
  v_reasons jsonb := '[]'::jsonb;
  v_profile record;
  v_rule record;
  v_velocity integer;
  v_duplicates integer;
  v_hour integer;
BEGIN
  IF auth.uid() IS NULL OR v_company_id IS NULL THEN RAISE EXCEPTION 'Usuário ou empresa não identificados'; END IF;
  v_hour := EXTRACT(HOUR FROM now());

  SELECT * INTO v_profile FROM public.financial_risk_profiles
   WHERE company_id = v_company_id AND entity_type = _entity_type AND entity_id = _entity_id;

  SELECT * INTO v_rule FROM public.financial_fraud_rules
   WHERE rule_key = 'max_single_transaction' AND enabled
     AND (company_id = v_company_id OR company_id IS NULL)
   ORDER BY (company_id = v_company_id) DESC LIMIT 1;
  IF FOUND AND _amount >= v_rule.threshold THEN
    v_score := v_score + 30;
    v_reasons := v_reasons || jsonb_build_object('rule', 'max_single_transaction', 'amount', _amount, 'threshold', v_rule.threshold);
    IF v_rule.action = 'block' THEN v_decision := 'block';
    ELSIF v_rule.action = 'review' AND v_decision <> 'block' THEN v_decision := 'review'; END IF;
  END IF;

  SELECT * INTO v_rule FROM public.financial_fraud_rules
   WHERE rule_key = 'velocity_check' AND enabled
     AND (company_id = v_company_id OR company_id IS NULL)
   ORDER BY (company_id = v_company_id) DESC LIMIT 1;
  IF FOUND AND _entity_id IS NOT NULL THEN
    SELECT count(*) INTO v_velocity FROM public.financial_ledger
     WHERE company_id = v_company_id
       AND created_at >= now() - (v_rule.window_minutes || ' minutes')::interval
       AND (source = _source OR _source IS NULL);
    IF v_velocity >= v_rule.threshold THEN
      v_score := v_score + 25;
      v_reasons := v_reasons || jsonb_build_object('rule', 'velocity_check', 'count', v_velocity);
      IF v_rule.action = 'review' AND v_decision = 'allow' THEN v_decision := 'review'; END IF;
    END IF;
  END IF;

  SELECT * INTO v_rule FROM public.financial_fraud_rules
   WHERE rule_key = 'duplicate_amount_window' AND enabled
     AND (company_id = v_company_id OR company_id IS NULL)
   ORDER BY (company_id = v_company_id) DESC LIMIT 1;
  IF FOUND THEN
    SELECT count(*) INTO v_duplicates FROM public.financial_ledger
     WHERE company_id = v_company_id AND abs(amount - _amount) < 0.01
       AND created_at >= now() - (v_rule.window_minutes || ' minutes')::interval;
    IF v_duplicates >= 1 THEN
      v_score := v_score + 35;
      v_reasons := v_reasons || jsonb_build_object('rule', 'duplicate_amount_window', 'count', v_duplicates);
      IF v_rule.action = 'block' THEN v_decision := 'block';
      ELSIF v_decision = 'allow' THEN v_decision := 'review'; END IF;
    END IF;
  END IF;

  SELECT * INTO v_rule FROM public.financial_fraud_rules
   WHERE rule_key = 'off_hours_high_value' AND enabled
     AND (company_id = v_company_id OR company_id IS NULL)
   ORDER BY (company_id = v_company_id) DESC LIMIT 1;
  IF FOUND AND _amount >= v_rule.threshold AND (v_hour >= 22 OR v_hour < 6) THEN
    v_score := v_score + 15;
    v_reasons := v_reasons || jsonb_build_object('rule', 'off_hours_high_value', 'hour', v_hour);
  END IF;

  SELECT * INTO v_rule FROM public.financial_fraud_rules
   WHERE rule_key = 'anomalous_ticket' AND enabled
     AND (company_id = v_company_id OR company_id IS NULL)
   ORDER BY (company_id = v_company_id) DESC LIMIT 1;
  IF FOUND AND v_profile.avg_ticket > 0 AND _amount >= v_profile.avg_ticket * v_rule.threshold THEN
    v_score := v_score + 20;
    v_reasons := v_reasons || jsonb_build_object('rule', 'anomalous_ticket', 'ticket', _amount, 'avg', v_profile.avg_ticket);
  END IF;

  IF v_profile.risk_score IS NOT NULL THEN
    v_score := v_score + (v_profile.risk_score / 4);
    IF v_profile.risk_level = 'critical' AND v_decision = 'allow' THEN v_decision := 'review'; END IF;
  END IF;

  v_score := LEAST(v_score, 100);
  RETURN jsonb_build_object('score', v_score, 'decision', v_decision, 'reasons', v_reasons, 'evaluated_at', now(), 'payment_method', _payment_method);
END;
$$;

CREATE OR REPLACE FUNCTION public.check_hierarchy_access(_user_id uuid, _target_company_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_tenant_id uuid;
  v_target_tenant_id uuid;
BEGIN
  IF auth.uid() IS NULL OR _user_id IS DISTINCT FROM auth.uid() THEN RETURN false; END IF;

  SELECT c.tenant_id INTO v_user_tenant_id
    FROM public.user_roles ur
    JOIN public.companies c ON c.id = ur.company_id
   WHERE ur.user_id = auth.uid()
     AND ur.company_id = public.get_user_company_id(auth.uid())
   LIMIT 1;

  SELECT tenant_id INTO v_target_tenant_id FROM public.companies WHERE id = _target_company_id;
  RETURN v_user_tenant_id IS NOT NULL AND v_target_tenant_id IS NOT NULL AND v_user_tenant_id = v_target_tenant_id;
END;
$$;

REVOKE ALL ON FUNCTION public.batch_pay_payables(uuid[], uuid, text, date, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.reverse_settlement(uuid, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.evaluate_transaction_risk(numeric, text, uuid, text, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.check_hierarchy_access(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.batch_pay_payables(uuid[], uuid, text, date, text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.reverse_settlement(uuid, text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.evaluate_transaction_risk(numeric, text, uuid, text, text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.check_hierarchy_access(uuid, uuid) TO authenticated, service_role;
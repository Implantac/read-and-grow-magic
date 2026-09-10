-- Fix tenant guard and company_id propagation for settlement ledger entries.
-- This prevents null/tenant-mismatched company_id writes when settle_account is called.

CREATE OR REPLACE FUNCTION public.settle_account(
  _source_type text,
  _source_id uuid,
  _splits jsonb,
  _settlement_date date DEFAULT CURRENT_DATE,
  _interest numeric DEFAULT 0,
  _penalty numeric DEFAULT 0,
  _discount numeric DEFAULT 0,
  _notes text DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_company uuid := public.get_user_company_id(auth.uid());
  v_settlement_id uuid;
  v_total numeric := 0;
  v_split jsonb;
  v_amount_principal numeric;
  v_total_settled numeric;
  v_main_method text;
  v_main_account uuid;
  v_desc text;
  v_party text;
  v_open numeric;
  v_paid_before numeric;
  v_amount_total numeric;
  v_ledger_id uuid;
  v_source_company uuid;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Usuário não autenticado';
  END IF;

  IF v_company IS NULL THEN
    RAISE EXCEPTION 'Tenant não resolvido para o usuário';
  END IF;

  IF _source_type NOT IN ('receivable','payable') THEN
    RAISE EXCEPTION 'source_type inválido: %', _source_type;
  END IF;

  IF jsonb_typeof(_splits) <> 'array' OR jsonb_array_length(_splits) = 0 THEN
    RAISE EXCEPTION 'É necessário informar pelo menos uma forma de pagamento';
  END IF;

  FOR v_split IN SELECT * FROM jsonb_array_elements(_splits) LOOP
    v_total := v_total + COALESCE((v_split->>'amount')::numeric, 0);
  END LOOP;

  IF v_total <= 0 THEN
    RAISE EXCEPTION 'Valor total das formas de pagamento deve ser positivo';
  END IF;

  v_total_settled := v_total + COALESCE(_interest,0) + COALESCE(_penalty,0) - COALESCE(_discount,0);
  v_amount_principal := v_total + COALESCE(_discount,0) - COALESCE(_interest,0) - COALESCE(_penalty,0);
  IF v_amount_principal < 0 THEN
    v_amount_principal := v_total;
  END IF;

  IF _source_type = 'receivable' THEN
    SELECT company_id, description, client_name, COALESCE(amount,0), COALESCE(paid_amount,0)
      INTO v_source_company, v_desc, v_party, v_amount_total, v_paid_before
      FROM public.accounts_receivable
     WHERE id = _source_id
     FOR UPDATE;

    IF v_desc IS NULL THEN
      RAISE EXCEPTION 'Conta a receber não encontrada';
    END IF;

    IF v_source_company IS DISTINCT FROM v_company THEN
      RAISE EXCEPTION 'Acesso negado: conta a receber pertence a outro tenant';
    END IF;
  ELSE
    SELECT company_id, description, supplier, COALESCE(amount,0), COALESCE(paid_amount,0)
      INTO v_source_company, v_desc, v_party, v_amount_total, v_paid_before
      FROM public.accounts_payable
     WHERE id = _source_id
     FOR UPDATE;

    IF v_desc IS NULL THEN
      RAISE EXCEPTION 'Conta a pagar não encontrada';
    END IF;

    IF v_source_company IS DISTINCT FROM v_company THEN
      RAISE EXCEPTION 'Acesso negado: conta a pagar pertence a outro tenant';
    END IF;
  END IF;

  v_open := GREATEST(v_amount_total - v_paid_before, 0);
  IF v_amount_principal > v_open + 0.01 THEN
    RAISE EXCEPTION 'Valor (%, principal %) excede o saldo em aberto (%)', v_total, v_amount_principal, v_open;
  END IF;

  v_main_method := COALESCE((_splits->0->>'payment_method'), 'cash');
  v_main_account := NULLIF((_splits->0->>'bank_account_id'),'')::uuid;

  INSERT INTO public.financial_settlements (
    source_type, source_id, amount, interest, penalty, discount,
    total_settled, settlement_date, bank_account_id, payment_method,
    notes, status, company_id, created_by
  ) VALUES (
    _source_type, _source_id, v_amount_principal,
    COALESCE(_interest,0), COALESCE(_penalty,0), COALESCE(_discount,0),
    v_total_settled, _settlement_date, v_main_account, v_main_method,
    _notes, 'active', v_company, auth.uid()
  ) RETURNING id INTO v_settlement_id;

  FOR v_split IN SELECT * FROM jsonb_array_elements(_splits) LOOP
    INSERT INTO public.financial_payment_split (
      settlement_id, payment_method, amount, bank_account_id, reference, notes, company_id
    ) VALUES (
      v_settlement_id,
      v_split->>'payment_method',
      (v_split->>'amount')::numeric,
      NULLIF(v_split->>'bank_account_id','')::uuid,
      v_split->>'reference',
      v_split->>'notes',
      v_company
    );

    INSERT INTO public.financial_ledger (
      entry_date, type, amount, description, bank_account_id,
      source, source_id, payment_method, reference, company_id, created_by
    ) VALUES (
      _settlement_date,
      CASE WHEN _source_type='receivable' THEN 'inflow' ELSE 'outflow' END,
      (v_split->>'amount')::numeric,
      COALESCE(v_desc,'Liquidação') || ' — ' || COALESCE(v_party,''),
      NULLIF(v_split->>'bank_account_id','')::uuid,
      _source_type, _source_id,
      v_split->>'payment_method',
      v_settlement_id::text,
      v_company,
      auth.uid()
    ) RETURNING id INTO v_ledger_id;
  END LOOP;

  UPDATE public.financial_settlements
     SET ledger_id = v_ledger_id
   WHERE id = v_settlement_id
     AND ledger_id IS NULL;

  IF _source_type = 'receivable' THEN
    UPDATE public.accounts_receivable
       SET paid_amount = COALESCE(paid_amount,0) + v_amount_principal,
           open_amount = GREATEST(amount - (COALESCE(paid_amount,0) + v_amount_principal), 0),
           interest = COALESCE(interest,0) + COALESCE(_interest,0),
           penalty = COALESCE(penalty,0) + COALESCE(_penalty,0),
           discount_amount = COALESCE(discount_amount,0) + COALESCE(_discount,0),
           payment_date = _settlement_date,
           payment_method = v_main_method,
           status = CASE WHEN amount - (COALESCE(paid_amount,0) + v_amount_principal) <= 0.009 THEN 'paid' ELSE 'partial' END,
           updated_at = now()
     WHERE id = _source_id
       AND company_id = v_company;
  ELSE
    UPDATE public.accounts_payable
       SET paid_amount = COALESCE(paid_amount,0) + v_amount_principal,
           open_amount = GREATEST(amount - (COALESCE(paid_amount,0) + v_amount_principal), 0),
           interest = COALESCE(interest,0) + COALESCE(_interest,0),
           penalty = COALESCE(penalty,0) + COALESCE(_penalty,0),
           discount_amount = COALESCE(discount_amount,0) + COALESCE(_discount,0),
           payment_date = _settlement_date,
           payment_method = v_main_method,
           status = CASE WHEN amount - (COALESCE(paid_amount,0) + v_amount_principal) <= 0.009 THEN 'paid' ELSE 'partial' END,
           updated_at = now()
     WHERE id = _source_id
       AND company_id = v_company;
  END IF;

  INSERT INTO public.financial_operations_log(
    operation_type, entity_type, entity_id, amount, payload, user_id, company_id
  ) VALUES (
    'settlement_created',
    _source_type,
    _source_id,
    v_total_settled,
    jsonb_build_object('settlement_id', v_settlement_id, 'splits', _splits),
    auth.uid(),
    v_company
  );

  RETURN jsonb_build_object('ok', true, 'settlement_id', v_settlement_id, 'total_settled', v_total_settled);
END;
$$;

GRANT EXECUTE ON FUNCTION public.settle_account(text, uuid, jsonb, date, numeric, numeric, numeric, text) TO authenticated, service_role;

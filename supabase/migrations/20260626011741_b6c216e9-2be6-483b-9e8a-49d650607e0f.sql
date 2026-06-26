
-- =========================================================================
-- Ciclo QA 27 — Tenant guards em RPCs SECURITY DEFINER financeiras
-- =========================================================================

-- transfer_between_accounts: valida ownership das duas contas
CREATE OR REPLACE FUNCTION public.transfer_between_accounts(
  _from_account uuid, _to_account uuid, _amount numeric,
  _description text DEFAULT 'Transferência entre contas'::text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_company UUID := public.get_user_company_id(auth.uid());
  v_transfer_id UUID; v_outflow_id UUID; v_inflow_id UUID;
  v_from_co UUID; v_to_co UUID;
BEGIN
  IF v_company IS NULL THEN RAISE EXCEPTION 'Tenant não resolvido para o usuário'; END IF;
  IF _from_account = _to_account THEN RAISE EXCEPTION 'Conta origem e destino devem ser diferentes'; END IF;
  IF _amount <= 0 THEN RAISE EXCEPTION 'Valor deve ser positivo'; END IF;

  SELECT company_id INTO v_from_co FROM public.bank_accounts WHERE id = _from_account;
  SELECT company_id INTO v_to_co   FROM public.bank_accounts WHERE id = _to_account;
  IF v_from_co IS NULL OR v_to_co IS NULL THEN
    RAISE EXCEPTION 'Conta bancária inválida';
  END IF;
  IF v_from_co <> v_company OR v_to_co <> v_company THEN
    RAISE EXCEPTION 'Acesso negado: conta bancária pertence a outro tenant';
  END IF;

  INSERT INTO public.bank_transfers (from_account_id, to_account_id, amount, description, created_by, company_id)
  VALUES (_from_account, _to_account, _amount, _description, auth.uid(), v_company)
  RETURNING id INTO v_transfer_id;

  INSERT INTO public.financial_ledger (entry_date, type, amount, description, bank_account_id, source, source_id, payment_method, company_id)
  VALUES (CURRENT_DATE, 'outflow', _amount, _description || ' (saída)', _from_account, 'transfer', v_transfer_id, 'transfer', v_company)
  RETURNING id INTO v_outflow_id;

  INSERT INTO public.financial_ledger (entry_date, type, amount, description, bank_account_id, source, source_id, payment_method, company_id)
  VALUES (CURRENT_DATE, 'inflow', _amount, _description || ' (entrada)', _to_account, 'transfer', v_transfer_id, 'transfer', v_company)
  RETURNING id INTO v_inflow_id;

  UPDATE public.bank_transfers SET outflow_ledger_id = v_outflow_id, inflow_ledger_id = v_inflow_id WHERE id = v_transfer_id;

  INSERT INTO public.financial_operations_log(operation_type, entity_type, entity_id, amount, payload, user_id, company_id)
  VALUES ('bank_transfer', 'bank_transfer', v_transfer_id, _amount,
          jsonb_build_object('from', _from_account, 'to', _to_account), auth.uid(), v_company);

  RETURN jsonb_build_object('ok', true, 'transfer_id', v_transfer_id);
END;
$function$;

-- compensate_check: valida ownership do cheque e da conta bancária
CREATE OR REPLACE FUNCTION public.compensate_check(
  _check_id uuid, _bank_account_id uuid DEFAULT NULL::uuid, _clear_date date DEFAULT CURRENT_DATE
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_company UUID := public.get_user_company_id(auth.uid());
  v_check RECORD;
  v_settlement_id UUID;
  v_ledger_id UUID;
  v_bank UUID;
  v_bank_co UUID;
BEGIN
  IF v_company IS NULL THEN RAISE EXCEPTION 'Tenant não resolvido para o usuário'; END IF;

  SELECT * INTO v_check FROM public.financial_checks WHERE id = _check_id FOR UPDATE;
  IF v_check.id IS NULL THEN RAISE EXCEPTION 'Cheque não encontrado'; END IF;
  IF v_check.company_id IS DISTINCT FROM v_company THEN
    RAISE EXCEPTION 'Acesso negado: cheque pertence a outro tenant';
  END IF;
  IF v_check.status = 'cleared' THEN RAISE EXCEPTION 'Cheque já compensado'; END IF;
  IF v_check.status IN ('bounced','cancelled') THEN
    RAISE EXCEPTION 'Cheque % não pode ser compensado', v_check.status;
  END IF;

  v_bank := COALESCE(_bank_account_id, v_check.bank_account_id);
  SELECT company_id INTO v_bank_co FROM public.bank_accounts WHERE id = v_bank;
  IF v_bank_co IS DISTINCT FROM v_company THEN
    RAISE EXCEPTION 'Acesso negado: conta bancária pertence a outro tenant';
  END IF;

  INSERT INTO public.financial_ledger (
    entry_date, type, amount, description, bank_account_id,
    source, source_id, payment_method, reference, company_id
  ) VALUES (
    _clear_date,
    CASE WHEN v_check.check_type = 'received' THEN 'inflow' ELSE 'outflow' END,
    v_check.amount,
    'Compensação cheque ' || v_check.check_number || COALESCE(' - '||v_check.issuer_name,''),
    v_bank, 'check', v_check.id, 'check', v_check.check_number, v_company
  ) RETURNING id INTO v_ledger_id;

  IF v_check.receivable_id IS NOT NULL THEN
    INSERT INTO public.financial_settlements (
      source_type, source_id, amount, total_settled, settlement_date,
      bank_account_id, payment_method, ledger_id, status, notes, company_id
    ) VALUES (
      'receivable', v_check.receivable_id, v_check.amount, v_check.amount,
      _clear_date, v_bank, 'check', v_ledger_id, 'active',
      'Compensação cheque ' || v_check.check_number, v_company
    ) RETURNING id INTO v_settlement_id;

    UPDATE public.accounts_receivable
       SET paid_amount = COALESCE(paid_amount,0) + v_check.amount,
           open_amount = GREATEST(amount - (COALESCE(paid_amount,0) + v_check.amount), 0),
           status = CASE WHEN amount - (COALESCE(paid_amount,0) + v_check.amount) <= 0.009 THEN 'paid' ELSE 'partial' END,
           payment_date = _clear_date,
           payment_method = 'check',
           updated_at = now()
     WHERE id = v_check.receivable_id AND company_id = v_company;

  ELSIF v_check.payable_id IS NOT NULL THEN
    INSERT INTO public.financial_settlements (
      source_type, source_id, amount, total_settled, settlement_date,
      bank_account_id, payment_method, ledger_id, status, notes, company_id
    ) VALUES (
      'payable', v_check.payable_id, v_check.amount, v_check.amount,
      _clear_date, v_bank, 'check', v_ledger_id, 'active',
      'Compensação cheque ' || v_check.check_number, v_company
    ) RETURNING id INTO v_settlement_id;

    UPDATE public.accounts_payable
       SET paid_amount = COALESCE(paid_amount,0) + v_check.amount,
           open_amount = GREATEST(amount - (COALESCE(paid_amount,0) + v_check.amount), 0),
           status = CASE WHEN amount - (COALESCE(paid_amount,0) + v_check.amount) <= 0.009 THEN 'paid' ELSE 'partial' END,
           payment_date = _clear_date,
           payment_method = 'check',
           updated_at = now()
     WHERE id = v_check.payable_id AND company_id = v_company;
  END IF;

  UPDATE public.financial_checks
     SET status = 'cleared', clear_date = _clear_date, ledger_id = v_ledger_id, updated_at = now()
   WHERE id = _check_id;

  RETURN jsonb_build_object('ok', true, 'check_id', _check_id, 'ledger_id', v_ledger_id, 'settlement_id', v_settlement_id);
END;
$function$;

-- manual_match_transaction: valida tenant em ambos os lados
CREATE OR REPLACE FUNCTION public.manual_match_transaction(p_bank_transaction_id uuid, p_ledger_entry_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_company UUID := public.get_user_company_id(auth.uid());
  v_bt_co UUID; v_le_co UUID;
BEGIN
  IF v_company IS NULL THEN RAISE EXCEPTION 'Tenant não resolvido'; END IF;
  SELECT company_id INTO v_bt_co FROM public.bank_transactions WHERE id = p_bank_transaction_id;
  SELECT company_id INTO v_le_co FROM public.financial_ledger WHERE id = p_ledger_entry_id;
  IF v_bt_co IS DISTINCT FROM v_company OR v_le_co IS DISTINCT FROM v_company THEN
    RAISE EXCEPTION 'Acesso negado: registro pertence a outro tenant';
  END IF;

  UPDATE public.bank_transactions
     SET status = 'matched', matched_entry_id = p_ledger_entry_id
   WHERE id = p_bank_transaction_id AND company_id = v_company;
  UPDATE public.financial_ledger
     SET reconciled = true, bank_transaction_id = p_bank_transaction_id
   WHERE id = p_ledger_entry_id AND company_id = v_company;
  RETURN true;
END;
$function$;

-- match_bank_transaction: escopa busca ao tenant
CREATE OR REPLACE FUNCTION public.match_bank_transaction(_bank_tx_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_company UUID := public.get_user_company_id(auth.uid());
  tx record;
  match record;
BEGIN
  IF v_company IS NULL THEN RAISE EXCEPTION 'Tenant não resolvido'; END IF;

  SELECT * INTO tx FROM public.bank_transactions WHERE id = _bank_tx_id AND company_id = v_company;
  IF tx.id IS NULL THEN RETURN jsonb_build_object('ok',false,'reason','tx_not_found'); END IF;
  IF tx.matched_entry_id IS NOT NULL THEN RETURN jsonb_build_object('ok',true,'already_matched',true); END IF;

  SELECT l.* INTO match
    FROM public.financial_ledger l
   WHERE l.company_id = v_company
     AND abs(l.amount - tx.amount) < 0.01
     AND l.entry_date BETWEEN (tx.date::date - 3) AND (tx.date::date + 3)
     AND ((tx.type='credit' AND l.type='inflow') OR (tx.type='debit' AND l.type='outflow'))
     AND NOT EXISTS (SELECT 1 FROM public.bank_transactions bt2 WHERE bt2.matched_entry_id = l.id)
   ORDER BY abs(EXTRACT(EPOCH FROM (l.entry_date::timestamptz - tx.date::timestamptz)))
   LIMIT 1;

  IF match.id IS NULL THEN
    UPDATE public.bank_transactions SET status='unmatched' WHERE id = tx.id;
    RETURN jsonb_build_object('ok',false,'reason','no_match');
  END IF;

  UPDATE public.bank_transactions SET matched_entry_id = match.id, status='matched' WHERE id = tx.id;
  UPDATE public.financial_ledger SET reconciled = true, bank_transaction_id = tx.id WHERE id = match.id;
  RETURN jsonb_build_object('ok',true,'matched_entry_id',match.id);
END;
$function$;

-- auto_match_bank_transactions: escopa por tenant
CREATE OR REPLACE FUNCTION public.auto_match_bank_transactions(
  p_bank_account_id uuid DEFAULT NULL::uuid, p_tolerance_days integer DEFAULT 3
)
RETURNS TABLE(matched integer, total_pending integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_company UUID := public.get_user_company_id(auth.uid());
  v_matched INT := 0;
  v_total INT := 0;
  r RECORD;
  v_ledger_id UUID;
  v_bank_co UUID;
BEGIN
  IF v_company IS NULL THEN RAISE EXCEPTION 'Tenant não resolvido'; END IF;

  IF p_bank_account_id IS NOT NULL THEN
    SELECT company_id INTO v_bank_co FROM public.bank_accounts WHERE id = p_bank_account_id;
    IF v_bank_co IS DISTINCT FROM v_company THEN
      RAISE EXCEPTION 'Acesso negado: conta pertence a outro tenant';
    END IF;
  END IF;

  FOR r IN
    SELECT bt.* FROM public.bank_transactions bt
    WHERE bt.company_id = v_company
      AND bt.status = 'pending'
      AND bt.matched_entry_id IS NULL
      AND (p_bank_account_id IS NULL OR bt.bank_account_id = p_bank_account_id)
  LOOP
    v_total := v_total + 1;
    SELECT id INTO v_ledger_id
      FROM public.financial_ledger fl
     WHERE fl.company_id = v_company
       AND fl.bank_account_id = r.bank_account_id
       AND fl.reconciled = false
       AND ABS(fl.amount - r.amount) < 0.01
       AND ABS(EXTRACT(EPOCH FROM (fl.entry_date::timestamptz - r.date))/86400) <= p_tolerance_days
       AND ((r.type = 'credit' AND fl.type = 'inflow')
         OR (r.type = 'debit' AND fl.type = 'outflow'))
     ORDER BY ABS(EXTRACT(EPOCH FROM (fl.entry_date::timestamptz - r.date)))
     LIMIT 1;

    IF v_ledger_id IS NOT NULL THEN
      UPDATE public.bank_transactions
         SET status = 'matched', matched_entry_id = v_ledger_id
       WHERE id = r.id;
      UPDATE public.financial_ledger
         SET reconciled = true, bank_transaction_id = r.id
       WHERE id = v_ledger_id;
      v_matched := v_matched + 1;
    END IF;
  END LOOP;

  RETURN QUERY SELECT v_matched, v_total;
END;
$function$;

-- import_bank_statement_batch: valida tenant da conta
CREATE OR REPLACE FUNCTION public.import_bank_statement_batch(p_bank_account_id uuid, p_transactions jsonb)
RETURNS TABLE(inserted integer, skipped integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_company UUID := public.get_user_company_id(auth.uid());
  v_bank_co UUID;
  v_inserted INT := 0;
  v_skipped INT := 0;
  v_tx JSONB;
BEGIN
  IF v_company IS NULL THEN RAISE EXCEPTION 'Tenant não resolvido'; END IF;
  SELECT company_id INTO v_bank_co FROM public.bank_accounts WHERE id = p_bank_account_id;
  IF v_bank_co IS DISTINCT FROM v_company THEN
    RAISE EXCEPTION 'Acesso negado: conta pertence a outro tenant';
  END IF;

  FOR v_tx IN SELECT * FROM jsonb_array_elements(p_transactions) LOOP
    BEGIN
      INSERT INTO public.bank_transactions (
        bank_account_id, date, description, amount, type, bank_reference, status, source, company_id
      ) VALUES (
        p_bank_account_id,
        (v_tx->>'date')::timestamptz,
        v_tx->>'description',
        (v_tx->>'amount')::numeric,
        v_tx->>'type',
        v_tx->>'bank_reference',
        'pending',
        COALESCE(v_tx->>'source', 'import'),
        v_company
      );
      v_inserted := v_inserted + 1;
    EXCEPTION WHEN unique_violation THEN
      v_skipped := v_skipped + 1;
    END;
  END LOOP;
  RETURN QUERY SELECT v_inserted, v_skipped;
END;
$function$;

-- recalc_bank_balance: valida ownership
CREATE OR REPLACE FUNCTION public.recalc_bank_balance(_bank_account_id uuid)
RETURNS numeric
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_company UUID := public.get_user_company_id(auth.uid());
  v_bank_co UUID;
  v_balance numeric;
BEGIN
  IF v_company IS NULL THEN RAISE EXCEPTION 'Tenant não resolvido'; END IF;
  SELECT company_id INTO v_bank_co FROM public.bank_accounts WHERE id = _bank_account_id;
  IF v_bank_co IS DISTINCT FROM v_company THEN
    RAISE EXCEPTION 'Acesso negado: conta pertence a outro tenant';
  END IF;

  SELECT COALESCE(SUM(CASE WHEN type='inflow' THEN amount ELSE -amount END),0)
    INTO v_balance
    FROM public.financial_ledger
   WHERE bank_account_id = _bank_account_id
     AND company_id = v_company;

  UPDATE public.bank_accounts SET balance = v_balance, updated_at = now()
   WHERE id = _bank_account_id AND company_id = v_company;

  RETURN v_balance;
END;
$function$;

-- process_pix_payment e purge_old_audit_logs: restringir EXECUTE a service_role
REVOKE EXECUTE ON FUNCTION public.process_pix_payment(uuid, text, text, text) FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.process_pix_payment(uuid, text, text, text) TO service_role;

REVOKE EXECUTE ON FUNCTION public.purge_old_audit_logs(integer) FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.purge_old_audit_logs(integer) TO service_role;

-- =====================================================================
-- PART 1: AUTOMATIC ACCOUNTING ENTRIES FROM FINANCIAL_LEDGER
-- =====================================================================

-- Resolve which chart_of_accounts to use for a ledger row (cash side + revenue/expense side)
CREATE OR REPLACE FUNCTION public.resolve_accounting_pair(
  _ledger_type text,
  _category_id uuid,
  _chart_account_id uuid,
  _bank_account_id uuid
)
RETURNS TABLE (cash_account_id uuid, cash_code text, cash_name text,
               result_account_id uuid, result_code text, result_name text)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_cash_id uuid; v_cash_code text; v_cash_name text;
  v_res_id uuid; v_res_code text; v_res_name text;
BEGIN
  -- Cash side: find first ATIVO/CIRCULANTE account; fallback to first asset
  SELECT id, code, name INTO v_cash_id, v_cash_code, v_cash_name
    FROM public.chart_of_accounts
   WHERE active = true AND type = 'asset'
   ORDER BY code LIMIT 1;

  -- Result side: prefer category.chart_account_id or ledger.chart_account_id
  IF _chart_account_id IS NOT NULL THEN
    SELECT id, code, name INTO v_res_id, v_res_code, v_res_name
      FROM public.chart_of_accounts WHERE id = _chart_account_id;
  ELSIF _category_id IS NOT NULL THEN
    SELECT coa.id, coa.code, coa.name INTO v_res_id, v_res_code, v_res_name
      FROM public.financial_categories fc
      JOIN public.chart_of_accounts coa ON coa.id = fc.chart_account_id
     WHERE fc.id = _category_id;
  END IF;

  -- Fallback by ledger type
  IF v_res_id IS NULL THEN
    SELECT id, code, name INTO v_res_id, v_res_code, v_res_name
      FROM public.chart_of_accounts
     WHERE active = true
       AND type = CASE WHEN _ledger_type = 'inflow' THEN 'revenue' ELSE 'expense' END
     ORDER BY code LIMIT 1;
  END IF;

  RETURN QUERY SELECT v_cash_id, v_cash_code, v_cash_name, v_res_id, v_res_code, v_res_name;
END;
$$;

-- Trigger function: each ledger row → balanced journal entry
CREATE OR REPLACE FUNCTION public.generate_accounting_from_ledger()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_pair RECORD;
  v_je_id uuid;
  v_number text;
BEGIN
  -- Skip if already has a journal entry for this ledger row
  IF EXISTS (SELECT 1 FROM public.journal_entries WHERE description LIKE 'LEDGER:' || NEW.id || '%') THEN
    RETURN NEW;
  END IF;

  SELECT * INTO v_pair FROM public.resolve_accounting_pair(
    NEW.type, NEW.category_id, NEW.chart_account_id, NEW.bank_account_id
  );

  -- If we cannot resolve both sides, skip silently (contabilidade requer plano configurado)
  IF v_pair.cash_account_id IS NULL OR v_pair.result_account_id IS NULL THEN
    RETURN NEW;
  END IF;

  v_number := 'AUTO-' || to_char(NEW.entry_date, 'YYYYMMDD') || '-' || substring(NEW.id::text, 1, 8);

  INSERT INTO public.journal_entries (number, date, description, status, total_debit, total_credit, created_by)
  VALUES (v_number, NEW.entry_date, 'LEDGER:' || NEW.id || ' ' || NEW.description,
          'posted', NEW.amount, NEW.amount, 'auto')
  RETURNING id INTO v_je_id;

  IF NEW.type = 'inflow' THEN
    -- Débito: Caixa/Banco | Crédito: Receita
    INSERT INTO public.journal_entry_lines (journal_entry_id, account_id, account_code, account_name, debit, credit, description)
    VALUES
      (v_je_id, v_pair.cash_account_id, v_pair.cash_code, v_pair.cash_name, NEW.amount, 0, NEW.description),
      (v_je_id, v_pair.result_account_id, v_pair.result_code, v_pair.result_name, 0, NEW.amount, NEW.description);
  ELSE
    -- Débito: Despesa | Crédito: Caixa/Banco
    INSERT INTO public.journal_entry_lines (journal_entry_id, account_id, account_code, account_name, debit, credit, description)
    VALUES
      (v_je_id, v_pair.result_account_id, v_pair.result_code, v_pair.result_name, NEW.amount, 0, NEW.description),
      (v_je_id, v_pair.cash_account_id, v_pair.cash_code, v_pair.cash_name, 0, NEW.amount, NEW.description);
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_generate_accounting_from_ledger ON public.financial_ledger;
CREATE TRIGGER trg_generate_accounting_from_ledger
  AFTER INSERT ON public.financial_ledger
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_accounting_from_ledger();

-- =====================================================================
-- PART 2: ACCOUNTING PERIODS (FECHAMENTO CONTÁBIL)
-- =====================================================================

CREATE TABLE IF NOT EXISTS public.accounting_periods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  year int NOT NULL,
  month int NOT NULL CHECK (month BETWEEN 1 AND 12),
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open','closed','locked')),
  closed_at timestamptz,
  closed_by uuid,
  result_amount numeric(14,2) DEFAULT 0,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (year, month)
);

ALTER TABLE public.accounting_periods ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auth read accounting_periods" ON public.accounting_periods
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "admin manage accounting_periods" ON public.accounting_periods
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'manager'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'manager'::app_role));

-- Block writes on closed/locked periods
CREATE OR REPLACE FUNCTION public.enforce_period_lock()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_date date;
  v_status text;
BEGIN
  v_date := COALESCE(NEW.entry_date, OLD.entry_date);
  IF v_date IS NULL THEN RETURN COALESCE(NEW, OLD); END IF;

  SELECT status INTO v_status
    FROM public.accounting_periods
   WHERE year = EXTRACT(YEAR FROM v_date)::int
     AND month = EXTRACT(MONTH FROM v_date)::int;

  IF v_status IN ('closed','locked') THEN
    RAISE EXCEPTION 'Período contábil % está %, não permite alterações', to_char(v_date,'YYYY-MM'), v_status;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_period_lock_ledger ON public.financial_ledger;
CREATE TRIGGER trg_enforce_period_lock_ledger
  BEFORE INSERT OR UPDATE OR DELETE ON public.financial_ledger
  FOR EACH ROW EXECUTE FUNCTION public.enforce_period_lock();

-- Close period RPC
CREATE OR REPLACE FUNCTION public.close_accounting_period(_year int, _month int)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_from date := make_date(_year, _month, 1);
  v_to date := (make_date(_year, _month, 1) + interval '1 month - 1 day')::date;
  v_result numeric;
BEGIN
  IF NOT (public.has_role(auth.uid(),'admin'::app_role) OR public.has_role(auth.uid(),'manager'::app_role)) THEN
    RAISE EXCEPTION 'Sem permissão para fechar período';
  END IF;

  SELECT COALESCE(SUM(CASE WHEN type='inflow' THEN amount ELSE -amount END),0)
    INTO v_result
    FROM public.financial_ledger
   WHERE entry_date BETWEEN v_from AND v_to;

  INSERT INTO public.accounting_periods(year, month, status, closed_at, closed_by, result_amount)
  VALUES (_year, _month, 'closed', now(), auth.uid(), v_result)
  ON CONFLICT (year, month) DO UPDATE SET
    status = 'closed', closed_at = now(), closed_by = auth.uid(),
    result_amount = EXCLUDED.result_amount, updated_at = now();

  RETURN jsonb_build_object('ok', true, 'year', _year, 'month', _month, 'result', v_result);
END;
$$;

CREATE OR REPLACE FUNCTION public.reopen_accounting_period(_year int, _month int)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(),'admin'::app_role) THEN
    RAISE EXCEPTION 'Apenas administradores podem reabrir períodos';
  END IF;
  UPDATE public.accounting_periods SET status='open', closed_at=NULL, closed_by=NULL, updated_at=now()
   WHERE year=_year AND month=_month AND status='closed';
  RETURN jsonb_build_object('ok', true);
END $$;

-- =====================================================================
-- PART 3: BATCH PAY PAYABLES RPC
-- =====================================================================

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
  v_payable RECORD;
  v_paid_count int := 0;
  v_total numeric := 0;
  v_settle_id uuid;
  v_open numeric;
BEGIN
  IF _bank_account_id IS NULL THEN RAISE EXCEPTION 'Conta bancária obrigatória'; END IF;
  IF array_length(_payable_ids,1) IS NULL THEN RAISE EXCEPTION 'Nenhuma conta selecionada'; END IF;

  FOR v_payable IN
    SELECT * FROM public.accounts_payable
     WHERE id = ANY(_payable_ids) AND status IN ('pending','overdue','partial')
     FOR UPDATE
  LOOP
    v_open := GREATEST(v_payable.amount - COALESCE(v_payable.paid_amount,0), 0);
    IF v_open <= 0 THEN CONTINUE; END IF;

    -- Create settlement (will trigger ledger via process_payment_record? — manual insert)
    INSERT INTO public.financial_settlements (
      source_type, source_id, amount, total_settled, settlement_date,
      payment_method, bank_account_id, notes, status, created_by
    ) VALUES (
      'payable', v_payable.id, v_open, v_open, _payment_date,
      _payment_method, _bank_account_id,
      COALESCE(_notes, 'Pagamento em lote'), 'active', auth.uid()
    ) RETURNING id INTO v_settle_id;

    -- Update payable
    UPDATE public.accounts_payable
       SET paid_amount = v_payable.amount,
           open_amount = 0,
           status = 'paid',
           payment_date = _payment_date,
           payment_method = _payment_method,
           bank_account_id = _bank_account_id,
           updated_at = now()
     WHERE id = v_payable.id;

    -- Ledger
    INSERT INTO public.financial_ledger (
      entry_date, type, amount, description, bank_account_id,
      source, source_id, payment_method, reference, created_by
    ) VALUES (
      _payment_date, 'outflow', v_open,
      'Pagamento lote: ' || v_payable.description || ' — ' || v_payable.supplier,
      _bank_account_id, 'batch_pay', v_payable.id, _payment_method, v_settle_id::text, auth.uid()
    );

    v_paid_count := v_paid_count + 1;
    v_total := v_total + v_open;
  END LOOP;

  INSERT INTO public.financial_operations_log(operation_type, entity_type, entity_id, amount, payload, user_id)
  VALUES ('batch_pay', 'payable', NULL, v_total,
          jsonb_build_object('count', v_paid_count, 'ids', _payable_ids), auth.uid());

  RETURN jsonb_build_object('ok', true, 'paid_count', v_paid_count, 'total', v_total);
END;
$$;

-- =====================================================================
-- PART 4: CONTA CORRENTE (current account view per client/supplier)
-- =====================================================================

CREATE OR REPLACE VIEW public.client_current_account AS
SELECT
  ar.client_id, ar.client_name,
  ar.id AS document_id, 'receivable'::text AS document_type,
  ar.description, ar.invoice_number,
  ar.due_date AS date,
  ar.amount AS debit, COALESCE(ar.paid_amount,0) AS credit,
  ar.amount - COALESCE(ar.paid_amount,0) AS balance,
  ar.status, ar.created_at
FROM public.accounts_receivable ar
WHERE ar.client_id IS NOT NULL;

CREATE OR REPLACE VIEW public.supplier_current_account AS
SELECT
  ap.supplier AS supplier_name,
  ap.id AS document_id, 'payable'::text AS document_type,
  ap.description, ap.invoice_number,
  ap.due_date AS date,
  ap.amount AS debit, COALESCE(ap.paid_amount,0) AS credit,
  ap.amount - COALESCE(ap.paid_amount,0) AS balance,
  ap.status, ap.created_at
FROM public.accounts_payable ap;

GRANT SELECT ON public.client_current_account TO authenticated;
GRANT SELECT ON public.supplier_current_account TO authenticated;
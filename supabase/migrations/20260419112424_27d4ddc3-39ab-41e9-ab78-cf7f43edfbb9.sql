
-- Helper function (idempotente)
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

-- =============================================================
-- CHEQUES
-- =============================================================
CREATE TABLE IF NOT EXISTS public.financial_checks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  check_type TEXT NOT NULL CHECK (check_type IN ('received','issued')),
  check_number TEXT NOT NULL,
  bank_code TEXT,
  bank_name TEXT,
  agency TEXT,
  account TEXT,
  issuer_name TEXT,
  issuer_document TEXT,
  amount NUMERIC(14,2) NOT NULL CHECK (amount > 0),
  issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE,
  deposit_date DATE,
  clear_date DATE,
  status TEXT NOT NULL DEFAULT 'received'
    CHECK (status IN ('received','deposited','cleared','bounced','cancelled','issued')),
  receivable_id UUID REFERENCES public.accounts_receivable(id) ON DELETE SET NULL,
  payable_id UUID REFERENCES public.accounts_payable(id) ON DELETE SET NULL,
  bank_account_id UUID REFERENCES public.bank_accounts(id) ON DELETE SET NULL,
  settlement_id UUID,
  ledger_id UUID,
  notes TEXT,
  company_id UUID,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_checks_status ON public.financial_checks(status);
CREATE INDEX IF NOT EXISTS idx_checks_due ON public.financial_checks(due_date);
CREATE INDEX IF NOT EXISTS idx_checks_recv ON public.financial_checks(receivable_id);
CREATE INDEX IF NOT EXISTS idx_checks_pay ON public.financial_checks(payable_id);

ALTER TABLE public.financial_checks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auth read checks" ON public.financial_checks
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth insert checks" ON public.financial_checks
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth update checks" ON public.financial_checks
  FOR UPDATE TO authenticated USING (true);
CREATE POLICY "auth delete checks" ON public.financial_checks
  FOR DELETE TO authenticated USING (true);

DROP TRIGGER IF EXISTS trg_checks_updated ON public.financial_checks;
CREATE TRIGGER trg_checks_updated
  BEFORE UPDATE ON public.financial_checks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================================
-- BOLETOS
-- =============================================================
CREATE TABLE IF NOT EXISTS public.financial_boletos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  receivable_id UUID REFERENCES public.accounts_receivable(id) ON DELETE CASCADE,
  client_id UUID,
  client_name TEXT,
  amount NUMERIC(14,2) NOT NULL CHECK (amount > 0),
  due_date DATE NOT NULL,
  digitable_line TEXT,
  barcode TEXT,
  our_number TEXT,
  document_number TEXT,
  pdf_url TEXT,
  provider TEXT NOT NULL DEFAULT 'mock',
  external_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','registered','paid','cancelled','expired')),
  paid_at TIMESTAMPTZ,
  paid_amount NUMERIC(14,2),
  bank_account_id UUID REFERENCES public.bank_accounts(id) ON DELETE SET NULL,
  notes TEXT,
  company_id UUID,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_boletos_status ON public.financial_boletos(status);
CREATE INDEX IF NOT EXISTS idx_boletos_due ON public.financial_boletos(due_date);
CREATE INDEX IF NOT EXISTS idx_boletos_recv ON public.financial_boletos(receivable_id);

ALTER TABLE public.financial_boletos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auth read boletos" ON public.financial_boletos
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth insert boletos" ON public.financial_boletos
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth update boletos" ON public.financial_boletos
  FOR UPDATE TO authenticated USING (true);
CREATE POLICY "auth delete boletos" ON public.financial_boletos
  FOR DELETE TO authenticated USING (true);

DROP TRIGGER IF EXISTS trg_boletos_updated ON public.financial_boletos;
CREATE TRIGGER trg_boletos_updated
  BEFORE UPDATE ON public.financial_boletos
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================================
-- COMPENSATE CHECK
-- =============================================================
CREATE OR REPLACE FUNCTION public.compensate_check(
  _check_id UUID,
  _bank_account_id UUID DEFAULT NULL,
  _clear_date DATE DEFAULT CURRENT_DATE
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_check RECORD;
  v_settlement_id UUID;
  v_ledger_id UUID;
  v_bank UUID;
BEGIN
  SELECT * INTO v_check FROM public.financial_checks WHERE id = _check_id FOR UPDATE;
  IF v_check.id IS NULL THEN RAISE EXCEPTION 'Cheque não encontrado'; END IF;
  IF v_check.status = 'cleared' THEN RAISE EXCEPTION 'Cheque já compensado'; END IF;
  IF v_check.status IN ('bounced','cancelled') THEN RAISE EXCEPTION 'Cheque % não pode ser compensado', v_check.status; END IF;

  v_bank := COALESCE(_bank_account_id, v_check.bank_account_id);

  INSERT INTO public.financial_ledger (
    entry_date, type, amount, description, bank_account_id,
    source, source_id, payment_method, reference
  ) VALUES (
    _clear_date,
    CASE WHEN v_check.check_type = 'received' THEN 'inflow' ELSE 'outflow' END,
    v_check.amount,
    'Compensação cheque ' || v_check.check_number || COALESCE(' - '||v_check.issuer_name,''),
    v_bank, 'check', v_check.id, 'check', v_check.check_number
  ) RETURNING id INTO v_ledger_id;

  IF v_check.receivable_id IS NOT NULL THEN
    INSERT INTO public.financial_settlements (
      source_type, source_id, amount, total_settled, settlement_date,
      bank_account_id, payment_method, ledger_id, status, notes
    ) VALUES (
      'receivable', v_check.receivable_id, v_check.amount, v_check.amount,
      _clear_date, v_bank, 'check', v_ledger_id, 'active',
      'Compensação cheque ' || v_check.check_number
    ) RETURNING id INTO v_settlement_id;

    UPDATE public.accounts_receivable
       SET paid_amount = COALESCE(paid_amount,0) + v_check.amount,
           open_amount = GREATEST(amount - (COALESCE(paid_amount,0) + v_check.amount), 0),
           status = CASE WHEN amount - (COALESCE(paid_amount,0) + v_check.amount) <= 0.009 THEN 'paid' ELSE 'partial' END,
           payment_date = _clear_date,
           payment_method = 'check',
           updated_at = now()
     WHERE id = v_check.receivable_id;

  ELSIF v_check.payable_id IS NOT NULL THEN
    INSERT INTO public.financial_settlements (
      source_type, source_id, amount, total_settled, settlement_date,
      bank_account_id, payment_method, ledger_id, status, notes
    ) VALUES (
      'payable', v_check.payable_id, v_check.amount, v_check.amount,
      _clear_date, v_bank, 'check', v_ledger_id, 'active',
      'Compensação cheque ' || v_check.check_number
    ) RETURNING id INTO v_settlement_id;

    UPDATE public.accounts_payable
       SET paid_amount = COALESCE(paid_amount,0) + v_check.amount,
           open_amount = GREATEST(amount - (COALESCE(paid_amount,0) + v_check.amount), 0),
           status = CASE WHEN amount - (COALESCE(paid_amount,0) + v_check.amount) <= 0.009 THEN 'paid' ELSE 'partial' END,
           payment_date = _clear_date,
           payment_method = 'check',
           updated_at = now()
     WHERE id = v_check.payable_id;
  END IF;

  UPDATE public.financial_checks
     SET status = 'cleared',
         clear_date = _clear_date,
         bank_account_id = v_bank,
         settlement_id = v_settlement_id,
         ledger_id = v_ledger_id,
         updated_at = now()
   WHERE id = _check_id;

  RETURN jsonb_build_object('ok', true, 'ledger_id', v_ledger_id, 'settlement_id', v_settlement_id);
END; $$;

-- =============================================================
-- BATCH PAY
-- =============================================================
CREATE OR REPLACE FUNCTION public.batch_pay_payables(
  _payable_ids UUID[],
  _bank_account_id UUID,
  _payment_method TEXT,
  _payment_date DATE DEFAULT CURRENT_DATE,
  _notes TEXT DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_id UUID;
  v_open NUMERIC;
  v_count INT := 0;
  v_total NUMERIC := 0;
BEGIN
  FOREACH v_id IN ARRAY _payable_ids LOOP
    SELECT GREATEST(amount - COALESCE(paid_amount,0), 0)
      INTO v_open FROM public.accounts_payable WHERE id = v_id;
    IF v_open IS NULL OR v_open <= 0 THEN CONTINUE; END IF;

    INSERT INTO public.payment_records (
      payable_id, amount, total_paid, payment_method, payment_date,
      bank_account_id, notes, created_by
    ) VALUES (
      v_id, v_open, v_open, _payment_method, _payment_date,
      _bank_account_id, COALESCE(_notes,'Pagamento em lote'), auth.uid()
    );
    v_count := v_count + 1;
    v_total := v_total + v_open;
  END LOOP;

  RETURN jsonb_build_object('ok', true, 'paid_count', v_count, 'total', v_total);
END; $$;

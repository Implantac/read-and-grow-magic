
-- 1. ADIANTAMENTOS
CREATE TABLE IF NOT EXISTS public.financial_advance_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  advance_id UUID NOT NULL REFERENCES public.financial_advances(id) ON DELETE CASCADE,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('entry','use','reversal')),
  amount NUMERIC NOT NULL CHECK (amount > 0),
  transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
  reference_type TEXT,
  reference_id UUID,
  ledger_id UUID REFERENCES public.financial_ledger(id),
  notes TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_advance_tx_advance ON public.financial_advance_transactions(advance_id);
CREATE INDEX IF NOT EXISTS idx_advance_tx_date ON public.financial_advance_transactions(transaction_date);
ALTER TABLE public.financial_advance_transactions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "auth read advance tx" ON public.financial_advance_transactions;
CREATE POLICY "auth read advance tx" ON public.financial_advance_transactions FOR SELECT USING (auth.uid() IS NOT NULL);
DROP POLICY IF EXISTS "auth ins advance tx" ON public.financial_advance_transactions;
CREATE POLICY "auth ins advance tx" ON public.financial_advance_transactions FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE OR REPLACE FUNCTION public.guard_advance_balance()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_remaining numeric;
BEGIN
  SELECT remaining_amount INTO v_remaining FROM public.financial_advances WHERE id = NEW.advance_id FOR UPDATE;
  IF NEW.transaction_type = 'use' AND v_remaining < NEW.amount THEN
    RAISE EXCEPTION 'Saldo de adiantamento insuficiente (disponível: %, solicitado: %)', v_remaining, NEW.amount;
  END IF;
  IF NEW.transaction_type = 'use' THEN
    UPDATE public.financial_advances
       SET used_amount = COALESCE(used_amount,0) + NEW.amount,
           status = CASE WHEN amount - (COALESCE(used_amount,0) + NEW.amount) <= 0.009 THEN 'consumed' ELSE 'partial' END
     WHERE id = NEW.advance_id;
  ELSIF NEW.transaction_type = 'reversal' THEN
    UPDATE public.financial_advances
       SET used_amount = GREATEST(COALESCE(used_amount,0) - NEW.amount, 0),
           status = 'available'
     WHERE id = NEW.advance_id;
  END IF;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS trg_guard_advance ON public.financial_advance_transactions;
CREATE TRIGGER trg_guard_advance BEFORE INSERT ON public.financial_advance_transactions
FOR EACH ROW EXECUTE FUNCTION public.guard_advance_balance();

-- 2. SETTLEMENTS
CREATE TABLE IF NOT EXISTS public.financial_settlements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_type TEXT NOT NULL CHECK (source_type IN ('receivable','payable','advance')),
  source_id UUID NOT NULL,
  amount NUMERIC NOT NULL CHECK (amount > 0),
  interest NUMERIC DEFAULT 0,
  penalty NUMERIC DEFAULT 0,
  discount NUMERIC DEFAULT 0,
  total_settled NUMERIC NOT NULL,
  settlement_date DATE NOT NULL DEFAULT CURRENT_DATE,
  bank_account_id UUID REFERENCES public.bank_accounts(id),
  payment_method TEXT,
  ledger_id UUID REFERENCES public.financial_ledger(id),
  payment_record_id UUID REFERENCES public.payment_records(id),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','reversed')),
  reversed_at TIMESTAMPTZ,
  reversed_by UUID,
  notes TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_settlements_source ON public.financial_settlements(source_type, source_id);
CREATE INDEX IF NOT EXISTS idx_settlements_date ON public.financial_settlements(settlement_date);
ALTER TABLE public.financial_settlements ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "auth read sett" ON public.financial_settlements;
CREATE POLICY "auth read sett" ON public.financial_settlements FOR SELECT USING (auth.uid() IS NOT NULL);
DROP POLICY IF EXISTS "auth ins sett" ON public.financial_settlements;
CREATE POLICY "auth ins sett" ON public.financial_settlements FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
DROP POLICY IF EXISTS "auth upd sett" ON public.financial_settlements;
CREATE POLICY "auth upd sett" ON public.financial_settlements FOR UPDATE USING (auth.uid() IS NOT NULL);

-- 3. TRANSFERÊNCIAS
CREATE TABLE IF NOT EXISTS public.bank_transfers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_account_id UUID NOT NULL REFERENCES public.bank_accounts(id),
  to_account_id UUID NOT NULL REFERENCES public.bank_accounts(id),
  amount NUMERIC NOT NULL CHECK (amount > 0),
  transfer_date DATE NOT NULL DEFAULT CURRENT_DATE,
  description TEXT,
  outflow_ledger_id UUID REFERENCES public.financial_ledger(id),
  inflow_ledger_id UUID REFERENCES public.financial_ledger(id),
  fees NUMERIC DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'completed',
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (from_account_id <> to_account_id)
);
ALTER TABLE public.bank_transfers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "auth read tr" ON public.bank_transfers;
CREATE POLICY "auth read tr" ON public.bank_transfers FOR SELECT USING (auth.uid() IS NOT NULL);
DROP POLICY IF EXISTS "auth ins tr" ON public.bank_transfers;
CREATE POLICY "auth ins tr" ON public.bank_transfers FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- 4. LOG
CREATE TABLE IF NOT EXISTS public.financial_operations_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  operation_type TEXT NOT NULL,
  entity_type TEXT,
  entity_id UUID,
  amount NUMERIC,
  payload JSONB,
  user_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_ops_log_type ON public.financial_operations_log(operation_type);
CREATE INDEX IF NOT EXISTS idx_ops_log_date ON public.financial_operations_log(created_at);
ALTER TABLE public.financial_operations_log ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "auth read ops" ON public.financial_operations_log;
CREATE POLICY "auth read ops" ON public.financial_operations_log FOR SELECT USING (auth.uid() IS NOT NULL);
DROP POLICY IF EXISTS "auth ins ops" ON public.financial_operations_log;
CREATE POLICY "auth ins ops" ON public.financial_operations_log FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- 5. AR/AP
ALTER TABLE public.accounts_receivable ADD COLUMN IF NOT EXISTS expected_date DATE;
ALTER TABLE public.accounts_payable ADD COLUMN IF NOT EXISTS expected_payment_date DATE;
ALTER TABLE public.accounts_payable ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'normal';

-- 6. USE_ADVANCE
CREATE OR REPLACE FUNCTION public.use_advance(
  _advance_id UUID, _source_type TEXT, _source_id UUID, _amount NUMERIC, _notes TEXT DEFAULT NULL
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_advance RECORD; v_settlement_id UUID; v_tx_id UUID;
BEGIN
  SELECT * INTO v_advance FROM public.financial_advances WHERE id = _advance_id FOR UPDATE;
  IF v_advance.id IS NULL THEN RAISE EXCEPTION 'Adiantamento não encontrado'; END IF;
  IF v_advance.remaining_amount < _amount THEN
    RAISE EXCEPTION 'Saldo insuficiente: disponível R$ %, solicitado R$ %', v_advance.remaining_amount, _amount;
  END IF;

  INSERT INTO public.financial_advance_transactions (advance_id, transaction_type, amount, reference_type, reference_id, notes)
  VALUES (_advance_id, 'use', _amount, _source_type, _source_id, _notes) RETURNING id INTO v_tx_id;

  INSERT INTO public.financial_settlements (source_type, source_id, amount, total_settled, settlement_date, payment_method, notes, status)
  VALUES (_source_type, _source_id, _amount, _amount, CURRENT_DATE, 'advance_offset', COALESCE(_notes,'Compensação via adiantamento'), 'active')
  RETURNING id INTO v_settlement_id;

  IF _source_type = 'receivable' THEN
    UPDATE public.accounts_receivable
       SET paid_amount = COALESCE(paid_amount,0) + _amount,
           open_amount = GREATEST(amount - (COALESCE(paid_amount,0) + _amount), 0),
           status = CASE WHEN amount - (COALESCE(paid_amount,0) + _amount) <= 0.009 THEN 'paid' ELSE 'partial' END,
           updated_at = now()
     WHERE id = _source_id;
  ELSIF _source_type = 'payable' THEN
    UPDATE public.accounts_payable
       SET paid_amount = COALESCE(paid_amount,0) + _amount,
           open_amount = GREATEST(amount - (COALESCE(paid_amount,0) + _amount), 0),
           status = CASE WHEN amount - (COALESCE(paid_amount,0) + _amount) <= 0.009 THEN 'paid' ELSE 'partial' END,
           updated_at = now()
     WHERE id = _source_id;
  END IF;

  INSERT INTO public.financial_operations_log(operation_type, entity_type, entity_id, amount, payload, user_id)
  VALUES ('advance_used', _source_type, _source_id, _amount,
          jsonb_build_object('advance_id', _advance_id, 'settlement_id', v_settlement_id), auth.uid());

  RETURN jsonb_build_object('ok', true, 'settlement_id', v_settlement_id, 'transaction_id', v_tx_id);
END; $$;

-- 7. TRANSFER
CREATE OR REPLACE FUNCTION public.transfer_between_accounts(
  _from_account UUID, _to_account UUID, _amount NUMERIC, _description TEXT DEFAULT 'Transferência entre contas'
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_transfer_id UUID; v_outflow_id UUID; v_inflow_id UUID;
BEGIN
  IF _from_account = _to_account THEN RAISE EXCEPTION 'Conta origem e destino devem ser diferentes'; END IF;
  IF _amount <= 0 THEN RAISE EXCEPTION 'Valor deve ser positivo'; END IF;

  INSERT INTO public.bank_transfers (from_account_id, to_account_id, amount, description, created_by)
  VALUES (_from_account, _to_account, _amount, _description, auth.uid()) RETURNING id INTO v_transfer_id;

  INSERT INTO public.financial_ledger (entry_date, type, amount, description, bank_account_id, source, source_id, payment_method)
  VALUES (CURRENT_DATE, 'outflow', _amount, _description || ' (saída)', _from_account, 'transfer', v_transfer_id, 'transfer')
  RETURNING id INTO v_outflow_id;

  INSERT INTO public.financial_ledger (entry_date, type, amount, description, bank_account_id, source, source_id, payment_method)
  VALUES (CURRENT_DATE, 'inflow', _amount, _description || ' (entrada)', _to_account, 'transfer', v_transfer_id, 'transfer')
  RETURNING id INTO v_inflow_id;

  UPDATE public.bank_transfers SET outflow_ledger_id = v_outflow_id, inflow_ledger_id = v_inflow_id WHERE id = v_transfer_id;

  INSERT INTO public.financial_operations_log(operation_type, entity_type, entity_id, amount, payload, user_id)
  VALUES ('bank_transfer', 'bank_transfer', v_transfer_id, _amount,
          jsonb_build_object('from', _from_account, 'to', _to_account), auth.uid());

  RETURN jsonb_build_object('ok', true, 'transfer_id', v_transfer_id);
END; $$;

-- 8. REVERSE
CREATE OR REPLACE FUNCTION public.reverse_settlement(_settlement_id UUID, _reason TEXT DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_settlement RECORD;
BEGIN
  SELECT * INTO v_settlement FROM public.financial_settlements WHERE id = _settlement_id FOR UPDATE;
  IF v_settlement.id IS NULL THEN RAISE EXCEPTION 'Baixa não encontrada'; END IF;
  IF v_settlement.status = 'reversed' THEN RAISE EXCEPTION 'Baixa já estornada'; END IF;

  IF v_settlement.ledger_id IS NOT NULL THEN
    INSERT INTO public.financial_ledger (entry_date, type, amount, description, bank_account_id, source, source_id, payment_method, notes)
    SELECT CURRENT_DATE, CASE WHEN type='inflow' THEN 'outflow' ELSE 'inflow' END, amount,
           'ESTORNO: ' || description, bank_account_id, 'reversal', v_settlement.id, payment_method,
           COALESCE(_reason, 'Estorno de baixa')
      FROM public.financial_ledger WHERE id = v_settlement.ledger_id;
  END IF;

  IF v_settlement.source_type = 'receivable' THEN
    UPDATE public.accounts_receivable
       SET paid_amount = GREATEST(COALESCE(paid_amount,0) - v_settlement.total_settled, 0),
           open_amount = LEAST(amount, COALESCE(open_amount,0) + v_settlement.total_settled),
           status = 'pending', payment_date = NULL, updated_at = now()
     WHERE id = v_settlement.source_id;
  ELSIF v_settlement.source_type = 'payable' THEN
    UPDATE public.accounts_payable
       SET paid_amount = GREATEST(COALESCE(paid_amount,0) - v_settlement.total_settled, 0),
           open_amount = LEAST(amount, COALESCE(open_amount,0) + v_settlement.total_settled),
           status = 'pending', payment_date = NULL, updated_at = now()
     WHERE id = v_settlement.source_id;
  END IF;

  UPDATE public.financial_settlements
     SET status = 'reversed', reversed_at = now(), reversed_by = auth.uid(),
         notes = COALESCE(notes,'') || ' | ESTORNO: ' || COALESCE(_reason,'sem motivo')
   WHERE id = _settlement_id;

  INSERT INTO public.financial_operations_log(operation_type, entity_type, entity_id, amount, payload, user_id)
  VALUES ('settlement_reversed', v_settlement.source_type, v_settlement.source_id, v_settlement.total_settled,
          jsonb_build_object('settlement_id', _settlement_id, 'reason', _reason), auth.uid());

  RETURN jsonb_build_object('ok', true, 'reversed', _settlement_id);
END; $$;

-- 9. AUTO-SETTLEMENT
CREATE OR REPLACE FUNCTION public.auto_create_settlement_from_payment()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_source_type text; v_source_id uuid;
BEGIN
  IF NEW.receivable_id IS NOT NULL THEN
    v_source_type := 'receivable'; v_source_id := NEW.receivable_id;
  ELSIF NEW.payable_id IS NOT NULL THEN
    v_source_type := 'payable'; v_source_id := NEW.payable_id;
  ELSE RETURN NEW; END IF;

  INSERT INTO public.financial_settlements (
    source_type, source_id, amount, interest, penalty, discount, total_settled,
    settlement_date, bank_account_id, payment_method, payment_record_id, status
  ) VALUES (
    v_source_type, v_source_id, NEW.amount, COALESCE(NEW.interest,0), COALESCE(NEW.penalty,0),
    COALESCE(NEW.discount,0), NEW.total_paid, NEW.payment_date::date, NEW.bank_account_id,
    NEW.payment_method, NEW.id, 'active'
  );

  INSERT INTO public.financial_operations_log(operation_type, entity_type, entity_id, amount, payload, user_id)
  VALUES ('settlement_created', v_source_type, v_source_id, NEW.total_paid,
          jsonb_build_object('payment_record_id', NEW.id), auth.uid());

  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS trg_auto_settlement ON public.payment_records;
CREATE TRIGGER trg_auto_settlement AFTER INSERT ON public.payment_records
FOR EACH ROW EXECUTE FUNCTION public.auto_create_settlement_from_payment();

-- 10. CORREÇÕES
UPDATE public.accounts_receivable
   SET open_amount = GREATEST(amount - COALESCE(paid_amount,0), 0)
 WHERE open_amount IS DISTINCT FROM GREATEST(amount - COALESCE(paid_amount,0), 0);
UPDATE public.accounts_payable
   SET open_amount = GREATEST(amount - COALESCE(paid_amount,0), 0)
 WHERE open_amount IS DISTINCT FROM GREATEST(amount - COALESCE(paid_amount,0), 0);
UPDATE public.accounts_receivable SET status = 'overdue', updated_at = now()
 WHERE status = 'pending' AND due_date < CURRENT_DATE AND COALESCE(open_amount,0) > 0;
UPDATE public.accounts_payable SET status = 'overdue', updated_at = now()
 WHERE status = 'pending' AND due_date < CURRENT_DATE AND COALESCE(open_amount,0) > 0;

DO $$ DECLARE r record;
BEGIN
  FOR r IN SELECT id FROM public.bank_accounts WHERE active = true LOOP
    PERFORM public.recalc_bank_balance(r.id);
  END LOOP;
END $$;

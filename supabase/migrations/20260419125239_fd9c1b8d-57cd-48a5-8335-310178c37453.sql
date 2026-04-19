
-- =========================================================
-- FASE 1: Central de Liquidação, Multi-forma, Compensação,
--         Conta Corrente, Vínculo com operações
-- =========================================================

-- 1) Vínculo com operações (source_type / source_id)
ALTER TABLE public.accounts_receivable
  ADD COLUMN IF NOT EXISTS source_type text,
  ADD COLUMN IF NOT EXISTS source_id uuid;

ALTER TABLE public.accounts_payable
  ADD COLUMN IF NOT EXISTS source_type text,
  ADD COLUMN IF NOT EXISTS source_id uuid;

-- Backfill para receivables existentes
UPDATE public.accounts_receivable
   SET source_type = 'sale', source_id = order_id
 WHERE source_type IS NULL AND order_id IS NOT NULL;

UPDATE public.accounts_receivable
   SET source_type = 'manual'
 WHERE source_type IS NULL;

UPDATE public.accounts_payable
   SET source_type = 'manual'
 WHERE source_type IS NULL;

CREATE INDEX IF NOT EXISTS idx_ar_source ON public.accounts_receivable(source_type, source_id);
CREATE INDEX IF NOT EXISTS idx_ap_source ON public.accounts_payable(source_type, source_id);

-- 2) Multi-forma de pagamento
CREATE TABLE IF NOT EXISTS public.financial_payment_split (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  settlement_id uuid NOT NULL REFERENCES public.financial_settlements(id) ON DELETE CASCADE,
  payment_method text NOT NULL,
  amount numeric NOT NULL CHECK (amount > 0),
  bank_account_id uuid REFERENCES public.bank_accounts(id),
  reference text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_payment_split_settlement ON public.financial_payment_split(settlement_id);

ALTER TABLE public.financial_payment_split ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auth read payment split" ON public.financial_payment_split
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth write payment split" ON public.financial_payment_split
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 3) Compensação entre contas (offsets)
CREATE TABLE IF NOT EXISTS public.financial_offsets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  receivable_id uuid NOT NULL REFERENCES public.accounts_receivable(id),
  payable_id uuid NOT NULL REFERENCES public.accounts_payable(id),
  amount numeric NOT NULL CHECK (amount > 0),
  offset_date date NOT NULL DEFAULT CURRENT_DATE,
  receivable_settlement_id uuid REFERENCES public.financial_settlements(id),
  payable_settlement_id uuid REFERENCES public.financial_settlements(id),
  notes text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_offsets_recv ON public.financial_offsets(receivable_id);
CREATE INDEX IF NOT EXISTS idx_offsets_pay ON public.financial_offsets(payable_id);

ALTER TABLE public.financial_offsets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auth read offsets" ON public.financial_offsets
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth write offsets" ON public.financial_offsets
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 4) Função: liquidação unificada com multi-forma
CREATE OR REPLACE FUNCTION public.settle_account(
  _source_type text,                 -- 'receivable' | 'payable'
  _source_id uuid,
  _splits jsonb,                     -- [{payment_method, amount, bank_account_id?, reference?}, ...]
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
BEGIN
  IF _source_type NOT IN ('receivable','payable') THEN
    RAISE EXCEPTION 'source_type inválido: %', _source_type;
  END IF;

  IF jsonb_typeof(_splits) <> 'array' OR jsonb_array_length(_splits) = 0 THEN
    RAISE EXCEPTION 'É necessário informar pelo menos uma forma de pagamento';
  END IF;

  -- Soma dos splits
  FOR v_split IN SELECT * FROM jsonb_array_elements(_splits) LOOP
    v_total := v_total + COALESCE((v_split->>'amount')::numeric, 0);
  END LOOP;

  IF v_total <= 0 THEN
    RAISE EXCEPTION 'Valor total das formas de pagamento deve ser positivo';
  END IF;

  v_total_settled := v_total + COALESCE(_interest,0) + COALESCE(_penalty,0) - COALESCE(_discount,0);
  v_amount_principal := v_total + COALESCE(_discount,0) - COALESCE(_interest,0) - COALESCE(_penalty,0);
  IF v_amount_principal < 0 THEN v_amount_principal := v_total; END IF;

  -- Trava o título e calcula saldo
  IF _source_type = 'receivable' THEN
    SELECT description, client_name, COALESCE(amount,0), COALESCE(paid_amount,0)
      INTO v_desc, v_party, v_amount_total, v_paid_before
      FROM public.accounts_receivable WHERE id = _source_id FOR UPDATE;
    IF v_desc IS NULL THEN RAISE EXCEPTION 'Conta a receber não encontrada'; END IF;
  ELSE
    SELECT description, supplier, COALESCE(amount,0), COALESCE(paid_amount,0)
      INTO v_desc, v_party, v_amount_total, v_paid_before
      FROM public.accounts_payable WHERE id = _source_id FOR UPDATE;
    IF v_desc IS NULL THEN RAISE EXCEPTION 'Conta a pagar não encontrada'; END IF;
  END IF;

  v_open := GREATEST(v_amount_total - v_paid_before, 0);
  IF v_amount_principal > v_open + 0.01 THEN
    RAISE EXCEPTION 'Valor (%, principal %) excede o saldo em aberto (%)', v_total, v_amount_principal, v_open;
  END IF;

  -- Forma principal = primeira do array
  v_main_method := COALESCE((_splits->0->>'payment_method'), 'cash');
  v_main_account := NULLIF((_splits->0->>'bank_account_id'),'')::uuid;

  -- Cria settlement
  INSERT INTO public.financial_settlements (
    source_type, source_id, amount, interest, penalty, discount,
    total_settled, settlement_date, bank_account_id, payment_method, notes, status
  ) VALUES (
    _source_type, _source_id, v_amount_principal,
    COALESCE(_interest,0), COALESCE(_penalty,0), COALESCE(_discount,0),
    v_total_settled, _settlement_date, v_main_account, v_main_method, _notes, 'active'
  ) RETURNING id INTO v_settlement_id;

  -- Cria splits + ledger por split
  FOR v_split IN SELECT * FROM jsonb_array_elements(_splits) LOOP
    INSERT INTO public.financial_payment_split (
      settlement_id, payment_method, amount, bank_account_id, reference, notes
    ) VALUES (
      v_settlement_id,
      v_split->>'payment_method',
      (v_split->>'amount')::numeric,
      NULLIF(v_split->>'bank_account_id','')::uuid,
      v_split->>'reference',
      v_split->>'notes'
    );

    INSERT INTO public.financial_ledger (
      entry_date, type, amount, description, bank_account_id,
      source, source_id, payment_method, reference
    ) VALUES (
      _settlement_date,
      CASE WHEN _source_type='receivable' THEN 'inflow' ELSE 'outflow' END,
      (v_split->>'amount')::numeric,
      COALESCE(v_desc,'Liquidação') || ' — ' || COALESCE(v_party,''),
      NULLIF(v_split->>'bank_account_id','')::uuid,
      _source_type, _source_id,
      v_split->>'payment_method',
      v_settlement_id::text
    ) RETURNING id INTO v_ledger_id;
  END LOOP;

  -- Linka o ledger principal ao settlement (último gerado serve de referência)
  UPDATE public.financial_settlements
     SET ledger_id = v_ledger_id
   WHERE id = v_settlement_id AND ledger_id IS NULL;

  -- Atualiza o título
  IF _source_type = 'receivable' THEN
    UPDATE public.accounts_receivable
       SET paid_amount   = COALESCE(paid_amount,0) + v_amount_principal,
           open_amount   = GREATEST(amount - (COALESCE(paid_amount,0) + v_amount_principal), 0),
           interest      = COALESCE(interest,0) + COALESCE(_interest,0),
           penalty       = COALESCE(penalty,0) + COALESCE(_penalty,0),
           discount_amount = COALESCE(discount_amount,0) + COALESCE(_discount,0),
           payment_date  = _settlement_date,
           payment_method = v_main_method,
           status        = CASE WHEN amount - (COALESCE(paid_amount,0) + v_amount_principal) <= 0.009 THEN 'paid' ELSE 'partial' END,
           updated_at    = now()
     WHERE id = _source_id;
  ELSE
    UPDATE public.accounts_payable
       SET paid_amount   = COALESCE(paid_amount,0) + v_amount_principal,
           open_amount   = GREATEST(amount - (COALESCE(paid_amount,0) + v_amount_principal), 0),
           interest      = COALESCE(interest,0) + COALESCE(_interest,0),
           penalty       = COALESCE(penalty,0) + COALESCE(_penalty,0),
           discount_amount = COALESCE(discount_amount,0) + COALESCE(_discount,0),
           payment_date  = _settlement_date,
           payment_method = v_main_method,
           status        = CASE WHEN amount - (COALESCE(paid_amount,0) + v_amount_principal) <= 0.009 THEN 'paid' ELSE 'partial' END,
           updated_at    = now()
     WHERE id = _source_id;
  END IF;

  INSERT INTO public.financial_operations_log(operation_type, entity_type, entity_id, amount, payload, user_id)
  VALUES ('settlement_created', _source_type, _source_id, v_total_settled,
          jsonb_build_object('settlement_id', v_settlement_id, 'splits', _splits), auth.uid());

  RETURN jsonb_build_object('ok', true, 'settlement_id', v_settlement_id, 'total_settled', v_total_settled);
END; $$;

-- 5) Função: compensação entre receber e pagar (cliente = fornecedor)
CREATE OR REPLACE FUNCTION public.compensate_accounts(
  _receivable_id uuid,
  _payable_id uuid,
  _amount numeric,
  _notes text DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_recv_open numeric;
  v_pay_open numeric;
  v_recv_settle uuid;
  v_pay_settle uuid;
  v_offset_id uuid;
BEGIN
  IF _amount <= 0 THEN RAISE EXCEPTION 'Valor deve ser positivo'; END IF;

  SELECT GREATEST(amount - COALESCE(paid_amount,0),0) INTO v_recv_open
    FROM public.accounts_receivable WHERE id = _receivable_id FOR UPDATE;
  SELECT GREATEST(amount - COALESCE(paid_amount,0),0) INTO v_pay_open
    FROM public.accounts_payable WHERE id = _payable_id FOR UPDATE;

  IF v_recv_open IS NULL OR v_pay_open IS NULL THEN
    RAISE EXCEPTION 'Conta a receber ou a pagar não encontrada';
  END IF;
  IF _amount > v_recv_open OR _amount > v_pay_open THEN
    RAISE EXCEPTION 'Valor excede saldo. Receber: %, Pagar: %', v_recv_open, v_pay_open;
  END IF;

  -- Settlement no receber
  INSERT INTO public.financial_settlements
    (source_type, source_id, amount, total_settled, settlement_date, payment_method, notes, status)
  VALUES ('receivable', _receivable_id, _amount, _amount, CURRENT_DATE, 'offset',
          COALESCE(_notes,'Compensação cliente/fornecedor'), 'active')
  RETURNING id INTO v_recv_settle;

  -- Settlement no pagar
  INSERT INTO public.financial_settlements
    (source_type, source_id, amount, total_settled, settlement_date, payment_method, notes, status)
  VALUES ('payable', _payable_id, _amount, _amount, CURRENT_DATE, 'offset',
          COALESCE(_notes,'Compensação cliente/fornecedor'), 'active')
  RETURNING id INTO v_pay_settle;

  -- Atualiza saldos sem tocar caixa
  UPDATE public.accounts_receivable
     SET paid_amount = COALESCE(paid_amount,0) + _amount,
         open_amount = GREATEST(amount - (COALESCE(paid_amount,0) + _amount),0),
         status = CASE WHEN amount - (COALESCE(paid_amount,0) + _amount) <= 0.009 THEN 'paid' ELSE 'partial' END,
         payment_method = 'offset',
         payment_date = CURRENT_DATE,
         updated_at = now()
   WHERE id = _receivable_id;

  UPDATE public.accounts_payable
     SET paid_amount = COALESCE(paid_amount,0) + _amount,
         open_amount = GREATEST(amount - (COALESCE(paid_amount,0) + _amount),0),
         status = CASE WHEN amount - (COALESCE(paid_amount,0) + _amount) <= 0.009 THEN 'paid' ELSE 'partial' END,
         payment_method = 'offset',
         payment_date = CURRENT_DATE,
         updated_at = now()
   WHERE id = _payable_id;

  INSERT INTO public.financial_offsets
    (receivable_id, payable_id, amount, receivable_settlement_id, payable_settlement_id, notes, created_by)
  VALUES (_receivable_id, _payable_id, _amount, v_recv_settle, v_pay_settle, _notes, auth.uid())
  RETURNING id INTO v_offset_id;

  INSERT INTO public.financial_operations_log(operation_type, entity_type, entity_id, amount, payload, user_id)
  VALUES ('offset_created', 'offset', v_offset_id, _amount,
          jsonb_build_object('receivable', _receivable_id, 'payable', _payable_id), auth.uid());

  RETURN jsonb_build_object('ok', true, 'offset_id', v_offset_id);
END; $$;

-- 6) Função: extrato de conta corrente por entidade
CREATE OR REPLACE FUNCTION public.get_account_statement(
  _entity_type text,    -- 'client' | 'supplier'
  _entity_id uuid,
  _from date DEFAULT (CURRENT_DATE - INTERVAL '180 days')::date,
  _to date DEFAULT CURRENT_DATE
) RETURNS TABLE (
  entry_date date,
  kind text,         -- 'debit' | 'credit'
  category text,     -- 'sale','payment','purchase','advance','offset'
  description text,
  reference text,
  amount numeric,
  running_balance numeric
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_running numeric := 0;
BEGIN
  RETURN QUERY
  WITH base AS (
    -- Cliente: receivables = débito (cliente deve), settlements = crédito
    SELECT ar.due_date::date AS entry_date, 'debit'::text AS kind,
           CASE WHEN ar.source_type='sale' THEN 'sale' ELSE 'receivable' END AS category,
           ar.description, ar.invoice_number AS reference, ar.amount
      FROM public.accounts_receivable ar
     WHERE _entity_type = 'client' AND ar.client_id = _entity_id
       AND ar.due_date BETWEEN _from AND _to
    UNION ALL
    SELECT fs.settlement_date, 'credit', fs.payment_method,
           'Baixa: ' || COALESCE(fs.notes,''), fs.id::text, fs.total_settled
      FROM public.financial_settlements fs
      JOIN public.accounts_receivable ar ON ar.id = fs.source_id
     WHERE _entity_type = 'client' AND fs.source_type='receivable' AND fs.status='active'
       AND ar.client_id = _entity_id
       AND fs.settlement_date BETWEEN _from AND _to
    UNION ALL
    -- Fornecedor: payables = crédito (devemos), settlements = débito
    SELECT ap.due_date::date, 'credit',
           CASE WHEN ap.source_type='purchase' THEN 'purchase' ELSE 'payable' END,
           ap.description, ap.invoice_number, ap.amount
      FROM public.accounts_payable ap
     WHERE _entity_type = 'supplier' AND ap.supplier = (SELECT name FROM public.suppliers WHERE id = _entity_id)
       AND ap.due_date BETWEEN _from AND _to
    UNION ALL
    SELECT fs.settlement_date, 'debit', fs.payment_method,
           'Pagamento: ' || COALESCE(fs.notes,''), fs.id::text, fs.total_settled
      FROM public.financial_settlements fs
      JOIN public.accounts_payable ap ON ap.id = fs.source_id
     WHERE _entity_type = 'supplier' AND fs.source_type='payable' AND fs.status='active'
       AND ap.supplier = (SELECT name FROM public.suppliers WHERE id = _entity_id)
       AND fs.settlement_date BETWEEN _from AND _to
  )
  SELECT b.entry_date, b.kind, b.category, b.description, b.reference, b.amount,
         SUM(CASE WHEN b.kind='debit' THEN b.amount ELSE -b.amount END)
           OVER (ORDER BY b.entry_date, b.kind) AS running_balance
    FROM base b
   ORDER BY b.entry_date, b.kind;
END; $$;


-- 1. Adicionar colunas em bank_transactions
ALTER TABLE public.bank_transactions
  ADD COLUMN IF NOT EXISTS bank_account_id UUID REFERENCES public.bank_accounts(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS imported_at TIMESTAMPTZ DEFAULT now(),
  ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'manual';

CREATE UNIQUE INDEX IF NOT EXISTS idx_bank_tx_unique_ref
  ON public.bank_transactions(bank_account_id, bank_reference)
  WHERE bank_reference IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_bank_tx_account_date
  ON public.bank_transactions(bank_account_id, date);

-- 2. Função: importar lote de transações bancárias (idempotente)
CREATE OR REPLACE FUNCTION public.import_bank_statement_batch(
  p_bank_account_id UUID,
  p_transactions JSONB
)
RETURNS TABLE(inserted INT, skipped INT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_inserted INT := 0;
  v_skipped INT := 0;
  v_tx JSONB;
BEGIN
  FOR v_tx IN SELECT * FROM jsonb_array_elements(p_transactions) LOOP
    BEGIN
      INSERT INTO public.bank_transactions (
        bank_account_id, date, description, amount, type, bank_reference, status, source
      ) VALUES (
        p_bank_account_id,
        (v_tx->>'date')::timestamptz,
        v_tx->>'description',
        (v_tx->>'amount')::numeric,
        v_tx->>'type',
        v_tx->>'bank_reference',
        'pending',
        COALESCE(v_tx->>'source', 'import')
      );
      v_inserted := v_inserted + 1;
    EXCEPTION WHEN unique_violation THEN
      v_skipped := v_skipped + 1;
    END;
  END LOOP;
  RETURN QUERY SELECT v_inserted, v_skipped;
END;
$$;

-- 3. Função: match automático ledger ↔ bank_transactions
CREATE OR REPLACE FUNCTION public.auto_match_bank_transactions(
  p_bank_account_id UUID DEFAULT NULL,
  p_tolerance_days INT DEFAULT 3
)
RETURNS TABLE(matched INT, total_pending INT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_matched INT := 0;
  v_total INT := 0;
  r RECORD;
  v_ledger_id UUID;
BEGIN
  FOR r IN
    SELECT bt.* FROM public.bank_transactions bt
    WHERE bt.status = 'pending'
      AND bt.matched_entry_id IS NULL
      AND (p_bank_account_id IS NULL OR bt.bank_account_id = p_bank_account_id)
  LOOP
    v_total := v_total + 1;

    -- Busca lançamento do ledger compatível (valor + conta + janela de datas)
    SELECT id INTO v_ledger_id
    FROM public.financial_ledger fl
    WHERE fl.bank_account_id = r.bank_account_id
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
$$;

-- 4. Conciliação manual (vincula manualmente um lançamento ao ledger)
CREATE OR REPLACE FUNCTION public.manual_match_transaction(
  p_bank_transaction_id UUID,
  p_ledger_entry_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.bank_transactions
    SET status = 'matched', matched_entry_id = p_ledger_entry_id
    WHERE id = p_bank_transaction_id;
  UPDATE public.financial_ledger
    SET reconciled = true, bank_transaction_id = p_bank_transaction_id
    WHERE id = p_ledger_entry_id;
  RETURN true;
END;
$$;

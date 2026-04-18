-- ============================================================
-- 1. PLANO DE CONTAS FINANCEIRO
-- ============================================================
CREATE TABLE IF NOT EXISTS public.financial_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL,
  name text NOT NULL,
  type text NOT NULL CHECK (type IN ('income','expense','cost','transfer')),
  parent_id uuid REFERENCES public.financial_categories(id) ON DELETE SET NULL,
  color text DEFAULT '#3b82f6',
  active boolean NOT NULL DEFAULT true,
  company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (company_id, code)
);

ALTER TABLE public.financial_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view financial_categories"
  ON public.financial_categories FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can manage financial_categories"
  ON public.financial_categories FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_fin_cat_type ON public.financial_categories(type);
CREATE INDEX IF NOT EXISTS idx_fin_cat_parent ON public.financial_categories(parent_id);

-- ============================================================
-- 2. LEDGER FINANCEIRO (RAZÃO)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.financial_ledger (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_date date NOT NULL DEFAULT CURRENT_DATE,
  type text NOT NULL CHECK (type IN ('inflow','outflow')),
  amount numeric(14,2) NOT NULL CHECK (amount > 0),
  description text NOT NULL,
  bank_account_id uuid REFERENCES public.bank_accounts(id) ON DELETE SET NULL,
  category_id uuid REFERENCES public.financial_categories(id) ON DELETE SET NULL,
  source text NOT NULL CHECK (source IN ('receivable','payable','advance','manual','transfer','reconciliation','pix','adjustment')),
  source_id uuid,
  payment_method text,
  reference text,
  notes text,
  reconciled boolean NOT NULL DEFAULT false,
  bank_transaction_id uuid REFERENCES public.bank_transactions(id) ON DELETE SET NULL,
  company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.financial_ledger ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view financial_ledger"
  ON public.financial_ledger FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert financial_ledger"
  ON public.financial_ledger FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update financial_ledger"
  ON public.financial_ledger FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Admins can delete financial_ledger"
  ON public.financial_ledger FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(),'admin'));

CREATE INDEX IF NOT EXISTS idx_ledger_date ON public.financial_ledger(entry_date);
CREATE INDEX IF NOT EXISTS idx_ledger_bank ON public.financial_ledger(bank_account_id);
CREATE INDEX IF NOT EXISTS idx_ledger_cat ON public.financial_ledger(category_id);
CREATE INDEX IF NOT EXISTS idx_ledger_source ON public.financial_ledger(source, source_id);
CREATE INDEX IF NOT EXISTS idx_ledger_type_date ON public.financial_ledger(type, entry_date);

-- ============================================================
-- 3. ADIANTAMENTOS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.financial_advances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  party_type text NOT NULL CHECK (party_type IN ('client','supplier')),
  client_id uuid REFERENCES public.clients(id) ON DELETE SET NULL,
  supplier_id uuid,
  party_name text NOT NULL,
  amount numeric(14,2) NOT NULL CHECK (amount > 0),
  used_amount numeric(14,2) NOT NULL DEFAULT 0,
  remaining_amount numeric(14,2) GENERATED ALWAYS AS (amount - used_amount) STORED,
  bank_account_id uuid REFERENCES public.bank_accounts(id) ON DELETE SET NULL,
  payment_method text,
  received_date date NOT NULL DEFAULT CURRENT_DATE,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open','partially_used','consumed','refunded','cancelled')),
  notes text,
  company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.financial_advances ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view financial_advances"
  ON public.financial_advances FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can manage financial_advances"
  ON public.financial_advances FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_adv_client ON public.financial_advances(client_id);
CREATE INDEX IF NOT EXISTS idx_adv_status ON public.financial_advances(status);

-- ============================================================
-- 4. AJUSTES EM TABELAS EXISTENTES
-- ============================================================
ALTER TABLE public.accounts_receivable
  ADD COLUMN IF NOT EXISTS bank_account_id uuid REFERENCES public.bank_accounts(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS category_id uuid REFERENCES public.financial_categories(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS recurrence text;

ALTER TABLE public.accounts_payable
  ADD COLUMN IF NOT EXISTS category_id uuid REFERENCES public.financial_categories(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS recurrence text;

-- ============================================================
-- 5. TRIGGER: payment_records -> ledger + atualização do título + saldo
-- ============================================================
CREATE OR REPLACE FUNCTION public.process_payment_record()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_type text;
  v_source text;
  v_source_id uuid;
  v_desc text;
  v_party text;
  v_open numeric;
  v_paid numeric;
  v_total numeric;
BEGIN
  IF NEW.receivable_id IS NOT NULL THEN
    v_type := 'inflow';
    v_source := 'receivable';
    v_source_id := NEW.receivable_id;

    SELECT description, client_name, COALESCE(amount,0), COALESCE(paid_amount,0)
      INTO v_desc, v_party, v_total, v_paid
      FROM public.accounts_receivable WHERE id = NEW.receivable_id FOR UPDATE;

    v_paid := v_paid + NEW.total_paid;
    v_open := GREATEST(v_total - v_paid, 0);

    UPDATE public.accounts_receivable
       SET paid_amount = v_paid,
           open_amount = v_open,
           interest = COALESCE(interest,0) + COALESCE(NEW.interest,0),
           penalty = COALESCE(penalty,0) + COALESCE(NEW.penalty,0),
           discount_amount = COALESCE(discount_amount,0) + COALESCE(NEW.discount,0),
           payment_date = NEW.payment_date,
           payment_method = NEW.payment_method,
           status = CASE WHEN v_open <= 0.009 THEN 'paid' ELSE 'pending' END,
           updated_at = now()
     WHERE id = NEW.receivable_id;

  ELSIF NEW.payable_id IS NOT NULL THEN
    v_type := 'outflow';
    v_source := 'payable';
    v_source_id := NEW.payable_id;

    SELECT description, supplier, COALESCE(amount,0), COALESCE(paid_amount,0)
      INTO v_desc, v_party, v_total, v_paid
      FROM public.accounts_payable WHERE id = NEW.payable_id FOR UPDATE;

    v_paid := v_paid + NEW.total_paid;
    v_open := GREATEST(v_total - v_paid, 0);

    UPDATE public.accounts_payable
       SET paid_amount = v_paid,
           open_amount = v_open,
           interest = COALESCE(interest,0) + COALESCE(NEW.interest,0),
           penalty = COALESCE(penalty,0) + COALESCE(NEW.penalty,0),
           discount_amount = COALESCE(discount_amount,0) + COALESCE(NEW.discount,0),
           payment_date = NEW.payment_date,
           payment_method = NEW.payment_method,
           status = CASE WHEN v_open <= 0.009 THEN 'paid' ELSE 'pending' END,
           updated_at = now()
     WHERE id = NEW.payable_id;
  ELSE
    RETURN NEW;
  END IF;

  -- Lançamento no ledger
  INSERT INTO public.financial_ledger (
    entry_date, type, amount, description, bank_account_id,
    source, source_id, payment_method, reference, created_by
  ) VALUES (
    NEW.payment_date::date, v_type, NEW.total_paid,
    COALESCE(v_desc,'Baixa') || ' — ' || COALESCE(v_party,''),
    NEW.bank_account_id, v_source, v_source_id,
    NEW.payment_method, NEW.id::text, NEW.created_by
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_process_payment_record ON public.payment_records;
CREATE TRIGGER trg_process_payment_record
  AFTER INSERT ON public.payment_records
  FOR EACH ROW EXECUTE FUNCTION public.process_payment_record();

-- ============================================================
-- 6. TRIGGER: ledger -> atualiza saldo da bank_account
-- ============================================================
CREATE OR REPLACE FUNCTION public.update_bank_balance_from_ledger()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.bank_account_id IS NOT NULL THEN
    UPDATE public.bank_accounts
       SET balance = COALESCE(balance,0) + CASE WHEN NEW.type='inflow' THEN NEW.amount ELSE -NEW.amount END,
           updated_at = now()
     WHERE id = NEW.bank_account_id;
  ELSIF TG_OP = 'DELETE' AND OLD.bank_account_id IS NOT NULL THEN
    UPDATE public.bank_accounts
       SET balance = COALESCE(balance,0) - CASE WHEN OLD.type='inflow' THEN OLD.amount ELSE -OLD.amount END,
           updated_at = now()
     WHERE id = OLD.bank_account_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trg_update_bank_balance ON public.financial_ledger;
CREATE TRIGGER trg_update_bank_balance
  AFTER INSERT OR DELETE ON public.financial_ledger
  FOR EACH ROW EXECUTE FUNCTION public.update_bank_balance_from_ledger();

-- ============================================================
-- 7. FUNÇÃO: recalcular saldo de uma conta a partir do ledger
-- ============================================================
CREATE OR REPLACE FUNCTION public.recalc_bank_balance(_bank_account_id uuid)
RETURNS numeric
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE v_balance numeric;
BEGIN
  SELECT COALESCE(SUM(CASE WHEN type='inflow' THEN amount ELSE -amount END),0)
    INTO v_balance
    FROM public.financial_ledger
   WHERE bank_account_id = _bank_account_id;

  UPDATE public.bank_accounts SET balance = v_balance, updated_at = now()
   WHERE id = _bank_account_id;

  RETURN v_balance;
END;
$$;

-- ============================================================
-- 8. CATEGORIAS PADRÃO
-- ============================================================
INSERT INTO public.financial_categories (code, name, type, color) VALUES
  ('1.01','Vendas','income','#22c55e'),
  ('1.02','Serviços','income','#3b82f6'),
  ('1.03','Adiantamento Cliente','income','#06b6d4'),
  ('2.01','Fornecedores','expense','#ef4444'),
  ('2.02','Folha de Pagamento','expense','#f97316'),
  ('2.03','Impostos','expense','#8b5cf6'),
  ('2.04','Aluguel','expense','#ec4899'),
  ('2.05','Utilidades','expense','#06b6d4'),
  ('2.06','Marketing','expense','#eab308'),
  ('3.01','Custo de Mercadoria Vendida','cost','#dc2626'),
  ('9.99','Transferência entre contas','transfer','#64748b')
ON CONFLICT DO NOTHING;
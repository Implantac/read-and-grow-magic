
-- 1. Cost Centers
CREATE TABLE public.cost_centers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL,
  name text NOT NULL,
  parent_id uuid REFERENCES public.cost_centers(id),
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.cost_centers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth users manage cost_centers" ON public.cost_centers FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 2. Bank Accounts
CREATE TABLE public.bank_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  bank_name text NOT NULL DEFAULT '',
  bank_code text,
  agency text,
  account_number text,
  account_type text NOT NULL DEFAULT 'checking',
  balance numeric NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.bank_accounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth users manage bank_accounts" ON public.bank_accounts FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 3. Payment Records (baixas)
CREATE TABLE public.payment_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  receivable_id uuid REFERENCES public.accounts_receivable(id) ON DELETE SET NULL,
  payable_id uuid REFERENCES public.accounts_payable(id) ON DELETE SET NULL,
  amount numeric NOT NULL DEFAULT 0,
  interest numeric NOT NULL DEFAULT 0,
  penalty numeric NOT NULL DEFAULT 0,
  discount numeric NOT NULL DEFAULT 0,
  total_paid numeric NOT NULL DEFAULT 0,
  payment_method text NOT NULL DEFAULT 'pix',
  payment_date timestamptz NOT NULL DEFAULT now(),
  bank_account_id uuid REFERENCES public.bank_accounts(id) ON DELETE SET NULL,
  notes text,
  created_by text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.payment_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth users manage payment_records" ON public.payment_records FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 4. Renegotiations
CREATE TABLE public.renegotiations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES public.clients(id) ON DELETE CASCADE NOT NULL,
  client_name text NOT NULL,
  original_total numeric NOT NULL DEFAULT 0,
  new_total numeric NOT NULL DEFAULT 0,
  interest_rate numeric NOT NULL DEFAULT 0,
  installments integer NOT NULL DEFAULT 1,
  first_due_date timestamptz,
  status text NOT NULL DEFAULT 'pending',
  notes text,
  created_by text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.renegotiations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth users manage renegotiations" ON public.renegotiations FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 5. Renegotiation Items
CREATE TABLE public.renegotiation_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  renegotiation_id uuid REFERENCES public.renegotiations(id) ON DELETE CASCADE NOT NULL,
  receivable_id uuid REFERENCES public.accounts_receivable(id) ON DELETE SET NULL,
  original_amount numeric NOT NULL DEFAULT 0
);
ALTER TABLE public.renegotiation_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth users manage renegotiation_items" ON public.renegotiation_items FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 6. Financial Alerts
CREATE TABLE public.financial_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_type text NOT NULL,
  severity text NOT NULL DEFAULT 'medium',
  title text NOT NULL,
  description text,
  entity_type text,
  entity_id uuid,
  status text NOT NULL DEFAULT 'open',
  resolved_at timestamptz,
  resolved_by text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.financial_alerts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth users manage financial_alerts" ON public.financial_alerts FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 7. Enhance accounts_receivable
ALTER TABLE public.accounts_receivable
  ADD COLUMN IF NOT EXISTS original_amount numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS open_amount numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS interest numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS penalty numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS discount_amount numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS paid_amount numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS installment_number integer DEFAULT 1,
  ADD COLUMN IF NOT EXISTS total_installments integer DEFAULT 1,
  ADD COLUMN IF NOT EXISTS issue_date timestamptz DEFAULT now(),
  ADD COLUMN IF NOT EXISTS nfe_id uuid;

-- 8. Enhance accounts_payable
ALTER TABLE public.accounts_payable
  ADD COLUMN IF NOT EXISTS cost_center_id uuid REFERENCES public.cost_centers(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS expense_type text DEFAULT 'variable',
  ADD COLUMN IF NOT EXISTS bank_account_id uuid REFERENCES public.bank_accounts(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS installment_number integer DEFAULT 1,
  ADD COLUMN IF NOT EXISTS total_installments integer DEFAULT 1,
  ADD COLUMN IF NOT EXISTS original_amount numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS open_amount numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS paid_amount numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS interest numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS penalty numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS discount_amount numeric DEFAULT 0;

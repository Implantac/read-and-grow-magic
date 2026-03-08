
-- Contas a Pagar
CREATE TABLE public.accounts_payable (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  description text NOT NULL,
  supplier text NOT NULL,
  category text NOT NULL DEFAULT 'Fornecedores',
  amount numeric NOT NULL DEFAULT 0,
  due_date timestamp with time zone NOT NULL,
  payment_date timestamp with time zone,
  status text NOT NULL DEFAULT 'pending',
  payment_method text,
  notes text,
  invoice_number text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.accounts_payable ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read accounts_payable" ON public.accounts_payable FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert accounts_payable" ON public.accounts_payable FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update accounts_payable" ON public.accounts_payable FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users can delete accounts_payable" ON public.accounts_payable FOR DELETE TO authenticated USING (true);

-- Contas a Receber
CREATE TABLE public.accounts_receivable (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  description text NOT NULL,
  client_name text NOT NULL,
  client_id uuid REFERENCES public.clients(id),
  category text NOT NULL DEFAULT 'Vendas',
  amount numeric NOT NULL DEFAULT 0,
  due_date timestamp with time zone NOT NULL,
  payment_date timestamp with time zone,
  status text NOT NULL DEFAULT 'pending',
  payment_method text,
  notes text,
  invoice_number text,
  order_id uuid REFERENCES public.orders(id),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.accounts_receivable ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read accounts_receivable" ON public.accounts_receivable FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert accounts_receivable" ON public.accounts_receivable FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update accounts_receivable" ON public.accounts_receivable FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users can delete accounts_receivable" ON public.accounts_receivable FOR DELETE TO authenticated USING (true);

-- Fluxo de Caixa
CREATE TABLE public.cash_flow_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date timestamp with time zone NOT NULL DEFAULT now(),
  description text NOT NULL,
  type text NOT NULL DEFAULT 'income',
  category text NOT NULL,
  amount numeric NOT NULL DEFAULT 0,
  balance numeric NOT NULL DEFAULT 0,
  reference text,
  account text NOT NULL DEFAULT 'Conta Principal',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.cash_flow_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read cash_flow_entries" ON public.cash_flow_entries FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert cash_flow_entries" ON public.cash_flow_entries FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update cash_flow_entries" ON public.cash_flow_entries FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users can delete cash_flow_entries" ON public.cash_flow_entries FOR DELETE TO authenticated USING (true);

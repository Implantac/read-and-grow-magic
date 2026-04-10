
-- Customer Credit Profiles
CREATE TABLE public.customer_credit_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  credit_limit NUMERIC NOT NULL DEFAULT 0,
  used_limit NUMERIC NOT NULL DEFAULT 0,
  available_limit NUMERIC GENERATED ALWAYS AS (credit_limit - used_limit) STORED,
  risk_classification TEXT NOT NULL DEFAULT 'medium' CHECK (risk_classification IN ('low','medium','high','blocked')),
  credit_status TEXT NOT NULL DEFAULT 'analysis' CHECK (credit_status IN ('approved','analysis','restricted','blocked')),
  score_numeric INTEGER NOT NULL DEFAULT 50 CHECK (score_numeric BETWEEN 0 AND 100),
  score_grade TEXT GENERATED ALWAYS AS (
    CASE WHEN score_numeric >= 80 THEN 'A'
         WHEN score_numeric >= 60 THEN 'B'
         WHEN score_numeric >= 40 THEN 'C'
         ELSE 'D' END
  ) STORED,
  last_analysis_date TIMESTAMPTZ,
  analysis_valid_until TIMESTAMPTZ,
  analyst_id TEXT,
  analyst_name TEXT,
  analysis_notes TEXT,
  avg_delay_days NUMERIC DEFAULT 0,
  overdue_count INTEGER DEFAULT 0,
  overdue_amount NUMERIC DEFAULT 0,
  total_open_amount NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(client_id)
);

ALTER TABLE public.customer_credit_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth users can read customer_credit_profiles" ON public.customer_credit_profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth users can insert customer_credit_profiles" ON public.customer_credit_profiles FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth users can update customer_credit_profiles" ON public.customer_credit_profiles FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Auth users can delete customer_credit_profiles" ON public.customer_credit_profiles FOR DELETE TO authenticated USING (true);

CREATE INDEX idx_credit_profiles_client ON public.customer_credit_profiles(client_id);
CREATE INDEX idx_credit_profiles_status ON public.customer_credit_profiles(credit_status);
CREATE INDEX idx_credit_profiles_risk ON public.customer_credit_profiles(risk_classification);

-- Order Blocks
CREATE TABLE public.order_blocks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  block_type TEXT NOT NULL DEFAULT 'financial',
  block_reason TEXT NOT NULL,
  description TEXT,
  blocked_by TEXT,
  blocked_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','released','expired')),
  released_by TEXT,
  released_at TIMESTAMPTZ,
  release_justification TEXT,
  approval_level TEXT DEFAULT 'financial',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.order_blocks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth users can read order_blocks" ON public.order_blocks FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth users can insert order_blocks" ON public.order_blocks FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth users can update order_blocks" ON public.order_blocks FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Auth users can delete order_blocks" ON public.order_blocks FOR DELETE TO authenticated USING (true);

CREATE INDEX idx_order_blocks_order ON public.order_blocks(order_id);
CREATE INDEX idx_order_blocks_status ON public.order_blocks(status);

-- Order Approvals
CREATE TABLE public.order_approvals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  block_id UUID REFERENCES public.order_blocks(id) ON DELETE SET NULL,
  approval_type TEXT NOT NULL DEFAULT 'financial',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  requested_by TEXT,
  requested_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  approved_by TEXT,
  approved_at TIMESTAMPTZ,
  justification TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.order_approvals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth users can read order_approvals" ON public.order_approvals FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth users can insert order_approvals" ON public.order_approvals FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth users can update order_approvals" ON public.order_approvals FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Auth users can delete order_approvals" ON public.order_approvals FOR DELETE TO authenticated USING (true);

CREATE INDEX idx_order_approvals_order ON public.order_approvals(order_id);
CREATE INDEX idx_order_approvals_status ON public.order_approvals(status);

-- Collection Actions
CREATE TABLE public.collection_actions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  receivable_id UUID REFERENCES public.accounts_receivable(id) ON DELETE SET NULL,
  action_type TEXT NOT NULL DEFAULT 'contact' CHECK (action_type IN ('contact','promise','renegotiation','agreement','note','follow_up')),
  description TEXT NOT NULL,
  contact_method TEXT,
  promise_date TIMESTAMPTZ,
  promise_amount NUMERIC,
  promise_status TEXT DEFAULT 'pending' CHECK (promise_status IN ('pending','fulfilled','broken','cancelled')),
  next_action_date TIMESTAMPTZ,
  next_action_description TEXT,
  responsible TEXT,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','completed','cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.collection_actions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth users can read collection_actions" ON public.collection_actions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth users can insert collection_actions" ON public.collection_actions FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth users can update collection_actions" ON public.collection_actions FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Auth users can delete collection_actions" ON public.collection_actions FOR DELETE TO authenticated USING (true);

CREATE INDEX idx_collection_actions_client ON public.collection_actions(client_id);
CREATE INDEX idx_collection_actions_status ON public.collection_actions(status);

-- Credit Policies
CREATE TABLE public.credit_policies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  min_score INTEGER DEFAULT 0,
  max_score INTEGER DEFAULT 100,
  max_payment_days INTEGER DEFAULT 30,
  max_discount_pct NUMERIC DEFAULT 10,
  auto_block_overdue_days INTEGER DEFAULT 30,
  auto_block_overdue_amount NUMERIC DEFAULT 0,
  requires_approval_above NUMERIC DEFAULT 50000,
  allow_new_client_credit BOOLEAN DEFAULT false,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.credit_policies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth users can read credit_policies" ON public.credit_policies FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth users can insert credit_policies" ON public.credit_policies FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth users can update credit_policies" ON public.credit_policies FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Auth users can delete credit_policies" ON public.credit_policies FOR DELETE TO authenticated USING (true);

-- Credit Audit Logs
CREATE TABLE public.credit_audit_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  action TEXT NOT NULL,
  old_value JSONB,
  new_value JSONB,
  performed_by TEXT,
  performed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  justification TEXT,
  ip_address TEXT
);

ALTER TABLE public.credit_audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth users can read credit_audit_logs" ON public.credit_audit_logs FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth users can insert credit_audit_logs" ON public.credit_audit_logs FOR INSERT TO authenticated WITH CHECK (true);

CREATE INDEX idx_credit_audit_entity ON public.credit_audit_logs(entity_type, entity_id);
CREATE INDEX idx_credit_audit_date ON public.credit_audit_logs(performed_at);

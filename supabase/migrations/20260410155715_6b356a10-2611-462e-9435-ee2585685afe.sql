
-- Commission Policies
CREATE TABLE public.commission_policies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  calculation_type TEXT NOT NULL DEFAULT 'percentage', -- percentage, fixed, tiered
  base_percentage NUMERIC NOT NULL DEFAULT 0,
  extra_percentage NUMERIC DEFAULT 0,
  min_margin_pct NUMERIC DEFAULT 0,
  margin_reduction_pct NUMERIC DEFAULT 0,
  max_discount_pct NUMERIC DEFAULT 100,
  discount_reduction_pct NUMERIC DEFAULT 0,
  requires_invoicing BOOLEAN NOT NULL DEFAULT false,
  requires_payment BOOLEAN NOT NULL DEFAULT false,
  applies_to TEXT NOT NULL DEFAULT 'all', -- all, internal, external, specific
  applies_to_entity_id TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  valid_from TIMESTAMP WITH TIME ZONE DEFAULT now(),
  valid_until TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.commission_policies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth users can read commission_policies" ON public.commission_policies FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth users can insert commission_policies" ON public.commission_policies FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth users can update commission_policies" ON public.commission_policies FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Auth users can delete commission_policies" ON public.commission_policies FOR DELETE TO authenticated USING (true);

-- Commission Rules (detailed rules per policy)
CREATE TABLE public.commission_rules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  policy_id UUID NOT NULL REFERENCES public.commission_policies(id) ON DELETE CASCADE,
  rule_type TEXT NOT NULL DEFAULT 'product', -- product, category, client, region, margin_tier, discount_tier
  rule_value TEXT, -- product_id, category_id, region name, etc.
  rule_label TEXT, -- human-readable label
  percentage NUMERIC NOT NULL DEFAULT 0,
  min_value NUMERIC DEFAULT 0,
  max_value NUMERIC DEFAULT 999999999,
  priority INTEGER NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.commission_rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth users can read commission_rules" ON public.commission_rules FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth users can insert commission_rules" ON public.commission_rules FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth users can update commission_rules" ON public.commission_rules FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Auth users can delete commission_rules" ON public.commission_rules FOR DELETE TO authenticated USING (true);

-- Commissions (calculated commissions)
CREATE TABLE public.commissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  order_number TEXT,
  order_item_id UUID,
  sales_rep_id TEXT,
  sales_rep_name TEXT,
  client_id UUID,
  client_name TEXT,
  policy_id UUID REFERENCES public.commission_policies(id) ON DELETE SET NULL,
  policy_name TEXT,
  rule_id UUID REFERENCES public.commission_rules(id) ON DELETE SET NULL,
  base_value NUMERIC NOT NULL DEFAULT 0,
  net_value NUMERIC NOT NULL DEFAULT 0,
  discount_value NUMERIC DEFAULT 0,
  margin_pct NUMERIC DEFAULT 0,
  applied_percentage NUMERIC NOT NULL DEFAULT 0,
  calculated_value NUMERIC NOT NULL DEFAULT 0,
  adjusted_value NUMERIC DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'forecast', -- forecast, blocked, released, approved, paid, cancelled
  block_reason TEXT,
  adjustment_reason TEXT,
  period TEXT, -- YYYY-MM
  invoice_date TIMESTAMP WITH TIME ZONE,
  payment_date TIMESTAMP WITH TIME ZONE,
  approved_by TEXT,
  approved_at TIMESTAMP WITH TIME ZONE,
  paid_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.commissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth users can read commissions" ON public.commissions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth users can insert commissions" ON public.commissions FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth users can update commissions" ON public.commissions FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Auth users can delete commissions" ON public.commissions FOR DELETE TO authenticated USING (true);

CREATE INDEX idx_commissions_order_id ON public.commissions(order_id);
CREATE INDEX idx_commissions_sales_rep ON public.commissions(sales_rep_id);
CREATE INDEX idx_commissions_status ON public.commissions(status);
CREATE INDEX idx_commissions_period ON public.commissions(period);

-- Commission Payments
CREATE TABLE public.commission_payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sales_rep_id TEXT NOT NULL,
  sales_rep_name TEXT NOT NULL,
  period TEXT NOT NULL, -- YYYY-MM
  total_amount NUMERIC NOT NULL DEFAULT 0,
  commissions_count INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, approved, paid
  payment_date TIMESTAMP WITH TIME ZONE,
  payment_method TEXT,
  approved_by TEXT,
  approved_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.commission_payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth users can read commission_payments" ON public.commission_payments FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth users can insert commission_payments" ON public.commission_payments FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth users can update commission_payments" ON public.commission_payments FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Auth users can delete commission_payments" ON public.commission_payments FOR DELETE TO authenticated USING (true);

-- Sales Targets (metas)
CREATE TABLE public.sales_targets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  target_type TEXT NOT NULL DEFAULT 'revenue', -- revenue, quantity, margin, new_clients, orders, conversion_rate
  entity_type TEXT NOT NULL DEFAULT 'sales_rep', -- sales_rep, team, branch, region, product, category
  entity_id TEXT,
  entity_name TEXT,
  period_type TEXT NOT NULL DEFAULT 'monthly', -- daily, weekly, monthly, quarterly, yearly
  period TEXT NOT NULL, -- YYYY-MM, YYYY-QN, YYYY-WN, YYYY
  target_value NUMERIC NOT NULL DEFAULT 0,
  achieved_value NUMERIC NOT NULL DEFAULT 0,
  achievement_pct NUMERIC GENERATED ALWAYS AS (CASE WHEN target_value > 0 THEN ROUND((achieved_value / target_value) * 100, 2) ELSE 0 END) STORED,
  projection NUMERIC DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active', -- active, completed, cancelled
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.sales_targets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth users can read sales_targets" ON public.sales_targets FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth users can insert sales_targets" ON public.sales_targets FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth users can update sales_targets" ON public.sales_targets FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Auth users can delete sales_targets" ON public.sales_targets FOR DELETE TO authenticated USING (true);

CREATE INDEX idx_sales_targets_entity ON public.sales_targets(entity_type, entity_id);
CREATE INDEX idx_sales_targets_period ON public.sales_targets(period);

-- Sales Forecasts
CREATE TABLE public.sales_forecasts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  period TEXT NOT NULL, -- YYYY-MM
  entity_type TEXT NOT NULL DEFAULT 'total', -- total, sales_rep, region, portfolio
  entity_id TEXT,
  entity_name TEXT,
  pipeline_value NUMERIC NOT NULL DEFAULT 0,
  weighted_value NUMERIC NOT NULL DEFAULT 0,
  confirmed_value NUMERIC NOT NULL DEFAULT 0,
  optimistic_value NUMERIC NOT NULL DEFAULT 0,
  conservative_value NUMERIC NOT NULL DEFAULT 0,
  realistic_value NUMERIC NOT NULL DEFAULT 0,
  historical_avg NUMERIC DEFAULT 0,
  conversion_rate NUMERIC DEFAULT 0,
  notes TEXT,
  snapshot_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.sales_forecasts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth users can read sales_forecasts" ON public.sales_forecasts FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth users can insert sales_forecasts" ON public.sales_forecasts FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth users can update sales_forecasts" ON public.sales_forecasts FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Auth users can delete sales_forecasts" ON public.sales_forecasts FOR DELETE TO authenticated USING (true);

CREATE INDEX idx_sales_forecasts_period ON public.sales_forecasts(period);

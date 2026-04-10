
-- Sales Opportunities (automated suggestions for sellers)
CREATE TABLE public.sales_opportunities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE NOT NULL,
  sales_rep_id UUID REFERENCES public.sales_reps(id) ON DELETE SET NULL,
  opportunity_type TEXT NOT NULL DEFAULT 'reactivation',
  title TEXT NOT NULL,
  description TEXT,
  priority TEXT NOT NULL DEFAULT 'medium',
  suggested_products JSONB DEFAULT '[]'::jsonb,
  estimated_value NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'open',
  contacted_at TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ,
  resolution_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Follow-ups
CREATE TABLE public.follow_ups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE NOT NULL,
  sales_rep_id UUID REFERENCES public.sales_reps(id) ON DELETE SET NULL,
  funnel_id UUID REFERENCES public.sales_funnel(id) ON DELETE SET NULL,
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  type TEXT NOT NULL DEFAULT 'call',
  subject TEXT NOT NULL,
  description TEXT,
  scheduled_date TIMESTAMPTZ NOT NULL,
  completed_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'pending',
  result TEXT,
  next_action TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Sales Campaigns
CREATE TABLE public.sales_campaigns (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  campaign_type TEXT NOT NULL DEFAULT 'product_focus',
  target_products JSONB DEFAULT '[]'::jsonb,
  target_segments JSONB DEFAULT '[]'::jsonb,
  goal_type TEXT NOT NULL DEFAULT 'revenue',
  goal_value NUMERIC NOT NULL DEFAULT 0,
  current_value NUMERIC NOT NULL DEFAULT 0,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  incentive_description TEXT,
  status TEXT NOT NULL DEFAULT 'draft',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Seller daily targets tracking
CREATE TABLE public.seller_daily_targets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sales_rep_id UUID REFERENCES public.sales_reps(id) ON DELETE CASCADE NOT NULL,
  target_date DATE NOT NULL DEFAULT CURRENT_DATE,
  daily_target NUMERIC NOT NULL DEFAULT 0,
  achieved_value NUMERIC NOT NULL DEFAULT 0,
  orders_count INTEGER NOT NULL DEFAULT 0,
  contacts_made INTEGER NOT NULL DEFAULT 0,
  opportunities_converted INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(sales_rep_id, target_date)
);

-- RLS
ALTER TABLE public.sales_opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.follow_ups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seller_daily_targets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage sales_opportunities" ON public.sales_opportunities FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users can manage follow_ups" ON public.follow_ups FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users can manage sales_campaigns" ON public.sales_campaigns FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users can manage seller_daily_targets" ON public.seller_daily_targets FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Enable realtime for follow_ups
ALTER PUBLICATION supabase_realtime ADD TABLE public.follow_ups;
ALTER PUBLICATION supabase_realtime ADD TABLE public.sales_opportunities;


-- Executive AI Insights table
CREATE TABLE public.ai_executive_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  insight_type TEXT NOT NULL DEFAULT 'general',
  category TEXT NOT NULL DEFAULT 'strategic',
  severity TEXT NOT NULL DEFAULT 'info',
  title TEXT NOT NULL,
  description TEXT,
  explanation TEXT,
  data_points JSONB,
  impact_estimate TEXT,
  recommended_actions JSONB,
  module TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  dismissed_at TIMESTAMPTZ,
  dismissed_by UUID,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Executive Alerts table
CREATE TABLE public.ai_executive_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_type TEXT NOT NULL DEFAULT 'warning',
  severity TEXT NOT NULL DEFAULT 'medium',
  title TEXT NOT NULL,
  description TEXT,
  module TEXT,
  metric_name TEXT,
  metric_value NUMERIC,
  threshold_value NUMERIC,
  trend TEXT,
  acknowledged_at TIMESTAMPTZ,
  acknowledged_by UUID,
  resolved_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Executive Scenarios table
CREATE TABLE public.ai_executive_scenarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scenario_type TEXT NOT NULL DEFAULT 'revenue',
  period TEXT NOT NULL DEFAULT 'monthly',
  optimistic JSONB,
  realistic JSONB,
  pessimistic JSONB,
  assumptions JSONB,
  recommendations JSONB,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Executive Chat History
CREATE TABLE public.ai_executive_chat (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'user',
  content TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ai_executive_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_executive_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_executive_scenarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_executive_chat ENABLE ROW LEVEL SECURITY;

-- RLS policies - authenticated users can read all
CREATE POLICY "Authenticated users can read executive insights" ON public.ai_executive_insights FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert executive insights" ON public.ai_executive_insights FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update executive insights" ON public.ai_executive_insights FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Authenticated users can read executive alerts" ON public.ai_executive_alerts FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert executive alerts" ON public.ai_executive_alerts FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update executive alerts" ON public.ai_executive_alerts FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Authenticated users can read executive scenarios" ON public.ai_executive_scenarios FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert executive scenarios" ON public.ai_executive_scenarios FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can manage own chat" ON public.ai_executive_chat FOR ALL TO authenticated USING (true) WITH CHECK (true);

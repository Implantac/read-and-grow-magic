
-- AI Sales Scores: persisted client scoring for prioritization
CREATE TABLE public.ai_sales_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  score_numeric NUMERIC NOT NULL DEFAULT 0,
  score_grade TEXT NOT NULL DEFAULT 'C',
  priority_level TEXT NOT NULL DEFAULT 'medium',
  recency_score NUMERIC DEFAULT 0,
  frequency_score NUMERIC DEFAULT 0,
  monetary_score NUMERIC DEFAULT 0,
  risk_score NUMERIC DEFAULT 0,
  growth_score NUMERIC DEFAULT 0,
  engagement_score NUMERIC DEFAULT 0,
  days_since_purchase INTEGER DEFAULT 0,
  purchase_trend TEXT DEFAULT 'stable',
  churn_probability NUMERIC DEFAULT 0,
  recompra_probability NUMERIC DEFAULT 0,
  explanation TEXT,
  computed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- AI Recommendations: product and action recommendations
CREATE TABLE public.ai_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  sales_rep_id TEXT,
  recommendation_type TEXT NOT NULL DEFAULT 'cross_sell',
  title TEXT NOT NULL,
  description TEXT,
  explanation TEXT,
  suggested_products JSONB DEFAULT '[]',
  estimated_value NUMERIC DEFAULT 0,
  confidence NUMERIC DEFAULT 0,
  priority TEXT DEFAULT 'medium',
  status TEXT DEFAULT 'pending',
  acted_at TIMESTAMPTZ,
  acted_by TEXT,
  result TEXT,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- AI Opportunity Predictions: closing probability per funnel/order
CREATE TABLE public.ai_opportunity_predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  funnel_id UUID REFERENCES public.sales_funnel(id) ON DELETE CASCADE,
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  close_probability NUMERIC NOT NULL DEFAULT 0,
  loss_risk NUMERIC NOT NULL DEFAULT 0,
  predicted_close_date DATE,
  predicted_value NUMERIC DEFAULT 0,
  recommended_action TEXT,
  key_factors JSONB DEFAULT '[]',
  explanation TEXT,
  model_version TEXT DEFAULT 'v1',
  computed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- AI Sales Insights: generated insights for managers
CREATE TABLE public.ai_sales_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  insight_type TEXT NOT NULL DEFAULT 'general',
  target_role TEXT NOT NULL DEFAULT 'manager',
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  explanation TEXT,
  severity TEXT DEFAULT 'info',
  data_points JSONB DEFAULT '{}',
  suggested_actions JSONB DEFAULT '[]',
  related_entity_type TEXT,
  related_entity_id TEXT,
  status TEXT DEFAULT 'active',
  dismissed_at TIMESTAMPTZ,
  dismissed_by TEXT,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- AI Daily Action Queue: prioritized daily tasks for sales reps
CREATE TABLE public.ai_daily_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sales_rep_id TEXT,
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
  action_date DATE NOT NULL DEFAULT CURRENT_DATE,
  action_type TEXT NOT NULL DEFAULT 'call',
  priority INTEGER NOT NULL DEFAULT 5,
  title TEXT NOT NULL,
  description TEXT,
  explanation TEXT,
  estimated_value NUMERIC DEFAULT 0,
  status TEXT DEFAULT 'pending',
  completed_at TIMESTAMPTZ,
  result TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- AI Forecast Snapshots: periodic forecast data
CREATE TABLE public.ai_forecast_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  forecast_date DATE NOT NULL DEFAULT CURRENT_DATE,
  period TEXT NOT NULL DEFAULT 'monthly',
  predicted_revenue NUMERIC DEFAULT 0,
  best_case NUMERIC DEFAULT 0,
  worst_case NUMERIC DEFAULT 0,
  confidence NUMERIC DEFAULT 0,
  factors JSONB DEFAULT '{}',
  by_rep JSONB DEFAULT '{}',
  by_region JSONB DEFAULT '{}',
  by_segment JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for performance
CREATE INDEX idx_ai_sales_scores_client ON public.ai_sales_scores(client_id);
CREATE INDEX idx_ai_sales_scores_priority ON public.ai_sales_scores(priority_level);
CREATE INDEX idx_ai_recommendations_client ON public.ai_recommendations(client_id);
CREATE INDEX idx_ai_recommendations_status ON public.ai_recommendations(status);
CREATE INDEX idx_ai_recommendations_type ON public.ai_recommendations(recommendation_type);
CREATE INDEX idx_ai_opportunity_predictions_funnel ON public.ai_opportunity_predictions(funnel_id);
CREATE INDEX idx_ai_daily_actions_rep_date ON public.ai_daily_actions(sales_rep_id, action_date);
CREATE INDEX idx_ai_daily_actions_status ON public.ai_daily_actions(status);
CREATE INDEX idx_ai_insights_role ON public.ai_sales_insights(target_role);
CREATE INDEX idx_ai_insights_status ON public.ai_sales_insights(status);

-- RLS
ALTER TABLE public.ai_sales_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_opportunity_predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_sales_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_daily_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_forecast_snapshots ENABLE ROW LEVEL SECURITY;

-- Authenticated users can read all AI data
CREATE POLICY "authenticated_read_ai_scores" ON public.ai_sales_scores FOR SELECT TO authenticated USING (true);
CREATE POLICY "authenticated_read_ai_recs" ON public.ai_recommendations FOR SELECT TO authenticated USING (true);
CREATE POLICY "authenticated_read_ai_preds" ON public.ai_opportunity_predictions FOR SELECT TO authenticated USING (true);
CREATE POLICY "authenticated_read_ai_insights" ON public.ai_sales_insights FOR SELECT TO authenticated USING (true);
CREATE POLICY "authenticated_read_ai_actions" ON public.ai_daily_actions FOR SELECT TO authenticated USING (true);
CREATE POLICY "authenticated_read_ai_forecasts" ON public.ai_forecast_snapshots FOR SELECT TO authenticated USING (true);

-- Authenticated users can insert/update AI data (edge function uses service role, but also allow authenticated)
CREATE POLICY "authenticated_insert_ai_scores" ON public.ai_sales_scores FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "authenticated_update_ai_scores" ON public.ai_sales_scores FOR UPDATE TO authenticated USING (true);
CREATE POLICY "authenticated_insert_ai_recs" ON public.ai_recommendations FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "authenticated_update_ai_recs" ON public.ai_recommendations FOR UPDATE TO authenticated USING (true);
CREATE POLICY "authenticated_insert_ai_preds" ON public.ai_opportunity_predictions FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "authenticated_insert_ai_insights" ON public.ai_sales_insights FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "authenticated_update_ai_insights" ON public.ai_sales_insights FOR UPDATE TO authenticated USING (true);
CREATE POLICY "authenticated_insert_ai_actions" ON public.ai_daily_actions FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "authenticated_update_ai_actions" ON public.ai_daily_actions FOR UPDATE TO authenticated USING (true);
CREATE POLICY "authenticated_insert_ai_forecasts" ON public.ai_forecast_snapshots FOR INSERT TO authenticated WITH CHECK (true);

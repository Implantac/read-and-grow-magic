
-- Plans table
CREATE TABLE public.plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  price_monthly NUMERIC NOT NULL DEFAULT 0,
  price_annual NUMERIC NOT NULL DEFAULT 0,
  trial_days INTEGER NOT NULL DEFAULT 14,
  max_users INTEGER NOT NULL DEFAULT 5,
  max_orders_month INTEGER NOT NULL DEFAULT 100,
  storage_mb INTEGER NOT NULL DEFAULT 1024,
  allowed_modules TEXT[] NOT NULL DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Plan features (granular feature flags)
CREATE TABLE public.plan_features (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  plan_id UUID NOT NULL REFERENCES public.plans(id) ON DELETE CASCADE,
  feature_key TEXT NOT NULL,
  feature_label TEXT NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT true,
  limit_value INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_plan_features_plan_id ON public.plan_features(plan_id);

-- Subscriptions (company <-> plan)
CREATE TABLE public.subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES public.plans(id),
  status TEXT NOT NULL DEFAULT 'trialing' CHECK (status IN ('trialing','active','past_due','cancelled','expired')),
  billing_cycle TEXT NOT NULL DEFAULT 'monthly' CHECK (billing_cycle IN ('monthly','annual')),
  current_period_start TIMESTAMPTZ NOT NULL DEFAULT now(),
  current_period_end TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '30 days'),
  trial_end TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  external_gateway TEXT,
  external_subscription_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(company_id)
);
CREATE INDEX idx_subscriptions_company ON public.subscriptions(company_id);
CREATE INDEX idx_subscriptions_status ON public.subscriptions(status);

-- Usage tracking per company per month
CREATE TABLE public.usage_tracking (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  metric TEXT NOT NULL,
  current_value INTEGER NOT NULL DEFAULT 0,
  limit_value INTEGER,
  period TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX idx_usage_tracking_unique ON public.usage_tracking(company_id, metric, period);

-- SaaS invoices
CREATE TABLE public.saas_invoices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES public.subscriptions(id),
  amount NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','paid','failed','refunded')),
  due_date DATE NOT NULL,
  paid_at TIMESTAMPTZ,
  payment_method TEXT,
  external_payment_id TEXT,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_saas_invoices_company ON public.saas_invoices(company_id);

-- RLS
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plan_features ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saas_invoices ENABLE ROW LEVEL SECURITY;

-- Plans: public read
CREATE POLICY "Anyone can view active plans" ON public.plans FOR SELECT USING (is_active = true);
CREATE POLICY "Admins manage plans" ON public.plans FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Plan features: public read
CREATE POLICY "Anyone can view plan features" ON public.plan_features FOR SELECT USING (true);

-- Subscriptions: company members can read
CREATE POLICY "Company members view subscription" ON public.subscriptions FOR SELECT TO authenticated
  USING (company_id IN (SELECT id FROM public.companies));
CREATE POLICY "Admins manage subscriptions" ON public.subscriptions FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Usage: company members read
CREATE POLICY "Company members view usage" ON public.usage_tracking FOR SELECT TO authenticated
  USING (company_id IN (SELECT id FROM public.companies));
CREATE POLICY "Admins manage usage" ON public.usage_tracking FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Invoices: company members read
CREATE POLICY "Company members view invoices" ON public.saas_invoices FOR SELECT TO authenticated
  USING (company_id IN (SELECT id FROM public.companies));
CREATE POLICY "Admins manage invoices" ON public.saas_invoices FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

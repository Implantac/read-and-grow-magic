
-- =============================================
-- FASE 1: Expandir tabela clients
-- =============================================
ALTER TABLE public.clients
  ADD COLUMN IF NOT EXISTS state_registration text,
  ADD COLUMN IF NOT EXISTS municipal_registration text,
  ADD COLUMN IF NOT EXISTS region text,
  ADD COLUMN IF NOT EXISTS micro_region text,
  ADD COLUMN IF NOT EXISTS default_payment_condition text DEFAULT 'À vista',
  ADD COLUMN IF NOT EXISTS price_table text DEFAULT 'default',
  ADD COLUMN IF NOT EXISTS abc_classification text DEFAULT 'C',
  ADD COLUMN IF NOT EXISTS commercial_notes text,
  ADD COLUMN IF NOT EXISTS last_purchase_date timestamp with time zone,
  ADD COLUMN IF NOT EXISTS avg_ticket numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS estimated_potential numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_purchases numeric DEFAULT 0;

-- =============================================
-- FASE 2: Tabela de Representantes Comerciais
-- =============================================
CREATE TABLE public.sales_reps (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  name text NOT NULL,
  code text NOT NULL UNIQUE,
  email text,
  phone text,
  region text,
  micro_region text,
  commission_rate numeric DEFAULT 5,
  status text DEFAULT 'active',
  monthly_target numeric DEFAULT 0,
  total_sales numeric DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.sales_reps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Auth users can read sales_reps" ON public.sales_reps FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth users can insert sales_reps" ON public.sales_reps FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth users can update sales_reps" ON public.sales_reps FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Auth users can delete sales_reps" ON public.sales_reps FOR DELETE TO authenticated USING (true);

-- =============================================
-- FASE 3: Funil Comercial
-- =============================================
CREATE TABLE public.sales_funnel (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id uuid REFERENCES public.clients(id) ON DELETE CASCADE,
  sales_rep_id uuid REFERENCES public.sales_reps(id) ON DELETE SET NULL,
  title text NOT NULL,
  description text,
  stage text NOT NULL DEFAULT 'lead',
  value numeric DEFAULT 0,
  probability integer DEFAULT 10,
  expected_close_date timestamp with time zone,
  won_date timestamp with time zone,
  lost_date timestamp with time zone,
  lost_reason text,
  source text,
  contact_name text,
  contact_phone text,
  contact_email text,
  notes text,
  status text DEFAULT 'open',
  order_id uuid REFERENCES public.orders(id) ON DELETE SET NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.sales_funnel ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Auth users can read sales_funnel" ON public.sales_funnel FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth users can insert sales_funnel" ON public.sales_funnel FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth users can update sales_funnel" ON public.sales_funnel FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Auth users can delete sales_funnel" ON public.sales_funnel FOR DELETE TO authenticated USING (true);

-- =============================================
-- FASE 4: Timeline do Cliente
-- =============================================
CREATE TABLE public.client_timeline (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  user_id uuid,
  user_name text,
  event_type text NOT NULL DEFAULT 'note',
  title text NOT NULL,
  description text,
  metadata jsonb,
  reference_id uuid,
  reference_type text,
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.client_timeline ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Auth users can read client_timeline" ON public.client_timeline FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth users can insert client_timeline" ON public.client_timeline FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth users can delete client_timeline" ON public.client_timeline FOR DELETE TO authenticated USING (true);

-- =============================================
-- FASE 5: Alertas Comerciais
-- =============================================
CREATE TABLE public.commercial_alerts (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  alert_type text NOT NULL,
  client_id uuid REFERENCES public.clients(id) ON DELETE CASCADE,
  order_id uuid REFERENCES public.orders(id) ON DELETE CASCADE,
  sales_rep_id uuid REFERENCES public.sales_reps(id) ON DELETE SET NULL,
  funnel_id uuid REFERENCES public.sales_funnel(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  severity text DEFAULT 'medium',
  status text DEFAULT 'open',
  resolved_at timestamp with time zone,
  resolved_by text,
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.commercial_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Auth users can read commercial_alerts" ON public.commercial_alerts FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth users can insert commercial_alerts" ON public.commercial_alerts FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth users can update commercial_alerts" ON public.commercial_alerts FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Auth users can delete commercial_alerts" ON public.commercial_alerts FOR DELETE TO authenticated USING (true);

-- =============================================
-- FASE 6: Expandir tabela orders
-- =============================================
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS commercial_approval text DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS financial_approval text DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS approved_by text,
  ADD COLUMN IF NOT EXISTS approved_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS commission_rate numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS commission_value numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS internal_notes text,
  ADD COLUMN IF NOT EXISTS expected_billing_date timestamp with time zone,
  ADD COLUMN IF NOT EXISTS max_discount_pct numeric DEFAULT 10;

-- =============================================
-- Índices para performance
-- =============================================
CREATE INDEX IF NOT EXISTS idx_clients_region ON public.clients(region);
CREATE INDEX IF NOT EXISTS idx_clients_micro_region ON public.clients(micro_region);
CREATE INDEX IF NOT EXISTS idx_clients_abc ON public.clients(abc_classification);
CREATE INDEX IF NOT EXISTS idx_clients_sales_rep ON public.clients(sales_rep_id);
CREATE INDEX IF NOT EXISTS idx_sales_funnel_stage ON public.sales_funnel(stage);
CREATE INDEX IF NOT EXISTS idx_sales_funnel_client ON public.sales_funnel(client_id);
CREATE INDEX IF NOT EXISTS idx_sales_funnel_rep ON public.sales_funnel(sales_rep_id);
CREATE INDEX IF NOT EXISTS idx_client_timeline_client ON public.client_timeline(client_id);
CREATE INDEX IF NOT EXISTS idx_commercial_alerts_status ON public.commercial_alerts(status);
CREATE INDEX IF NOT EXISTS idx_orders_commercial_approval ON public.orders(commercial_approval);
CREATE INDEX IF NOT EXISTS idx_orders_financial_approval ON public.orders(financial_approval);

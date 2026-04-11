
-- 1. Product Costs (custo real por produto)
CREATE TABLE public.product_costs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  product_code TEXT NOT NULL,
  product_name TEXT NOT NULL,
  raw_material_cost NUMERIC NOT NULL DEFAULT 0,
  labor_cost NUMERIC NOT NULL DEFAULT 0,
  production_time_minutes INTEGER NOT NULL DEFAULT 0,
  labor_rate_per_hour NUMERIC NOT NULL DEFAULT 0,
  operational_cost NUMERIC NOT NULL DEFAULT 0,
  total_cost NUMERIC NOT NULL DEFAULT 0,
  sale_price NUMERIC NOT NULL DEFAULT 0,
  profit_margin NUMERIC NOT NULL DEFAULT 0,
  profit_value NUMERIC NOT NULL DEFAULT 0,
  last_calculated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.product_costs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can manage product_costs" ON public.product_costs FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 2. Supply Stock (estoque de insumos)
CREATE TABLE public.supply_stock (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  unit TEXT NOT NULL DEFAULT 'UN',
  current_quantity NUMERIC NOT NULL DEFAULT 0,
  min_quantity NUMERIC NOT NULL DEFAULT 0,
  max_quantity NUMERIC NOT NULL DEFAULT 0,
  unit_cost NUMERIC NOT NULL DEFAULT 0,
  total_value NUMERIC NOT NULL DEFAULT 0,
  supplier TEXT,
  location TEXT,
  category TEXT,
  last_entry_date TIMESTAMP WITH TIME ZONE,
  last_exit_date TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.supply_stock ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can manage supply_stock" ON public.supply_stock FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 3. Supply Movements (movimentações de insumos)
CREATE TABLE public.supply_movements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  supply_id UUID NOT NULL REFERENCES public.supply_stock(id) ON DELETE CASCADE,
  supply_code TEXT NOT NULL,
  supply_name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'entry',
  direction TEXT NOT NULL DEFAULT 'in',
  quantity NUMERIC NOT NULL DEFAULT 0,
  unit_cost NUMERIC NOT NULL DEFAULT 0,
  total_cost NUMERIC NOT NULL DEFAULT 0,
  production_order_id UUID,
  production_order_number TEXT,
  document_number TEXT,
  operator TEXT,
  reason TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.supply_movements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can manage supply_movements" ON public.supply_movements FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 4. Industrial Alerts
CREATE TABLE public.industrial_alerts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  alert_type TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'warning',
  title TEXT NOT NULL,
  description TEXT,
  entity_type TEXT,
  entity_id UUID,
  entity_name TEXT,
  metric_value NUMERIC,
  threshold_value NUMERIC,
  status TEXT NOT NULL DEFAULT 'active',
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolved_by TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.industrial_alerts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can manage industrial_alerts" ON public.industrial_alerts FOR ALL TO authenticated USING (true) WITH CHECK (true);

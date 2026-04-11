
-- Production Schedule
CREATE TABLE IF NOT EXISTS public.production_schedule (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  production_order_id UUID REFERENCES public.production_orders(id) ON DELETE CASCADE,
  planned_start TIMESTAMP WITH TIME ZONE NOT NULL,
  planned_end TIMESTAMP WITH TIME ZONE NOT NULL,
  actual_start TIMESTAMP WITH TIME ZONE,
  actual_end TIMESTAMP WITH TIME ZONE,
  sector TEXT,
  work_center TEXT,
  shift TEXT DEFAULT 'diurno',
  priority INTEGER DEFAULT 0,
  status TEXT DEFAULT 'scheduled',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.production_schedule ENABLE ROW LEVEL SECURITY;
CREATE POLICY "authenticated_read_schedule" ON public.production_schedule FOR SELECT TO authenticated USING (true);
CREATE POLICY "authenticated_write_schedule" ON public.production_schedule FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "authenticated_update_schedule" ON public.production_schedule FOR UPDATE TO authenticated USING (true);
CREATE POLICY "authenticated_delete_schedule" ON public.production_schedule FOR DELETE TO authenticated USING (true);

-- Production Costs
CREATE TABLE IF NOT EXISTS public.production_costs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  production_order_id UUID REFERENCES public.production_orders(id) ON DELETE CASCADE,
  raw_material_cost NUMERIC DEFAULT 0,
  labor_cost NUMERIC DEFAULT 0,
  operational_cost NUMERIC DEFAULT 0,
  total_cost NUMERIC DEFAULT 0,
  sale_price NUMERIC DEFAULT 0,
  profit_margin NUMERIC DEFAULT 0,
  profit_per_unit NUMERIC DEFAULT 0,
  quantity INTEGER DEFAULT 0,
  notes TEXT,
  calculated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.production_costs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "authenticated_read_costs" ON public.production_costs FOR SELECT TO authenticated USING (true);
CREATE POLICY "authenticated_write_costs" ON public.production_costs FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "authenticated_update_costs" ON public.production_costs FOR UPDATE TO authenticated USING (true);
CREATE POLICY "authenticated_delete_costs" ON public.production_costs FOR DELETE TO authenticated USING (true);

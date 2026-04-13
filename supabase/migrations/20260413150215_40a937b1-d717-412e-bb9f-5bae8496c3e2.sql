
-- ============================================
-- 1. PRODUCT_MATERIALS (BOM - Bill of Materials)
-- ============================================
CREATE TABLE public.product_materials (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  product_code TEXT NOT NULL,
  product_name TEXT NOT NULL,
  component_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  component_code TEXT NOT NULL,
  component_name TEXT NOT NULL,
  quantity NUMERIC NOT NULL DEFAULT 1,
  unit TEXT NOT NULL DEFAULT 'UN',
  waste_percentage NUMERIC NOT NULL DEFAULT 0,
  unit_cost NUMERIC NOT NULL DEFAULT 0,
  is_optional BOOLEAN NOT NULL DEFAULT false,
  sequence INTEGER NOT NULL DEFAULT 1,
  notes TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.product_materials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view product_materials"
  ON public.product_materials FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert product_materials"
  ON public.product_materials FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update product_materials"
  ON public.product_materials FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete product_materials"
  ON public.product_materials FOR DELETE TO authenticated USING (true);

CREATE INDEX idx_product_materials_product ON public.product_materials(product_id);
CREATE INDEX idx_product_materials_component ON public.product_materials(component_id);

-- ============================================
-- 2. MATERIAL_REQUIREMENTS (MRP)
-- ============================================
CREATE TABLE public.material_requirements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  production_order_id UUID REFERENCES public.production_orders(id) ON DELETE CASCADE,
  order_number TEXT,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  component_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  component_code TEXT NOT NULL,
  component_name TEXT NOT NULL,
  required_quantity NUMERIC NOT NULL DEFAULT 0,
  available_quantity NUMERIC NOT NULL DEFAULT 0,
  to_purchase_quantity NUMERIC NOT NULL DEFAULT 0,
  unit TEXT NOT NULL DEFAULT 'UN',
  unit_cost NUMERIC NOT NULL DEFAULT 0,
  total_cost NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending',
  purchase_order_id UUID,
  due_date TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.material_requirements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view material_requirements"
  ON public.material_requirements FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert material_requirements"
  ON public.material_requirements FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update material_requirements"
  ON public.material_requirements FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete material_requirements"
  ON public.material_requirements FOR DELETE TO authenticated USING (true);

CREATE INDEX idx_material_requirements_order ON public.material_requirements(production_order_id);
CREATE INDEX idx_material_requirements_component ON public.material_requirements(component_id);
CREATE INDEX idx_material_requirements_status ON public.material_requirements(status);

-- ============================================
-- 3. PRODUCTION_INDICATORS (KPI Snapshots)
-- ============================================
CREATE TABLE public.production_indicators (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  period TEXT NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  sector TEXT,
  line_id UUID REFERENCES public.production_lines(id) ON DELETE SET NULL,
  line_name TEXT,
  oee NUMERIC DEFAULT 0,
  availability NUMERIC DEFAULT 0,
  performance NUMERIC DEFAULT 0,
  quality NUMERIC DEFAULT 0,
  efficiency NUMERIC DEFAULT 0,
  productivity NUMERIC DEFAULT 0,
  rejection_rate NUMERIC DEFAULT 0,
  total_produced INTEGER DEFAULT 0,
  total_rejected INTEGER DEFAULT 0,
  total_orders INTEGER DEFAULT 0,
  completed_orders INTEGER DEFAULT 0,
  on_time_delivery_pct NUMERIC DEFAULT 0,
  avg_lead_time_hours NUMERIC DEFAULT 0,
  mtbf_hours NUMERIC DEFAULT 0,
  mttr_hours NUMERIC DEFAULT 0,
  total_downtime_minutes INTEGER DEFAULT 0,
  labor_cost NUMERIC DEFAULT 0,
  material_cost NUMERIC DEFAULT 0,
  total_cost NUMERIC DEFAULT 0,
  cost_per_unit NUMERIC DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.production_indicators ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view production_indicators"
  ON public.production_indicators FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert production_indicators"
  ON public.production_indicators FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update production_indicators"
  ON public.production_indicators FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete production_indicators"
  ON public.production_indicators FOR DELETE TO authenticated USING (true);

CREATE INDEX idx_production_indicators_period ON public.production_indicators(period_start, period_end);
CREATE INDEX idx_production_indicators_line ON public.production_indicators(line_id);
CREATE INDEX idx_production_indicators_sector ON public.production_indicators(sector);

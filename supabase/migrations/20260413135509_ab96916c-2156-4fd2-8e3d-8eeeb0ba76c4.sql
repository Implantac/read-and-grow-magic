
-- 1. SETORES DE PRODUÇÃO
CREATE TABLE public.production_sectors (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  responsible TEXT,
  sector_type TEXT NOT NULL DEFAULT 'production', -- production, support
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.production_sectors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can manage production_sectors" ON public.production_sectors FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 2. LINHAS PRODUTIVAS
CREATE TABLE public.production_lines (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  sector_id UUID REFERENCES public.production_sectors(id) ON DELETE SET NULL,
  capacity_per_hour NUMERIC NOT NULL DEFAULT 0,
  shift TEXT NOT NULL DEFAULT 'integral', -- morning, afternoon, night, integral
  responsible TEXT,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.production_lines ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can manage production_lines" ON public.production_lines FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 3. RECURSOS PRODUTIVOS
CREATE TABLE public.production_resources (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  resource_type TEXT NOT NULL DEFAULT 'machine', -- machine, operator, workstation
  sector_id UUID REFERENCES public.production_sectors(id) ON DELETE SET NULL,
  line_id UUID REFERENCES public.production_lines(id) ON DELETE SET NULL,
  capacity_per_hour NUMERIC NOT NULL DEFAULT 0,
  cost_per_hour NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'available', -- available, running, maintenance, inactive
  is_active BOOLEAN NOT NULL DEFAULT true,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.production_resources ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can manage production_resources" ON public.production_resources FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 4. ROTAS PRODUTIVAS
CREATE TABLE public.production_routes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  product_code TEXT,
  product_name TEXT,
  version TEXT NOT NULL DEFAULT '1.0',
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  total_time_minutes NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.production_routes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can manage production_routes" ON public.production_routes FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 5. ETAPAS DA ROTA PRODUTIVA
CREATE TABLE public.production_route_steps (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  route_id UUID NOT NULL REFERENCES public.production_routes(id) ON DELETE CASCADE,
  sequence INTEGER NOT NULL DEFAULT 1,
  step_name TEXT NOT NULL,
  sector_id UUID REFERENCES public.production_sectors(id) ON DELETE SET NULL,
  resource_id UUID REFERENCES public.production_resources(id) ON DELETE SET NULL,
  setup_time_minutes NUMERIC NOT NULL DEFAULT 0,
  operation_time_minutes NUMERIC NOT NULL DEFAULT 0,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.production_route_steps ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can manage production_route_steps" ON public.production_route_steps FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Indexes
CREATE INDEX idx_production_lines_sector ON public.production_lines(sector_id);
CREATE INDEX idx_production_resources_sector ON public.production_resources(sector_id);
CREATE INDEX idx_production_resources_line ON public.production_resources(line_id);
CREATE INDEX idx_production_routes_product ON public.production_routes(product_id);
CREATE INDEX idx_production_route_steps_route ON public.production_route_steps(route_id);

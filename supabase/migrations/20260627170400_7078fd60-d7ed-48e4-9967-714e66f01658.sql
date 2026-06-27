
-- 1. agro_farms
CREATE TABLE public.agro_farms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL DEFAULT get_user_company_id(auth.uid()),
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  location TEXT,
  total_area_ha NUMERIC(12,2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.agro_farms TO authenticated;
GRANT ALL ON public.agro_farms TO service_role;
ALTER TABLE public.agro_farms ENABLE ROW LEVEL SECURITY;
CREATE POLICY agro_farms_tenant ON public.agro_farms FOR ALL TO authenticated
  USING (company_id = get_user_company_id(auth.uid()))
  WITH CHECK (company_id = get_user_company_id(auth.uid()) AND company_id IS NOT NULL);
CREATE INDEX idx_agro_farms_company ON public.agro_farms(company_id);

-- 2. agro_fields (talhões)
CREATE TABLE public.agro_fields (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL DEFAULT get_user_company_id(auth.uid()),
  farm_id UUID NOT NULL REFERENCES public.agro_farms(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  area_ha NUMERIC(12,2) NOT NULL DEFAULT 0,
  soil_type TEXT,
  current_crop TEXT,
  status TEXT NOT NULL DEFAULT 'idle',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.agro_fields TO authenticated;
GRANT ALL ON public.agro_fields TO service_role;
ALTER TABLE public.agro_fields ENABLE ROW LEVEL SECURITY;
CREATE POLICY agro_fields_tenant ON public.agro_fields FOR ALL TO authenticated
  USING (company_id = get_user_company_id(auth.uid()))
  WITH CHECK (company_id = get_user_company_id(auth.uid()) AND company_id IS NOT NULL);
CREATE INDEX idx_agro_fields_company ON public.agro_fields(company_id);
CREATE INDEX idx_agro_fields_farm ON public.agro_fields(farm_id);

-- 3. agro_seasons (safras)
CREATE TABLE public.agro_seasons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL DEFAULT get_user_company_id(auth.uid()),
  field_id UUID NOT NULL REFERENCES public.agro_fields(id) ON DELETE CASCADE,
  crop TEXT NOT NULL,
  variety TEXT,
  planting_date DATE,
  expected_harvest_date DATE,
  estimated_yield_per_ha NUMERIC(12,2),
  estimated_cost NUMERIC(14,2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'planned',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.agro_seasons TO authenticated;
GRANT ALL ON public.agro_seasons TO service_role;
ALTER TABLE public.agro_seasons ENABLE ROW LEVEL SECURITY;
CREATE POLICY agro_seasons_tenant ON public.agro_seasons FOR ALL TO authenticated
  USING (company_id = get_user_company_id(auth.uid()))
  WITH CHECK (company_id = get_user_company_id(auth.uid()) AND company_id IS NOT NULL);
CREATE INDEX idx_agro_seasons_company ON public.agro_seasons(company_id);
CREATE INDEX idx_agro_seasons_field ON public.agro_seasons(field_id);

-- 4. agro_harvests (colheitas)
CREATE TABLE public.agro_harvests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL DEFAULT get_user_company_id(auth.uid()),
  season_id UUID NOT NULL REFERENCES public.agro_seasons(id) ON DELETE CASCADE,
  harvest_date DATE NOT NULL,
  quantity NUMERIC(14,2) NOT NULL DEFAULT 0,
  unit TEXT NOT NULL DEFAULT 'kg',
  quality_grade TEXT,
  revenue NUMERIC(14,2) NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.agro_harvests TO authenticated;
GRANT ALL ON public.agro_harvests TO service_role;
ALTER TABLE public.agro_harvests ENABLE ROW LEVEL SECURITY;
CREATE POLICY agro_harvests_tenant ON public.agro_harvests FOR ALL TO authenticated
  USING (company_id = get_user_company_id(auth.uid()))
  WITH CHECK (company_id = get_user_company_id(auth.uid()) AND company_id IS NOT NULL);
CREATE INDEX idx_agro_harvests_company ON public.agro_harvests(company_id);
CREATE INDEX idx_agro_harvests_season ON public.agro_harvests(season_id);

-- updated_at triggers
CREATE TRIGGER trg_agro_farms_updated BEFORE UPDATE ON public.agro_farms
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_agro_fields_updated BEFORE UPDATE ON public.agro_fields
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_agro_seasons_updated BEFORE UPDATE ON public.agro_seasons
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_agro_harvests_updated BEFORE UPDATE ON public.agro_harvests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


-- PROJECTS
CREATE TABLE public.construction_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL DEFAULT get_user_company_id(auth.uid()),
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  address TEXT,
  city TEXT,
  state TEXT,
  start_date DATE,
  end_date DATE,
  budget_total NUMERIC(14,2) DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'planning' CHECK (status IN ('planning','in_progress','paused','completed','cancelled')),
  progress_percent NUMERIC(5,2) DEFAULT 0,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (company_id, code)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.construction_projects TO authenticated;
GRANT ALL ON public.construction_projects TO service_role;
ALTER TABLE public.construction_projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY cp_tenant_all ON public.construction_projects FOR ALL TO authenticated
USING (company_id = get_user_company_id(auth.uid()))
WITH CHECK (company_id = get_user_company_id(auth.uid()));
CREATE INDEX idx_cp_company ON public.construction_projects(company_id);
CREATE TRIGGER trg_cp_updated BEFORE UPDATE ON public.construction_projects
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- BUDGET ITEMS
CREATE TABLE public.construction_budget_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL DEFAULT get_user_company_id(auth.uid()),
  project_id UUID NOT NULL REFERENCES public.construction_projects(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  unit TEXT NOT NULL DEFAULT 'un',
  quantity NUMERIC(14,4) NOT NULL DEFAULT 0,
  unit_cost NUMERIC(14,4) NOT NULL DEFAULT 0,
  total NUMERIC(14,2) GENERATED ALWAYS AS (ROUND(quantity * unit_cost, 2)) STORED,
  category TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.construction_budget_items TO authenticated;
GRANT ALL ON public.construction_budget_items TO service_role;
ALTER TABLE public.construction_budget_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY cbi_tenant_all ON public.construction_budget_items FOR ALL TO authenticated
USING (company_id = get_user_company_id(auth.uid()))
WITH CHECK (company_id = get_user_company_id(auth.uid()));
CREATE INDEX idx_cbi_project ON public.construction_budget_items(project_id);
CREATE TRIGGER trg_cbi_updated BEFORE UPDATE ON public.construction_budget_items
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- MEASUREMENTS
CREATE TABLE public.construction_measurements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL DEFAULT get_user_company_id(auth.uid()),
  project_id UUID NOT NULL REFERENCES public.construction_projects(id) ON DELETE CASCADE,
  reference_month DATE NOT NULL,
  executed_percent NUMERIC(5,2) NOT NULL DEFAULT 0,
  amount NUMERIC(14,2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','approved','invoiced','paid','rejected')),
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.construction_measurements TO authenticated;
GRANT ALL ON public.construction_measurements TO service_role;
ALTER TABLE public.construction_measurements ENABLE ROW LEVEL SECURITY;
CREATE POLICY cm_tenant_all ON public.construction_measurements FOR ALL TO authenticated
USING (company_id = get_user_company_id(auth.uid()))
WITH CHECK (company_id = get_user_company_id(auth.uid()));
CREATE INDEX idx_cm_project ON public.construction_measurements(project_id);
CREATE TRIGGER trg_cm_updated BEFORE UPDATE ON public.construction_measurements
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- DIARY
CREATE TABLE public.construction_diary (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL DEFAULT get_user_company_id(auth.uid()),
  project_id UUID NOT NULL REFERENCES public.construction_projects(id) ON DELETE CASCADE,
  entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
  weather TEXT,
  workforce_count INTEGER DEFAULT 0,
  activities TEXT,
  incidents TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.construction_diary TO authenticated;
GRANT ALL ON public.construction_diary TO service_role;
ALTER TABLE public.construction_diary ENABLE ROW LEVEL SECURITY;
CREATE POLICY cd_tenant_all ON public.construction_diary FOR ALL TO authenticated
USING (company_id = get_user_company_id(auth.uid()))
WITH CHECK (company_id = get_user_company_id(auth.uid()));
CREATE INDEX idx_cd_project ON public.construction_diary(project_id);
CREATE TRIGGER trg_cd_updated BEFORE UPDATE ON public.construction_diary
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

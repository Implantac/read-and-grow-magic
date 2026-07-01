
-- Add cost center to ledger for managerial DRE
ALTER TABLE public.financial_ledger
  ADD COLUMN IF NOT EXISTS cost_center_id uuid REFERENCES public.cost_centers(id);

CREATE INDEX IF NOT EXISTS idx_financial_ledger_cost_center
  ON public.financial_ledger(company_id, cost_center_id, entry_date);

-- Aggregated DRE by cost center + section + category
CREATE OR REPLACE FUNCTION public.dre_managerial(
  p_company_id uuid,
  p_from date,
  p_to date
)
RETURNS TABLE(
  cost_center_id uuid,
  cost_center_code text,
  cost_center_name text,
  dre_section text,
  category_id uuid,
  category_name text,
  category_type text,
  total_amount numeric,
  entry_count bigint
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    cc.id AS cost_center_id,
    COALESCE(cc.code, '—') AS cost_center_code,
    COALESCE(cc.name, 'Sem centro de custo') AS cost_center_name,
    COALESCE(fc.dre_section, 'outros') AS dre_section,
    fc.id AS category_id,
    COALESCE(fc.name, 'Sem categoria') AS category_name,
    COALESCE(fc.type, fl.type) AS category_type,
    SUM(CASE WHEN COALESCE(fc.type, fl.type) = 'receita' THEN fl.amount ELSE -fl.amount END) AS total_amount,
    COUNT(*)::bigint AS entry_count
  FROM public.financial_ledger fl
  LEFT JOIN public.cost_centers cc ON cc.id = fl.cost_center_id
  LEFT JOIN public.financial_categories fc ON fc.id = fl.category_id
  WHERE fl.company_id = p_company_id
    AND fl.entry_date BETWEEN p_from AND p_to
  GROUP BY cc.id, cc.code, cc.name, fc.dre_section, fc.id, fc.name, fc.type, fl.type
  ORDER BY cost_center_name, dre_section, category_name;
$$;

REVOKE ALL ON FUNCTION public.dre_managerial(uuid, date, date) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.dre_managerial(uuid, date, date) TO authenticated, service_role;

-- Drill-down: entries for a specific cost center + category
CREATE OR REPLACE FUNCTION public.dre_managerial_entries(
  p_company_id uuid,
  p_from date,
  p_to date,
  p_cost_center_id uuid DEFAULT NULL,
  p_category_id uuid DEFAULT NULL
)
RETURNS TABLE(
  id uuid,
  entry_date date,
  description text,
  type text,
  amount numeric,
  category_name text,
  cost_center_name text,
  source text,
  reference text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    fl.id,
    fl.entry_date,
    fl.description,
    fl.type,
    fl.amount,
    COALESCE(fc.name, 'Sem categoria') AS category_name,
    COALESCE(cc.name, 'Sem centro de custo') AS cost_center_name,
    fl.source,
    fl.reference
  FROM public.financial_ledger fl
  LEFT JOIN public.cost_centers cc ON cc.id = fl.cost_center_id
  LEFT JOIN public.financial_categories fc ON fc.id = fl.category_id
  WHERE fl.company_id = p_company_id
    AND fl.entry_date BETWEEN p_from AND p_to
    AND (p_cost_center_id IS NULL OR fl.cost_center_id IS NOT DISTINCT FROM p_cost_center_id)
    AND (p_category_id IS NULL OR fl.category_id IS NOT DISTINCT FROM p_category_id)
  ORDER BY fl.entry_date DESC, fl.id DESC
  LIMIT 500;
$$;

REVOKE ALL ON FUNCTION public.dre_managerial_entries(uuid, date, date, uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.dre_managerial_entries(uuid, date, date, uuid, uuid) TO authenticated, service_role;

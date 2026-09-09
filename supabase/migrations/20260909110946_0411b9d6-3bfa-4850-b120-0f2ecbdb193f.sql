GRANT EXECUTE ON FUNCTION public.get_dre(date, date) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_dre_summary(date, date) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_dre_dynamic(date, date, uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_cashflow_scenarios(integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_operator_productivity(integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.aps_schedule_multi(integer) TO authenticated;

CREATE TABLE IF NOT EXISTS public.quality_inspections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL DEFAULT public.get_user_company_id(auth.uid()),
  production_order_id uuid REFERENCES public.production_orders(id) ON DELETE CASCADE,
  step_id uuid,
  inspector text NOT NULL DEFAULT '',
  inspection_date timestamptz NOT NULL DEFAULT now(),
  approved_quantity numeric NOT NULL DEFAULT 0,
  rejected_quantity numeric NOT NULL DEFAULT 0,
  defect_reason text,
  defect_category text,
  severity text NOT NULL DEFAULT 'low',
  corrective_action text,
  notes text,
  status text NOT NULL DEFAULT 'open',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.quality_inspections TO authenticated;
GRANT ALL ON public.quality_inspections TO service_role;
ALTER TABLE public.quality_inspections ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "quality_inspections_company" ON public.quality_inspections;
CREATE POLICY "quality_inspections_company" ON public.quality_inspections
  FOR ALL TO authenticated
  USING (company_id = public.get_user_company_id(auth.uid()))
  WITH CHECK (company_id = public.get_user_company_id(auth.uid()));

CREATE INDEX IF NOT EXISTS idx_quality_inspections_company ON public.quality_inspections(company_id, inspection_date DESC);

DROP TRIGGER IF EXISTS trg_quality_inspections_updated_at ON public.quality_inspections;
CREATE TRIGGER trg_quality_inspections_updated_at
  BEFORE UPDATE ON public.quality_inspections
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
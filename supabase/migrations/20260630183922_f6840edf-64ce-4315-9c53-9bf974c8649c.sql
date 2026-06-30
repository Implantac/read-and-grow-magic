
CREATE TABLE IF NOT EXISTS public.wms_quality_checks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL,
  lot_id UUID REFERENCES public.stock_lots(id) ON DELETE SET NULL,
  receiving_item_id UUID REFERENCES public.wms_receiving_items(id) ON DELETE SET NULL,
  product_id UUID,
  inspector_id UUID,
  decision TEXT NOT NULL CHECK (decision IN ('approved','quarantine','rejected')),
  reason TEXT,
  notes TEXT,
  sample_size INTEGER DEFAULT 0,
  defects_found INTEGER DEFAULT 0,
  defect_categories JSONB DEFAULT '[]'::jsonb,
  photos JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_wms_quality_checks_company ON public.wms_quality_checks(company_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_wms_quality_checks_lot ON public.wms_quality_checks(lot_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.wms_quality_checks TO authenticated;
GRANT ALL ON public.wms_quality_checks TO service_role;

ALTER TABLE public.wms_quality_checks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant can view their quality checks"
  ON public.wms_quality_checks FOR SELECT TO authenticated
  USING (company_id = public.get_user_company_id(auth.uid()));

CREATE POLICY "Tenant can insert quality checks"
  ON public.wms_quality_checks FOR INSERT TO authenticated
  WITH CHECK (company_id = public.get_user_company_id(auth.uid()));

CREATE POLICY "Tenant can update their quality checks"
  ON public.wms_quality_checks FOR UPDATE TO authenticated
  USING (company_id = public.get_user_company_id(auth.uid()))
  WITH CHECK (company_id = public.get_user_company_id(auth.uid()));

CREATE OR REPLACE FUNCTION public.tg_wms_quality_apply_lot()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.lot_id IS NOT NULL THEN
    UPDATE public.stock_lots
      SET quality_status = NEW.decision,
          inspection_date = now(),
          updated_at = now()
      WHERE id = NEW.lot_id
        AND company_id = NEW.company_id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_wms_quality_apply_lot ON public.wms_quality_checks;
CREATE TRIGGER trg_wms_quality_apply_lot
  AFTER INSERT ON public.wms_quality_checks
  FOR EACH ROW EXECUTE FUNCTION public.tg_wms_quality_apply_lot();

DROP TRIGGER IF EXISTS trg_wms_quality_checks_updated_at ON public.wms_quality_checks;
CREATE TRIGGER trg_wms_quality_checks_updated_at
  BEFORE UPDATE ON public.wms_quality_checks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

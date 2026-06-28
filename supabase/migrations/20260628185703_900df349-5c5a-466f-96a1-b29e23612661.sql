
-- 1) industrial_alerts: company_id NOT NULL
DELETE FROM public.industrial_alerts WHERE company_id IS NULL;
ALTER TABLE public.industrial_alerts ALTER COLUMN company_id SET NOT NULL;

-- 2) time_entries: company_id NOT NULL
DELETE FROM public.time_entries WHERE company_id IS NULL;
ALTER TABLE public.time_entries ALTER COLUMN company_id SET NOT NULL;

-- 3) production_quality_checks: add denormalized company_id
ALTER TABLE public.production_quality_checks ADD COLUMN IF NOT EXISTS company_id uuid;

UPDATE public.production_quality_checks pqc
SET company_id = po.company_id
FROM public.production_orders po
WHERE pqc.production_order_id = po.id
  AND pqc.company_id IS NULL;

DELETE FROM public.production_quality_checks WHERE company_id IS NULL;
ALTER TABLE public.production_quality_checks ALTER COLUMN company_id SET NOT NULL;

-- Trigger to auto-fill company_id from parent order if missing
CREATE OR REPLACE FUNCTION public.fn_pqc_set_company_id()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.company_id IS NULL AND NEW.production_order_id IS NOT NULL THEN
    SELECT company_id INTO NEW.company_id
    FROM public.production_orders
    WHERE id = NEW.production_order_id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_pqc_set_company_id ON public.production_quality_checks;
CREATE TRIGGER trg_pqc_set_company_id
BEFORE INSERT OR UPDATE ON public.production_quality_checks
FOR EACH ROW EXECUTE FUNCTION public.fn_pqc_set_company_id();

-- Drop existing policies and recreate using direct company_id check
DROP POLICY IF EXISTS "pqc_select" ON public.production_quality_checks;
DROP POLICY IF EXISTS "pqc_insert" ON public.production_quality_checks;
DROP POLICY IF EXISTS "pqc_update" ON public.production_quality_checks;
DROP POLICY IF EXISTS "pqc_delete" ON public.production_quality_checks;

CREATE POLICY "pqc_tenant_select" ON public.production_quality_checks
FOR SELECT TO authenticated
USING (company_id = public.get_user_company_id(auth.uid()));

CREATE POLICY "pqc_tenant_insert" ON public.production_quality_checks
FOR INSERT TO authenticated
WITH CHECK (company_id = public.get_user_company_id(auth.uid()));

CREATE POLICY "pqc_tenant_update" ON public.production_quality_checks
FOR UPDATE TO authenticated
USING (company_id = public.get_user_company_id(auth.uid()))
WITH CHECK (company_id = public.get_user_company_id(auth.uid()));

CREATE POLICY "pqc_tenant_delete" ON public.production_quality_checks
FOR DELETE TO authenticated
USING (company_id = public.get_user_company_id(auth.uid()));

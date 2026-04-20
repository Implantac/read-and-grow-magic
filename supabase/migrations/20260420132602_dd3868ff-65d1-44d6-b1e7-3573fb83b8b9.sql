
-- ============================================
-- 1. ICMS ST RULES
-- ============================================
CREATE TABLE IF NOT EXISTS public.tax_icms_st_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  ncm text,
  cest text,
  uf_origin text,
  uf_destination text,
  mva_original numeric NOT NULL DEFAULT 0,
  mva_adjusted numeric DEFAULT 0,
  internal_rate numeric NOT NULL DEFAULT 18,
  interstate_rate numeric NOT NULL DEFAULT 12,
  reduction_base numeric DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  priority integer NOT NULL DEFAULT 0,
  valid_from date,
  valid_until date,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_icms_st_ncm ON public.tax_icms_st_rules(ncm);
CREATE INDEX IF NOT EXISTS idx_icms_st_uf ON public.tax_icms_st_rules(uf_origin, uf_destination);
ALTER TABLE public.tax_icms_st_rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "icms_st_select" ON public.tax_icms_st_rules FOR SELECT TO authenticated USING (true);
CREATE POLICY "icms_st_all" ON public.tax_icms_st_rules FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ============================================
-- 2. DIFAL RULES
-- ============================================
CREATE TABLE IF NOT EXISTS public.tax_difal_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  uf_origin text NOT NULL,
  uf_destination text NOT NULL,
  internal_rate_destination numeric NOT NULL DEFAULT 18,
  interstate_rate numeric NOT NULL DEFAULT 12,
  fcp_rate numeric DEFAULT 0,
  partilha_destination numeric DEFAULT 100,
  partilha_origin numeric DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  valid_from date,
  valid_until date,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(uf_origin, uf_destination)
);
ALTER TABLE public.tax_difal_rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "difal_select" ON public.tax_difal_rules FOR SELECT TO authenticated USING (true);
CREATE POLICY "difal_all" ON public.tax_difal_rules FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ============================================
-- 3. NFE EXTENDED FIELDS
-- ============================================
ALTER TABLE public.nfe
  ADD COLUMN IF NOT EXISTS icms_st_total numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS difal_total numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS fcp_total numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS uf_origin text,
  ADD COLUMN IF NOT EXISTS uf_destination text,
  ADD COLUMN IF NOT EXISTS consumer_final boolean NOT NULL DEFAULT false;

ALTER TABLE public.nfe_items
  ADD COLUMN IF NOT EXISTS icms_st_base numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS icms_st_value numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS icms_st_mva numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS difal_base numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS difal_value numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS difal_destination_rate numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS fcp_value numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS cest text;

-- ============================================
-- 4. CT-e
-- ============================================
CREATE TABLE IF NOT EXISTS public.cte (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  number text NOT NULL,
  series text NOT NULL DEFAULT '1',
  access_key text,
  protocol text,
  issue_date timestamptz NOT NULL DEFAULT now(),
  authorization_date timestamptz,
  cancellation_date timestamptz,
  cancellation_reason text,
  status text NOT NULL DEFAULT 'draft',
  cte_type text NOT NULL DEFAULT 'normal',
  modal text NOT NULL DEFAULT 'rodoviario',
  service_type text NOT NULL DEFAULT 'frete',
  carrier_id uuid REFERENCES public.carriers(id),
  carrier_name text NOT NULL,
  carrier_document text,
  sender_name text NOT NULL,
  sender_document text,
  sender_uf text,
  recipient_name text NOT NULL,
  recipient_document text,
  recipient_uf text,
  origin_city text,
  destination_city text,
  cargo_value numeric NOT NULL DEFAULT 0,
  freight_value numeric NOT NULL DEFAULT 0,
  icms_base numeric NOT NULL DEFAULT 0,
  icms_rate numeric NOT NULL DEFAULT 0,
  icms_value numeric NOT NULL DEFAULT 0,
  total numeric NOT NULL DEFAULT 0,
  xml_content text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_cte_status ON public.cte(status);
CREATE INDEX IF NOT EXISTS idx_cte_carrier ON public.cte(carrier_id);
ALTER TABLE public.cte ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cte_select" ON public.cte FOR SELECT TO authenticated USING (true);
CREATE POLICY "cte_all" ON public.cte FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE TABLE IF NOT EXISTS public.cte_nfe_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cte_id uuid NOT NULL REFERENCES public.cte(id) ON DELETE CASCADE,
  nfe_id uuid REFERENCES public.nfe(id) ON DELETE SET NULL,
  nfe_number text,
  nfe_access_key text,
  nfe_value numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_cte_nfe_links_cte ON public.cte_nfe_links(cte_id);
ALTER TABLE public.cte_nfe_links ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cte_nfe_links_select" ON public.cte_nfe_links FOR SELECT TO authenticated USING (true);
CREATE POLICY "cte_nfe_links_all" ON public.cte_nfe_links FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ============================================
-- 5. MDF-e
-- ============================================
CREATE TABLE IF NOT EXISTS public.mdfe (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  number text NOT NULL,
  series text NOT NULL DEFAULT '1',
  access_key text,
  protocol text,
  issue_date timestamptz NOT NULL DEFAULT now(),
  authorization_date timestamptz,
  cancellation_date timestamptz,
  closure_date timestamptz,
  status text NOT NULL DEFAULT 'draft',
  modal text NOT NULL DEFAULT 'rodoviario',
  uf_origin text NOT NULL,
  uf_destination text NOT NULL,
  loading_city text,
  unloading_cities text[] DEFAULT '{}',
  vehicle_plate text,
  vehicle_renavam text,
  vehicle_uf text,
  driver_name text,
  driver_cpf text,
  carrier_id uuid REFERENCES public.carriers(id),
  total_cargo_value numeric NOT NULL DEFAULT 0,
  total_weight numeric NOT NULL DEFAULT 0,
  total_documents integer NOT NULL DEFAULT 0,
  xml_content text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_mdfe_status ON public.mdfe(status);
ALTER TABLE public.mdfe ENABLE ROW LEVEL SECURITY;
CREATE POLICY "mdfe_select" ON public.mdfe FOR SELECT TO authenticated USING (true);
CREATE POLICY "mdfe_all" ON public.mdfe FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE TABLE IF NOT EXISTS public.mdfe_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mdfe_id uuid NOT NULL REFERENCES public.mdfe(id) ON DELETE CASCADE,
  document_type text NOT NULL CHECK (document_type IN ('nfe', 'cte')),
  document_id uuid,
  document_number text NOT NULL,
  access_key text,
  document_value numeric NOT NULL DEFAULT 0,
  document_weight numeric NOT NULL DEFAULT 0,
  unloading_city text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_mdfe_docs_mdfe ON public.mdfe_documents(mdfe_id);
ALTER TABLE public.mdfe_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "mdfe_docs_select" ON public.mdfe_documents FOR SELECT TO authenticated USING (true);
CREATE POLICY "mdfe_docs_all" ON public.mdfe_documents FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ============================================
-- 6. TRIGGERS DE updated_at
-- ============================================
CREATE TRIGGER trg_icms_st_updated BEFORE UPDATE ON public.tax_icms_st_rules
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_difal_updated BEFORE UPDATE ON public.tax_difal_rules
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_cte_updated BEFORE UPDATE ON public.cte
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_mdfe_updated BEFORE UPDATE ON public.mdfe
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- 7. FUNÇÕES DE CÁLCULO
-- ============================================
CREATE OR REPLACE FUNCTION public.calculate_icms_st(
  _ncm text,
  _uf_origin text,
  _uf_destination text,
  _base numeric,
  _icms_value numeric
) RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  rule record;
  st_base numeric := 0;
  st_value numeric := 0;
  mva numeric := 0;
BEGIN
  SELECT * INTO rule FROM public.tax_icms_st_rules
  WHERE active = true
    AND (ncm = _ncm OR ncm IS NULL)
    AND (uf_origin = _uf_origin OR uf_origin IS NULL)
    AND (uf_destination = _uf_destination OR uf_destination IS NULL)
    AND (valid_from IS NULL OR valid_from <= CURRENT_DATE)
    AND (valid_until IS NULL OR valid_until >= CURRENT_DATE)
  ORDER BY priority DESC, ncm NULLS LAST, uf_destination NULLS LAST
  LIMIT 1;

  IF rule.id IS NULL THEN
    RETURN jsonb_build_object('rule_id', null, 'st_base', 0, 'st_value', 0, 'mva', 0);
  END IF;

  mva := COALESCE(rule.mva_adjusted, rule.mva_original, 0);
  st_base := _base * (1 + mva / 100);
  IF rule.reduction_base > 0 THEN
    st_base := st_base * (1 - rule.reduction_base / 100);
  END IF;
  st_value := GREATEST(0, (st_base * rule.internal_rate / 100) - _icms_value);

  RETURN jsonb_build_object(
    'rule_id', rule.id,
    'rule_name', rule.name,
    'st_base', round(st_base, 2),
    'st_value', round(st_value, 2),
    'mva', mva,
    'internal_rate', rule.internal_rate
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.calculate_difal(
  _uf_origin text,
  _uf_destination text,
  _base numeric
) RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  rule record;
  difal_value numeric := 0;
  fcp_value numeric := 0;
BEGIN
  SELECT * INTO rule FROM public.tax_difal_rules
  WHERE active = true
    AND uf_origin = _uf_origin
    AND uf_destination = _uf_destination
    AND (valid_from IS NULL OR valid_from <= CURRENT_DATE)
    AND (valid_until IS NULL OR valid_until >= CURRENT_DATE)
  LIMIT 1;

  IF rule.id IS NULL THEN
    RETURN jsonb_build_object('rule_id', null, 'difal_value', 0, 'fcp_value', 0, 'destination_rate', 0);
  END IF;

  difal_value := _base * (rule.internal_rate_destination - rule.interstate_rate) / 100;
  fcp_value := _base * COALESCE(rule.fcp_rate, 0) / 100;

  RETURN jsonb_build_object(
    'rule_id', rule.id,
    'difal_value', round(difal_value, 2),
    'fcp_value', round(fcp_value, 2),
    'destination_rate', rule.internal_rate_destination,
    'interstate_rate', rule.interstate_rate
  );
END;
$$;

-- ============================================
-- 8. TRIGGER: recalcular impostos no nfe_items
-- ============================================
CREATE OR REPLACE FUNCTION public.recalc_nfe_item_taxes_v2()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  base numeric;
  nfe_row record;
  st_result jsonb;
  difal_result jsonb;
  base_calc jsonb;
BEGIN
  SELECT * INTO nfe_row FROM public.nfe WHERE id = NEW.nfe_id;
  base := (NEW.quantity * NEW.unit_price) - COALESCE(NEW.discount, 0);

  -- Cálculo base via função existente (ICMS, PIS, COFINS, IPI)
  BEGIN
    base_calc := public.calculate_nfe_item_taxes(
      _ncm := NEW.ncm,
      _cfop := NEW.cfop,
      _quantity := NEW.quantity,
      _unit_price := NEW.unit_price,
      _discount := COALESCE(NEW.discount, 0)
    )::jsonb;
    NEW.icms_base := COALESCE((base_calc->>'icms_base')::numeric, base);
    NEW.icms_rate := COALESCE((base_calc->>'icms_rate')::numeric, NEW.icms_rate);
    NEW.icms_value := COALESCE((base_calc->>'icms_value')::numeric, NEW.icms_value);
    NEW.pis_rate := COALESCE((base_calc->>'pis_rate')::numeric, NEW.pis_rate);
    NEW.pis_value := COALESCE((base_calc->>'pis_value')::numeric, NEW.pis_value);
    NEW.cofins_rate := COALESCE((base_calc->>'cofins_rate')::numeric, NEW.cofins_rate);
    NEW.cofins_value := COALESCE((base_calc->>'cofins_value')::numeric, NEW.cofins_value);
    NEW.ipi_rate := COALESCE((base_calc->>'ipi_rate')::numeric, NEW.ipi_rate);
    NEW.ipi_value := COALESCE((base_calc->>'ipi_value')::numeric, NEW.ipi_value);
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;

  -- ICMS ST
  IF nfe_row.uf_origin IS NOT NULL AND nfe_row.uf_destination IS NOT NULL THEN
    st_result := public.calculate_icms_st(NEW.ncm, nfe_row.uf_origin, nfe_row.uf_destination, base, NEW.icms_value);
    NEW.icms_st_base := COALESCE((st_result->>'st_base')::numeric, 0);
    NEW.icms_st_value := COALESCE((st_result->>'st_value')::numeric, 0);
    NEW.icms_st_mva := COALESCE((st_result->>'mva')::numeric, 0);

    -- DIFAL apenas para consumidor final interestadual
    IF nfe_row.consumer_final = true AND nfe_row.uf_origin <> nfe_row.uf_destination THEN
      difal_result := public.calculate_difal(nfe_row.uf_origin, nfe_row.uf_destination, base);
      NEW.difal_base := base;
      NEW.difal_value := COALESCE((difal_result->>'difal_value')::numeric, 0);
      NEW.difal_destination_rate := COALESCE((difal_result->>'destination_rate')::numeric, 0);
      NEW.fcp_value := COALESCE((difal_result->>'fcp_value')::numeric, 0);
    END IF;
  END IF;

  NEW.total := base + COALESCE(NEW.ipi_value, 0) + COALESCE(NEW.icms_st_value, 0);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_nfe_item_taxes_v2 ON public.nfe_items;
CREATE TRIGGER trg_nfe_item_taxes_v2
  BEFORE INSERT OR UPDATE OF quantity, unit_price, discount, ncm, cfop ON public.nfe_items
  FOR EACH ROW EXECUTE FUNCTION public.recalc_nfe_item_taxes_v2();

-- ============================================
-- 9. TRIGGER: agregar totais de ST/DIFAL na NF-e
-- ============================================
CREATE OR REPLACE FUNCTION public.aggregate_nfe_totals()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target_id uuid;
BEGIN
  target_id := COALESCE(NEW.nfe_id, OLD.nfe_id);
  UPDATE public.nfe SET
    icms = COALESCE((SELECT SUM(icms_value) FROM public.nfe_items WHERE nfe_id = target_id), 0),
    icms_st_total = COALESCE((SELECT SUM(icms_st_value) FROM public.nfe_items WHERE nfe_id = target_id), 0),
    difal_total = COALESCE((SELECT SUM(difal_value) FROM public.nfe_items WHERE nfe_id = target_id), 0),
    fcp_total = COALESCE((SELECT SUM(fcp_value) FROM public.nfe_items WHERE nfe_id = target_id), 0),
    pis = COALESCE((SELECT SUM(pis_value) FROM public.nfe_items WHERE nfe_id = target_id), 0),
    cofins = COALESCE((SELECT SUM(cofins_value) FROM public.nfe_items WHERE nfe_id = target_id), 0),
    ipi = COALESCE((SELECT SUM(ipi_value) FROM public.nfe_items WHERE nfe_id = target_id), 0),
    subtotal = COALESCE((SELECT SUM(quantity * unit_price - COALESCE(discount,0)) FROM public.nfe_items WHERE nfe_id = target_id), 0),
    updated_at = now()
  WHERE id = target_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_aggregate_nfe_totals ON public.nfe_items;
CREATE TRIGGER trg_aggregate_nfe_totals
  AFTER INSERT OR UPDATE OR DELETE ON public.nfe_items
  FOR EACH ROW EXECUTE FUNCTION public.aggregate_nfe_totals();

-- ============================================
-- 10. SEED de dados padrão (alíquotas comuns Brasil)
-- ============================================
INSERT INTO public.tax_difal_rules (name, uf_origin, uf_destination, internal_rate_destination, interstate_rate, fcp_rate)
SELECT 'DIFAL ' || o || '→' || d, o, d,
  CASE WHEN d IN ('RJ','MG','PR','RS','SC','SP') THEN 18 ELSE 17 END,
  CASE WHEN o IN ('SP','RJ','MG','PR','RS','SC') AND d IN ('SP','RJ','MG','PR','RS','SC') THEN 12
       WHEN d IN ('AC','AL','AP','AM','BA','CE','MA','MT','MS','PA','PB','PE','PI','RN','RO','RR','SE','TO','ES','GO','DF') THEN 7
       ELSE 12 END,
  0
FROM (VALUES ('SP'),('RJ'),('MG'),('PR'),('RS'),('SC'),('BA'),('GO'),('PE'),('CE'),('DF')) AS origin(o)
CROSS JOIN (VALUES ('SP'),('RJ'),('MG'),('PR'),('RS'),('SC'),('BA'),('GO'),('PE'),('CE'),('DF')) AS dest(d)
WHERE o <> d
ON CONFLICT (uf_origin, uf_destination) DO NOTHING;

-- ICMS ST exemplos para NCMs comuns
INSERT INTO public.tax_icms_st_rules (name, ncm, uf_destination, mva_original, internal_rate, interstate_rate, priority)
VALUES
  ('ST Bebidas Refrigerante', '22021000', NULL, 70, 18, 12, 10),
  ('ST Cerveja', '22030000', NULL, 100, 25, 12, 10),
  ('ST Cosméticos', '33030010', NULL, 38.24, 18, 12, 10),
  ('ST Autopeças', '87089990', NULL, 71.78, 18, 12, 10),
  ('ST Material Construção', '69072100', NULL, 36, 18, 12, 10)
ON CONFLICT DO NOTHING;

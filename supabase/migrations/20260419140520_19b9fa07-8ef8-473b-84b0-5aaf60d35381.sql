
-- ============================================================
-- TAX RULES (regras fiscais reutilizáveis)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.tax_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  -- escopo de aplicação
  ncm TEXT,                       -- NULL = qualquer NCM
  cfop TEXT,                      -- NULL = qualquer CFOP
  uf_origin TEXT,                 -- NULL = qualquer UF origem
  uf_destination TEXT,            -- NULL = qualquer UF destino
  operation_type TEXT DEFAULT 'saida', -- saida | entrada
  tax_regime TEXT DEFAULT 'simples',   -- simples | presumido | real
  -- ICMS
  icms_cst TEXT DEFAULT '00',
  icms_rate NUMERIC(7,4) DEFAULT 0,
  icms_reduction_base NUMERIC(7,4) DEFAULT 0,  -- % redução base
  icms_st_rate NUMERIC(7,4) DEFAULT 0,
  icms_st_mva NUMERIC(7,4) DEFAULT 0,          -- margem valor agregado
  -- PIS
  pis_cst TEXT DEFAULT '01',
  pis_rate NUMERIC(7,4) DEFAULT 1.65,
  -- COFINS
  cofins_cst TEXT DEFAULT '01',
  cofins_rate NUMERIC(7,4) DEFAULT 7.6,
  -- IPI
  ipi_cst TEXT DEFAULT '50',
  ipi_rate NUMERIC(7,4) DEFAULT 0,
  -- meta
  priority INTEGER NOT NULL DEFAULT 100,
  active BOOLEAN NOT NULL DEFAULT true,
  valid_from DATE DEFAULT CURRENT_DATE,
  valid_until DATE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tax_rules_ncm ON public.tax_rules(ncm) WHERE active;
CREATE INDEX IF NOT EXISTS idx_tax_rules_cfop ON public.tax_rules(cfop) WHERE active;
CREATE INDEX IF NOT EXISTS idx_tax_rules_priority ON public.tax_rules(priority DESC) WHERE active;

CREATE TRIGGER trg_tax_rules_updated
BEFORE UPDATE ON public.tax_rules
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.tax_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tax_rules_select_authenticated"
ON public.tax_rules FOR SELECT TO authenticated USING (true);

CREATE POLICY "tax_rules_insert_admin"
ON public.tax_rules FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager'));

CREATE POLICY "tax_rules_update_admin"
ON public.tax_rules FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager'));

CREATE POLICY "tax_rules_delete_admin"
ON public.tax_rules FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- ============================================================
-- FUNÇÃO: cálculo de impostos para um item
-- ============================================================
CREATE OR REPLACE FUNCTION public.calculate_nfe_item_taxes(
  _ncm TEXT,
  _cfop TEXT,
  _quantity NUMERIC,
  _unit_price NUMERIC,
  _discount NUMERIC DEFAULT 0,
  _uf_origin TEXT DEFAULT NULL,
  _uf_destination TEXT DEFAULT NULL
) RETURNS JSONB
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_rule RECORD;
  v_gross NUMERIC;
  v_base NUMERIC;
  v_icms_base NUMERIC;
  v_icms_value NUMERIC := 0;
  v_pis_value NUMERIC := 0;
  v_cofins_value NUMERIC := 0;
  v_ipi_value NUMERIC := 0;
BEGIN
  v_gross := COALESCE(_quantity,0) * COALESCE(_unit_price,0);
  v_base := GREATEST(v_gross - COALESCE(_discount,0), 0);

  SELECT * INTO v_rule
    FROM public.tax_rules
   WHERE active = true
     AND (valid_from IS NULL OR valid_from <= CURRENT_DATE)
     AND (valid_until IS NULL OR valid_until >= CURRENT_DATE)
     AND (ncm IS NULL OR ncm = _ncm)
     AND (cfop IS NULL OR cfop = _cfop)
     AND (uf_origin IS NULL OR uf_origin = _uf_origin)
     AND (uf_destination IS NULL OR uf_destination = _uf_destination)
   ORDER BY
     (CASE WHEN ncm = _ncm THEN 0 ELSE 1 END),
     (CASE WHEN cfop = _cfop THEN 0 ELSE 1 END),
     priority DESC
   LIMIT 1;

  IF v_rule.id IS NULL THEN
    RETURN jsonb_build_object(
      'rule_id', NULL,
      'icms_base', v_base, 'icms_rate', 0, 'icms_value', 0,
      'pis_rate', 0, 'pis_value', 0,
      'cofins_rate', 0, 'cofins_value', 0,
      'ipi_rate', 0, 'ipi_value', 0,
      'total', v_base
    );
  END IF;

  v_icms_base := v_base * (1 - COALESCE(v_rule.icms_reduction_base,0)/100);
  v_icms_value := round(v_icms_base * v_rule.icms_rate / 100, 2);
  v_pis_value := round(v_base * v_rule.pis_rate / 100, 2);
  v_cofins_value := round(v_base * v_rule.cofins_rate / 100, 2);
  v_ipi_value := round(v_base * v_rule.ipi_rate / 100, 2);

  RETURN jsonb_build_object(
    'rule_id', v_rule.id,
    'rule_name', v_rule.name,
    'icms_cst', v_rule.icms_cst,
    'icms_base', round(v_icms_base,2),
    'icms_rate', v_rule.icms_rate,
    'icms_value', v_icms_value,
    'pis_cst', v_rule.pis_cst,
    'pis_rate', v_rule.pis_rate,
    'pis_value', v_pis_value,
    'cofins_cst', v_rule.cofins_cst,
    'cofins_rate', v_rule.cofins_rate,
    'cofins_value', v_cofins_value,
    'ipi_cst', v_rule.ipi_cst,
    'ipi_rate', v_rule.ipi_rate,
    'ipi_value', v_ipi_value,
    'total', round(v_base + v_ipi_value, 2)
  );
END;
$$;

-- ============================================================
-- TRIGGER: auto-calcular impostos no nfe_items
-- ============================================================
CREATE OR REPLACE FUNCTION public.nfe_items_auto_calc_taxes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_calc JSONB;
  v_should_calc BOOLEAN;
BEGIN
  -- só recalcula se vierem zerados (evita sobrescrever entrada manual)
  v_should_calc := COALESCE(NEW.icms_value,0) = 0
                AND COALESCE(NEW.pis_value,0) = 0
                AND COALESCE(NEW.cofins_value,0) = 0
                AND COALESCE(NEW.ipi_value,0) = 0;

  IF NOT v_should_calc THEN RETURN NEW; END IF;
  IF NEW.ncm IS NULL AND NEW.cfop IS NULL THEN RETURN NEW; END IF;

  v_calc := public.calculate_nfe_item_taxes(
    NEW.ncm, NEW.cfop, NEW.quantity, NEW.unit_price, COALESCE(NEW.discount,0)
  );

  NEW.icms_base := COALESCE((v_calc->>'icms_base')::numeric, NEW.icms_base);
  NEW.icms_rate := COALESCE((v_calc->>'icms_rate')::numeric, NEW.icms_rate);
  NEW.icms_value := COALESCE((v_calc->>'icms_value')::numeric, NEW.icms_value);
  NEW.pis_rate := COALESCE((v_calc->>'pis_rate')::numeric, NEW.pis_rate);
  NEW.pis_value := COALESCE((v_calc->>'pis_value')::numeric, NEW.pis_value);
  NEW.cofins_rate := COALESCE((v_calc->>'cofins_rate')::numeric, NEW.cofins_rate);
  NEW.cofins_value := COALESCE((v_calc->>'cofins_value')::numeric, NEW.cofins_value);
  NEW.ipi_rate := COALESCE((v_calc->>'ipi_rate')::numeric, NEW.ipi_rate);
  NEW.ipi_value := COALESCE((v_calc->>'ipi_value')::numeric, NEW.ipi_value);

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_nfe_items_auto_calc ON public.nfe_items;
CREATE TRIGGER trg_nfe_items_auto_calc
BEFORE INSERT OR UPDATE ON public.nfe_items
FOR EACH ROW EXECUTE FUNCTION public.nfe_items_auto_calc_taxes();

-- ============================================================
-- TRIGGER: recalcular totais da NF-e pai
-- ============================================================
CREATE OR REPLACE FUNCTION public.nfe_recalc_totals()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_nfe_id UUID;
BEGIN
  v_nfe_id := COALESCE(NEW.nfe_id, OLD.nfe_id);
  IF v_nfe_id IS NULL THEN RETURN COALESCE(NEW, OLD); END IF;

  UPDATE public.nfe SET
    subtotal = COALESCE((SELECT SUM(quantity * unit_price) FROM public.nfe_items WHERE nfe_id = v_nfe_id), 0),
    discount = COALESCE((SELECT SUM(discount) FROM public.nfe_items WHERE nfe_id = v_nfe_id), 0),
    icms = COALESCE((SELECT SUM(icms_value) FROM public.nfe_items WHERE nfe_id = v_nfe_id), 0),
    pis = COALESCE((SELECT SUM(pis_value) FROM public.nfe_items WHERE nfe_id = v_nfe_id), 0),
    cofins = COALESCE((SELECT SUM(cofins_value) FROM public.nfe_items WHERE nfe_id = v_nfe_id), 0),
    ipi = COALESCE((SELECT SUM(ipi_value) FROM public.nfe_items WHERE nfe_id = v_nfe_id), 0),
    total = COALESCE((SELECT SUM(quantity * unit_price - discount + ipi_value) FROM public.nfe_items WHERE nfe_id = v_nfe_id), 0)
                + COALESCE(shipping, 0),
    updated_at = now()
  WHERE id = v_nfe_id;

  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trg_nfe_recalc_totals ON public.nfe_items;
CREATE TRIGGER trg_nfe_recalc_totals
AFTER INSERT OR UPDATE OR DELETE ON public.nfe_items
FOR EACH ROW EXECUTE FUNCTION public.nfe_recalc_totals();

-- ============================================================
-- SEED: regras fiscais padrão (Simples Nacional)
-- ============================================================
INSERT INTO public.tax_rules (name, description, cfop, icms_cst, icms_rate, pis_rate, cofins_rate, priority)
VALUES
  ('Venda Simples Nacional - Mesmo Estado', 'Venda interna padrão Simples', '5102', '102', 0, 0, 0, 50),
  ('Venda Simples Nacional - Outro Estado', 'Venda interestadual padrão Simples', '6102', '102', 0, 0, 0, 50),
  ('Venda Lucro Presumido - Interna', 'Venda interna lucro presumido', '5102', '00', 18, 0.65, 3, 40),
  ('Venda Lucro Presumido - Interestadual', 'Venda interestadual lucro presumido', '6102', '00', 12, 0.65, 3, 40),
  ('Venda Produção Própria - Interna', 'Venda de produção interna', '5101', '00', 18, 1.65, 7.6, 40),
  ('Venda Produção Própria - Interestadual', 'Venda de produção interestadual', '6101', '00', 12, 1.65, 7.6, 40)
ON CONFLICT DO NOTHING;

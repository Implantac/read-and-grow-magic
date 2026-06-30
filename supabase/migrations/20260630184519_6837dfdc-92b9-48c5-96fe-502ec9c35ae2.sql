
-- WMS Sprint 12 — 3PL Billing
-- Tabela de contratos/clientes 3PL com tarifas
CREATE TABLE IF NOT EXISTS public.wms_3pl_contracts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  client_id uuid,
  client_name text NOT NULL,
  status text NOT NULL DEFAULT 'active',
  -- tarifas
  storage_rate_per_pallet_day numeric(12,4) NOT NULL DEFAULT 0,
  storage_rate_per_m3_day numeric(12,4) NOT NULL DEFAULT 0,
  inbound_rate_per_unit numeric(12,4) NOT NULL DEFAULT 0,
  outbound_rate_per_unit numeric(12,4) NOT NULL DEFAULT 0,
  picking_rate_per_line numeric(12,4) NOT NULL DEFAULT 0,
  packing_rate_per_order numeric(12,4) NOT NULL DEFAULT 0,
  minimum_monthly_fee numeric(12,2) NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'BRL',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.wms_3pl_contracts TO authenticated;
GRANT ALL ON public.wms_3pl_contracts TO service_role;

ALTER TABLE public.wms_3pl_contracts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_select_3pl_contracts" ON public.wms_3pl_contracts
  FOR SELECT TO authenticated
  USING (company_id = public.get_user_company_id(auth.uid()));
CREATE POLICY "tenant_insert_3pl_contracts" ON public.wms_3pl_contracts
  FOR INSERT TO authenticated
  WITH CHECK (company_id = public.get_user_company_id(auth.uid()));
CREATE POLICY "tenant_update_3pl_contracts" ON public.wms_3pl_contracts
  FOR UPDATE TO authenticated
  USING (company_id = public.get_user_company_id(auth.uid()))
  WITH CHECK (company_id = public.get_user_company_id(auth.uid()));
CREATE POLICY "tenant_delete_3pl_contracts" ON public.wms_3pl_contracts
  FOR DELETE TO authenticated
  USING (company_id = public.get_user_company_id(auth.uid()));

CREATE TRIGGER trg_3pl_contracts_updated
  BEFORE UPDATE ON public.wms_3pl_contracts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Faturas geradas
CREATE TABLE IF NOT EXISTS public.wms_3pl_invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  contract_id uuid NOT NULL REFERENCES public.wms_3pl_contracts(id) ON DELETE CASCADE,
  period_start date NOT NULL,
  period_end date NOT NULL,
  storage_amount numeric(12,2) NOT NULL DEFAULT 0,
  inbound_amount numeric(12,2) NOT NULL DEFAULT 0,
  outbound_amount numeric(12,2) NOT NULL DEFAULT 0,
  picking_amount numeric(12,2) NOT NULL DEFAULT 0,
  packing_amount numeric(12,2) NOT NULL DEFAULT 0,
  minimum_adjustment numeric(12,2) NOT NULL DEFAULT 0,
  total_amount numeric(12,2) NOT NULL DEFAULT 0,
  breakdown jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'draft',
  generated_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.wms_3pl_invoices TO authenticated;
GRANT ALL ON public.wms_3pl_invoices TO service_role;

ALTER TABLE public.wms_3pl_invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_select_3pl_invoices" ON public.wms_3pl_invoices
  FOR SELECT TO authenticated
  USING (company_id = public.get_user_company_id(auth.uid()));
CREATE POLICY "tenant_insert_3pl_invoices" ON public.wms_3pl_invoices
  FOR INSERT TO authenticated
  WITH CHECK (company_id = public.get_user_company_id(auth.uid()));
CREATE POLICY "tenant_update_3pl_invoices" ON public.wms_3pl_invoices
  FOR UPDATE TO authenticated
  USING (company_id = public.get_user_company_id(auth.uid()))
  WITH CHECK (company_id = public.get_user_company_id(auth.uid()));
CREATE POLICY "tenant_delete_3pl_invoices" ON public.wms_3pl_invoices
  FOR DELETE TO authenticated
  USING (company_id = public.get_user_company_id(auth.uid()));

CREATE TRIGGER trg_3pl_invoices_updated
  BEFORE UPDATE ON public.wms_3pl_invoices
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_3pl_invoices_period
  ON public.wms_3pl_invoices(company_id, contract_id, period_start);

-- RPC: gera fatura 3PL para um contrato em um período
CREATE OR REPLACE FUNCTION public.wms_generate_3pl_invoice(
  p_contract_id uuid,
  p_period_start date,
  p_period_end date
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_company uuid;
  v_contract public.wms_3pl_contracts%ROWTYPE;
  v_days integer;
  v_pallet_days numeric := 0;
  v_inbound_units numeric := 0;
  v_outbound_units numeric := 0;
  v_picking_lines numeric := 0;
  v_packing_orders numeric := 0;
  v_storage numeric := 0;
  v_inbound numeric := 0;
  v_outbound numeric := 0;
  v_picking numeric := 0;
  v_packing numeric := 0;
  v_subtotal numeric := 0;
  v_min_adj numeric := 0;
  v_total numeric := 0;
  v_invoice_id uuid;
BEGIN
  v_company := public.get_user_company_id(auth.uid());
  IF v_company IS NULL THEN
    RAISE EXCEPTION 'unauthorized';
  END IF;

  SELECT * INTO v_contract FROM public.wms_3pl_contracts
    WHERE id = p_contract_id AND company_id = v_company;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'contract not found';
  END IF;

  v_days := GREATEST(1, (p_period_end - p_period_start) + 1);

  -- estimativa pallet-dias: soma de saldos (média simples) * dias
  SELECT COALESCE(SUM(quantity), 0) * v_days / NULLIF(28, 0)
    INTO v_pallet_days
  FROM public.stock_balances
  WHERE company_id = v_company;

  -- movimentos do período
  SELECT
    COALESCE(SUM(CASE WHEN movement_type IN ('inbound','receiving','putaway') THEN quantity ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN movement_type IN ('outbound','picking','shipping') THEN quantity ELSE 0 END), 0)
  INTO v_inbound_units, v_outbound_units
  FROM public.wms_movements
  WHERE company_id = v_company
    AND created_at::date BETWEEN p_period_start AND p_period_end;

  -- linhas de picking e ordens de packing
  SELECT COALESCE(COUNT(*), 0) INTO v_picking_lines
  FROM public.wms_picking_items pi
  JOIN public.wms_picking_orders po ON po.id = pi.picking_order_id
  WHERE po.company_id = v_company
    AND po.created_at::date BETWEEN p_period_start AND p_period_end;

  SELECT COALESCE(COUNT(*), 0) INTO v_packing_orders
  FROM public.wms_packing_orders
  WHERE company_id = v_company
    AND created_at::date BETWEEN p_period_start AND p_period_end;

  v_storage  := ROUND(v_pallet_days * v_contract.storage_rate_per_pallet_day, 2);
  v_inbound  := ROUND(v_inbound_units * v_contract.inbound_rate_per_unit, 2);
  v_outbound := ROUND(v_outbound_units * v_contract.outbound_rate_per_unit, 2);
  v_picking  := ROUND(v_picking_lines * v_contract.picking_rate_per_line, 2);
  v_packing  := ROUND(v_packing_orders * v_contract.packing_rate_per_order, 2);
  v_subtotal := v_storage + v_inbound + v_outbound + v_picking + v_packing;

  IF v_subtotal < v_contract.minimum_monthly_fee THEN
    v_min_adj := v_contract.minimum_monthly_fee - v_subtotal;
  END IF;
  v_total := v_subtotal + v_min_adj;

  INSERT INTO public.wms_3pl_invoices(
    company_id, contract_id, period_start, period_end,
    storage_amount, inbound_amount, outbound_amount,
    picking_amount, packing_amount, minimum_adjustment, total_amount,
    breakdown
  ) VALUES (
    v_company, p_contract_id, p_period_start, p_period_end,
    v_storage, v_inbound, v_outbound, v_picking, v_packing, v_min_adj, v_total,
    jsonb_build_object(
      'pallet_days', v_pallet_days,
      'inbound_units', v_inbound_units,
      'outbound_units', v_outbound_units,
      'picking_lines', v_picking_lines,
      'packing_orders', v_packing_orders,
      'days', v_days
    )
  ) RETURNING id INTO v_invoice_id;

  RETURN v_invoice_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.wms_generate_3pl_invoice(uuid, date, date) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.wms_generate_3pl_invoice(uuid, date, date) TO authenticated;

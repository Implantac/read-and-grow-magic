
-- Kit Assembly (VAS) for WMS

CREATE TABLE IF NOT EXISTS public.wms_kits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  parent_product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  code text NOT NULL,
  name text NOT NULL,
  active boolean NOT NULL DEFAULT true,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (company_id, code)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.wms_kits TO authenticated;
GRANT ALL ON public.wms_kits TO service_role;
ALTER TABLE public.wms_kits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "wms_kits tenant access" ON public.wms_kits
  FOR ALL TO authenticated
  USING (company_id = public.get_user_company_id(auth.uid()))
  WITH CHECK (company_id = public.get_user_company_id(auth.uid()));

CREATE TABLE IF NOT EXISTS public.wms_kit_components (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kit_id uuid NOT NULL REFERENCES public.wms_kits(id) ON DELETE CASCADE,
  company_id uuid NOT NULL,
  component_product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
  quantity numeric NOT NULL CHECK (quantity > 0),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.wms_kit_components TO authenticated;
GRANT ALL ON public.wms_kit_components TO service_role;
ALTER TABLE public.wms_kit_components ENABLE ROW LEVEL SECURITY;

CREATE POLICY "wms_kit_components tenant access" ON public.wms_kit_components
  FOR ALL TO authenticated
  USING (company_id = public.get_user_company_id(auth.uid()))
  WITH CHECK (company_id = public.get_user_company_id(auth.uid()));

CREATE INDEX IF NOT EXISTS idx_wms_kit_components_kit ON public.wms_kit_components(kit_id);

CREATE TABLE IF NOT EXISTS public.wms_kit_assemblies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  kit_id uuid NOT NULL REFERENCES public.wms_kits(id) ON DELETE RESTRICT,
  quantity numeric NOT NULL CHECK (quantity > 0),
  status text NOT NULL DEFAULT 'completed' CHECK (status IN ('completed','reversed')),
  location_id uuid REFERENCES public.wms_storage_locations(id),
  performed_by uuid REFERENCES auth.users(id),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.wms_kit_assemblies TO authenticated;
GRANT ALL ON public.wms_kit_assemblies TO service_role;
ALTER TABLE public.wms_kit_assemblies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "wms_kit_assemblies tenant access" ON public.wms_kit_assemblies
  FOR ALL TO authenticated
  USING (company_id = public.get_user_company_id(auth.uid()))
  WITH CHECK (company_id = public.get_user_company_id(auth.uid()));

-- Assemble RPC: consume components, produce parent
CREATE OR REPLACE FUNCTION public.wms_assemble_kit(
  p_kit_id uuid,
  p_quantity numeric,
  p_location_id uuid DEFAULT NULL,
  p_notes text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_company uuid := public.get_user_company_id(auth.uid());
  v_kit RECORD;
  v_comp RECORD;
  v_needed numeric;
  v_available numeric;
  v_assembly_id uuid;
BEGIN
  IF v_company IS NULL THEN
    RAISE EXCEPTION 'auth_required';
  END IF;
  IF p_quantity IS NULL OR p_quantity <= 0 THEN
    RAISE EXCEPTION 'invalid_quantity';
  END IF;

  SELECT * INTO v_kit FROM public.wms_kits
    WHERE id = p_kit_id AND company_id = v_company AND active = true;
  IF NOT FOUND THEN RAISE EXCEPTION 'kit_not_found'; END IF;

  -- Validate stock
  FOR v_comp IN
    SELECT component_product_id, quantity FROM public.wms_kit_components
      WHERE kit_id = p_kit_id AND company_id = v_company
  LOOP
    v_needed := v_comp.quantity * p_quantity;
    SELECT COALESCE(SUM(quantity),0) INTO v_available
      FROM public.stock_balances
      WHERE company_id = v_company AND product_id = v_comp.component_product_id;
    IF v_available < v_needed THEN
      RAISE EXCEPTION 'insufficient_stock_for_component_%', v_comp.component_product_id;
    END IF;
  END LOOP;

  INSERT INTO public.wms_kit_assemblies(company_id, kit_id, quantity, location_id, performed_by, notes)
    VALUES (v_company, p_kit_id, p_quantity, p_location_id, auth.uid(), p_notes)
    RETURNING id INTO v_assembly_id;

  -- Consume components (FIFO across balances)
  FOR v_comp IN
    SELECT component_product_id, quantity FROM public.wms_kit_components
      WHERE kit_id = p_kit_id AND company_id = v_company
  LOOP
    v_needed := v_comp.quantity * p_quantity;
    -- decrement from balances
    PERFORM 1;
    UPDATE public.stock_balances sb SET quantity = sb.quantity - LEAST(sb.quantity, v_needed)
      WHERE sb.ctid IN (
        SELECT ctid FROM public.stock_balances
          WHERE company_id = v_company AND product_id = v_comp.component_product_id AND quantity > 0
          ORDER BY created_at ASC
      )
      AND v_needed > 0;
    INSERT INTO public.wms_movements(company_id, product_id, quantity, movement_type, reference_id, notes)
      VALUES (v_company, v_comp.component_product_id, -v_needed, 'kit_consume', v_assembly_id::text, 'Kit assembly consume');
  END LOOP;

  -- Produce parent
  INSERT INTO public.stock_balances(company_id, product_id, location_id, quantity, status)
    VALUES (v_company, v_kit.parent_product_id, p_location_id, p_quantity, 'available');

  INSERT INTO public.wms_movements(company_id, product_id, quantity, movement_type, reference_id, notes)
    VALUES (v_company, v_kit.parent_product_id, p_quantity, 'kit_produce', v_assembly_id::text, 'Kit assembly produce');

  INSERT INTO public.wms_events(company_id, event_type, source_module, entity_type, entity_id, payload)
    VALUES (v_company, 'kit.assembled', 'wms', 'kit_assembly', v_assembly_id,
      jsonb_build_object('kit_id', p_kit_id, 'quantity', p_quantity));

  RETURN v_assembly_id;
END;
$$;

REVOKE ALL ON FUNCTION public.wms_assemble_kit(uuid, numeric, uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.wms_assemble_kit(uuid, numeric, uuid, text) TO authenticated;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

DROP TRIGGER IF EXISTS update_wms_kits_updated_at ON public.wms_kits;
CREATE TRIGGER update_wms_kits_updated_at BEFORE UPDATE ON public.wms_kits
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

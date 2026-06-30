
CREATE OR REPLACE FUNCTION public.wms_move_stock(
  p_product_id uuid,
  p_product_code text,
  p_product_name text,
  p_quantity numeric,
  p_unit text DEFAULT 'UN',
  p_from_location_id uuid DEFAULT NULL,
  p_to_location_id uuid DEFAULT NULL,
  p_lot_id uuid DEFAULT NULL,
  p_lot_number text DEFAULT NULL,
  p_reason text DEFAULT 'manual'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_company uuid := public.get_user_company_id(auth.uid());
  v_from_company uuid;
  v_to_company uuid;
  v_from_wh uuid;
  v_to_wh uuid;
  v_from_code text;
  v_to_code text;
  v_available numeric;
  v_mov_id uuid;
  v_direction text;
  v_type text;
BEGIN
  IF v_user_company IS NULL THEN
    RAISE EXCEPTION 'Usuário sem empresa vinculada';
  END IF;
  IF p_quantity IS NULL OR p_quantity <= 0 THEN
    RAISE EXCEPTION 'Quantidade deve ser maior que zero';
  END IF;
  IF p_from_location_id IS NULL AND p_to_location_id IS NULL THEN
    RAISE EXCEPTION 'Informe origem ou destino';
  END IF;

  IF p_from_location_id IS NOT NULL THEN
    SELECT wl.company_id, wz.warehouse_id, wl.code
      INTO v_from_company, v_from_wh, v_from_code
      FROM public.warehouse_locations wl
      JOIN public.warehouse_zones wz ON wz.id = wl.zone_id
     WHERE wl.id = p_from_location_id;
    IF v_from_company IS NULL OR v_from_company <> v_user_company THEN
      RAISE EXCEPTION 'Endereço de origem inválido para esta empresa';
    END IF;
  END IF;

  IF p_to_location_id IS NOT NULL THEN
    SELECT wl.company_id, wz.warehouse_id, wl.code
      INTO v_to_company, v_to_wh, v_to_code
      FROM public.warehouse_locations wl
      JOIN public.warehouse_zones wz ON wz.id = wl.zone_id
     WHERE wl.id = p_to_location_id;
    IF v_to_company IS NULL OR v_to_company <> v_user_company THEN
      RAISE EXCEPTION 'Endereço de destino inválido para esta empresa';
    END IF;
  END IF;

  IF p_product_id IS NOT NULL THEN
    PERFORM 1 FROM public.products WHERE id = p_product_id AND company_id = v_user_company;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Produto não pertence à empresa';
    END IF;
  END IF;

  -- Decrementa origem
  IF p_from_location_id IS NOT NULL THEN
    SELECT COALESCE(quantity,0) INTO v_available
      FROM public.stock_balances
     WHERE company_id = v_user_company
       AND location_id = p_from_location_id
       AND product_code = p_product_code
       AND COALESCE(lot_id::text,'') = COALESCE(p_lot_id::text,'')
     FOR UPDATE;
    IF v_available IS NULL OR v_available < p_quantity THEN
      RAISE EXCEPTION 'Saldo insuficiente no endereço de origem (disponível: %)', COALESCE(v_available,0);
    END IF;
    UPDATE public.stock_balances
       SET quantity = quantity - p_quantity,
           last_movement_at = now(),
           updated_at = now()
     WHERE company_id = v_user_company
       AND location_id = p_from_location_id
       AND product_code = p_product_code
       AND COALESCE(lot_id::text,'') = COALESCE(p_lot_id::text,'');
  END IF;

  -- Incrementa destino (upsert)
  IF p_to_location_id IS NOT NULL THEN
    UPDATE public.stock_balances
       SET quantity = quantity + p_quantity,
           last_movement_at = now(),
           updated_at = now()
     WHERE company_id = v_user_company
       AND location_id = p_to_location_id
       AND product_code = p_product_code
       AND COALESCE(lot_id::text,'') = COALESCE(p_lot_id::text,'');
    IF NOT FOUND THEN
      INSERT INTO public.stock_balances(
        company_id, product_id, product_code, product_name, lot_id, lot_number,
        location_id, location_code, warehouse_id, stock_status, quantity, reserved_qty, unit, last_movement_at
      ) VALUES (
        v_user_company, p_product_id, p_product_code, p_product_name, p_lot_id, p_lot_number,
        p_to_location_id, v_to_code, v_to_wh, 'available', p_quantity, 0, p_unit, now()
      );
    END IF;
  END IF;

  -- Registra movimento
  IF p_from_location_id IS NOT NULL AND p_to_location_id IS NOT NULL THEN
    v_type := 'transfer'; v_direction := 'transfer';
  ELSIF p_to_location_id IS NOT NULL THEN
    v_type := 'inbound'; v_direction := 'in';
  ELSE
    v_type := 'outbound'; v_direction := 'out';
  END IF;

  INSERT INTO public.stock_movements(
    company_id, document_number, product_id, product_code, product_name,
    type, direction, quantity, unit_cost, total_cost,
    batch, origin, destination, reference, operator, source, lot_id
  ) VALUES (
    v_user_company,
    'MOV-' || to_char(now(),'YYYYMMDDHH24MISS'),
    p_product_id, p_product_code, p_product_name,
    v_type, v_direction, p_quantity, 0, 0,
    p_lot_number, v_from_code, v_to_code, p_reason,
    COALESCE((auth.jwt() ->> 'email'), 'system'),
    'wms_allocation', p_lot_id
  )
  RETURNING id INTO v_mov_id;

  RETURN jsonb_build_object('ok', true, 'movement_id', v_mov_id, 'type', v_type);
END;
$$;

REVOKE EXECUTE ON FUNCTION public.wms_move_stock(uuid,text,text,numeric,text,uuid,uuid,uuid,text,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.wms_move_stock(uuid,text,text,numeric,text,uuid,uuid,uuid,text,text) TO authenticated, service_role;

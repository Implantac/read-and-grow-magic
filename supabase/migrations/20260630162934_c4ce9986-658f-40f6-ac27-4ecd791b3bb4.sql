
-- Pick reserved stock for an order: reserved -> picked
-- Decrements stock_balances.quantity & reserved_qty, marks reservations picked, writes outbound stock_movements
CREATE OR REPLACE FUNCTION public.wms_pick_order_stock(p_order_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_company uuid := public.get_user_company_id(auth.uid());
  v_order_company uuid;
  v_order_number text;
  r RECORD;
  v_take numeric;
  v_remaining numeric;
  v_total_picked numeric := 0;
  v_lines_picked int := 0;
  v_lines_short int := 0;
BEGIN
  IF v_company IS NULL THEN
    RAISE EXCEPTION 'forbidden: user has no company';
  END IF;

  SELECT company_id, number INTO v_order_company, v_order_number
  FROM public.orders WHERE id = p_order_id;
  IF v_order_company IS NULL THEN
    RAISE EXCEPTION 'order not found';
  END IF;
  IF v_order_company <> v_company THEN
    RAISE EXCEPTION 'forbidden: cross-tenant order';
  END IF;

  -- Iterate each reserved reservation line for this order
  FOR r IN
    SELECT id, product_id, product_code, product_name, reserved_qty, picked_qty
    FROM public.stock_reservations
    WHERE order_id = p_order_id
      AND company_id = v_company
      AND status = 'reserved'
    FOR UPDATE
  LOOP
    v_remaining := r.reserved_qty - COALESCE(r.picked_qty, 0);
    IF v_remaining <= 0 THEN CONTINUE; END IF;

    -- Decrement reserved + quantity from balances (FIFO) for this product within tenant
    FOR v_take IN
      SELECT LEAST(sb.reserved_qty, v_remaining)
      FROM public.stock_balances sb
      WHERE sb.company_id = v_company
        AND sb.product_id = r.product_id
        AND sb.reserved_qty > 0
      ORDER BY sb.created_at
      FOR UPDATE
    LOOP
      EXIT WHEN v_remaining <= 0;
      UPDATE public.stock_balances sb
         SET reserved_qty = reserved_qty - v_take,
             quantity     = GREATEST(quantity - v_take, 0),
             last_movement_at = now(),
             updated_at = now()
       WHERE sb.company_id = v_company
         AND sb.product_id = r.product_id
         AND sb.reserved_qty >= v_take
         AND ctid = (
           SELECT ctid FROM public.stock_balances
           WHERE company_id = v_company AND product_id = r.product_id AND reserved_qty > 0
           ORDER BY created_at LIMIT 1
         );
      v_remaining := v_remaining - v_take;
    END LOOP;

    -- Update reservation status
    IF v_remaining = 0 THEN
      UPDATE public.stock_reservations
         SET status = 'picked',
             picked_qty = reserved_qty,
             updated_at = now()
       WHERE id = r.id;
      v_lines_picked := v_lines_picked + 1;
      v_total_picked := v_total_picked + r.reserved_qty;

      -- Audit movement
      INSERT INTO public.stock_movements
        (product_id, product_code, product_name, type, direction, quantity,
         reference, notes, operator, source, company_id)
      VALUES
        (r.product_id, r.product_code, r.product_name, 'outbound', 'out', r.reserved_qty,
         COALESCE(v_order_number, p_order_id::text),
         'Separação de pedido', COALESCE(auth.uid()::text,'system'), 'wms_pick', v_company);
    ELSE
      -- Partial pick: record what was picked
      UPDATE public.stock_reservations
         SET picked_qty = reserved_qty - v_remaining,
             updated_at = now()
       WHERE id = r.id;
      v_lines_short := v_lines_short + 1;
      v_total_picked := v_total_picked + (r.reserved_qty - v_remaining);
    END IF;
  END LOOP;

  RETURN jsonb_build_object(
    'order_id', p_order_id,
    'lines_picked', v_lines_picked,
    'lines_short', v_lines_short,
    'total_picked', v_total_picked
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.wms_pick_order_stock(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.wms_pick_order_stock(uuid) TO authenticated, service_role;

-- Mark picked reservations as shipped
CREATE OR REPLACE FUNCTION public.wms_ship_order(p_order_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_company uuid := public.get_user_company_id(auth.uid());
  v_order_company uuid;
  v_count int;
BEGIN
  IF v_company IS NULL THEN
    RAISE EXCEPTION 'forbidden: user has no company';
  END IF;

  SELECT company_id INTO v_order_company FROM public.orders WHERE id = p_order_id;
  IF v_order_company IS NULL THEN RAISE EXCEPTION 'order not found'; END IF;
  IF v_order_company <> v_company THEN RAISE EXCEPTION 'forbidden: cross-tenant order'; END IF;

  UPDATE public.stock_reservations
     SET status = 'shipped',
         updated_at = now()
   WHERE order_id = p_order_id
     AND company_id = v_company
     AND status = 'picked';
  GET DIAGNOSTICS v_count = ROW_COUNT;

  RETURN jsonb_build_object('order_id', p_order_id, 'lines_shipped', v_count);
END;
$$;

REVOKE EXECUTE ON FUNCTION public.wms_ship_order(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.wms_ship_order(uuid) TO authenticated, service_role;

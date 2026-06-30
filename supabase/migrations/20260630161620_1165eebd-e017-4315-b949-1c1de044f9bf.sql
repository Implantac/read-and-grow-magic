
-- Reserve stock for an order (atomic, tenant-scoped)
CREATE OR REPLACE FUNCTION public.wms_reserve_order_stock(p_order_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_company uuid;
  v_order_company uuid;
  v_user uuid := auth.uid();
  v_item RECORD;
  v_bal RECORD;
  v_remaining numeric;
  v_take numeric;
  v_total_reserved numeric := 0;
  v_items_done int := 0;
  v_items_partial int := 0;
BEGIN
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'unauthorized';
  END IF;

  v_company := public.get_user_company_id(v_user);
  IF v_company IS NULL THEN
    RAISE EXCEPTION 'company_not_found';
  END IF;

  SELECT company_id INTO v_order_company FROM public.orders WHERE id = p_order_id;
  IF v_order_company IS NULL THEN
    RAISE EXCEPTION 'order_not_found';
  END IF;
  IF v_order_company <> v_company THEN
    RAISE EXCEPTION 'cross_tenant_forbidden';
  END IF;

  -- Prevent duplicate active reservations for the same order
  IF EXISTS (
    SELECT 1 FROM public.stock_reservations
    WHERE order_id = p_order_id AND status IN ('pending','reserved')
  ) THEN
    RAISE EXCEPTION 'order_already_reserved';
  END IF;

  FOR v_item IN
    SELECT id, product_id, product_code, product_name, quantity
    FROM public.order_items
    WHERE order_id = p_order_id AND company_id = v_company
  LOOP
    v_remaining := v_item.quantity;

    -- FIFO across balances with available stock
    FOR v_bal IN
      SELECT id, location_code, available_qty, reserved_qty, quantity
      FROM public.stock_balances
      WHERE company_id = v_company
        AND (product_id = v_item.product_id OR product_code = v_item.product_code)
        AND stock_status = 'available'
        AND COALESCE(available_qty, quantity - reserved_qty) > 0
      ORDER BY created_at ASC
      FOR UPDATE
    LOOP
      EXIT WHEN v_remaining <= 0;
      v_take := LEAST(v_remaining, COALESCE(v_bal.available_qty, v_bal.quantity - v_bal.reserved_qty));

      UPDATE public.stock_balances
        SET reserved_qty = reserved_qty + v_take,
            updated_at = now()
      WHERE id = v_bal.id;

      INSERT INTO public.stock_reservations (
        company_id, order_id, order_item_id, product_id, product_code, product_name,
        requested_qty, reserved_qty, picked_qty, location, status, reserved_by, reserved_at
      ) VALUES (
        v_company, p_order_id, v_item.id, v_item.product_id, v_item.product_code, v_item.product_name,
        v_item.quantity, v_take, 0, v_bal.location_code, 'reserved', v_user::text, now()
      );

      v_remaining := v_remaining - v_take;
      v_total_reserved := v_total_reserved + v_take;
    END LOOP;

    IF v_remaining > 0 THEN
      -- Pending row for unfulfilled portion
      INSERT INTO public.stock_reservations (
        company_id, order_id, order_item_id, product_id, product_code, product_name,
        requested_qty, reserved_qty, picked_qty, status, reserved_by, reserved_at
      ) VALUES (
        v_company, p_order_id, v_item.id, v_item.product_id, v_item.product_code, v_item.product_name,
        v_remaining, 0, 0, 'pending', v_user::text, now()
      );
      v_items_partial := v_items_partial + 1;
    ELSE
      v_items_done := v_items_done + 1;
    END IF;
  END LOOP;

  RETURN jsonb_build_object(
    'ok', true,
    'order_id', p_order_id,
    'total_reserved', v_total_reserved,
    'items_fully_reserved', v_items_done,
    'items_partial', v_items_partial
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.wms_reserve_order_stock(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.wms_reserve_order_stock(uuid) TO authenticated, service_role;

-- Release reservations for an order
CREATE OR REPLACE FUNCTION public.wms_release_order_reservation(p_order_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_company uuid;
  v_order_company uuid;
  v_user uuid := auth.uid();
  v_res RECORD;
  v_total numeric := 0;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'unauthorized'; END IF;
  v_company := public.get_user_company_id(v_user);

  SELECT company_id INTO v_order_company FROM public.orders WHERE id = p_order_id;
  IF v_order_company IS NULL THEN RAISE EXCEPTION 'order_not_found'; END IF;
  IF v_order_company <> v_company THEN RAISE EXCEPTION 'cross_tenant_forbidden'; END IF;

  FOR v_res IN
    SELECT id, product_id, product_code, reserved_qty, location
    FROM public.stock_reservations
    WHERE order_id = p_order_id
      AND company_id = v_company
      AND status IN ('pending','reserved')
      AND reserved_qty > 0
    FOR UPDATE
  LOOP
    UPDATE public.stock_balances
      SET reserved_qty = GREATEST(0, reserved_qty - v_res.reserved_qty),
          updated_at = now()
    WHERE company_id = v_company
      AND (product_id = v_res.product_id OR product_code = v_res.product_code)
      AND (v_res.location IS NULL OR location_code = v_res.location);

    v_total := v_total + v_res.reserved_qty;
  END LOOP;

  UPDATE public.stock_reservations
    SET status = 'released', released_at = now(), updated_at = now()
  WHERE order_id = p_order_id
    AND company_id = v_company
    AND status IN ('pending','reserved');

  RETURN jsonb_build_object('ok', true, 'order_id', p_order_id, 'released_qty', v_total);
END;
$$;

REVOKE EXECUTE ON FUNCTION public.wms_release_order_reservation(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.wms_release_order_reservation(uuid) TO authenticated, service_role;

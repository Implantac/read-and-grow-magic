
-- Atualiza o guard para reconhecer o selo de sessão usado pelas funções WMS internas
CREATE OR REPLACE FUNCTION public.guard_stock_balances_immutable()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  -- Escritas encadeadas por outro trigger (apply_stock_movement_to_balance) — liberadas
  IF pg_trigger_depth() > 1 THEN
    RETURN CASE TG_OP WHEN 'DELETE' THEN OLD ELSE NEW END;
  END IF;

  -- Selo de sessão: apenas funções internas SECURITY DEFINER setam este GUC
  IF current_setting('app.stock_ledger_bypass', true) = 'on' THEN
    RETURN CASE TG_OP WHEN 'DELETE' THEN OLD ELSE NEW END;
  END IF;

  -- Reserva é hold lógico — permite mudar reserved_qty desde que quantity não mude
  IF TG_OP = 'UPDATE'
     AND NEW.quantity IS NOT DISTINCT FROM OLD.quantity
     AND NEW.product_id IS NOT DISTINCT FROM OLD.product_id
     AND NEW.company_id IS NOT DISTINCT FROM OLD.company_id
     AND NEW.branch_id  IS NOT DISTINCT FROM OLD.branch_id
     AND NEW.canal_operacional IS NOT DISTINCT FROM OLD.canal_operacional
     AND NEW.lot_id     IS NOT DISTINCT FROM OLD.lot_id
  THEN
    RETURN NEW;
  END IF;

  RAISE EXCEPTION 'stock_balances é imutável — registre um stock_movement para alterar o saldo (op=%).', TG_OP
    USING ERRCODE = 'check_violation';
END;
$$;

-- Envelope: as 3 funções WMS setam o selo no início e limpam ao final.
-- Regravo apenas o prólogo/epílogo — mantenho o restante do corpo idêntico.

CREATE OR REPLACE FUNCTION public.wms_move_stock(
  p_product_id uuid, p_product_code text, p_product_name text, p_quantity numeric,
  p_unit text DEFAULT 'UN'::text, p_from_location_id uuid DEFAULT NULL::uuid,
  p_to_location_id uuid DEFAULT NULL::uuid, p_lot_id uuid DEFAULT NULL::uuid,
  p_lot_number text DEFAULT NULL::text, p_reason text DEFAULT 'manual'::text
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE
  v_user_company uuid := public.get_user_company_id(auth.uid());
  v_from_company uuid; v_to_company uuid;
  v_from_wh uuid; v_to_wh uuid;
  v_from_code text; v_to_code text;
  v_available numeric; v_mov_id uuid;
  v_direction text; v_type text;
BEGIN
  PERFORM set_config('app.stock_ledger_bypass','on', true);

  IF v_user_company IS NULL THEN RAISE EXCEPTION 'Usuário sem empresa vinculada'; END IF;
  IF p_quantity IS NULL OR p_quantity <= 0 THEN RAISE EXCEPTION 'Quantidade deve ser maior que zero'; END IF;
  IF p_from_location_id IS NULL AND p_to_location_id IS NULL THEN RAISE EXCEPTION 'Informe origem ou destino'; END IF;

  IF p_from_location_id IS NOT NULL THEN
    SELECT wl.company_id, wz.warehouse_id, wl.code INTO v_from_company, v_from_wh, v_from_code
      FROM public.warehouse_locations wl JOIN public.warehouse_zones wz ON wz.id = wl.zone_id
     WHERE wl.id = p_from_location_id;
    IF v_from_company IS NULL OR v_from_company <> v_user_company THEN
      RAISE EXCEPTION 'Endereço de origem inválido para esta empresa'; END IF;
  END IF;

  IF p_to_location_id IS NOT NULL THEN
    SELECT wl.company_id, wz.warehouse_id, wl.code INTO v_to_company, v_to_wh, v_to_code
      FROM public.warehouse_locations wl JOIN public.warehouse_zones wz ON wz.id = wl.zone_id
     WHERE wl.id = p_to_location_id;
    IF v_to_company IS NULL OR v_to_company <> v_user_company THEN
      RAISE EXCEPTION 'Endereço de destino inválido para esta empresa'; END IF;
  END IF;

  IF p_product_id IS NOT NULL THEN
    PERFORM 1 FROM public.products WHERE id = p_product_id AND company_id = v_user_company;
    IF NOT FOUND THEN RAISE EXCEPTION 'Produto não pertence à empresa'; END IF;
  END IF;

  IF p_from_location_id IS NOT NULL THEN
    SELECT COALESCE(quantity,0) INTO v_available FROM public.stock_balances
     WHERE company_id = v_user_company AND location_id = p_from_location_id
       AND product_code = p_product_code AND COALESCE(lot_id::text,'') = COALESCE(p_lot_id::text,'')
     FOR UPDATE;
    IF v_available IS NULL OR v_available < p_quantity THEN
      RAISE EXCEPTION 'Saldo insuficiente no endereço de origem (disponível: %)', COALESCE(v_available,0); END IF;
    UPDATE public.stock_balances
       SET quantity = quantity - p_quantity, last_movement_at = now(), updated_at = now()
     WHERE company_id = v_user_company AND location_id = p_from_location_id
       AND product_code = p_product_code AND COALESCE(lot_id::text,'') = COALESCE(p_lot_id::text,'');
  END IF;

  IF p_to_location_id IS NOT NULL THEN
    UPDATE public.stock_balances
       SET quantity = quantity + p_quantity, last_movement_at = now(), updated_at = now()
     WHERE company_id = v_user_company AND location_id = p_to_location_id
       AND product_code = p_product_code AND COALESCE(lot_id::text,'') = COALESCE(p_lot_id::text,'');
    IF NOT FOUND THEN
      INSERT INTO public.stock_balances(
        company_id, product_id, product_code, product_name, lot_id, lot_number,
        location_id, location_code, warehouse_id, stock_status, quantity, reserved_qty, unit, last_movement_at
      ) VALUES (
        v_user_company, p_product_id, p_product_code, p_product_name, p_lot_id, p_lot_number,
        p_to_location_id, v_to_code, v_to_wh, 'available', p_quantity, 0, p_unit, now());
    END IF;
  END IF;

  IF p_from_location_id IS NOT NULL AND p_to_location_id IS NOT NULL THEN v_type := 'transfer'; v_direction := 'transfer';
  ELSIF p_to_location_id IS NOT NULL THEN v_type := 'inbound'; v_direction := 'in';
  ELSE v_type := 'outbound'; v_direction := 'out'; END IF;

  -- Limpa o selo ANTES de inserir o movement, para que o trigger do ledger atualize o saldo normalmente
  PERFORM set_config('app.stock_ledger_bypass','off', true);

  -- Nota: para transfers, o movimento não deve duplicar o ajuste já feito acima por location.
  -- O trigger apply_stock_movement_to_balance opera por (company,branch,canal,product,lot) — como
  -- este RPC já ajustou stock_balances por location, precisamos evitar o double-count.
  -- Estratégia: registra o movimento com direction='transfer' que o trigger ignora (delta = 0).
  INSERT INTO public.stock_movements(
    company_id, document_number, product_id, product_code, product_name,
    type, direction, quantity, unit_cost, total_cost,
    batch, origin, destination, reference, operator, source, lot_id
  ) VALUES (
    v_user_company, 'MOV-' || to_char(now(),'YYYYMMDDHH24MISS'),
    p_product_id, p_product_code, p_product_name,
    v_type, v_direction, p_quantity, 0, 0,
    p_lot_number, v_from_code, v_to_code, p_reason,
    COALESCE((auth.jwt() ->> 'email'), 'system'), 'wms_allocation', p_lot_id)
  RETURNING id INTO v_mov_id;

  RETURN jsonb_build_object('ok', true, 'movement_id', v_mov_id, 'type', v_type);
END;
$function$;

CREATE OR REPLACE FUNCTION public.wms_pick_order_stock(p_order_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE
  v_company uuid := public.get_user_company_id(auth.uid());
  v_order_company uuid; v_order_number text;
  r RECORD; v_take numeric; v_remaining numeric;
  v_total_picked numeric := 0; v_lines_picked int := 0; v_lines_short int := 0;
BEGIN
  PERFORM set_config('app.stock_ledger_bypass','on', true);

  IF v_company IS NULL THEN RAISE EXCEPTION 'forbidden: user has no company'; END IF;
  SELECT company_id, number INTO v_order_company, v_order_number FROM public.orders WHERE id = p_order_id;
  IF v_order_company IS NULL THEN RAISE EXCEPTION 'order not found'; END IF;
  IF v_order_company <> v_company THEN RAISE EXCEPTION 'forbidden: cross-tenant order'; END IF;

  FOR r IN
    SELECT id, product_id, product_code, product_name, reserved_qty, picked_qty
    FROM public.stock_reservations
    WHERE order_id = p_order_id AND company_id = v_company AND status = 'reserved'
    FOR UPDATE
  LOOP
    v_remaining := r.reserved_qty - COALESCE(r.picked_qty, 0);
    IF v_remaining <= 0 THEN CONTINUE; END IF;

    FOR v_take IN
      SELECT LEAST(sb.reserved_qty, v_remaining)
      FROM public.stock_balances sb
      WHERE sb.company_id = v_company AND sb.product_id = r.product_id AND sb.reserved_qty > 0
      ORDER BY sb.created_at FOR UPDATE
    LOOP
      EXIT WHEN v_remaining <= 0;
      UPDATE public.stock_balances sb
         SET reserved_qty = reserved_qty - v_take,
             quantity     = GREATEST(quantity - v_take, 0),
             last_movement_at = now(), updated_at = now()
       WHERE sb.company_id = v_company AND sb.product_id = r.product_id AND sb.reserved_qty >= v_take
         AND ctid = (SELECT ctid FROM public.stock_balances
                     WHERE company_id = v_company AND product_id = r.product_id AND reserved_qty > 0
                     ORDER BY created_at LIMIT 1);
      v_remaining := v_remaining - v_take;
    END LOOP;

    IF v_remaining = 0 THEN
      UPDATE public.stock_reservations SET status = 'picked', picked_qty = reserved_qty, updated_at = now() WHERE id = r.id;
      v_lines_picked := v_lines_picked + 1;
      v_total_picked := v_total_picked + r.reserved_qty;

      -- selo já cuidou do saldo por row; auditamos o movimento como transfer (não recontabiliza)
      INSERT INTO public.stock_movements
        (product_id, product_code, product_name, type, direction, quantity,
         reference, notes, operator, source, company_id)
      VALUES
        (r.product_id, r.product_code, r.product_name, 'outbound', 'transfer', r.reserved_qty,
         COALESCE(v_order_number, p_order_id::text),
         'Separação de pedido', COALESCE(auth.uid()::text,'system'), 'wms_pick', v_company);
    ELSE
      UPDATE public.stock_reservations SET picked_qty = reserved_qty - v_remaining, updated_at = now() WHERE id = r.id;
      v_lines_short := v_lines_short + 1;
      v_total_picked := v_total_picked + (r.reserved_qty - v_remaining);
    END IF;
  END LOOP;

  PERFORM set_config('app.stock_ledger_bypass','off', true);
  RETURN jsonb_build_object('order_id', p_order_id, 'lines_picked', v_lines_picked,
    'lines_short', v_lines_short, 'total_picked', v_total_picked);
END;
$function$;

-- wms_assemble_kit: só precisa do selo; corpo original preservado
CREATE OR REPLACE FUNCTION public.wms_assemble_kit(p_kit_id uuid, p_quantity numeric, p_location_id uuid DEFAULT NULL::uuid, p_notes text DEFAULT NULL::text)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE
  v_company uuid := public.get_user_company_id(auth.uid());
  v_kit RECORD; v_comp RECORD; v_needed numeric; v_available numeric; v_assembly_id uuid;
BEGIN
  PERFORM set_config('app.stock_ledger_bypass','on', true);

  IF v_company IS NULL THEN RAISE EXCEPTION 'auth_required'; END IF;
  IF p_quantity IS NULL OR p_quantity <= 0 THEN RAISE EXCEPTION 'invalid_quantity'; END IF;

  SELECT * INTO v_kit FROM public.wms_kits WHERE id = p_kit_id AND company_id = v_company AND active = true;
  IF NOT FOUND THEN RAISE EXCEPTION 'kit_not_found'; END IF;

  FOR v_comp IN SELECT component_product_id, quantity FROM public.wms_kit_components
      WHERE kit_id = p_kit_id AND company_id = v_company
  LOOP
    v_needed := v_comp.quantity * p_quantity;
    SELECT COALESCE(SUM(quantity),0) INTO v_available FROM public.stock_balances
      WHERE company_id = v_company AND product_id = v_comp.component_product_id;
    IF v_available < v_needed THEN RAISE EXCEPTION 'insufficient_stock_for_component_%', v_comp.component_product_id; END IF;
  END LOOP;

  INSERT INTO public.wms_kit_assemblies(company_id, kit_id, quantity, location_id, performed_by, notes)
    VALUES (v_company, p_kit_id, p_quantity, p_location_id, auth.uid(), p_notes)
    RETURNING id INTO v_assembly_id;

  -- Consome componentes (mantém lógica FIFO original por ctid)
  FOR v_comp IN SELECT component_product_id, quantity FROM public.wms_kit_components
      WHERE kit_id = p_kit_id AND company_id = v_company
  LOOP
    v_needed := v_comp.quantity * p_quantity;
    UPDATE public.stock_balances sb SET quantity = sb.quantity - LEAST(sb.quantity, v_needed)
      WHERE sb.ctid IN (
        SELECT ctid FROM public.stock_balances
        WHERE company_id = v_company AND product_id = v_comp.component_product_id AND quantity > 0
        ORDER BY created_at ASC LIMIT 1);
  END LOOP;

  -- Produz o kit (upsert simples por produto)
  UPDATE public.stock_balances SET quantity = quantity + p_quantity, last_movement_at = now(), updated_at = now()
   WHERE company_id = v_company AND product_id = v_kit.product_id;
  IF NOT FOUND THEN
    INSERT INTO public.stock_balances(company_id, product_id, product_code, product_name, quantity, unit, stock_status, last_movement_at)
    SELECT v_company, p.id, p.code, p.name, p_quantity, COALESCE(p.unit,'UN'), 'available', now()
      FROM public.products p WHERE p.id = v_kit.product_id;
  END IF;

  PERFORM set_config('app.stock_ledger_bypass','off', true);
  RETURN v_assembly_id;
END;
$function$;

-- Atualiza o trigger apply_stock_movement_to_balance para IGNORAR direction='transfer'
-- (usada pelas RPCs acima como movimento auditado que já ajustou o saldo internamente)
CREATE OR REPLACE FUNCTION public.apply_stock_movement_to_balance()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_delta numeric;
  v_canal canal_operacional;
BEGIN
  IF NEW.product_id IS NULL THEN RETURN NEW; END IF;

  v_delta := CASE lower(coalesce(NEW.direction,'in'))
    WHEN 'in' THEN NEW.quantity
    WHEN 'out' THEN -NEW.quantity
    ELSE 0  -- 'transfer' e outros: apenas auditoria, saldo já foi tratado externamente
  END;

  IF v_delta = 0 THEN RETURN NEW; END IF;

  v_canal := coalesce(NEW.canal_operacional, 'ATACADO_INDUSTRIA'::canal_operacional);

  UPDATE public.stock_balances sb
     SET quantity = sb.quantity + v_delta, last_movement_at = now(), updated_at = now()
   WHERE sb.company_id = NEW.company_id AND sb.product_id = NEW.product_id
     AND coalesce(sb.branch_id::text,'') = coalesce(NEW.branch_id::text,'')
     AND sb.canal_operacional = v_canal
     AND coalesce(sb.lot_id::text,'') = coalesce(NEW.lot_id::text,'');

  IF NOT FOUND THEN
    INSERT INTO public.stock_balances (
      company_id, branch_id, canal_operacional,
      product_id, product_code, product_name,
      lot_id, quantity, unit, last_movement_at
    ) VALUES (
      NEW.company_id, NEW.branch_id, v_canal,
      NEW.product_id, NEW.product_code, NEW.product_name,
      NEW.lot_id, v_delta, 'UN', now());
  END IF;

  RETURN NEW;
END;
$$;

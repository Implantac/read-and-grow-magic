-- Fix: correct column name in process_rfid_event_for_wms function

CREATE OR REPLACE FUNCTION public.process_rfid_event_for_wms()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tag RECORD;
  v_rule RECORD;
  v_receiving_order RECORD;
  v_picking_order RECORD;
  v_action_taken TEXT := '';
BEGIN
  IF NEW.processed THEN
    RETURN NEW;
  END IF;

  SELECT * INTO v_tag FROM public.rfid_tags WHERE epc = NEW.tag_epc LIMIT 1;
  
  IF v_tag.id IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT * INTO v_rule
  FROM public.rfid_wms_rules
  WHERE enabled = true
    AND trigger_event_type = NEW.event_type
    AND (trigger_zone IS NULL OR trigger_zone = NEW.zone)
    AND (trigger_reader_code IS NULL OR trigger_reader_code = NEW.reader_code)
  ORDER BY priority DESC
  LIMIT 1;

  IF v_rule.id IS NULL THEN
    RETURN NEW;
  END IF;

  CASE v_rule.wms_action
    WHEN 'receive' THEN
      SELECT * INTO v_receiving_order
      FROM wms_receiving_orders
      WHERE status IN ('pending', 'in_progress')
      ORDER BY expected_date ASC
      LIMIT 1;

      IF v_receiving_order.id IS NOT NULL THEN
        UPDATE wms_receiving_orders
        SET received_items = COALESCE(received_items, 0) + 1,
            status = CASE WHEN v_rule.auto_complete AND COALESCE(received_items, 0) + 1 >= items_count THEN 'completed' ELSE CASE WHEN status = 'pending' THEN 'in_progress' ELSE status END END,
            received_date = CASE WHEN v_rule.auto_complete AND COALESCE(received_items, 0) + 1 >= items_count THEN now() ELSE received_date END
        WHERE id = v_receiving_order.id;
        v_action_taken := 'WMS: Recebimento atualizado - ' || v_receiving_order.order_number;
      END IF;

    WHEN 'pick' THEN
      SELECT * INTO v_picking_order
      FROM wms_picking_orders
      WHERE status IN ('pending', 'assigned', 'in_progress')
      ORDER BY created_at ASC
      LIMIT 1;

      IF v_picking_order.id IS NOT NULL THEN
        UPDATE wms_picking_orders
        SET picked_items = COALESCE(picked_items, 0) + 1,
            status = CASE WHEN status = 'pending' THEN 'in_progress' ELSE status END,
            completed_at = CASE WHEN v_rule.auto_complete AND COALESCE(picked_items, 0) + 1 >= items_count THEN now() ELSE completed_at END
        WHERE id = v_picking_order.id;
        v_action_taken := 'WMS: Picking atualizado - ' || v_picking_order.order_number;
      END IF;

    WHEN 'transfer' THEN
      IF v_tag.product_id IS NOT NULL AND v_rule.wms_target_location IS NOT NULL THEN
        INSERT INTO wms_movements (
          product_id, product_code, product_name,
          type, from_location, to_location, quantity,
          reason, operator, reference
        ) VALUES (
          v_tag.product_id, v_tag.product_code, v_tag.product_name,
          'transfer', v_tag.location, v_rule.wms_target_location, 1,
          'RFID auto-transfer', 'RFID System', NEW.id::text
        );
        UPDATE rfid_tags SET location = v_rule.wms_target_location WHERE id = v_tag.id;
        v_action_taken := 'WMS: Transferido para ' || v_rule.wms_target_location;
      END IF;

    WHEN 'inventory_count' THEN
      v_action_taken := 'WMS: Inventário registrado - zona ' || COALESCE(NEW.zone, 'unknown');

  END CASE;

  IF v_action_taken <> '' THEN
    NEW.processed := true;
    NEW.processed_at := now();
    NEW.action_taken := v_action_taken;
  END IF;

  RETURN NEW;
END;
$$;
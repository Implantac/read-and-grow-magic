-- Migration: RFID ↔ WMS Integration
-- Description: Create RFID-WMS integration rules and automated processing

-- ========================================
-- STEP 1: Create RFID-WMS automation rules table
-- ========================================

CREATE TABLE IF NOT EXISTS public.rfid_wms_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  enabled BOOLEAN NOT NULL DEFAULT true,
  
  -- Trigger conditions
  trigger_zone TEXT, -- NULL = all zones
  trigger_event_type TEXT NOT NULL, -- read, entry, exit, transfer
  trigger_reader_code TEXT, -- NULL = any reader
  
  -- WMS action
  wms_action TEXT NOT NULL, -- receive, pick, transfer, inventory_count
  wms_target_location TEXT, -- destination location for transfers
  auto_complete BOOLEAN NOT NULL DEFAULT false, -- auto-complete WMS operation
  
  -- Rule metadata
  priority INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS for rfid_wms_rules
ALTER TABLE public.rfid_wms_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Auth users can read rfid_wms_rules"
  ON public.rfid_wms_rules FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "Auth users can insert rfid_wms_rules"
  ON public.rfid_wms_rules FOR INSERT
  TO authenticated WITH CHECK (true);

CREATE POLICY "Auth users can update rfid_wms_rules"
  ON public.rfid_wms_rules FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Auth users can delete rfid_wms_rules"
  ON public.rfid_wms_rules FOR DELETE
  TO authenticated USING (true);

-- ========================================
-- STEP 2: Function to process RFID events for WMS
-- ========================================

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
  -- Only process if not already processed
  IF NEW.processed THEN
    RETURN NEW;
  END IF;

  -- Get tag info
  SELECT * INTO v_tag FROM public.rfid_tags WHERE epc = NEW.tag_epc LIMIT 1;
  
  IF v_tag.id IS NULL THEN
    -- Tag not registered, skip
    RETURN NEW;
  END IF;

  -- Find matching automation rule
  SELECT * INTO v_rule
  FROM public.rfid_wms_rules
  WHERE enabled = true
    AND event_type = NEW.event_type
    AND (trigger_zone IS NULL OR trigger_zone = NEW.zone)
    AND (trigger_reader_code IS NULL OR trigger_reader_code = NEW.reader_code)
  ORDER BY priority DESC
  LIMIT 1;

  IF v_rule.id IS NULL THEN
    -- No rule matched
    RETURN NEW;
  END IF;

  -- Execute WMS action based on rule
  CASE v_rule.wms_action
    WHEN 'receive' THEN
      -- Auto-update receiving order for this product
      SELECT * INTO v_receiving_order
      FROM wms_receiving_orders
      WHERE status IN ('pending', 'in_progress')
      ORDER BY expected_date ASC
      LIMIT 1;

      IF v_receiving_order.id IS NOT NULL THEN
        UPDATE wms_receiving_orders
        SET received_items = COALESCE(received_items, 0) + 1,
            status = CASE WHEN v_rule.auto_complete THEN 'completed' ELSE status END,
            received_date = CASE WHEN v_rule.auto_complete THEN now() ELSE received_date END
        WHERE id = v_receiving_order.id;
        
        v_action_taken := 'Auto-updated receiving ' || v_receiving_order.order_number;
      END IF;

    WHEN 'pick' THEN
      -- Auto-update picking for this tag
      SELECT * INTO v_picking_order
      FROM wms_picking_orders
      WHERE status IN ('pending', 'assigned', 'in_progress')
      ORDER BY created_at ASC
      LIMIT 1;

      IF v_picking_order.id IS NOT NULL THEN
        UPDATE wms_picking_orders
        SET picked_items = COALESCE(picked_items, 0) + 1,
            status = CASE WHEN v_rule.auto_complete THEN 'completed' ELSE status END,
            completed_at = CASE WHEN v_rule.auto_complete THEN now() ELSE completed_at END
        WHERE id = v_picking_order.id;
        
        v_action_taken := 'Auto-picked for order ' || v_picking_order.order_number;
      END IF;

    WHEN 'transfer' THEN
      -- Create automatic WMS movement
      IF v_tag.product_id IS NOT NULL AND v_rule.wms_target_location IS NOT NULL THEN
        INSERT INTO wms_movements (
          product_id, product_code, product_name,
          type, from_location, to_location, quantity,
          reason, operator, reference
        ) VALUES (
          v_tag.product_id, v_tag.product_code, v_tag.product_name,
          'transfer', v_tag.location, v_rule.wms_target_location, 1,
          'RFID auto-transfer from ' || NEW.zone, 'RFID System', NEW.id::text
        );

        -- Update tag location
        UPDATE rfid_tags SET location = v_rule.wms_target_location WHERE id = v_tag.id;
        
        v_action_taken := 'Auto-transferred to ' || v_rule.wms_target_location;
      END IF;

    WHEN 'inventory_count' THEN
      v_action_taken := 'Inventory count recorded for zone ' || COALESCE(NEW.zone, 'unknown');

  END CASE;

  -- Mark event as processed
  NEW.processed := true;
  NEW.processed_at := now();
  NEW.action_taken := v_action_taken;

  RETURN NEW;
END;
$$;

-- ========================================
-- STEP 3: Create trigger for automatic RFID-WMS processing
-- ========================================

DROP TRIGGER IF EXISTS trigger_process_rfid_for_wms ON public.rfid_events;

CREATE TRIGGER trigger_process_rfid_for_wms
  BEFORE INSERT ON public.rfid_events
  FOR EACH ROW
  EXECUTE FUNCTION public.process_rfid_event_for_wms();

-- ========================================
-- STEP 4: Insert default automation rules
-- ========================================

INSERT INTO public.rfid_wms_rules (name, description, enabled, trigger_zone, trigger_event_type, wms_action, auto_complete, priority)
VALUES
  ('Auto-receive on dock entry', 'Automatically update receiving orders when tags enter dock zone', true, 'Recebimento', 'entry', 'receive', false, 10),
  ('Auto-pick on picking zone', 'Automatically mark items as picked when scanned in picking zone', true, 'Picking', 'read', 'pick', false, 9),
  ('Auto-transfer to storage', 'Move items to storage after receiving', true, 'Recebimento', 'exit', 'transfer', true, 8),
  ('Inventory count on scan', 'Record inventory count when tags are scanned during inventory', false, NULL, 'inventory', 'inventory_count', false, 5);

-- ========================================
-- STEP 5: Add index for performance
-- ========================================

CREATE INDEX IF NOT EXISTS idx_rfid_events_processed ON public.rfid_events(processed, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_rfid_wms_rules_zone_event ON public.rfid_wms_rules(trigger_zone, trigger_event_type, enabled);
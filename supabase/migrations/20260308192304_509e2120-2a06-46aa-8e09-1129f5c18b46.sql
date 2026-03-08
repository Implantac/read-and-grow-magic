
-- Add purchase_order_id column to wms_receiving_orders for traceability
ALTER TABLE public.wms_receiving_orders ADD COLUMN IF NOT EXISTS purchase_order_id UUID;

-- Create trigger function: purchase_orders approved → wms_receiving_orders
CREATE OR REPLACE FUNCTION public.generate_receiving_from_purchase()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_receiving_id UUID;
  v_rec_number TEXT;
  v_items_count INTEGER;
BEGIN
  -- Only trigger when status changes to 'approved' or 'sent'
  IF (NEW.status IN ('approved', 'sent')) AND (OLD.status IS DISTINCT FROM NEW.status) THEN
    -- Avoid duplicates
    IF EXISTS (SELECT 1 FROM public.wms_receiving_orders WHERE purchase_order_id = NEW.id) THEN
      RETURN NEW;
    END IF;

    v_rec_number := 'REC-' || to_char(now(), 'YYYYMMDD') || '-' || substring(NEW.id::text, 1, 8);
    SELECT count(*) INTO v_items_count FROM public.purchase_order_items WHERE purchase_order_id = NEW.id;

    INSERT INTO public.wms_receiving_orders (
      order_number, supplier, expected_date, items_count, status, purchase_order_id, notes
    ) VALUES (
      v_rec_number, NEW.supplier_name, COALESCE(NEW.expected_delivery, now()), v_items_count, 'pending', NEW.id, 'Gerado automaticamente do pedido ' || NEW.number
    ) RETURNING id INTO v_receiving_id;
  END IF;

  RETURN NEW;
END;
$$;

-- Create trigger on purchase_orders
CREATE TRIGGER trg_generate_receiving_from_purchase
  AFTER UPDATE ON public.purchase_orders
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_receiving_from_purchase();

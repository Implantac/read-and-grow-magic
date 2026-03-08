
-- Add missing columns to wms_picking_orders
ALTER TABLE public.wms_picking_orders ADD COLUMN IF NOT EXISTS items_count INTEGER NOT NULL DEFAULT 0;
ALTER TABLE public.wms_picking_orders ADD COLUMN IF NOT EXISTS picked_items INTEGER NOT NULL DEFAULT 0;

-- Create trigger function for orders -> picking
CREATE OR REPLACE FUNCTION public.generate_picking_from_order()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_picking_id UUID;
  v_pick_number TEXT;
  v_items_count INTEGER;
BEGIN
  IF (NEW.status IN ('confirmed', 'approved')) AND (OLD.status IS DISTINCT FROM NEW.status) THEN
    IF EXISTS (SELECT 1 FROM public.wms_picking_orders WHERE sales_order_id = NEW.id::text) THEN
      RETURN NEW;
    END IF;

    v_pick_number := 'PICK-' || to_char(now(), 'YYYYMMDD') || '-' || substring(NEW.id::text, 1, 8);
    SELECT count(*) INTO v_items_count FROM public.order_items WHERE order_id = NEW.id;

    INSERT INTO public.wms_picking_orders (
      order_number, sales_order_id, customer_name, priority, items_count
    ) VALUES (
      v_pick_number, NEW.id::text, NEW.client_name, NEW.priority, v_items_count
    ) RETURNING id INTO v_picking_id;

    INSERT INTO public.wms_picking_items (
      picking_order_id, product_code, product_name, requested_qty, unit, location
    )
    SELECT
      v_picking_id, oi.product_code, oi.product_name,
      oi.quantity, 'UN', COALESCE(p.location, '')
    FROM public.order_items oi
    LEFT JOIN public.products p ON p.id = oi.product_id
    WHERE oi.order_id = NEW.id;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_generate_picking_from_order
  AFTER UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_picking_from_order();

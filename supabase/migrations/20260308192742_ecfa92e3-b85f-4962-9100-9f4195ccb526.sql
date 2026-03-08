
-- Add sales_order_id to wms_packing_orders for traceability back to the order
ALTER TABLE public.wms_packing_orders ADD COLUMN IF NOT EXISTS sales_order_id TEXT;

-- Trigger function: when packing order shipped → generate NF-e draft
CREATE OR REPLACE FUNCTION public.generate_nfe_from_packing()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_nfe_id UUID;
  v_nfe_number TEXT;
  v_order RECORD;
  v_subtotal NUMERIC := 0;
BEGIN
  IF NEW.status = 'shipped' AND (OLD.status IS DISTINCT FROM NEW.status) THEN
    -- Check if NF-e already exists for this packing
    IF EXISTS (SELECT 1 FROM public.nfe WHERE order_id = NEW.order_number) THEN
      RETURN NEW;
    END IF;

    -- Try to find the related sales order via picking
    SELECT o.* INTO v_order
    FROM public.orders o
    JOIN public.wms_picking_orders po ON po.sales_order_id = o.id::text
    WHERE po.order_number = NEW.order_number
    LIMIT 1;

    -- Generate NF-e number
    v_nfe_number := 'NFE-' || to_char(now(), 'YYYYMMDD') || '-' || substring(NEW.id::text, 1, 8);

    IF v_order IS NOT NULL THEN
      INSERT INTO public.nfe (
        number, client_name, client_id, client_document, subtotal, total, discount, shipping,
        operation_type, status, order_id
      ) VALUES (
        v_nfe_number, v_order.client_name, v_order.client_id, NULL,
        v_order.subtotal, v_order.total, v_order.discount, v_order.shipping,
        'saida', 'draft', NEW.order_number
      ) RETURNING id INTO v_nfe_id;

      -- Copy order items to NF-e items
      INSERT INTO public.nfe_items (
        nfe_id, product_code, product_name, product_id, quantity, unit_price, total, unit
      )
      SELECT v_nfe_id, oi.product_code, oi.product_name, oi.product_id,
             oi.quantity, oi.unit_price, oi.total, 'UN'
      FROM public.order_items oi
      WHERE oi.order_id = v_order.id;
    ELSE
      -- Fallback: create minimal NF-e from packing data
      INSERT INTO public.nfe (
        number, client_name, operation_type, status, order_id
      ) VALUES (
        v_nfe_number, COALESCE(NEW.customer_name, 'Cliente'), 'saida', 'draft', NEW.order_number
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_generate_nfe_from_packing
  AFTER UPDATE ON public.wms_packing_orders
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_nfe_from_packing();

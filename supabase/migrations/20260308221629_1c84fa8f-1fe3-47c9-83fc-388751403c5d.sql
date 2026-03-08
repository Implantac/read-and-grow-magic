
-- Fix: trigger NF-e generation when order becomes 'invoiced' (not 'invoicing')
CREATE OR REPLACE FUNCTION public.generate_nfe_from_order()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_nfe_id UUID;
  v_nfe_number TEXT;
BEGIN
  IF NEW.status = 'invoiced' AND (OLD.status IS DISTINCT FROM NEW.status) THEN
    -- Check if NF-e already exists
    IF EXISTS (SELECT 1 FROM public.nfe WHERE order_id = NEW.id::text) THEN
      RETURN NEW;
    END IF;

    v_nfe_number := 'NFE-' || to_char(now(), 'YYYYMMDD') || '-' || substring(NEW.id::text, 1, 8);

    INSERT INTO public.nfe (
      number, client_name, client_id, client_document, subtotal, total,
      discount, shipping, operation_type, status, order_id
    ) VALUES (
      v_nfe_number, NEW.client_name, NEW.client_id, NULL,
      NEW.subtotal, NEW.total, NEW.discount, NEW.shipping,
      'saida', 'draft', NEW.id::text
    ) RETURNING id INTO v_nfe_id;

    -- Copy order items to NF-e items
    INSERT INTO public.nfe_items (
      nfe_id, product_code, product_name, product_id, quantity, unit_price, total, unit
    )
    SELECT v_nfe_id, oi.product_code, oi.product_name, oi.product_id,
           oi.quantity, oi.unit_price, oi.total, 'UN'
    FROM public.order_items oi
    WHERE oi.order_id = NEW.id;
  END IF;
  RETURN NEW;
END;
$function$;

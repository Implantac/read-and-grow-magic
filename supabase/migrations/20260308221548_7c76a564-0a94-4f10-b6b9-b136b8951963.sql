
-- 1. Attach existing trigger functions that were created but not connected

-- Attach sync_wms_movement_to_stock to wms_movements
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_sync_wms_to_stock') THEN
    CREATE TRIGGER trigger_sync_wms_to_stock
      AFTER INSERT ON public.wms_movements
      FOR EACH ROW
      EXECUTE FUNCTION public.sync_wms_movement_to_stock();
  END IF;
END $$;

-- Attach generate_picking_from_order to orders
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_generate_picking') THEN
    CREATE TRIGGER trigger_generate_picking
      AFTER UPDATE ON public.orders
      FOR EACH ROW
      EXECUTE FUNCTION public.generate_picking_from_order();
  END IF;
END $$;

-- Attach generate_receiving_from_purchase to purchase_orders
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_generate_receiving') THEN
    CREATE TRIGGER trigger_generate_receiving
      AFTER UPDATE ON public.purchase_orders
      FOR EACH ROW
      EXECUTE FUNCTION public.generate_receiving_from_purchase();
  END IF;
END $$;

-- Attach generate_nfe_from_packing to wms_packing_orders
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_generate_nfe_packing') THEN
    CREATE TRIGGER trigger_generate_nfe_packing
      AFTER UPDATE ON public.wms_packing_orders
      FOR EACH ROW
      EXECUTE FUNCTION public.generate_nfe_from_packing();
  END IF;
END $$;

-- 2. Create trigger: Sale → Stock Movements (outbound)
CREATE OR REPLACE FUNCTION public.generate_stock_movements_from_sale()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_item RECORD;
  v_doc_number TEXT;
BEGIN
  IF NEW.status = 'completed' AND (OLD.status IS DISTINCT FROM NEW.status) THEN
    v_doc_number := 'VND-' || NEW.number;

    FOR v_item IN
      SELECT * FROM public.sale_items WHERE sale_id = NEW.id
    LOOP
      INSERT INTO public.stock_movements (
        document_number, product_id, product_code, product_name,
        type, direction, quantity, unit_cost, total_cost,
        operator, source, reference, notes
      ) VALUES (
        v_doc_number, v_item.product_id, v_item.product_code, v_item.product_name,
        'sale', 'out', v_item.quantity, v_item.unit_price, v_item.total,
        'Sistema', 'erp', NEW.number, 'Baixa automática - Venda ' || NEW.number
      );
    END LOOP;
  END IF;
  RETURN NEW;
END;
$function$;

CREATE TRIGGER trigger_sale_stock_movement
  AFTER UPDATE ON public.sales
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_stock_movements_from_sale();

-- 3. Create trigger: Sale → Accounts Receivable
CREATE OR REPLACE FUNCTION public.generate_receivable_from_sale()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.status = 'completed' AND (OLD.status IS DISTINCT FROM NEW.status) THEN
    -- Check if already exists
    IF EXISTS (SELECT 1 FROM public.accounts_receivable WHERE order_id = NEW.id) THEN
      RETURN NEW;
    END IF;

    INSERT INTO public.accounts_receivable (
      description, client_name, client_id, amount, due_date,
      status, category, invoice_number, order_id, notes
    ) VALUES (
      'Venda ' || NEW.number, NEW.client_name, NEW.client_id, NEW.total,
      (now() + interval '30 days'), 'pending', 'Vendas',
      NEW.number, NEW.id, 'Gerado automaticamente da venda ' || NEW.number
    );
  END IF;
  RETURN NEW;
END;
$function$;

CREATE TRIGGER trigger_sale_receivable
  AFTER UPDATE ON public.sales
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_receivable_from_sale();

-- 4. Create trigger: Purchase Order approved → Accounts Payable
CREATE OR REPLACE FUNCTION public.generate_payable_from_purchase()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.status = 'approved' AND (OLD.status IS DISTINCT FROM NEW.status) THEN
    -- Check if already exists
    IF EXISTS (SELECT 1 FROM public.accounts_payable WHERE invoice_number = NEW.number) THEN
      RETURN NEW;
    END IF;

    INSERT INTO public.accounts_payable (
      description, supplier, amount, due_date,
      status, category, invoice_number, notes
    ) VALUES (
      'Pedido Compra ' || NEW.number, NEW.supplier_name, NEW.total,
      COALESCE(NEW.expected_delivery, now() + interval '30 days'),
      'pending', 'Fornecedores', NEW.number,
      'Gerado automaticamente do pedido de compra ' || NEW.number
    );
  END IF;
  RETURN NEW;
END;
$function$;

CREATE TRIGGER trigger_purchase_payable
  AFTER UPDATE ON public.purchase_orders
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_payable_from_purchase();

-- 5. Create trigger: Order confirmed → NF-e draft (direct, without WMS)
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
  IF NEW.status = 'invoicing' AND (OLD.status IS DISTINCT FROM NEW.status) THEN
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

CREATE TRIGGER trigger_order_nfe
  AFTER UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_nfe_from_order();

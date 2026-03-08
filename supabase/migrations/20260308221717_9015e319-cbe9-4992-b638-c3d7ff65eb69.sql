
-- Drop the UPDATE trigger for sales and create INSERT triggers instead
DROP TRIGGER IF EXISTS trigger_sale_stock_movement ON public.sales;
DROP TRIGGER IF EXISTS trigger_sale_receivable ON public.sales;

-- Recreate sale → stock as AFTER INSERT trigger
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
  IF NEW.status = 'completed' THEN
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

-- Use AFTER INSERT since sales are created as 'completed'
-- We use a constraint trigger with DEFERRABLE to ensure sale_items exist
CREATE CONSTRAINT TRIGGER trigger_sale_stock_movement
  AFTER INSERT ON public.sales
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_stock_movements_from_sale();

-- Recreate sale → receivable as AFTER INSERT
CREATE OR REPLACE FUNCTION public.generate_receivable_from_sale()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.status = 'completed' THEN
    INSERT INTO public.accounts_receivable (
      description, client_name, client_id, amount, due_date,
      status, category, invoice_number, notes
    ) VALUES (
      'Venda ' || NEW.number, NEW.client_name, NEW.client_id, NEW.total,
      (now() + interval '30 days'), 'pending', 'Vendas',
      NEW.number, 'Gerado automaticamente da venda ' || NEW.number
    );
  END IF;
  RETURN NEW;
END;
$function$;

CREATE CONSTRAINT TRIGGER trigger_sale_receivable
  AFTER INSERT ON public.sales
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_receivable_from_sale();

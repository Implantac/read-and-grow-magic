
-- Trigger: When a production order is completed, auto-generate stock movement for finished product
CREATE OR REPLACE FUNCTION public.generate_stock_from_production()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_doc_number TEXT;
BEGIN
  -- Only trigger on completion
  IF NEW.status = 'completed' AND (OLD.status IS DISTINCT FROM NEW.status) THEN
    v_doc_number := 'PROD-' || NEW.order_number;

    -- Check if already exists
    IF EXISTS (SELECT 1 FROM public.stock_movements WHERE document_number = v_doc_number AND direction = 'in') THEN
      RETURN NEW;
    END IF;

    -- Entry of finished product
    INSERT INTO public.stock_movements (
      document_number, product_id, product_code, product_name,
      type, direction, quantity, operator, source, reference, notes
    ) VALUES (
      v_doc_number, NEW.product_id, NEW.product_code, NEW.product_name,
      'production', 'in', NEW.produced_quantity,
      COALESCE(NEW.operator, 'Sistema'), 'erp', NEW.order_number,
      'Entrada automática - Produção concluída OP ' || NEW.order_number
    );
  END IF;
  RETURN NEW;
END;
$function$;

-- Create the trigger on production_orders
DROP TRIGGER IF EXISTS trg_stock_from_production ON public.production_orders;
CREATE TRIGGER trg_stock_from_production
  AFTER UPDATE ON public.production_orders
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_stock_from_production();

-- Trigger: Auto-generate industrial alert when OP is overdue
CREATE OR REPLACE FUNCTION public.check_production_delay_alert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- When an OP is updated and still not completed, check if overdue
  IF NEW.status NOT IN ('completed', 'cancelled') AND NEW.due_date IS NOT NULL THEN
    IF NEW.due_date::date < CURRENT_DATE THEN
      -- Check if alert already exists for this OP
      IF NOT EXISTS (
        SELECT 1 FROM public.industrial_alerts
        WHERE entity_id = NEW.id::text AND alert_type = 'delay' AND status = 'active'
      ) THEN
        INSERT INTO public.industrial_alerts (
          alert_type, severity, title, description,
          entity_type, entity_id, entity_name, status
        ) VALUES (
          'delay',
          CASE
            WHEN (CURRENT_DATE - NEW.due_date::date) > 7 THEN 'critical'
            WHEN (CURRENT_DATE - NEW.due_date::date) > 3 THEN 'high'
            ELSE 'medium'
          END,
          'OP ' || NEW.order_number || ' atrasada',
          'Produto: ' || NEW.product_name || ' — Atraso de ' || (CURRENT_DATE - NEW.due_date::date) || ' dias',
          'production_order', NEW.id::text, NEW.order_number, 'active'
        );
      END IF;
    END IF;
  END IF;

  -- Auto-resolve alert when OP is completed
  IF NEW.status = 'completed' AND (OLD.status IS DISTINCT FROM NEW.status) THEN
    UPDATE public.industrial_alerts
    SET status = 'resolved', resolved_at = now()
    WHERE entity_id = NEW.id::text AND status = 'active';
  END IF;

  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS trg_production_delay_alert ON public.production_orders;
CREATE TRIGGER trg_production_delay_alert
  AFTER UPDATE ON public.production_orders
  FOR EACH ROW
  EXECUTE FUNCTION public.check_production_delay_alert();

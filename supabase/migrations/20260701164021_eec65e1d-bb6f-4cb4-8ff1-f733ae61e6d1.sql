CREATE OR REPLACE FUNCTION public.emit_production_order_event()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.production_events (event_type, source, entity_type, entity_id, entity_name, operator, sector, payload, company_id)
  VALUES (
    CASE WHEN TG_OP='INSERT' THEN 'op_created'
         WHEN TG_OP='UPDATE' AND NEW.status <> OLD.status THEN 'op_status_changed'
         ELSE 'op_updated' END,
    'trigger', 'production_order', NEW.id::text, NEW.order_number, NEW.operator, NEW.sector,
    jsonb_build_object('product_name', NEW.product_name, 'quantity', NEW.quantity, 'priority', NEW.priority, 'status', NEW.status, 'due_date', NEW.due_date),
    NEW.company_id
  );
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.trg_alert_low_margin_order()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.estimated_margin_pct IS NOT NULL
     AND NEW.estimated_margin_pct < 8
     AND (TG_OP = 'INSERT' OR OLD.estimated_margin_pct IS DISTINCT FROM NEW.estimated_margin_pct)
  THEN
    INSERT INTO public.commercial_alerts (
      alert_type, order_id, client_id, sales_rep_id, title, description, severity, status, company_id
    ) VALUES (
      'low_margin',
      NEW.id,
      NEW.client_id,
      NEW.sales_rep_id,
      'Pedido ' || COALESCE(NEW.number, '') || ' com margem crítica',
      'Margem estimada de ' || ROUND(NEW.estimated_margin_pct::numeric, 2) || '% (limite: 8%). Cliente: ' || COALESCE(NEW.client_name, '-') || '. Receita: R$ ' || ROUND(NEW.total::numeric, 2) || '.',
      CASE WHEN NEW.estimated_margin_pct < 0 THEN 'critical' ELSE 'high' END,
      'open',
      NEW.company_id
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS orders_low_margin_alert ON public.orders;
CREATE TRIGGER orders_low_margin_alert
AFTER INSERT OR UPDATE OF estimated_margin_pct ON public.orders
FOR EACH ROW EXECUTE FUNCTION public.trg_alert_low_margin_order();

-- 1) Immutable guard: block UPDATE/DELETE on system_audit_logs
CREATE OR REPLACE FUNCTION public.audit_logs_immutable_guard()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RAISE EXCEPTION 'system_audit_logs é imutável — registros não podem ser alterados ou excluídos';
END;
$$;

DROP TRIGGER IF EXISTS trg_audit_logs_no_update ON public.system_audit_logs;
DROP TRIGGER IF EXISTS trg_audit_logs_no_delete ON public.system_audit_logs;

CREATE TRIGGER trg_audit_logs_no_update
BEFORE UPDATE ON public.system_audit_logs
FOR EACH ROW EXECUTE FUNCTION public.audit_logs_immutable_guard();

CREATE TRIGGER trg_audit_logs_no_delete
BEFORE DELETE ON public.system_audit_logs
FOR EACH ROW EXECUTE FUNCTION public.audit_logs_immutable_guard();

-- 2) Product price / cost audit
CREATE OR REPLACE FUNCTION public.audit_product_price_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_company uuid;
BEGIN
  IF (NEW.sale_price IS DISTINCT FROM OLD.sale_price)
     OR (NEW.cost_price IS DISTINCT FROM OLD.cost_price) THEN
    v_company := COALESCE(NEW.company_id, OLD.company_id, get_user_company_id(auth.uid()));
    IF v_company IS NULL THEN
      RETURN NEW;
    END IF;
    INSERT INTO public.system_audit_logs (
      user_id, company_id, action, module, entity_name, entity_id, old_data, new_data
    ) VALUES (
      auth.uid(),
      v_company,
      'price_change',
      'products',
      NEW.name,
      NEW.id,
      jsonb_build_object('sale_price', OLD.sale_price, 'cost_price', OLD.cost_price),
      jsonb_build_object('sale_price', NEW.sale_price, 'cost_price', NEW.cost_price)
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_audit_product_price ON public.products;
CREATE TRIGGER trg_audit_product_price
AFTER UPDATE OF sale_price, cost_price ON public.products
FOR EACH ROW EXECUTE FUNCTION public.audit_product_price_changes();

-- 3) Order cancellation audit
CREATE OR REPLACE FUNCTION public.audit_order_cancellation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_company uuid;
BEGIN
  IF NEW.status = 'cancelled' AND OLD.status IS DISTINCT FROM NEW.status THEN
    v_company := COALESCE(NEW.company_id, OLD.company_id, get_user_company_id(auth.uid()));
    IF v_company IS NULL THEN
      RETURN NEW;
    END IF;
    INSERT INTO public.system_audit_logs (
      user_id, company_id, action, module, entity_name, entity_id, old_data, new_data
    ) VALUES (
      auth.uid(),
      v_company,
      'order_cancelled',
      'orders',
      COALESCE(NEW.order_number, NEW.id::text),
      NEW.id,
      jsonb_build_object('status', OLD.status, 'total', OLD.total),
      jsonb_build_object('status', NEW.status, 'total', NEW.total)
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_audit_order_cancellation ON public.orders;
CREATE TRIGGER trg_audit_order_cancellation
AFTER UPDATE OF status ON public.orders
FOR EACH ROW EXECUTE FUNCTION public.audit_order_cancellation();

-- 4) Stock adjustment audit
CREATE OR REPLACE FUNCTION public.audit_stock_adjustment()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.type = 'adjustment' AND NEW.company_id IS NOT NULL THEN
    INSERT INTO public.system_audit_logs (
      user_id, company_id, action, module, entity_name, entity_id, new_data
    ) VALUES (
      auth.uid(),
      NEW.company_id,
      'stock_adjustment',
      'stock',
      NEW.product_name,
      NEW.product_id,
      jsonb_build_object(
        'product_code', NEW.product_code,
        'direction', NEW.direction,
        'quantity', NEW.quantity,
        'batch', NEW.batch,
        'reference', NEW.reference,
        'notes', NEW.notes,
        'branch_id', NEW.branch_id,
        'canal_operacional', NEW.canal_operacional
      )
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_audit_stock_adjustment ON public.stock_movements;
CREATE TRIGGER trg_audit_stock_adjustment
AFTER INSERT ON public.stock_movements
FOR EACH ROW EXECUTE FUNCTION public.audit_stock_adjustment();
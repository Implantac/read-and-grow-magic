CREATE OR REPLACE FUNCTION public.generate_stock_from_production()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_doc_number text;
  v_qty numeric;
BEGIN
  IF NEW.status = 'completed' AND (OLD.status IS DISTINCT FROM NEW.status) THEN
    v_qty := COALESCE(NEW.produced_quantity, 0) - COALESCE(NEW.rejected_quantity, 0);
    IF v_qty <= 0 THEN
      RAISE EXCEPTION 'Informe a quantidade produzida aprovada antes de concluir a OP %', NEW.order_number;
    END IF;
    IF NEW.company_id IS NULL OR NEW.branch_id IS NULL THEN
      RAISE EXCEPTION 'A OP % precisa estar vinculada a empresa e unidade para dar entrada no estoque', NEW.order_number;
    END IF;
    v_doc_number := 'PROD-' || NEW.order_number;
    PERFORM pg_advisory_xact_lock(hashtext(NEW.company_id::text || v_doc_number));
    IF EXISTS (SELECT 1 FROM public.stock_movements
               WHERE company_id = NEW.company_id AND document_number = v_doc_number AND direction = 'in') THEN
      RETURN NEW;
    END IF;
    INSERT INTO public.stock_movements (
      document_number, product_id, product_code, product_name, type, direction, quantity,
      operator, source, reference, notes, company_id, branch_id
    ) VALUES (
      v_doc_number, NEW.product_id, NEW.product_code, NEW.product_name, 'production', 'in', v_qty,
      COALESCE(NEW.operator, 'Sistema'), 'erp', NEW.order_number,
      'Entrada automática - Produção concluída OP ' || NEW.order_number, NEW.company_id, NEW.branch_id
    );
  END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.generate_stock_from_production() FROM PUBLIC, anon, authenticated;
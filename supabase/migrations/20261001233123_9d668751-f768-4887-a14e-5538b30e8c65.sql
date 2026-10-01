GRANT SELECT, INSERT, UPDATE, DELETE ON public.production_bom TO authenticated;
GRANT ALL ON public.production_bom TO service_role;
CREATE UNIQUE INDEX IF NOT EXISTS uq_production_bom_component ON public.production_bom(company_id, product_id, component_id);

CREATE OR REPLACE FUNCTION public.generate_stock_from_production()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_doc text; v_qty numeric; v_produced numeric; r record;
BEGIN
  IF NEW.status = 'completed' AND (OLD.status IS DISTINCT FROM NEW.status) THEN
    v_produced := COALESCE(NEW.produced_quantity, 0);
    v_qty := v_produced - COALESCE(NEW.rejected_quantity, 0);
    IF v_qty <= 0 THEN
      RAISE EXCEPTION 'Informe a quantidade produzida aprovada antes de concluir a OP %', NEW.order_number;
    END IF;
    IF NEW.company_id IS NULL OR NEW.branch_id IS NULL THEN
      RAISE EXCEPTION 'A OP % precisa estar vinculada a empresa e unidade para movimentar o estoque', NEW.order_number;
    END IF;
    v_doc := 'PROD-' || NEW.order_number;
    PERFORM pg_advisory_xact_lock(hashtext(NEW.company_id::text || v_doc));
    IF EXISTS (SELECT 1 FROM public.stock_movements WHERE company_id = NEW.company_id AND document_number = v_doc) THEN
      RETURN NEW;
    END IF;

    -- Consumo de matéria-prima pela estrutura do produto (sobre o total produzido, incluindo refugo)
    FOR r IN
      SELECT b.component_id, b.quantity, COALESCE(b.waste_percentage, 0) AS waste, p.code, p.name
      FROM public.production_bom b JOIN public.products p ON p.id = b.component_id
      WHERE b.company_id = NEW.company_id AND b.product_id = NEW.product_id AND b.quantity > 0
    LOOP
      INSERT INTO public.stock_movements (document_number, product_id, product_code, product_name, type, direction, quantity,
        operator, source, reference, notes, company_id, branch_id)
      VALUES (v_doc, r.component_id, r.code, r.name, 'production_consumption', 'out',
        round(r.quantity * v_produced * (1 + r.waste / 100.0), 4),
        COALESCE(NEW.operator, 'Sistema'), 'erp', NEW.order_number,
        'Consumo automático - OP ' || NEW.order_number, NEW.company_id, NEW.branch_id);
    END LOOP;

    INSERT INTO public.stock_movements (document_number, product_id, product_code, product_name, type, direction, quantity,
      operator, source, reference, notes, company_id, branch_id)
    VALUES (v_doc, NEW.product_id, NEW.product_code, NEW.product_name, 'production', 'in', v_qty,
      COALESCE(NEW.operator, 'Sistema'), 'erp', NEW.order_number,
      'Entrada automática - Produção concluída OP ' || NEW.order_number, NEW.company_id, NEW.branch_id);
  END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.generate_stock_from_production() FROM PUBLIC, anon, authenticated;
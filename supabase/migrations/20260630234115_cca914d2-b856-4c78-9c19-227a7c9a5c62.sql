
-- 1) Tabela de itens
CREATE TABLE IF NOT EXISTS public.wms_return_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL,
  return_id UUID NOT NULL REFERENCES public.wms_returns(id) ON DELETE CASCADE,
  product_id UUID,
  product_sku TEXT,
  product_name TEXT,
  lot_id UUID,
  location_id UUID,
  quantity NUMERIC(14,3) NOT NULL DEFAULT 0,
  unit TEXT DEFAULT 'UN',
  disposition TEXT CHECK (disposition IN ('restock','quarantine','scrap','return_supplier','rework')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected','processed')),
  inspection_notes TEXT,
  inspected_by UUID,
  inspected_at TIMESTAMPTZ,
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_wms_return_items_return ON public.wms_return_items(return_id);
CREATE INDEX IF NOT EXISTS idx_wms_return_items_company ON public.wms_return_items(company_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.wms_return_items TO authenticated;
GRANT ALL ON public.wms_return_items TO service_role;

ALTER TABLE public.wms_return_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "wms_return_items tenant read"
ON public.wms_return_items FOR SELECT TO authenticated
USING (company_id = public.get_user_company_id(auth.uid()));

CREATE POLICY "wms_return_items tenant write"
ON public.wms_return_items FOR INSERT TO authenticated
WITH CHECK (company_id = public.get_user_company_id(auth.uid()));

CREATE POLICY "wms_return_items tenant update"
ON public.wms_return_items FOR UPDATE TO authenticated
USING (company_id = public.get_user_company_id(auth.uid()))
WITH CHECK (company_id = public.get_user_company_id(auth.uid()));

CREATE POLICY "wms_return_items tenant delete"
ON public.wms_return_items FOR DELETE TO authenticated
USING (company_id = public.get_user_company_id(auth.uid()));

CREATE TRIGGER trg_wms_return_items_updated
BEFORE UPDATE ON public.wms_return_items
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2) RPC de disposição atômica
CREATE OR REPLACE FUNCTION public.wms_dispose_return_item(
  _item_id UUID,
  _disposition TEXT,
  _notes TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user UUID := auth.uid();
  v_company UUID := public.get_user_company_id(auth.uid());
  v_item public.wms_return_items%ROWTYPE;
  v_status TEXT;
BEGIN
  IF v_user IS NULL OR v_company IS NULL THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  IF _disposition NOT IN ('restock','quarantine','scrap','return_supplier','rework') THEN
    RAISE EXCEPTION 'Invalid disposition: %', _disposition;
  END IF;

  SELECT * INTO v_item FROM public.wms_return_items
   WHERE id = _item_id AND company_id = v_company
   FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Return item not found';
  END IF;

  IF v_item.status = 'processed' THEN
    RAISE EXCEPTION 'Item already processed';
  END IF;

  -- Efeito por disposição
  IF _disposition = 'restock' AND v_item.location_id IS NOT NULL AND v_item.product_id IS NOT NULL THEN
    UPDATE public.wms_inventory_items
       SET quantity = COALESCE(quantity,0) + v_item.quantity,
           updated_at = now()
     WHERE company_id = v_company
       AND location_id = v_item.location_id
       AND product_id  = v_item.product_id;
    v_status := 'approved';
  ELSIF _disposition = 'quarantine' THEN
    INSERT INTO public.wms_quality_checks (
      company_id, lot_id, product_id, quantity, status, reason, created_by
    ) VALUES (
      v_company, v_item.lot_id, v_item.product_id, v_item.quantity,
      'pending', COALESCE(_notes,'Devolução em quarentena'), v_user
    );
    v_status := 'approved';
  ELSIF _disposition IN ('scrap','return_supplier','rework') THEN
    v_status := CASE WHEN _disposition = 'scrap' THEN 'rejected' ELSE 'approved' END;
  END IF;

  UPDATE public.wms_return_items
     SET disposition = _disposition,
         status = 'processed',
         inspection_notes = COALESCE(_notes, inspection_notes),
         inspected_by = v_user,
         inspected_at = COALESCE(inspected_at, now()),
         processed_at = now(),
         updated_at = now()
   WHERE id = _item_id;

  -- Atualiza contadores no header
  UPDATE public.wms_returns r
     SET inspected_items = (SELECT count(*) FROM public.wms_return_items WHERE return_id = r.id AND status = 'processed'),
         approved_items  = (SELECT count(*) FROM public.wms_return_items WHERE return_id = r.id AND status IN ('processed','approved') AND disposition <> 'scrap'),
         rejected_items  = (SELECT count(*) FROM public.wms_return_items WHERE return_id = r.id AND (status = 'rejected' OR disposition = 'scrap')),
         updated_at = now()
   WHERE r.id = v_item.return_id AND r.company_id = v_company;

  -- Evento
  BEGIN
    INSERT INTO public.wms_events (company_id, event_type, entity_type, entity_id, payload)
    VALUES (v_company, 'return_item_disposed', 'wms_return_item', _item_id,
            jsonb_build_object('disposition', _disposition, 'quantity', v_item.quantity));
  EXCEPTION WHEN OTHERS THEN NULL;
  END;

  RETURN jsonb_build_object('ok', true, 'item_id', _item_id, 'disposition', _disposition, 'status', v_status);
END;
$$;

REVOKE EXECUTE ON FUNCTION public.wms_dispose_return_item(UUID, TEXT, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.wms_dispose_return_item(UUID, TEXT, TEXT) TO authenticated;

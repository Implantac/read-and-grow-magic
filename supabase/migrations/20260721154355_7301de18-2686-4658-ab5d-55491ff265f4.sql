-- 1) Extend receiving orders with branch/channel/warehouse for ledger routing
ALTER TABLE public.wms_receiving_orders
  ADD COLUMN IF NOT EXISTS branch_id uuid REFERENCES public.branches(id),
  ADD COLUMN IF NOT EXISTS canal_operacional public.canal_operacional,
  ADD COLUMN IF NOT EXISTS warehouse_id uuid;

CREATE INDEX IF NOT EXISTS idx_wms_receiving_orders_branch ON public.wms_receiving_orders(branch_id);

-- 2) Add product_id to conference items so ledger entries have a strong reference
ALTER TABLE public.wms_conference_items
  ADD COLUMN IF NOT EXISTS product_id uuid REFERENCES public.products(id);

CREATE INDEX IF NOT EXISTS idx_wms_conference_items_product ON public.wms_conference_items(product_id);

-- 3) RPC: finalize a receiving conference → generate immutable stock_movements entries
CREATE OR REPLACE FUNCTION public.finalize_receiving_conference(_conference_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_conf RECORD;
  v_recv RECORD;
  v_company uuid;
  v_missing int;
  v_inserted int := 0;
  v_item RECORD;
BEGIN
  v_company := get_user_company_id(auth.uid());
  IF v_company IS NULL THEN
    RAISE EXCEPTION 'Usuário sem empresa vinculada';
  END IF;

  SELECT * INTO v_conf FROM public.wms_conference_records
  WHERE id = _conference_id AND company_id = v_company;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Conferência % não encontrada para esta empresa', _conference_id;
  END IF;

  IF v_conf.reference_type <> 'receiving' THEN
    RAISE EXCEPTION 'Conferência não é de recebimento (tipo: %)', v_conf.reference_type;
  END IF;

  IF v_conf.status = 'completed' THEN
    RAISE EXCEPTION 'Conferência % já foi finalizada', v_conf.conference_number;
  END IF;

  -- Block if any checked item is missing product_id (ledger orphan protection)
  SELECT COUNT(*) INTO v_missing
  FROM public.wms_conference_items
  WHERE conference_id = _conference_id
    AND checked_qty > 0
    AND product_id IS NULL;

  IF v_missing > 0 THEN
    RAISE EXCEPTION 'Existem % item(ns) conferido(s) sem produto vinculado. Vincule antes de finalizar.', v_missing;
  END IF;

  -- Load parent receiving order (may be null if reference_id not set)
  IF v_conf.reference_id IS NOT NULL THEN
    SELECT * INTO v_recv FROM public.wms_receiving_orders
    WHERE id = v_conf.reference_id AND company_id = v_company;
  END IF;

  -- Enable session bypass for the ledger insert path (uses immutable guard)
  PERFORM set_config('app.stock_ledger_bypass', 'receiving_finalize', true);

  FOR v_item IN
    SELECT ci.*
    FROM public.wms_conference_items ci
    WHERE ci.conference_id = _conference_id
      AND ci.checked_qty > 0
      AND ci.product_id IS NOT NULL
  LOOP
    INSERT INTO public.stock_movements (
      document_number, product_id, product_code, product_name,
      type, direction, quantity, unit_cost, total_cost,
      batch, reference, notes, operator, source,
      company_id, branch_id, canal_operacional
    ) VALUES (
      COALESCE(v_conf.conference_number, ''),
      v_item.product_id,
      v_item.product_code,
      v_item.product_name,
      'receiving',
      'in',
      v_item.checked_qty,
      0, 0,
      v_item.lot_number,
      COALESCE(v_recv.order_number, v_conf.reference_number),
      'Recebimento finalizado via conferência ' || v_conf.conference_number,
      COALESCE(v_conf.operator, ''),
      'wms_receiving',
      v_company,
      v_recv.branch_id,
      v_recv.canal_operacional
    );
    v_inserted := v_inserted + 1;
  END LOOP;

  PERFORM set_config('app.stock_ledger_bypass', '', true);

  UPDATE public.wms_conference_records
     SET status = 'completed', completed_at = now(), updated_at = now()
   WHERE id = _conference_id;

  IF v_recv.id IS NOT NULL THEN
    UPDATE public.wms_receiving_orders
       SET status = 'completed', received_date = now()
     WHERE id = v_recv.id;
  END IF;

  RETURN jsonb_build_object(
    'conference_id', _conference_id,
    'items_ledgered', v_inserted,
    'receiving_order_id', v_recv.id
  );
END;
$$;

REVOKE ALL ON FUNCTION public.finalize_receiving_conference(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.finalize_receiving_conference(uuid) TO authenticated;
ALTER TABLE public.stock_balances ADD COLUMN IF NOT EXISTS in_transit_qty numeric NOT NULL DEFAULT 0;

CREATE OR REPLACE FUNCTION public.adjust_stock(
  p_branch_id uuid,
  p_product_id uuid,
  p_quantity numeric DEFAULT 0,
  p_reserved numeric DEFAULT 0,
  p_transit_in numeric DEFAULT 0
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_company_id uuid;
  v_code text;
  v_name text;
  v_canal canal_operacional;
BEGIN
  IF p_branch_id IS NULL OR p_product_id IS NULL THEN
    RAISE EXCEPTION 'adjust_stock: filial e produto são obrigatórios';
  END IF;

  SELECT b.company_id, coalesce(b.canal_padrao, 'ATACADO_INDUSTRIA'::canal_operacional)
    INTO v_company_id, v_canal
  FROM public.branches b WHERE b.id = p_branch_id;

  IF v_company_id IS NULL THEN
    RAISE EXCEPTION 'adjust_stock: filial % não encontrada', p_branch_id;
  END IF;

  IF v_company_id <> get_user_company_id(auth.uid()) AND NOT check_hierarchy_access(auth.uid(), v_company_id) THEN
    RAISE EXCEPTION 'adjust_stock: acesso negado à filial %', p_branch_id;
  END IF;

  SELECT p.code, p.name INTO v_code, v_name FROM public.products p WHERE p.id = p_product_id;

  -- Garante a existência da linha de saldo (sem alterar quantidade física)
  INSERT INTO public.stock_balances (company_id, branch_id, canal_operacional, product_id, product_code, product_name, quantity, unit)
  SELECT v_company_id, p_branch_id, v_canal, p_product_id, coalesce(v_code,''), coalesce(v_name,''), 0, 'UN'
  WHERE NOT EXISTS (
    SELECT 1 FROM public.stock_balances sb
     WHERE sb.company_id = v_company_id AND sb.branch_id = p_branch_id
       AND sb.product_id = p_product_id AND sb.lot_id IS NULL
  );

  -- Movimento físico: sempre pelo ledger (stock_movements)
  IF coalesce(p_quantity,0) <> 0 THEN
    INSERT INTO public.stock_movements (
      company_id, branch_id, canal_operacional, product_id, product_code, product_name,
      type, direction, quantity, document_number, operator, source
    ) VALUES (
      v_company_id, p_branch_id, v_canal, p_product_id, coalesce(v_code,''), coalesce(v_name,''),
      'transfer', CASE WHEN p_quantity > 0 THEN 'in' ELSE 'out' END, abs(p_quantity),
      'ADJ-' || to_char(now(), 'YYYYMMDDHH24MISS'), coalesce(auth.uid()::text, 'system'), 'adjust_stock'
    );
  END IF;

  -- Reserva e trânsito são holds lógicos (permitidos pelo guard)
  IF coalesce(p_reserved,0) <> 0 OR coalesce(p_transit_in,0) <> 0 THEN
    UPDATE public.stock_balances sb
       SET reserved_qty = greatest(0, coalesce(sb.reserved_qty,0) + coalesce(p_reserved,0)),
           in_transit_qty = greatest(0, coalesce(sb.in_transit_qty,0) + coalesce(p_transit_in,0)),
           updated_at = now()
     WHERE sb.company_id = v_company_id AND sb.branch_id = p_branch_id
       AND sb.product_id = p_product_id AND sb.lot_id IS NULL;
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.adjust_stock(uuid, uuid, numeric, numeric, numeric) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.adjust_stock(uuid, uuid, numeric, numeric, numeric) TO authenticated;
GRANT EXECUTE ON FUNCTION public.adjust_stock(uuid, uuid, numeric, numeric, numeric) TO service_role;

-- Demanda média diária por produto na filial (últimos N dias)
CREATE OR REPLACE FUNCTION public.get_branch_daily_demand(p_branch_id uuid, p_days integer DEFAULT 30)
RETURNS TABLE (product_id uuid, daily_demand numeric)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT m.product_id, (sum(m.quantity) / greatest(p_days, 1))::numeric AS daily_demand
    FROM public.stock_movements m
   WHERE m.branch_id = p_branch_id
     AND lower(m.direction) = 'out'
     AND m.type IN ('sale', 'transfer', 'loss')
     AND m.created_at >= now() - make_interval(days => greatest(p_days, 1))
     AND (m.company_id = get_user_company_id(auth.uid()) OR check_hierarchy_access(auth.uid(), m.company_id))
   GROUP BY m.product_id;
$$;

REVOKE ALL ON FUNCTION public.get_branch_daily_demand(uuid, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_branch_daily_demand(uuid, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_branch_daily_demand(uuid, integer) TO service_role;
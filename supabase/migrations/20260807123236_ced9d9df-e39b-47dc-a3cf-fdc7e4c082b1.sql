-- 1. Função de Sincronização de Saldo via Movimento
CREATE OR REPLACE FUNCTION public.sync_stock_balance_from_movement()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_qty_change NUMERIC;
BEGIN
    -- Determina a mudança na quantidade baseada na direção do movimento
    IF NEW.direction = 'in' THEN
        v_qty_change := NEW.quantity;
    ELSIF NEW.direction = 'out' THEN
        v_qty_change := -NEW.quantity;
    ELSE
        v_qty_change := 0;
    END IF;

    -- Upsert no saldo
    INSERT INTO public.stock_balances (
        company_id,
        branch_id,
        warehouse_id,
        product_id,
        location_id,
        lot_id,
        quantity,
        updated_at
    )
    VALUES (
        NEW.company_id,
        NEW.branch_id,
        NEW.warehouse_id,
        NEW.product_id,
        NEW.location_id,
        NEW.lot_id,
        v_qty_change,
        now()
    )
    ON CONFLICT (product_id, warehouse_id, COALESCE(location_id, '00000000-0000-0000-0000-000000000000'), COALESCE(lot_id, '00000000-0000-0000-0000-000000000000')) 
    DO UPDATE SET 
        quantity = stock_balances.quantity + v_qty_change,
        updated_at = now();

    RETURN NEW;
END;
$$;

-- Trigger para automatizar a sincronização
DROP TRIGGER IF EXISTS trg_sync_stock_balance ON public.stock_movements;
CREATE TRIGGER trg_sync_stock_balance
AFTER INSERT ON public.stock_movements
FOR EACH ROW
EXECUTE FUNCTION public.sync_stock_balance_from_movement();

-- 2. Hardening RLS em Stock Balances
ALTER TABLE public.stock_balances ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "stock_balances_isolation" ON public.stock_balances;
CREATE POLICY "stock_balances_isolation" ON public.stock_balances
    FOR ALL
    TO authenticated
    USING (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()))
    WITH CHECK (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

-- 3. Função de Auditoria de Kardex
CREATE OR REPLACE FUNCTION public.audit_stock_integrity(_company_id UUID)
RETURNS TABLE (
    product_id UUID,
    balance_qty NUMERIC,
    movement_sum NUMERIC,
    divergence NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    WITH movement_agg AS (
        SELECT 
            m.product_id,
            SUM(CASE WHEN direction = 'in' THEN quantity ELSE -quantity END) as total_mov
        FROM public.stock_movements m
        WHERE m.company_id = _company_id
        GROUP BY m.product_id
    )
    SELECT 
        sb.product_id,
        SUM(sb.quantity) as balance_qty,
        COALESCE(ma.total_mov, 0) as movement_sum,
        SUM(sb.quantity) - COALESCE(ma.total_mov, 0) as divergence
    FROM public.stock_balances sb
    LEFT JOIN movement_agg ma ON sb.product_id = ma.product_id
    WHERE sb.company_id = _company_id
    GROUP BY sb.product_id, ma.total_mov
    HAVING SUM(sb.quantity) - COALESCE(ma.total_mov, 0) != 0;
END;
$$;

-- 4. Permissões
GRANT EXECUTE ON FUNCTION public.audit_stock_integrity(UUID) TO authenticated;
GRANT ALL ON public.stock_balances TO service_role;
GRANT ALL ON public.stock_movements TO service_role;
GRANT SELECT ON public.stock_balances TO authenticated;
GRANT INSERT, UPDATE ON public.stock_balances TO authenticated;

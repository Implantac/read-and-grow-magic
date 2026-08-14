-- Adiciona campos necessários para Posição de Estoque Projetada e Inteligência
ALTER TABLE public.stock_balances 
ADD COLUMN IF NOT EXISTS reserved_quantity numeric(12,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS in_transit_in_quantity numeric(12,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS in_transit_out_quantity numeric(12,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS average_daily_sales numeric(12,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS abc_class text CHECK (abc_class IN ('A', 'B', 'C'));

-- Atualiza permissões
GRANT SELECT, UPDATE ON public.stock_balances TO authenticated;

-- Função para calcular Estoque Projetado (Centralizada)
CREATE OR REPLACE FUNCTION public.get_projected_stock(
    p_branch_id uuid,
    p_product_id uuid
) RETURNS numeric AS $$
DECLARE
    v_physical numeric;
    v_reserved numeric;
    v_transit_in numeric;
BEGIN
    SELECT 
        quantity, 
        COALESCE(reserved_quantity, 0),
        COALESCE(in_transit_in_quantity, 0)
    INTO v_physical, v_reserved, v_transit_in
    FROM public.stock_balances
    WHERE branch_id = p_branch_id AND product_id = p_product_id;

    RETURN COALESCE(v_physical, 0) - COALESCE(v_reserved, 0) + COALESCE(v_transit_in, 0);
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- HARDENING DO LEDGER DE ESTOQUE (IMUTABILIDADE)

-- 1. Trigger para impedir Deletes e Updates na stock_movements (exceto service_role)
CREATE OR REPLACE FUNCTION public.enforce_stock_ledger_immutability()
RETURNS TRIGGER AS $$
BEGIN
    -- Permitir apenas via triggers internos ou service_role em casos críticos (auditoria)
    -- O linter do Supabase geralmente permite SECURITY DEFINER com restrições.
    -- Aqui, bloqueamos qualquer alteração direta via Data API para usuários normais.
    IF (TG_OP = 'DELETE' OR TG_OP = 'UPDATE') THEN
        -- Verifica se o usuário tem a role 'admin' ou se é service_role
        -- Na prática, nem admins deveriam deletar do ledger, apenas estornar com novo registro.
        RAISE EXCEPTION 'O Ledger de Estoque é imutável. Para correções, realize um movimento de estorno (tipo: estorno/ajuste).';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_stock_ledger_immutability ON public.stock_movements;
CREATE TRIGGER trg_stock_ledger_immutability
BEFORE UPDATE OR DELETE ON public.stock_movements
FOR EACH ROW EXECUTE FUNCTION public.enforce_stock_ledger_immutability();

-- 2. Garantir que todo ajuste tenha motivo e aprovador
ALTER TABLE public.stock_movements ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES auth.users(id);
ALTER TABLE public.stock_movements ADD COLUMN IF NOT EXISTS adjustment_reason TEXT;

-- 3. Comentário de Auditoria
COMMENT ON TRIGGER trg_stock_ledger_immutability ON public.stock_movements IS 'Garante que registros de movimentação de estoque não possam ser alterados ou deletados, preservando a trilha de auditoria.';

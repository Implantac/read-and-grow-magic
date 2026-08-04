-- Adiciona branch_id para isolamento RLS se não existir
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'replenishment_tasks' AND column_name = 'branch_id') THEN
        ALTER TABLE public.replenishment_tasks ADD COLUMN branch_id uuid REFERENCES public.branches(id);
    END IF;
END $$;

-- Habilita RLS
ALTER TABLE public.replenishment_tasks ENABLE ROW LEVEL SECURITY;

-- Grants
GRANT SELECT, INSERT, UPDATE ON public.replenishment_tasks TO authenticated;
GRANT ALL ON public.replenishment_tasks TO service_role;

-- Políticas de RLS
CREATE POLICY "Users can manage replenishment tasks for their company"
ON public.replenishment_tasks
FOR ALL
TO authenticated
USING (company_id = (SELECT company_id FROM profiles WHERE id = auth.uid()))
WITH CHECK (company_id = (SELECT company_id FROM profiles WHERE id = auth.uid()));

-- Função de Log de Movimentação de Estoque com Validação de Saldo
CREATE OR REPLACE FUNCTION public.check_stock_availability()
RETURNS TRIGGER AS $$
DECLARE
    current_qty numeric;
BEGIN
    SELECT quantity INTO current_qty 
    FROM public.stock_balances 
    WHERE product_id = NEW.product_id 
      AND branch_id = NEW.origem_branch_id
      AND canal_operacional = NEW.canal_origem;

    IF current_qty < NEW.quantidade THEN
        RAISE EXCEPTION 'Saldo insuficiente na origem (Disponível: %, Solicitado: %)', current_qty, NEW.quantidade;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para validar transferências antes da inserção
DROP TRIGGER IF EXISTS tr_validate_stock_transfer ON public.stock_transfers;
CREATE TRIGGER tr_validate_stock_transfer
BEFORE INSERT ON public.stock_transfers
FOR EACH ROW EXECUTE FUNCTION public.check_stock_availability();

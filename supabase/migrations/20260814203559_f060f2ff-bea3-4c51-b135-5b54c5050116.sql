-- Migration P1/P2: Criação e Hardening do Ledger Logístico
-- Byte-for-byte da migração base com adições de Hardening

-- 1. Tabela para Rastreabilidade Imutável (Ledger)
CREATE TABLE IF NOT EXISTS public.supply_chain_ledger (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    movement_id UUID NOT NULL REFERENCES public.supply_chain_movements(id) ON DELETE CASCADE,
    previous_status TEXT,
    new_status TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id),
    metadata JSONB DEFAULT '{}'::jsonb,
    correlation_id UUID,
    causation_id UUID
);

-- 2. Alterar public.supply_chain_movements
ALTER TABLE public.supply_chain_movements
ADD COLUMN IF NOT EXISTS correlation_id UUID,
ADD COLUMN IF NOT EXISTS causation_id UUID;

-- 3. Grant Access
GRANT SELECT, INSERT ON public.supply_chain_ledger TO authenticated;
GRANT ALL ON public.supply_chain_ledger TO service_role;
GRANT SELECT, INSERT, UPDATE ON public.supply_chain_movements TO authenticated;
GRANT ALL ON public.supply_chain_movements TO service_role;

-- 4. Enable RLS
ALTER TABLE public.supply_chain_ledger ENABLE ROW LEVEL SECURITY;

-- 5. Policies
DROP POLICY IF EXISTS "Users can see ledger entries from their company" ON public.supply_chain_ledger;
CREATE POLICY "Users can see ledger entries from their company" ON public.supply_chain_ledger
    FOR SELECT TO authenticated USING (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Users can insert ledger entries for their company" ON public.supply_chain_ledger;
CREATE POLICY "Users can insert ledger entries for their company" ON public.supply_chain_ledger
    FOR INSERT TO authenticated WITH CHECK (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

-- 6. Trigger para registrar mudanças automaticamente
CREATE OR REPLACE FUNCTION public.on_movement_status_change()
RETURNS TRIGGER AS $$
BEGIN
    IF (OLD.status IS DISTINCT FROM NEW.status) THEN
        INSERT INTO public.supply_chain_ledger (
            movement_id, 
            previous_status, 
            new_status, 
            company_id, 
            user_id,
            correlation_id,
            causation_id
        )
        VALUES (
            NEW.id, 
            OLD.status, 
            NEW.status, 
            NEW.company_id, 
            auth.uid(),
            NEW.correlation_id,
            NEW.causation_id
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_movement_status_change ON public.supply_chain_movements;
CREATE TRIGGER tr_movement_status_change
    AFTER UPDATE ON public.supply_chain_movements
    FOR EACH ROW EXECUTE FUNCTION public.on_movement_status_change();

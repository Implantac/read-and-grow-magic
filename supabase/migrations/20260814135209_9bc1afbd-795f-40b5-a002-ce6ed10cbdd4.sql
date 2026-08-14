-- 1. Criar o Enum de status para o workflow
DO $$ BEGIN
    CREATE TYPE public.transfer_workflow_status AS ENUM (
      'SUGERIDA', 'APROVADA', 'RESERVADA', 'SEPARAÇÃO', 
      'CONFERÊNCIA', 'EXPEDIDA', 'EM TRÂNSITO', 'RECEBIDA', 
      'CONFERIDA', 'ENCERRADA'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Tabela de logs do workflow
CREATE TABLE IF NOT EXISTS public.stock_transfer_workflow_logs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    transfer_id uuid REFERENCES public.stock_transfer_orders(id) ON DELETE CASCADE,
    user_id uuid REFERENCES auth.users(id),
    status public.transfer_workflow_status NOT NULL,
    quantity numeric(12,2) DEFAULT 0,
    divergence numeric(12,2) DEFAULT 0,
    notes text,
    created_at timestamptz DEFAULT now()
);

-- 3. Adicionar coluna status na tabela existente
ALTER TABLE public.stock_transfer_orders 
ADD COLUMN IF NOT EXISTS current_status public.transfer_workflow_status DEFAULT 'SUGERIDA';

-- 4. Grants e RLS
GRANT SELECT, INSERT, UPDATE ON public.stock_transfer_workflow_logs TO authenticated;
GRANT ALL ON public.stock_transfer_workflow_logs TO service_role;

ALTER TABLE public.stock_transfer_workflow_logs ENABLE ROW LEVEL SECURITY;

-- Nota: stock_transfer_orders já tem company_id
DO $$ BEGIN
    CREATE POLICY "Users can read workflow logs for their company" ON public.stock_transfer_workflow_logs
        FOR SELECT TO authenticated
        USING (EXISTS (SELECT 1 FROM public.stock_transfer_orders WHERE id = stock_transfer_workflow_logs.transfer_id));
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

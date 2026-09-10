ALTER TYPE public.transfer_workflow_status ADD VALUE IF NOT EXISTS 'REJEITADA';
ALTER TYPE public.transfer_workflow_status ADD VALUE IF NOT EXISTS 'CANCELADA';
ALTER TYPE public.transfer_workflow_status ADD VALUE IF NOT EXISTS 'RECEBIDA PARCIAL';
ALTER TYPE public.transfer_workflow_status ADD VALUE IF NOT EXISTS 'RECEBIDA COM DIVERGÊNCIA';
ALTER TABLE public.stock_transfer_divergences ADD COLUMN IF NOT EXISTS item_id uuid REFERENCES public.stock_transfer_items(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_transfer_divergences_item ON public.stock_transfer_divergences(item_id);
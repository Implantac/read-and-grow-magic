-- Propagar correlation_id para ordens de venda
ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS correlation_id UUID;

-- Grant
GRANT SELECT, UPDATE ON public.orders TO authenticated;
GRANT ALL ON public.orders TO service_role;

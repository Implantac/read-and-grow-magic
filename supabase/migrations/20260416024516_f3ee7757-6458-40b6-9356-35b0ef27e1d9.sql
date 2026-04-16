
ALTER TABLE public.production_orders
ADD COLUMN IF NOT EXISTS sequence_order integer DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_production_orders_sequence ON public.production_orders (sequence_order);

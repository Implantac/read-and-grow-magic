
ALTER TABLE public.stock_transfer_orders 
ADD COLUMN IF NOT EXISTS correlation_id UUID;

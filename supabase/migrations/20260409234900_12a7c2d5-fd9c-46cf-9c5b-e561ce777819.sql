
ALTER TABLE public.clients 
ADD COLUMN IF NOT EXISTS purchase_frequency integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS client_score text DEFAULT 'medium';

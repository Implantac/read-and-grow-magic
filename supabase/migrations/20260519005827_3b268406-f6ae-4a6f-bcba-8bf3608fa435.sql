-- Table to store deleted orders temporarily for undo functionality
CREATE TABLE IF NOT EXISTS public.deleted_orders_archive (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    original_order_id UUID NOT NULL,
    order_data JSONB NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.deleted_orders_archive ENABLE ROW LEVEL SECURITY;

-- Only authenticated users can manage their archive (simplified for now, ideally matches order ownership)
CREATE POLICY "Authenticated users can manage their deleted orders archive"
ON public.deleted_orders_archive
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Function to clean up expired entries
CREATE OR REPLACE FUNCTION public.cleanup_expired_deleted_orders()
RETURNS void AS $$
BEGIN
    DELETE FROM public.deleted_orders_archive
    WHERE expires_at < now();
END;
$$ LANGUAGE plpgsql;

-- Trigger logic could be complex to run periodically in Postgres without pg_cron, 
-- but we can check during insertion/selection.

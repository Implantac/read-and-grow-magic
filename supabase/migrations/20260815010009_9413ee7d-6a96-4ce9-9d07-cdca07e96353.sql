
ALTER TABLE public.nfe 
ADD COLUMN IF NOT EXISTS correlation_id UUID;

GRANT SELECT, UPDATE, INSERT ON public.nfe TO authenticated;
GRANT ALL ON public.nfe TO service_role;

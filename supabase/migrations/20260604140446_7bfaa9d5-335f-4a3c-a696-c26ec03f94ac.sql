-- Add segment and industry metadata to companies
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS segment TEXT DEFAULT 'general';
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS sub_segment TEXT;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS tax_regime TEXT;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS operation_types JSONB DEFAULT '[]'::jsonb;

COMMENT ON COLUMN public.companies.segment IS 'Main business vertical (textile, pharma, distribution, etc.)';
COMMENT ON COLUMN public.companies.operation_types IS 'Automatically generated CFOP/operation rules for this company';

-- Update RLS or permissions if needed (assuming existing grants are sufficient as this is public schema)
GRANT SELECT, INSERT, UPDATE ON public.companies TO authenticated;
GRANT ALL ON public.companies TO service_role;

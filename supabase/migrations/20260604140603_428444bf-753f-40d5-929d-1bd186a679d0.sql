-- Update tax_rules to support reform transition
ALTER TABLE public.tax_rules ADD COLUMN IF NOT EXISTS tax_framework TEXT DEFAULT 'current' CHECK (tax_framework IN ('current', 'reform_ibs_cbs', 'hybrid'));
ALTER TABLE public.tax_rules ADD COLUMN IF NOT EXISTS ibs_rate NUMERIC DEFAULT 0;
ALTER TABLE public.tax_rules ADD COLUMN IF NOT EXISTS cbs_rate NUMERIC DEFAULT 0;
ALTER TABLE public.tax_rules ADD COLUMN IF NOT EXISTS is_is_rate NUMERIC DEFAULT 0; -- Imposto Seletivo

COMMENT ON COLUMN public.tax_rules.tax_framework IS 'current: Regra Atual, reform_ibs_cbs: Nova Regra IBS/CBS, hybrid: Ambas concomitantes';

-- Ensure Grant matches current table
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tax_rules TO authenticated;
GRANT ALL ON public.tax_rules TO service_role;

-- Adicionar campos de Reforma Tributária às Regras Fiscais
ALTER TABLE public.fiscal_tax_rules ADD COLUMN IF NOT EXISTS cbs_rate NUMERIC DEFAULT 0;
ALTER TABLE public.fiscal_tax_rules ADD COLUMN IF NOT EXISTS ibs_rate NUMERIC DEFAULT 0;
ALTER TABLE public.fiscal_tax_rules ADD COLUMN IF NOT EXISTS is_hybrid_regime BOOLEAN DEFAULT true;

-- Adicionar campos de impostos da Reforma aos itens da NF-e
ALTER TABLE public.nfe_items ADD COLUMN IF NOT EXISTS cbs_value NUMERIC DEFAULT 0;
ALTER TABLE public.nfe_items ADD COLUMN IF NOT EXISTS ibs_value NUMERIC DEFAULT 0;

-- Adicionar totais da Reforma à NF-e
ALTER TABLE public.nfe ADD COLUMN IF NOT EXISTS total_cbs NUMERIC DEFAULT 0;
ALTER TABLE public.nfe ADD COLUMN IF NOT EXISTS total_ibs NUMERIC DEFAULT 0;
ALTER TABLE public.nfe ADD COLUMN IF NOT EXISTS tax_regime_type TEXT DEFAULT 'hybrid'; -- 'current', 'hybrid', 'reformed'

-- Comentários para documentação
COMMENT ON COLUMN public.nfe.tax_regime_type IS 'Tipo de regime: current (atual), hybrid (IBS/CBS + ICMS/IPI gradual), reformed (IBS/CBS total)';

-- Garantir GRANTs
GRANT SELECT, INSERT, UPDATE ON public.nfe_items TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.nfe TO authenticated;

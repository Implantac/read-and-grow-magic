-- Adicionar segmentação à tabela de empresas
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS segment TEXT DEFAULT 'general';
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS enterprise_group_id UUID REFERENCES public.enterprise_groups(id);
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS parent_company_id UUID REFERENCES public.companies(id);
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS tax_regime TEXT DEFAULT 'simples_nacional';
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS company_size TEXT DEFAULT 'me';

-- Comentários para documentação e IA
COMMENT ON COLUMN public.companies.segment IS 'Segmento de atuação: textile, food_factory, pharma, distribution, etc.';
COMMENT ON COLUMN public.companies.tax_regime IS 'Regime tributário: simples_nacional, lucro_presumido, lucro_real.';

-- Garantir permissões
GRANT SELECT, UPDATE ON public.companies TO authenticated;
GRANT ALL ON public.companies TO service_role;

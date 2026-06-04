-- Melhoria nas Regras Fiscais
ALTER TABLE public.fiscal_tax_rules ADD COLUMN IF NOT EXISTS ncm TEXT;
ALTER TABLE public.fiscal_tax_rules ADD COLUMN IF NOT EXISTS regime_tributario_destino TEXT; -- simples, normal

-- Ampliação dos itens da NF-e para suportar impostos calculados pelo motor
ALTER TABLE public.nfe_items ADD COLUMN IF NOT EXISTS icms_base NUMERIC DEFAULT 0;
ALTER TABLE public.nfe_items ADD COLUMN IF NOT EXISTS icms_value NUMERIC DEFAULT 0;
ALTER TABLE public.nfe_items ADD COLUMN IF NOT EXISTS ipi_value NUMERIC DEFAULT 0;
ALTER TABLE public.nfe_items ADD COLUMN IF NOT EXISTS pis_value NUMERIC DEFAULT 0;
ALTER TABLE public.nfe_items ADD COLUMN IF NOT EXISTS cofins_value NUMERIC DEFAULT 0;
ALTER TABLE public.nfe_items ADD COLUMN IF NOT EXISTS icms_st_value NUMERIC DEFAULT 0;

-- Adição de colunas de impostos à NF-e (totais)
ALTER TABLE public.nfe ADD COLUMN IF NOT EXISTS total_icms_st NUMERIC DEFAULT 0;
ALTER TABLE public.nfe ADD COLUMN IF NOT EXISTS total_ipi NUMERIC DEFAULT 0;
ALTER TABLE public.nfe ADD COLUMN IF NOT EXISTS total_pis NUMERIC DEFAULT 0;
ALTER TABLE public.nfe ADD COLUMN IF NOT EXISTS total_cofins NUMERIC DEFAULT 0;

-- Garantir GRANTs para as novas colunas (as tabelas já têm grants, mas re-aplicar por segurança)
GRANT SELECT, INSERT, UPDATE ON public.nfe_items TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.nfe TO authenticated;

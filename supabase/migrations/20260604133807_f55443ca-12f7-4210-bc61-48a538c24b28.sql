-- Tabela de referência para CFOPs padrão
CREATE TABLE IF NOT EXISTS public.fiscal_cfop_reference (
    code TEXT PRIMARY KEY,
    description TEXT NOT NULL,
    operation_type TEXT NOT NULL, -- 'entrada' ou 'saida'
    is_interstate BOOLEAN NOT NULL DEFAULT false
);

GRANT SELECT ON public.fiscal_cfop_reference TO authenticated;
GRANT ALL ON public.fiscal_cfop_reference TO service_role;

-- Inserir CFOPs básicos de exemplo (Poderia ser uma lista exaustiva)
INSERT INTO public.fiscal_cfop_reference (code, description, operation_type, is_interstate) VALUES
('5101', 'Venda de produção do estabelecimento', 'saida', false),
('5102', 'Venda de mercadoria adquirida ou recebida de terceiros', 'saida', false),
('6101', 'Venda de produção do estabelecimento (Interestadual)', 'saida', true),
('6102', 'Venda de mercadoria adquirida ou recebida de terceiros (Interestadual)', 'saida', true),
('5405', 'Venda de mercadoria adquirida ou recebida de terceiros (ST)', 'saida', false),
('1102', 'Compra para comercialização', 'entrada', false),
('2102', 'Compra para comercialização (Interestadual)', 'entrada', true)
ON CONFLICT (code) DO NOTHING;

-- Função para configurar fiscal automaticamente
CREATE OR REPLACE FUNCTION public.fn_setup_new_company_fiscal()
RETURNS TRIGGER AS $$
BEGIN
    -- 1. Aqui poderíamos integrar com uma API externa (como BrasilAPI ou ReceitaWS) 
    -- via Edge Function se quiséssemos buscar dados reais do CNPJ. 
    -- Por agora, garantimos que se o CNPJ for novo, criamos as regras básicas.

    -- 2. Criar Regras Fiscais Padrão baseadas nos CFOPs de referência
    INSERT INTO public.fiscal_tax_rules (
        company_id,
        name,
        cfop,
        icms_rate,
        pis_rate,
        cofins_rate,
        ipi_rate,
        created_at,
        updated_at
    )
    SELECT 
        NEW.id,
        r.description,
        r.code,
        18.0, -- Alíquota padrão ICMS estimada
        1.65, -- PIS Estimado
        7.6,  -- COFINS Estimado
        0.0,  -- IPI
        NOW(),
        NOW()
    FROM public.fiscal_cfop_reference r;

    -- 3. Log de IA (Opcional, mas bom para rastrear)
    INSERT INTO public.ai_action_logs (
        company_id,
        module,
        action_name,
        action_type,
        context,
        result
    ) VALUES (
        NEW.id,
        'fiscal',
        'Auto Fiscal Setup',
        'automatic_initialization',
        'Company created with CNPJ: ' || NEW.cnpj,
        'Created ' || (SELECT count(*) FROM public.fiscal_cfop_reference) || ' tax rules automatically.'
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para disparar na criação da empresa
DROP TRIGGER IF EXISTS trg_setup_fiscal_on_company_creation ON public.companies;
CREATE TRIGGER trg_setup_fiscal_on_company_creation
AFTER INSERT ON public.companies
FOR EACH ROW
EXECUTE FUNCTION public.fn_setup_new_company_fiscal();

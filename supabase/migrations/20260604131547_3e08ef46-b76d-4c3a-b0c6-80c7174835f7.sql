-- Motor Fiscal Enterprise
CREATE TABLE public.fiscal_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL,
    name TEXT NOT NULL,
    ncm TEXT,
    origin_state CHAR(2),
    destination_state CHAR(2),
    cfop TEXT,
    icms_rate DECIMAL(5,2) DEFAULT 0,
    icms_st_rate DECIMAL(5,2) DEFAULT 0,
    ipi_rate DECIMAL(5,2) DEFAULT 0,
    pis_rate DECIMAL(5,2) DEFAULT 0,
    cofins_rate DECIMAL(5,2) DEFAULT 0,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE public.fiscal_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL,
    type TEXT NOT NULL, -- NFE, NFCE, CTE, MDFE
    number INTEGER NOT NULL,
    series INTEGER NOT NULL,
    access_key CHAR(44) UNIQUE,
    status TEXT DEFAULT 'draft', -- draft, authorized, cancelled, error
    xml_content TEXT,
    total_amount DECIMAL(15,2),
    tax_amount DECIMAL(15,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- IA Corporativa (Brain)
CREATE TABLE public.ai_enterprise_memory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL,
    module TEXT NOT NULL,
    context_key TEXT NOT NULL,
    context_value JSONB NOT NULL,
    importance_score INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE public.ai_executive_decisions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL,
    problem_description TEXT NOT NULL,
    suggestion TEXT NOT NULL,
    rationale TEXT,
    impact_prediction JSONB,
    status TEXT DEFAULT 'pending', -- pending, approved, rejected, implemented
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Grants
GRANT SELECT, INSERT, UPDATE, DELETE ON public.fiscal_rules TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.fiscal_documents TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_enterprise_memory TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_executive_decisions TO authenticated;

GRANT ALL ON public.fiscal_rules TO service_role;
GRANT ALL ON public.fiscal_documents TO service_role;
GRANT ALL ON public.ai_enterprise_memory TO service_role;
GRANT ALL ON public.ai_executive_decisions TO service_role;

-- RLS
ALTER TABLE public.fiscal_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fiscal_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_enterprise_memory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_executive_decisions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Fiscal rules access" ON public.fiscal_rules FOR ALL USING (company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()));
CREATE POLICY "Fiscal docs access" ON public.fiscal_documents FOR ALL USING (company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()));
CREATE POLICY "AI memory access" ON public.ai_enterprise_memory FOR ALL USING (company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

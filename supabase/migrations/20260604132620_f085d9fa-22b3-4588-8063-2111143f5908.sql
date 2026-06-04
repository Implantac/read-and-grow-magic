-- Tabelas de Motor Fiscal Enterprise
CREATE TABLE IF NOT EXISTS public.fiscal_tax_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id),
    name TEXT NOT NULL,
    origin_state CHAR(2) NOT NULL,
    destination_state CHAR(2) NOT NULL,
    cfop TEXT NOT NULL,
    cst TEXT,
    icms_rate NUMERIC DEFAULT 0,
    icms_st_rate NUMERIC DEFAULT 0,
    ipi_rate NUMERIC DEFAULT 0,
    pis_rate NUMERIC DEFAULT 0,
    cofins_rate NUMERIC DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.fiscal_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id),
    type TEXT NOT NULL, -- 'NFE', 'NFCE', 'CTE', 'MDFE'
    number INTEGER NOT NULL,
    series INTEGER NOT NULL,
    status TEXT DEFAULT 'pending', -- 'pending', 'transmitted', 'cancelled', 'error'
    xml_content TEXT,
    key_access TEXT UNIQUE,
    total_amount NUMERIC DEFAULT 0,
    tax_amount NUMERIC DEFAULT 0,
    customer_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Grants
GRANT SELECT, INSERT, UPDATE, DELETE ON public.fiscal_tax_rules TO authenticated;
GRANT ALL ON public.fiscal_tax_rules TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.fiscal_documents TO authenticated;
GRANT ALL ON public.fiscal_documents TO service_role;

-- RLS
ALTER TABLE public.fiscal_tax_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fiscal_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their company's tax rules" 
ON public.fiscal_tax_rules FOR ALL 
USING (company_id = public.get_user_company_id(auth.uid()))
WITH CHECK (company_id = public.get_user_company_id(auth.uid()));

CREATE POLICY "Users can manage their company's fiscal docs" 
ON public.fiscal_documents FOR ALL 
USING (company_id = public.get_user_company_id(auth.uid()))
WITH CHECK (company_id = public.get_user_company_id(auth.uid()));

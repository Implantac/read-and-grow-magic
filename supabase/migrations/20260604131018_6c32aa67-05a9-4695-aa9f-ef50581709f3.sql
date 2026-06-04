-- CRM Enterprise
CREATE TABLE public.crm_leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    source TEXT,
    status TEXT DEFAULT 'new',
    assigned_to UUID REFERENCES auth.users(id),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE public.crm_pipelines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE public.crm_pipeline_stages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pipeline_id UUID REFERENCES public.crm_pipelines(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    order_index INTEGER NOT NULL,
    probability DECIMAL(5,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE public.crm_opportunities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL,
    lead_id UUID REFERENCES public.crm_leads(id),
    pipeline_id UUID REFERENCES public.crm_pipelines(id),
    stage_id UUID REFERENCES public.crm_pipeline_stages(id),
    title TEXT NOT NULL,
    value DECIMAL(15,2),
    expected_closing_date DATE,
    lost_reason TEXT,
    ai_score DECIMAL(5,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Suporte a Consolidação Multi-empresa
CREATE TABLE public.enterprise_groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS group_id UUID REFERENCES public.enterprise_groups(id);

-- Grants
GRANT SELECT, INSERT, UPDATE, DELETE ON public.crm_leads TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.crm_pipelines TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.crm_pipeline_stages TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.crm_opportunities TO authenticated;
GRANT SELECT ON public.enterprise_groups TO authenticated;

GRANT ALL ON public.crm_leads TO service_role;
GRANT ALL ON public.crm_pipelines TO service_role;
GRANT ALL ON public.crm_pipeline_stages TO service_role;
GRANT ALL ON public.crm_opportunities TO service_role;
GRANT ALL ON public.enterprise_groups TO service_role;

-- RLS
ALTER TABLE public.crm_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_pipelines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_pipeline_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enterprise_groups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage leads of their company" ON public.crm_leads FOR ALL USING (company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()));
CREATE POLICY "Users can manage pipelines of their company" ON public.crm_pipelines FOR ALL USING (company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()));
CREATE POLICY "Users can manage stages of their company" ON public.crm_pipeline_stages FOR SELECT USING (true);
CREATE POLICY "Users can manage opportunities of their company" ON public.crm_opportunities FOR ALL USING (company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()));
CREATE POLICY "Users can see groups they belong to" ON public.enterprise_groups FOR SELECT USING (true);

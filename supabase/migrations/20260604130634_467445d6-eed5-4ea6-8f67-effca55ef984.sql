-- Hierarquia Multi-empresa e Segmentação
CREATE TYPE public.org_type AS ENUM ('holding', 'company', 'branch', 'unit');
CREATE TYPE public.tax_regime AS ENUM ('simples', 'presumed', 'real');
CREATE TYPE public.enterprise_tier AS ENUM ('small', 'medium', 'enterprise');

-- Auditoria Global
CREATE TABLE public.system_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    company_id UUID,
    action TEXT NOT NULL,
    module TEXT NOT NULL,
    entity_name TEXT,
    entity_id UUID,
    old_data JSONB,
    new_data JSONB,
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Configuração Adaptativa por Segmento
CREATE TABLE public.enterprise_segments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    active_modules TEXT[] DEFAULT '{}',
    kpi_templates JSONB DEFAULT '{}',
    ui_theme_overrides JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Atualização da Tabela de Empresas para suporte Enterprise
ALTER TABLE public.companies 
ADD COLUMN IF NOT EXISTS type org_type DEFAULT 'company',
ADD COLUMN IF NOT EXISTS tier enterprise_tier DEFAULT 'medium',
ADD COLUMN IF NOT EXISTS tax_regime tax_regime DEFAULT 'real',
ADD COLUMN IF NOT EXISTS segment_id UUID REFERENCES public.enterprise_segments(id),
ADD COLUMN IF NOT EXISTS settings JSONB DEFAULT '{}';

-- Permissões
GRANT ALL ON public.system_audit_logs TO service_role;
GRANT SELECT ON public.system_audit_logs TO authenticated;
GRANT ALL ON public.enterprise_segments TO service_role;
GRANT SELECT ON public.enterprise_segments TO authenticated;

-- RLS
ALTER TABLE public.system_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enterprise_segments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view audit logs for their company" ON public.system_audit_logs
    FOR SELECT USING (auth.uid() IN (SELECT id FROM public.profiles WHERE company_id = system_audit_logs.company_id));

CREATE POLICY "Authenticated users can view segments" ON public.enterprise_segments
    FOR SELECT TO authenticated USING (true);

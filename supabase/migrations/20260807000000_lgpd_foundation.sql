-- FASE 25: LGPD (Lei Geral de Proteção de Dados) Foundation
-- Este script cria a infraestrutura básica para gestão de privacidade.

-- 1. Tipos de solicitações LGPD
DO $$ BEGIN
    CREATE TYPE public.lgpd_request_type AS ENUM ('export', 'delete', 'rectify', 'objection', 'portability');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE public.lgpd_request_status AS ENUM ('pending', 'processing', 'completed', 'rejected');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Tabela de Consentimentos
CREATE TABLE IF NOT EXISTS public.lgpd_consents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    consent_type TEXT NOT NULL, -- e.g., 'terms', 'privacy_policy', 'marketing', 'telemetry'
    accepted BOOLEAN NOT NULL DEFAULT false,
    version TEXT NOT NULL DEFAULT '1.0',
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

GRANT SELECT, INSERT ON public.lgpd_consents TO authenticated;
GRANT ALL ON public.lgpd_consents TO service_role;

ALTER TABLE public.lgpd_consents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own consents"
    ON public.lgpd_consents FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can record their own consents"
    ON public.lgpd_consents FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

-- 3. Tabela de Solicitações de Dados
CREATE TABLE IF NOT EXISTS public.lgpd_data_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    request_type public.lgpd_request_type NOT NULL,
    status public.lgpd_request_status DEFAULT 'pending' NOT NULL,
    requested_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    completed_at TIMESTAMPTZ,
    rejection_reason TEXT,
    metadata JSONB DEFAULT '{}'::jsonb
);

GRANT SELECT, INSERT ON public.lgpd_data_requests TO authenticated;
GRANT ALL ON public.lgpd_data_requests TO service_role;

ALTER TABLE public.lgpd_data_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own requests"
    ON public.lgpd_data_requests FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own requests"
    ON public.lgpd_data_requests FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

-- 4. Função para anonimização básica (Placeholder para o cérebro da plataforma processar via Edge Function)
CREATE OR REPLACE FUNCTION public.request_lgpd_anonymization()
RETURNS trigger AS $$
BEGIN
    -- Esta função serve como um gatilho para processos offline/Edge Functions
    -- A anonimização real deve ser feita com cuidado para não quebrar integridade referencial fiscal/financeira.
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Índices para performance em auditoria LGPD
CREATE INDEX IF NOT EXISTS idx_lgpd_consents_user ON public.lgpd_consents(user_id);
CREATE INDEX IF NOT EXISTS idx_lgpd_requests_user ON public.lgpd_data_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_lgpd_consents_company ON public.lgpd_consents(company_id);

COMMENT ON TABLE public.lgpd_consents IS 'Registro auditável de consentimentos conforme LGPD art. 7 e 8.';
COMMENT ON TABLE public.lgpd_data_requests IS 'Registro de requisições de titulares de dados conforme LGPD art. 18.';

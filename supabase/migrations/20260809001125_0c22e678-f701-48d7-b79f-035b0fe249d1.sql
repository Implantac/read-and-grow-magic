-- AUDITORIA DE SEGURANÇA E BANCO DE DADOS (TURN 2) — USE PLATFORM 2026
-- Objetivo: Resolver vulnerabilidades críticas identificadas na auditoria anterior.

-- 1. HARDENING DE RLS: ISOLAMENTO TOTAL DE TENANT (MULTI-TENANCY)
-- Muitas tabelas estavam usando políticas genéricas "USING (true)". 
-- Agora forçamos o isolamento via company_id vinculado ao perfil do usuário.

-- 1.1 WMS: Controle de Centros de Distribuição e Armazéns
ALTER TABLE public.distribution_centers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Authenticated users can manage distribution_centers" ON public.distribution_centers;
CREATE POLICY "tenant_isolation_distribution_centers" ON public.distribution_centers
FOR ALL TO authenticated USING (company_id = public.get_user_company_id(auth.uid()));

ALTER TABLE public.warehouses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "warehouses_public_read" ON public.warehouses;
DROP POLICY IF EXISTS "warehouses_public_write" ON public.warehouses;
CREATE POLICY "tenant_isolation_warehouses" ON public.warehouses
FOR ALL TO authenticated USING (company_id = public.get_user_company_id(auth.uid()));

-- 1.2 CRM & Inteligência Comercial
ALTER TABLE public.customer_credit_profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Auth users can read customer_credit_profiles" ON public.customer_credit_profiles;
CREATE POLICY "tenant_isolation_credit_profiles" ON public.customer_credit_profiles
FOR ALL TO authenticated USING (company_id = public.get_user_company_id(auth.uid()));

ALTER TABLE public.ai_sales_scores ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "authenticated_read_ai_scores" ON public.ai_sales_scores;
CREATE POLICY "tenant_isolation_ai_sales_scores" ON public.ai_sales_scores
FOR ALL TO authenticated USING (company_id = public.get_user_company_id(auth.uid()));

-- 1.3 Gamificação (Dados de Performance de Vendedores)
ALTER TABLE public.gamification_points ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "auth read points" ON public.gamification_points;
CREATE POLICY "tenant_isolation_gamification_points" ON public.gamification_points
FOR ALL TO authenticated USING (company_id = public.get_user_company_id(auth.uid()));

-- 2. HARDENING DE SEGURANÇA: REVOKE EXECUTE EM FUNÇÕES SENSÍVEIS (CORREÇÃO LINTER)
-- A migração anterior revogou de PUBLIC/anon, mas o linter reportou que authenticated ainda podia executar algumas.
-- Revogamos explicitamente funções de trigger e gerenciamento interno.

DO $$
DECLARE
  r record;
BEGIN
  FOR r IN
    SELECT n.nspname, p.proname, pg_get_function_identity_arguments(p.oid) AS args
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    JOIN pg_type t ON t.oid = p.prorettype
    WHERE n.nspname = 'public' 
    AND (p.proname LIKE 'handle_%' OR p.proname LIKE 'record_%' OR t.typname = 'trigger')
  LOOP
    EXECUTE format('REVOKE EXECUTE ON FUNCTION %I.%I(%s) FROM authenticated, PUBLIC, anon', r.nspname, r.proname, r.args);
  END LOOP;
END$$;

-- 3. OTIMIZAÇÃO DE BANCO DE DADOS: ÍNDICES DE PERFORMANCE E SEGURANÇA
-- Adicionar company_id onde faltava para garantir que as políticas RLS não degradem a performance.

ALTER TABLE public.distribution_centers ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id);
ALTER TABLE public.warehouses ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id);
ALTER TABLE public.customer_credit_profiles ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id);
ALTER TABLE public.gamification_points ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id);

CREATE INDEX IF NOT EXISTS idx_dc_company_id ON public.distribution_centers(company_id);
CREATE INDEX IF NOT EXISTS idx_wh_company_id ON public.warehouses(company_id);
CREATE INDEX IF NOT EXISTS idx_ccp_company_id ON public.customer_credit_profiles(company_id);
CREATE INDEX IF NOT EXISTS idx_gp_company_id ON public.gamification_points(company_id);

-- 4. GRANTS DE ACESSO (Obrigatório por diretiva)
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated, service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO service_role;

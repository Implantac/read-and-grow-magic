-- AUDITORIA DE SEGURANÇA E BANCO DE DADOS — USE PLATFORM 2026
-- Objetivo: Hardening de RLS, Isolamento de Tenant (Multi-tenancy) e Segurança de Funções.

-- 1. SEGURANÇA DE FUNÇÕES (REVOKE EXECUTE)
-- Revogar permissões públicas de funções sensíveis para evitar exploração via API
DO $$
DECLARE
  r record;
BEGIN
  FOR r IN
    SELECT n.nspname, p.proname, pg_get_function_identity_arguments(p.oid) AS args
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' 
    AND p.prosecdef = true -- SECURITY DEFINER
  LOOP
    EXECUTE format('REVOKE EXECUTE ON FUNCTION %I.%I(%s) FROM PUBLIC, anon', r.nspname, r.proname, r.args);
  END LOOP;
END$$;

-- 2. ISOLAMENTO DE TENANT (MULTI-TENANCY) EM TABELAS CRÍTICAS
-- Garantir que cada usuário só veja dados da sua própria empresa

-- 2.1 Fiscal: NF-e e NFC-e
ALTER TABLE public.nfe ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Auth users can read own nfe" ON public.nfe;
CREATE POLICY "Auth users can read own nfe" ON public.nfe 
FOR SELECT TO authenticated 
USING (company_id = public.get_user_company_id(auth.uid()));

-- 2.2 Comercial: Pedidos (orders) e Itens
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Auth users can manage own orders" ON public.orders;
CREATE POLICY "Auth users can manage own orders" ON public.orders 
FOR ALL TO authenticated 
USING (company_id = public.get_user_company_id(auth.uid()))
WITH CHECK (company_id = public.get_user_company_id(auth.uid()));

-- 2.3 WMS: Balanços de Estoque e Movimentações
ALTER TABLE public.stock_balances ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Auth users can manage own stock_balances" ON public.stock_balances;
CREATE POLICY "Auth users can manage own stock_balances" ON public.stock_balances 
FOR ALL TO authenticated 
USING (company_id = public.get_user_company_id(auth.uid()))
WITH CHECK (company_id = public.get_user_company_id(auth.uid()));

-- 2.4 Financeiro: Contas a Pagar/Receber
ALTER TABLE public.accounts_payable ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Auth users can manage own accounts_payable" ON public.accounts_payable;
CREATE POLICY "Auth users can manage own accounts_payable" ON public.accounts_payable 
FOR ALL TO authenticated 
USING (company_id = public.get_user_company_id(auth.uid()))
WITH CHECK (company_id = public.get_user_company_id(auth.uid()));

ALTER TABLE public.accounts_receivable ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Auth users can manage own accounts_receivable" ON public.accounts_receivable;
CREATE POLICY "Auth users can manage own accounts_receivable" ON public.accounts_receivable 
FOR ALL TO authenticated 
USING (company_id = public.get_user_company_id(auth.uid()))
WITH CHECK (company_id = public.get_user_company_id(auth.uid()));

-- 3. SEGURANÇA DE TABELAS DE IA (SENSÍVEIS)
-- Impedir que usuários de um tenant leiam recomendações ou memórias de outro tenant

-- 3.1 AI Brain Decisions
ALTER TABLE public.ai_brain_decisions ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id);
DROP POLICY IF EXISTS "brain_decisions_all_authenticated" ON public.ai_brain_decisions;
CREATE POLICY "brain_decisions_tenant_isolation" ON public.ai_brain_decisions
FOR ALL TO authenticated 
USING (company_id = public.get_user_company_id(auth.uid()))
WITH CHECK (company_id = public.get_user_company_id(auth.uid()));

-- 4. OTIMIZAÇÃO DE ÍNDICES PARA CONSULTAS DE TENANT
-- Garantir performance em filtros por company_id
CREATE INDEX IF NOT EXISTS idx_nfe_company_id ON public.nfe(company_id);
CREATE INDEX IF NOT EXISTS idx_orders_company_id ON public.orders(company_id);
CREATE INDEX IF NOT EXISTS idx_stock_balances_company_id ON public.stock_balances(company_id);
CREATE INDEX IF NOT EXISTS idx_accounts_payable_company_id ON public.accounts_payable(company_id);
CREATE INDEX IF NOT EXISTS idx_accounts_receivable_company_id ON public.accounts_receivable(company_id);

-- 5. GRANTS EXPLÍCITOS PARAauthenticated ROLE
GRANT SELECT, INSERT, UPDATE, DELETE ON public.nfe TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.orders TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.stock_balances TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.accounts_payable TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.accounts_receivable TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_brain_decisions TO authenticated;

-- Garantir service_role access para Edge Functions
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;

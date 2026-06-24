
-- Módulo 1.2: Catálogo de Planos e Features
-- 1) Adicionar colunas de limite ao plans
ALTER TABLE public.plans
  ADD COLUMN IF NOT EXISTS max_companies integer NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS max_branches integer NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS nfe_per_month integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS ai_calls_per_month integer NOT NULL DEFAULT 0;

-- 2) Tabela plan_modules (plan x módulo habilitado)
CREATE TABLE IF NOT EXISTS public.plan_modules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id uuid NOT NULL REFERENCES public.plans(id) ON DELETE CASCADE,
  module_key text NOT NULL,
  enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (plan_id, module_key)
);

GRANT SELECT ON public.plan_modules TO authenticated, anon;
GRANT ALL ON public.plan_modules TO service_role;
ALTER TABLE public.plan_modules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "plan_modules read public"
ON public.plan_modules FOR SELECT
USING (true);

CREATE POLICY "plan_modules admin write"
ON public.plan_modules FOR ALL
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 3) Atualizar limites dos planos existentes + criar Business
UPDATE public.plans SET
  max_companies = 1, max_branches = 1, nfe_per_month = 100, ai_calls_per_month = 200
WHERE slug = 'basico';

UPDATE public.plans SET
  max_companies = 2, max_branches = 5, nfe_per_month = 2000, ai_calls_per_month = 5000
WHERE slug = 'profissional';

UPDATE public.plans SET
  max_companies = 99, max_branches = 999, nfe_per_month = 999999, ai_calls_per_month = 999999
WHERE slug = 'enterprise';

INSERT INTO public.plans (slug, name, description, price_monthly, price_annual, trial_days,
  max_users, max_orders_month, storage_mb, allowed_modules, is_active, sort_order,
  max_companies, max_branches, nfe_per_month, ai_calls_per_month)
VALUES (
  'business',
  'Business',
  'Plano avançado para empresas em crescimento com múltiplas filiais',
  997,
  9970,
  14,
  50,
  10000,
  51200,
  ARRAY['comercial','estoque','financeiro','producao','fiscal','compras','wms','contabilidade','rfid','credito','relatorios'],
  true,
  3,
  5,
  20,
  10000,
  20000
)
ON CONFLICT (slug) DO UPDATE SET
  max_companies = EXCLUDED.max_companies,
  max_branches = EXCLUDED.max_branches,
  nfe_per_month = EXCLUDED.nfe_per_month,
  ai_calls_per_month = EXCLUDED.ai_calls_per_month,
  allowed_modules = EXCLUDED.allowed_modules,
  updated_at = now();

-- Garantir sort_order coerente
UPDATE public.plans SET sort_order = 1 WHERE slug = 'basico';
UPDATE public.plans SET sort_order = 2 WHERE slug = 'profissional';
UPDATE public.plans SET sort_order = 3 WHERE slug = 'business';
UPDATE public.plans SET sort_order = 4 WHERE slug = 'enterprise';

-- 4) Popular plan_modules a partir de allowed_modules
INSERT INTO public.plan_modules (plan_id, module_key, enabled)
SELECT p.id, unnest(p.allowed_modules), true
FROM public.plans p
ON CONFLICT (plan_id, module_key) DO UPDATE SET enabled = true;

-- 5) Helper: retornar plano efetivo da company do usuário atual
CREATE OR REPLACE FUNCTION public.get_current_plan()
RETURNS TABLE (
  plan_id uuid,
  plan_slug text,
  plan_name text,
  max_users integer,
  max_companies integer,
  max_branches integer,
  max_orders_month integer,
  nfe_per_month integer,
  ai_calls_per_month integer,
  storage_mb integer,
  allowed_modules text[],
  subscription_status text,
  trial_end timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    p.id, p.slug, p.name,
    p.max_users, p.max_companies, p.max_branches, p.max_orders_month,
    p.nfe_per_month, p.ai_calls_per_month, p.storage_mb,
    p.allowed_modules,
    s.status, s.trial_end
  FROM public.profiles pr
  JOIN public.subscriptions s ON s.company_id = pr.company_id
  JOIN public.plans p ON p.id = s.plan_id
  WHERE pr.id = auth.uid()
  ORDER BY s.created_at DESC
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.get_current_plan() TO authenticated;

-- 6) Helper: checar acesso a módulo (server-side guard)
CREATE OR REPLACE FUNCTION public.has_module_access(_module_key text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles pr
    JOIN public.subscriptions s ON s.company_id = pr.company_id
    JOIN public.plan_modules pm ON pm.plan_id = s.plan_id
    WHERE pr.id = auth.uid()
      AND pm.module_key = _module_key
      AND pm.enabled = true
      AND s.status IN ('active','trialing','trial')
  );
$$;

GRANT EXECUTE ON FUNCTION public.has_module_access(text) TO authenticated;

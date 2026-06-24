-- Remove privilégio de admins de tenant sobre tabela global `plans` (SaaS-level).
-- Apenas service_role (operadores da plataforma) deve gerenciar planos.
DROP POLICY IF EXISTS "Admins manage plans" ON public.plans;
-- Mantém leitura pública de planos ativos (já existe: "Authenticated can view active plans").
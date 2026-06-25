
-- 1. permissions catalog
CREATE TABLE public.permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  resource text NOT NULL,
  action text NOT NULL,
  module_key text,
  description text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (resource, action)
);
GRANT SELECT ON public.permissions TO authenticated;
GRANT ALL ON public.permissions TO service_role;
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "permissions_read_authenticated" ON public.permissions
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "permissions_admin_write" ON public.permissions
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- 2. role -> permissions mapping
CREATE TABLE public.role_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role app_role NOT NULL,
  permission_id uuid NOT NULL REFERENCES public.permissions(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (role, permission_id)
);
GRANT SELECT ON public.role_permissions TO authenticated;
GRANT ALL ON public.role_permissions TO service_role;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "role_permissions_read" ON public.role_permissions
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "role_permissions_admin_write" ON public.role_permissions
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- 3. per-user overrides (grant or revoke specific permission per tenant)
CREATE TABLE public.user_permission_overrides (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  permission_id uuid NOT NULL REFERENCES public.permissions(id) ON DELETE CASCADE,
  granted boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  UNIQUE (user_id, company_id, permission_id)
);
CREATE INDEX idx_upo_user_company ON public.user_permission_overrides(user_id, company_id);
GRANT SELECT ON public.user_permission_overrides TO authenticated;
GRANT ALL ON public.user_permission_overrides TO service_role;
ALTER TABLE public.user_permission_overrides ENABLE ROW LEVEL SECURITY;
CREATE POLICY "upo_read_own_or_admin" ON public.user_permission_overrides
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "upo_admin_write" ON public.user_permission_overrides
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- 4. has_permission function
CREATE OR REPLACE FUNCTION public.has_permission(
  _user_id uuid,
  _company_id uuid,
  _resource text,
  _action text
) RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH perm AS (
    SELECT id FROM public.permissions
    WHERE resource = _resource AND action = _action
    LIMIT 1
  ),
  override AS (
    SELECT granted FROM public.user_permission_overrides upo, perm
    WHERE upo.user_id = _user_id
      AND upo.company_id = _company_id
      AND upo.permission_id = perm.id
    LIMIT 1
  )
  SELECT CASE
    WHEN (SELECT granted FROM override) IS NOT NULL THEN (SELECT granted FROM override)
    ELSE EXISTS (
      SELECT 1
      FROM public.user_roles ur
      JOIN public.role_permissions rp ON rp.role = ur.role
      JOIN perm ON perm.id = rp.permission_id
      WHERE ur.user_id = _user_id
        AND ur.company_id = _company_id
    )
  END;
$$;
REVOKE EXECUTE ON FUNCTION public.has_permission(uuid, uuid, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_permission(uuid, uuid, text, text) TO authenticated, service_role;

-- 5. seed catalog
INSERT INTO public.permissions (resource, action, module_key, description) VALUES
  ('financial.ap', 'read', 'financial', 'Visualizar contas a pagar'),
  ('financial.ap', 'write', 'financial', 'Lançar/editar contas a pagar'),
  ('financial.ap', 'approve', 'financial', 'Aprovar pagamentos'),
  ('financial.ar', 'read', 'financial', 'Visualizar contas a receber'),
  ('financial.ar', 'write', 'financial', 'Lançar/editar contas a receber'),
  ('financial.ledger', 'read', 'financial', 'Visualizar razão financeiro'),
  ('commercial.orders', 'read', 'comercial', 'Visualizar pedidos'),
  ('commercial.orders', 'write', 'comercial', 'Criar/editar pedidos'),
  ('commercial.orders', 'approve', 'comercial', 'Aprovar pedidos bloqueados'),
  ('commercial.clients', 'read', 'comercial', 'Visualizar clientes'),
  ('commercial.clients', 'write', 'comercial', 'Editar clientes'),
  ('production.orders', 'read', 'producao', 'Visualizar ordens de produção'),
  ('production.orders', 'write', 'producao', 'Criar/editar OPs'),
  ('inventory.stock', 'read', 'estoque', 'Visualizar estoque'),
  ('inventory.stock', 'write', 'estoque', 'Movimentar estoque'),
  ('fiscal.nfe', 'read', 'fiscal', 'Visualizar NF-e'),
  ('fiscal.nfe', 'write', 'fiscal', 'Emitir NF-e'),
  ('accounting.entries', 'read', 'contabil', 'Visualizar lançamentos contábeis'),
  ('accounting.entries', 'write', 'contabil', 'Lançar partidas contábeis'),
  ('admin.users', 'read', 'admin', 'Visualizar usuários'),
  ('admin.users', 'write', 'admin', 'Gerenciar usuários e papéis'),
  ('admin.billing', 'read', 'admin', 'Ver assinatura e faturamento'),
  ('admin.billing', 'write', 'admin', 'Alterar plano')
ON CONFLICT (resource, action) DO NOTHING;

-- 6. default role -> permission mapping
-- admin: everything
INSERT INTO public.role_permissions (role, permission_id)
SELECT 'admin'::app_role, id FROM public.permissions
ON CONFLICT DO NOTHING;

-- manager: tudo exceto admin.users write e admin.billing write
INSERT INTO public.role_permissions (role, permission_id)
SELECT 'manager'::app_role, id FROM public.permissions
WHERE NOT (resource IN ('admin.users','admin.billing') AND action = 'write')
ON CONFLICT DO NOTHING;

-- operator: read em tudo + write em commercial/inventory/production
INSERT INTO public.role_permissions (role, permission_id)
SELECT 'operator'::app_role, id FROM public.permissions
WHERE action = 'read'
   OR (resource IN ('commercial.orders','commercial.clients','inventory.stock','production.orders') AND action = 'write')
ON CONFLICT DO NOTHING;

-- viewer: somente read
INSERT INTO public.role_permissions (role, permission_id)
SELECT 'viewer'::app_role, id FROM public.permissions
WHERE action = 'read'
ON CONFLICT DO NOTHING;


-- 1. GRANTs para tabelas do módulo Crédito (Data API)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.customer_credit_profiles TO authenticated;
GRANT ALL ON public.customer_credit_profiles TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.order_blocks TO authenticated;
GRANT ALL ON public.order_blocks TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.collection_actions TO authenticated;
GRANT ALL ON public.collection_actions TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.credit_policies TO authenticated;
GRANT ALL ON public.credit_policies TO service_role;

GRANT SELECT, INSERT ON public.credit_audit_logs TO authenticated;
GRANT ALL ON public.credit_audit_logs TO service_role;

-- 2. Registrar permissões RBAC do módulo Crédito
INSERT INTO public.permissions (resource, action, module_key, description) VALUES
  ('credit.risk',        'view',   'credit', 'Visualizar dashboard de risco e perfis de crédito'),
  ('credit.risk',        'manage', 'credit', 'Editar perfis, limites e classificação de risco'),
  ('credit.blocks',      'view',   'credit', 'Visualizar bloqueios de pedidos'),
  ('credit.blocks',      'manage', 'credit', 'Liberar bloqueios de pedidos'),
  ('credit.collections', 'view',   'credit', 'Visualizar ações de cobrança'),
  ('credit.collections', 'manage', 'credit', 'Registrar e atualizar ações de cobrança')
ON CONFLICT DO NOTHING;

-- 3. Atribuir aos papéis padrão
INSERT INTO public.role_permissions (role, permission_id)
SELECT 'admin'::app_role, id FROM public.permissions WHERE module_key = 'credit'
ON CONFLICT DO NOTHING;

INSERT INTO public.role_permissions (role, permission_id)
SELECT 'manager'::app_role, id FROM public.permissions WHERE module_key = 'credit'
ON CONFLICT DO NOTHING;

INSERT INTO public.role_permissions (role, permission_id)
SELECT 'operator'::app_role, id FROM public.permissions
  WHERE module_key = 'credit' AND action = 'view'
ON CONFLICT DO NOTHING;

INSERT INTO public.role_permissions (role, permission_id)
SELECT 'viewer'::app_role, id FROM public.permissions
  WHERE module_key = 'credit' AND action = 'view'
ON CONFLICT DO NOTHING;

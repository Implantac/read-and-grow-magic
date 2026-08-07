-- FASE 7: RBAC Hardening & Autorização Granular

-- 1. Estrutura de Permissões
CREATE TABLE IF NOT EXISTS public.permissions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text UNIQUE NOT NULL,
    resource text NOT NULL,
    action text NOT NULL,
    description text,
    created_at timestamptz DEFAULT now()
);

-- 2. Vínculo Role-Permissão
CREATE TABLE IF NOT EXISTS public.role_permissions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    role public.app_role NOT NULL,
    permission_id uuid REFERENCES public.permissions(id) ON DELETE CASCADE,
    created_at timestamptz DEFAULT now(),
    UNIQUE(role, permission_id)
);

-- 3. Grants Iniciais
GRANT SELECT ON public.permissions TO authenticated;
GRANT SELECT ON public.role_permissions TO authenticated;
GRANT ALL ON public.permissions TO service_role;
GRANT ALL ON public.role_permissions TO service_role;

-- 4. RLS nas tabelas de permissões
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read permissions for authenticated" ON public.permissions
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow read role_permissions for authenticated" ON public.role_permissions
    FOR SELECT TO authenticated USING (true);

-- 5. Função de Verificação de Permissão Granular (Security Definer)
CREATE OR REPLACE FUNCTION public.has_permission(
    _user_id uuid,
    _company_id uuid,
    _resource text,
    _action text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1
        FROM public.user_roles ur
        JOIN public.role_permissions rp ON ur.role = rp.role
        JOIN public.permissions p ON rp.permission_id = p.id
        WHERE ur.user_id = _user_id
          AND ur.company_id = _company_id
          AND p.resource = _resource
          AND p.action = _action
    );
END;
$$;

-- 6. Populando Permissões Básicas
INSERT INTO public.permissions (name, resource, action, description) VALUES
('fiscal.nfe.view', 'fiscal.nfe', 'view', 'Visualizar notas fiscais eletrônicas'),
('fiscal.nfe.create', 'fiscal.nfe', 'create', 'Emitir notas fiscais eletrônicas'),
('financial.ledger.view', 'financial.ledger', 'view', 'Visualizar livro razão'),
('wms.inventory.view', 'wms.inventory', 'view', 'Visualizar estoque WMS')
ON CONFLICT (name) DO NOTHING;

-- 7. Atribuindo Permissões ao papel 'admin'
-- Assumindo que 'admin' existe no enum app_role
DO $$
BEGIN
    INSERT INTO public.role_permissions (role, permission_id)
    SELECT 'admin', id FROM public.permissions
    ON CONFLICT DO NOTHING;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Erro ao atribuir permissões ao admin. Verifique se a role existe.';
END;
$$;

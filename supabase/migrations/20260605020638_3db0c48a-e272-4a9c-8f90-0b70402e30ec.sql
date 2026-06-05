-- 1. Expandir Perfis RBAC (Pillar 20)
-- Como enum não pode ser alterado facilmente dentro de transação em alguns casos, usamos este método seguro
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_enum JOIN pg_type ON pg_enum.enumtypid = pg_type.oid WHERE pg_type.typname = 'app_role' AND enumlabel = 'diretor') THEN
        ALTER TYPE public.app_role ADD VALUE 'diretor';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_enum JOIN pg_type ON pg_enum.enumtypid = pg_type.oid WHERE pg_type.typname = 'app_role' AND enumlabel = 'financeiro') THEN
        ALTER TYPE public.app_role ADD VALUE 'financeiro';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_enum JOIN pg_type ON pg_enum.enumtypid = pg_type.oid WHERE pg_type.typname = 'app_role' AND enumlabel = 'fiscal') THEN
        ALTER TYPE public.app_role ADD VALUE 'fiscal';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_enum JOIN pg_type ON pg_enum.enumtypid = pg_type.oid WHERE pg_type.typname = 'app_role' AND enumlabel = 'contabil') THEN
        ALTER TYPE public.app_role ADD VALUE 'contabil';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_enum JOIN pg_type ON pg_enum.enumtypid = pg_type.oid WHERE pg_type.typname = 'app_role' AND enumlabel = 'compras') THEN
        ALTER TYPE public.app_role ADD VALUE 'compras';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_enum JOIN pg_type ON pg_enum.enumtypid = pg_type.oid WHERE pg_type.typname = 'app_role' AND enumlabel = 'producao') THEN
        ALTER TYPE public.app_role ADD VALUE 'producao';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_enum JOIN pg_type ON pg_enum.enumtypid = pg_type.oid WHERE pg_type.typname = 'app_role' AND enumlabel = 'logistica') THEN
        ALTER TYPE public.app_role ADD VALUE 'logistica';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_enum JOIN pg_type ON pg_enum.enumtypid = pg_type.oid WHERE pg_type.typname = 'app_role' AND enumlabel = 'comercial') THEN
        ALTER TYPE public.app_role ADD VALUE 'comercial';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_enum JOIN pg_type ON pg_enum.enumtypid = pg_type.oid WHERE pg_type.typname = 'app_role' AND enumlabel = 'loja') THEN
        ALTER TYPE public.app_role ADD VALUE 'loja';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_enum JOIN pg_type ON pg_enum.enumtypid = pg_type.oid WHERE pg_type.typname = 'app_role' AND enumlabel = 'franquia') THEN
        ALTER TYPE public.app_role ADD VALUE 'franquia';
    END IF;
END $$;

-- 2. Função de Consolidação Financeira Nativa (Pillar 2 & 6)
CREATE OR REPLACE FUNCTION public.get_consolidated_revenue(
    _tenant_id UUID DEFAULT NULL,
    _group_id UUID DEFAULT NULL,
    _company_id UUID DEFAULT NULL,
    _start_date DATE DEFAULT NULL,
    _end_date DATE DEFAULT NULL
)
RETURNS TABLE (
    entity_id UUID,
    entity_name TEXT,
    total_revenue NUMERIC,
    orders_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.id,
        c.name,
        COALESCE(SUM(o.total_amount), 0) as total_revenue,
        COUNT(o.id) as orders_count
    FROM public.companies c
    LEFT JOIN public.orders o ON o.company_id = c.id
    WHERE 
        (_tenant_id IS NULL OR c.tenant_id = _tenant_id) AND
        (_group_id IS NULL OR c.enterprise_group_id = _group_id) AND
        (_company_id IS NULL OR c.id = _company_id OR c.parent_company_id = _company_id) AND
        (_start_date IS NULL OR o.created_at >= _start_date) AND
        (_end_date IS NULL OR o.created_at <= _end_date)
    GROUP BY c.id, c.name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.get_consolidated_revenue TO authenticated;

-- 3. Função para Validar Hierarquia (Pillar 2)
CREATE OR REPLACE FUNCTION public.check_hierarchy_access(
    _user_id UUID,
    _target_company_id UUID
) RETURNS BOOLEAN AS $$
DECLARE
    _user_tenant_id UUID;
    _target_tenant_id UUID;
BEGIN
    -- Obter tenant do usuário
    SELECT tenant_id INTO _user_tenant_id FROM public.user_roles WHERE user_id = _user_id LIMIT 1;
    -- Obter tenant da empresa alvo
    SELECT tenant_id INTO _target_tenant_id FROM public.companies WHERE id = _target_company_id;
    
    -- Se forem do mesmo tenant, permite acesso (Consolidação Nativa)
    RETURN _user_tenant_id = _target_tenant_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.check_hierarchy_access TO authenticated;

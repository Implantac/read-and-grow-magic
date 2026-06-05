-- Pilar 2: Multi-tenant & Pilar 1: ERP Core Refinement

-- 1. Create Tenants Table (Highest Level)
CREATE TABLE IF NOT EXISTS public.tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE,
    status TEXT DEFAULT 'active',
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.tenants TO authenticated;
GRANT ALL ON public.tenants TO service_role;
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenants are visible to authenticated users" ON public.tenants
    FOR SELECT TO authenticated USING (true);

-- 2. Link Enterprise Groups to Tenants
ALTER TABLE public.enterprise_groups 
    ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id);

-- 3. Refine Companies Table
-- Adding tenant_id for direct scoping (performance + security)
ALTER TABLE public.companies 
    ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id);

-- 4. Create a Materialized Hierarchy View for Consolidation
-- This allows summing financial data up from Filial -> Empresa -> Grupo -> Tenant
CREATE OR REPLACE VIEW public.vw_organizational_hierarchy AS
WITH RECURSIVE org_tree AS (
    -- Root level: Companies without a parent are "Empresas" (or headquarters)
    SELECT 
        c.id as unit_id,
        c.name as unit_name,
        c.id as company_id,
        NULL::uuid as parent_id,
        'empresa' as level,
        c.group_id,
        c.enterprise_group_id,
        c.tenant_id,
        1 as depth
    FROM public.companies c
    WHERE c.parent_company_id IS NULL
    
    UNION ALL
    
    -- Recursive level: Children are "Filiais"
    SELECT 
        c.id as unit_id,
        c.name as unit_name,
        ot.company_id, -- Keep reference to the root company
        c.parent_company_id as parent_id,
        'filial' as level,
        c.group_id,
        c.enterprise_group_id,
        c.tenant_id,
        ot.depth + 1
    FROM public.companies c
    INNER JOIN org_tree ot ON c.parent_company_id = ot.unit_id
)
SELECT 
    ot.*,
    eg.name as group_name,
    t.name as tenant_name
FROM org_tree ot
LEFT JOIN public.enterprise_groups eg ON ot.enterprise_group_id = eg.id
LEFT JOIN public.tenants t ON ot.tenant_id = t.id;

-- 5. Helper Function for Consolidation
-- Returns all IDs (Self + Branches) to use in financial queries
CREATE OR REPLACE FUNCTION public.get_consolidated_company_ids(_company_id uuid)
RETURNS TABLE (id uuid) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    WITH RECURSIVE branches AS (
        SELECT c.id FROM public.companies c WHERE c.id = _company_id
        UNION ALL
        SELECT c.id FROM public.companies c INNER JOIN branches b ON c.parent_company_id = b.id
    )
    SELECT branches.id FROM branches;
END;
$$;

-- Standardizing permissions
GRANT EXECUTE ON FUNCTION public.get_consolidated_company_ids(uuid) TO authenticated, service_role;

-- 6. Trigger to automatically update updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_tenants_updated_at ON public.tenants;
CREATE TRIGGER tr_tenants_updated_at 
    BEFORE UPDATE ON public.tenants 
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

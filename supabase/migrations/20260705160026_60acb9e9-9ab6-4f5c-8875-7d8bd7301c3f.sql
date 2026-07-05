
-- ============================================================
-- 1. financial_ledger — padroniza has_role para 2-arg
-- ============================================================
DROP POLICY IF EXISTS ledger_tenant_select ON public.financial_ledger;
DROP POLICY IF EXISTS ledger_tenant_insert ON public.financial_ledger;
DROP POLICY IF EXISTS ledger_tenant_update ON public.financial_ledger;
DROP POLICY IF EXISTS ledger_tenant_delete ON public.financial_ledger;

CREATE POLICY ledger_tenant_select ON public.financial_ledger
  FOR SELECT TO authenticated
  USING (
    company_id = get_user_company_id(auth.uid())
    AND (
      has_role(auth.uid(), 'admin'::app_role)
      OR has_role(auth.uid(), 'manager'::app_role)
      OR has_role(auth.uid(), 'operator'::app_role)
      OR has_role(auth.uid(), 'viewer'::app_role)
    )
  );

CREATE POLICY ledger_tenant_insert ON public.financial_ledger
  FOR INSERT TO authenticated
  WITH CHECK (
    company_id IS NOT NULL
    AND company_id = get_user_company_id(auth.uid())
    AND (
      has_role(auth.uid(), 'admin'::app_role)
      OR has_role(auth.uid(), 'manager'::app_role)
      OR has_role(auth.uid(), 'operator'::app_role)
    )
  );

CREATE POLICY ledger_tenant_update ON public.financial_ledger
  FOR UPDATE TO authenticated
  USING (
    company_id = get_user_company_id(auth.uid())
    AND (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role))
  )
  WITH CHECK (
    company_id = get_user_company_id(auth.uid())
    AND (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role))
  );

CREATE POLICY ledger_tenant_delete ON public.financial_ledger
  FOR DELETE TO authenticated
  USING (
    company_id = get_user_company_id(auth.uid())
    AND has_role(auth.uid(), 'admin'::app_role)
  );

-- ============================================================
-- 2. user_roles — admins não podem tocar em outros admins
-- ============================================================
DROP POLICY IF EXISTS "Admins update roles in their company" ON public.user_roles;
DROP POLICY IF EXISTS "Admins delete roles in their company" ON public.user_roles;
DROP POLICY IF EXISTS "Admins insert roles in their company" ON public.user_roles;

-- INSERT: admin pode criar papéis na sua empresa, mas não pode criar outro 'admin' (só system_admin faz isso)
CREATE POLICY "Admins insert roles in their company" ON public.user_roles
  FOR INSERT TO authenticated
  WITH CHECK (
    has_role(auth.uid(), 'admin'::app_role)
    AND company_id = get_user_company_id(auth.uid())
    AND role <> 'system_admin'::app_role
    AND role <> 'admin'::app_role
  );

-- UPDATE: admin não pode alterar linhas de outro admin da mesma empresa (a menos que seja a própria linha)
CREATE POLICY "Admins update roles in their company" ON public.user_roles
  FOR UPDATE TO authenticated
  USING (
    has_role(auth.uid(), 'admin'::app_role)
    AND company_id = get_user_company_id(auth.uid())
    AND role <> 'system_admin'::app_role
    AND (role <> 'admin'::app_role OR user_id = auth.uid())
  )
  WITH CHECK (
    has_role(auth.uid(), 'admin'::app_role)
    AND company_id = get_user_company_id(auth.uid())
    AND role <> 'system_admin'::app_role
    AND role <> 'admin'::app_role
  );

-- DELETE: admin não pode remover outro admin
CREATE POLICY "Admins delete roles in their company" ON public.user_roles
  FOR DELETE TO authenticated
  USING (
    has_role(auth.uid(), 'admin'::app_role)
    AND company_id = get_user_company_id(auth.uid())
    AND role <> 'system_admin'::app_role
    AND role <> 'admin'::app_role
  );

-- Política adicional para system_admin gerenciar admins livremente
DROP POLICY IF EXISTS "System admins manage all roles" ON public.user_roles;
CREATE POLICY "System admins manage all roles" ON public.user_roles
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'system_admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'system_admin'::app_role));

-- ============================================================
-- 3. wms_docks — adiciona company_id direto na tabela
-- ============================================================
ALTER TABLE public.wms_docks ADD COLUMN IF NOT EXISTS company_id uuid;

-- Backfill a partir do warehouse
UPDATE public.wms_docks d
   SET company_id = w.company_id
  FROM public.warehouses w
 WHERE d.warehouse_id = w.id
   AND d.company_id IS DISTINCT FROM w.company_id;

CREATE INDEX IF NOT EXISTS idx_wms_docks_company_id ON public.wms_docks(company_id);

-- Trigger para manter sincronizado
CREATE OR REPLACE FUNCTION public.wms_docks_sync_company_id()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.warehouse_id IS NOT NULL THEN
    SELECT w.company_id INTO NEW.company_id
      FROM public.warehouses w
     WHERE w.id = NEW.warehouse_id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_wms_docks_sync_company ON public.wms_docks;
CREATE TRIGGER trg_wms_docks_sync_company
  BEFORE INSERT OR UPDATE OF warehouse_id ON public.wms_docks
  FOR EACH ROW EXECUTE FUNCTION public.wms_docks_sync_company_id();

-- Recria políticas usando company_id direto + join redundante como defesa em profundidade
DROP POLICY IF EXISTS wms_docks_select ON public.wms_docks;
DROP POLICY IF EXISTS wms_docks_insert ON public.wms_docks;
DROP POLICY IF EXISTS wms_docks_update ON public.wms_docks;
DROP POLICY IF EXISTS wms_docks_delete ON public.wms_docks;

CREATE POLICY wms_docks_select ON public.wms_docks
  FOR SELECT TO authenticated
  USING (
    company_id = get_user_company_id(auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.warehouses w
       WHERE w.id = wms_docks.warehouse_id
         AND w.company_id = get_user_company_id(auth.uid())
    )
  );

CREATE POLICY wms_docks_insert ON public.wms_docks
  FOR INSERT TO authenticated
  WITH CHECK (
    (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role))
    AND EXISTS (
      SELECT 1 FROM public.warehouses w
       WHERE w.id = wms_docks.warehouse_id
         AND w.company_id = get_user_company_id(auth.uid())
    )
  );

CREATE POLICY wms_docks_update ON public.wms_docks
  FOR UPDATE TO authenticated
  USING (
    company_id = get_user_company_id(auth.uid())
    AND (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role))
  )
  WITH CHECK (
    company_id = get_user_company_id(auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.warehouses w
       WHERE w.id = wms_docks.warehouse_id
         AND w.company_id = get_user_company_id(auth.uid())
    )
  );

CREATE POLICY wms_docks_delete ON public.wms_docks
  FOR DELETE TO authenticated
  USING (
    company_id = get_user_company_id(auth.uid())
    AND (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role))
  );

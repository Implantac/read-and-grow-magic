-- accounting_items: require admin/manager for INSERT/UPDATE
DROP POLICY IF EXISTS accounting_items_insert ON public.accounting_items;
CREATE POLICY accounting_items_insert ON public.accounting_items
FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (SELECT 1 FROM public.accounting_entries e WHERE e.id = entry_id AND e.company_id = public.get_user_company_id(auth.uid()))
  AND (public.has_role(auth.uid(),'admin'::app_role) OR public.has_role(auth.uid(),'manager'::app_role))
);

DROP POLICY IF EXISTS accounting_items_update ON public.accounting_items;
CREATE POLICY accounting_items_update ON public.accounting_items
FOR UPDATE TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.accounting_entries e WHERE e.id = entry_id AND e.company_id = public.get_user_company_id(auth.uid()))
  AND (public.has_role(auth.uid(),'admin'::app_role) OR public.has_role(auth.uid(),'manager'::app_role))
)
WITH CHECK (
  EXISTS (SELECT 1 FROM public.accounting_entries e WHERE e.id = entry_id AND e.company_id = public.get_user_company_id(auth.uid()))
  AND (public.has_role(auth.uid(),'admin'::app_role) OR public.has_role(auth.uid(),'manager'::app_role))
);

-- production_quality_checks: drop duplicated permissive tenant-only policies
DROP POLICY IF EXISTS pqc_tenant_insert ON public.production_quality_checks;
DROP POLICY IF EXISTS pqc_tenant_update ON public.production_quality_checks;
DROP POLICY IF EXISTS pqc_tenant_delete ON public.production_quality_checks;

DROP POLICY IF EXISTS production_quality_checks_insert ON public.production_quality_checks;
CREATE POLICY production_quality_checks_insert ON public.production_quality_checks
FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (SELECT 1 FROM public.production_orders po WHERE po.id = production_order_id AND po.company_id = public.get_user_company_id(auth.uid()))
  AND (public.has_role(auth.uid(),'admin'::app_role) OR public.has_role(auth.uid(),'manager'::app_role) OR public.has_role(auth.uid(),'operator'::app_role))
);

DROP POLICY IF EXISTS production_quality_checks_update ON public.production_quality_checks;
CREATE POLICY production_quality_checks_update ON public.production_quality_checks
FOR UPDATE TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.production_orders po WHERE po.id = production_order_id AND po.company_id = public.get_user_company_id(auth.uid()))
  AND (public.has_role(auth.uid(),'admin'::app_role) OR public.has_role(auth.uid(),'manager'::app_role) OR public.has_role(auth.uid(),'operator'::app_role))
)
WITH CHECK (
  EXISTS (SELECT 1 FROM public.production_orders po WHERE po.id = production_order_id AND po.company_id = public.get_user_company_id(auth.uid()))
  AND (public.has_role(auth.uid(),'admin'::app_role) OR public.has_role(auth.uid(),'manager'::app_role) OR public.has_role(auth.uid(),'operator'::app_role))
);
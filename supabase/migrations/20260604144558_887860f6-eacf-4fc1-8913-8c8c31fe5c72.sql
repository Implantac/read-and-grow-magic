
-- 1. accounting_items: scope via accounting_entries.company_id
DROP POLICY IF EXISTS accounting_items_select ON public.accounting_items;
DROP POLICY IF EXISTS accounting_items_insert ON public.accounting_items;
DROP POLICY IF EXISTS accounting_items_update ON public.accounting_items;
DROP POLICY IF EXISTS accounting_items_delete ON public.accounting_items;

CREATE POLICY accounting_items_select ON public.accounting_items FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.accounting_entries e WHERE e.id = accounting_items.entry_id AND e.company_id = get_user_company_id(auth.uid())));

CREATE POLICY accounting_items_insert ON public.accounting_items FOR INSERT TO authenticated
WITH CHECK (EXISTS (SELECT 1 FROM public.accounting_entries e WHERE e.id = accounting_items.entry_id AND e.company_id = get_user_company_id(auth.uid())));

CREATE POLICY accounting_items_update ON public.accounting_items FOR UPDATE TO authenticated
USING (EXISTS (SELECT 1 FROM public.accounting_entries e WHERE e.id = accounting_items.entry_id AND e.company_id = get_user_company_id(auth.uid())))
WITH CHECK (EXISTS (SELECT 1 FROM public.accounting_entries e WHERE e.id = accounting_items.entry_id AND e.company_id = get_user_company_id(auth.uid())));

CREATE POLICY accounting_items_delete ON public.accounting_items FOR DELETE TO authenticated
USING (EXISTS (SELECT 1 FROM public.accounting_entries e WHERE e.id = accounting_items.entry_id AND e.company_id = get_user_company_id(auth.uid())) AND has_role(auth.uid(), 'admin'::app_role));

-- 2. system_parameters: add company_id scope to INSERT/UPDATE
DROP POLICY IF EXISTS "Admins/managers insert parameters" ON public.system_parameters;
DROP POLICY IF EXISTS "Admins/managers update parameters" ON public.system_parameters;

CREATE POLICY "Admins/managers insert parameters" ON public.system_parameters FOR INSERT TO authenticated
WITH CHECK (
  company_id = get_user_company_id(auth.uid())
  AND (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role))
);

CREATE POLICY "Admins/managers update parameters" ON public.system_parameters FOR UPDATE TO authenticated
USING (
  company_id = get_user_company_id(auth.uid())
  AND (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role))
)
WITH CHECK (
  company_id = get_user_company_id(auth.uid())
  AND (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role))
);

-- 3. financial_ledger DELETE: scope by company
DROP POLICY IF EXISTS "Admins can delete financial_ledger" ON public.financial_ledger;
CREATE POLICY "Admins can delete financial_ledger" ON public.financial_ledger FOR DELETE TO authenticated
USING (
  company_id = get_user_company_id(auth.uid())
  AND has_role(auth.uid(), 'admin'::app_role)
);

-- 4. product_supplier_references: restrict SELECT to admin/manager (no company_id column)
DROP POLICY IF EXISTS psr_select_authenticated ON public.product_supplier_references;
CREATE POLICY psr_select_authenticated ON public.product_supplier_references FOR SELECT TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role));

-- 5. production_bom: tenant policies via company_id
DROP POLICY IF EXISTS production_bom_select ON public.production_bom;
DROP POLICY IF EXISTS production_bom_insert ON public.production_bom;
DROP POLICY IF EXISTS production_bom_update ON public.production_bom;
DROP POLICY IF EXISTS production_bom_delete ON public.production_bom;

CREATE POLICY production_bom_select ON public.production_bom FOR SELECT TO authenticated
USING (company_id = get_user_company_id(auth.uid()));

CREATE POLICY production_bom_insert ON public.production_bom FOR INSERT TO authenticated
WITH CHECK (company_id = get_user_company_id(auth.uid()));

CREATE POLICY production_bom_update ON public.production_bom FOR UPDATE TO authenticated
USING (company_id = get_user_company_id(auth.uid()))
WITH CHECK (company_id = get_user_company_id(auth.uid()));

CREATE POLICY production_bom_delete ON public.production_bom FOR DELETE TO authenticated
USING (company_id = get_user_company_id(auth.uid()) AND (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role)));

-- 6. production_quality_checks: scope via production_orders.company_id
DROP POLICY IF EXISTS production_quality_checks_select ON public.production_quality_checks;
DROP POLICY IF EXISTS production_quality_checks_insert ON public.production_quality_checks;
DROP POLICY IF EXISTS production_quality_checks_update ON public.production_quality_checks;
DROP POLICY IF EXISTS production_quality_checks_delete ON public.production_quality_checks;

CREATE POLICY production_quality_checks_select ON public.production_quality_checks FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.production_orders po WHERE po.id = production_quality_checks.production_order_id AND po.company_id = get_user_company_id(auth.uid())));

CREATE POLICY production_quality_checks_insert ON public.production_quality_checks FOR INSERT TO authenticated
WITH CHECK (EXISTS (SELECT 1 FROM public.production_orders po WHERE po.id = production_quality_checks.production_order_id AND po.company_id = get_user_company_id(auth.uid())));

CREATE POLICY production_quality_checks_update ON public.production_quality_checks FOR UPDATE TO authenticated
USING (EXISTS (SELECT 1 FROM public.production_orders po WHERE po.id = production_quality_checks.production_order_id AND po.company_id = get_user_company_id(auth.uid())))
WITH CHECK (EXISTS (SELECT 1 FROM public.production_orders po WHERE po.id = production_quality_checks.production_order_id AND po.company_id = get_user_company_id(auth.uid())));

CREATE POLICY production_quality_checks_delete ON public.production_quality_checks FOR DELETE TO authenticated
USING (EXISTS (SELECT 1 FROM public.production_orders po WHERE po.id = production_quality_checks.production_order_id AND po.company_id = get_user_company_id(auth.uid())) AND (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role)));

-- 7. sales_playbooks: scope admin ALL policy by company
DROP POLICY IF EXISTS "Admins can manage playbooks" ON public.sales_playbooks;
CREATE POLICY "Admins can manage playbooks" ON public.sales_playbooks FOR ALL TO authenticated
USING (company_id = get_user_company_id(auth.uid()) AND has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (company_id = get_user_company_id(auth.uid()) AND has_role(auth.uid(), 'admin'::app_role));

-- 8. tax_rules: scope write operations by company
DROP POLICY IF EXISTS tax_rules_insert_admin ON public.tax_rules;
DROP POLICY IF EXISTS tax_rules_update_admin ON public.tax_rules;
DROP POLICY IF EXISTS tax_rules_delete_admin ON public.tax_rules;

CREATE POLICY tax_rules_insert_admin ON public.tax_rules FOR INSERT TO authenticated
WITH CHECK (company_id = get_user_company_id(auth.uid()) AND (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role)));

CREATE POLICY tax_rules_update_admin ON public.tax_rules FOR UPDATE TO authenticated
USING (company_id = get_user_company_id(auth.uid()) AND (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role)))
WITH CHECK (company_id = get_user_company_id(auth.uid()) AND (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role)));

CREATE POLICY tax_rules_delete_admin ON public.tax_rules FOR DELETE TO authenticated
USING (company_id = get_user_company_id(auth.uid()) AND has_role(auth.uid(), 'admin'::app_role));

-- 9. wms_docks: scope via warehouses.company_id
DROP POLICY IF EXISTS wms_docks_select ON public.wms_docks;
DROP POLICY IF EXISTS wms_docks_insert ON public.wms_docks;
DROP POLICY IF EXISTS wms_docks_update ON public.wms_docks;
DROP POLICY IF EXISTS wms_docks_delete ON public.wms_docks;

CREATE POLICY wms_docks_select ON public.wms_docks FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.warehouses w WHERE w.id = wms_docks.warehouse_id AND w.company_id = get_user_company_id(auth.uid())));

CREATE POLICY wms_docks_insert ON public.wms_docks FOR INSERT TO authenticated
WITH CHECK (EXISTS (SELECT 1 FROM public.warehouses w WHERE w.id = wms_docks.warehouse_id AND w.company_id = get_user_company_id(auth.uid())));

CREATE POLICY wms_docks_update ON public.wms_docks FOR UPDATE TO authenticated
USING (EXISTS (SELECT 1 FROM public.warehouses w WHERE w.id = wms_docks.warehouse_id AND w.company_id = get_user_company_id(auth.uid())))
WITH CHECK (EXISTS (SELECT 1 FROM public.warehouses w WHERE w.id = wms_docks.warehouse_id AND w.company_id = get_user_company_id(auth.uid())));

CREATE POLICY wms_docks_delete ON public.wms_docks FOR DELETE TO authenticated
USING (EXISTS (SELECT 1 FROM public.warehouses w WHERE w.id = wms_docks.warehouse_id AND w.company_id = get_user_company_id(auth.uid())) AND (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role)));

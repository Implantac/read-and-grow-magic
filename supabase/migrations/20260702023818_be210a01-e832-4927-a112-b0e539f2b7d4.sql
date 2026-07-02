
-- 1) financial_categories: enforce NOT NULL guard on USING as well
DROP POLICY IF EXISTS financial_categories_tenant_all ON public.financial_categories;
CREATE POLICY financial_categories_tenant_all ON public.financial_categories
  FOR ALL TO authenticated
  USING (company_id IS NOT NULL AND company_id = public.get_user_company_id(auth.uid()))
  WITH CHECK (company_id IS NOT NULL AND company_id = public.get_user_company_id(auth.uid()));

-- 2) order_items: require admin/manager role for insert & update
DROP POLICY IF EXISTS order_items_tenant_insert ON public.order_items;
DROP POLICY IF EXISTS order_items_tenant_update ON public.order_items;
CREATE POLICY order_items_tenant_insert ON public.order_items
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = order_items.order_id
        AND o.company_id = public.get_user_company_id(auth.uid())
    )
    AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager'))
  );
CREATE POLICY order_items_tenant_update ON public.order_items
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = order_items.order_id
        AND o.company_id = public.get_user_company_id(auth.uid())
    )
    AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager'))
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = order_items.order_id
        AND o.company_id = public.get_user_company_id(auth.uid())
    )
    AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager'))
  );

-- 3) production_bom: require admin/manager role for insert & update
DROP POLICY IF EXISTS production_bom_insert ON public.production_bom;
DROP POLICY IF EXISTS production_bom_update ON public.production_bom;
CREATE POLICY production_bom_insert ON public.production_bom
  FOR INSERT TO authenticated
  WITH CHECK (
    company_id = public.get_user_company_id(auth.uid())
    AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager'))
  );
CREATE POLICY production_bom_update ON public.production_bom
  FOR UPDATE TO authenticated
  USING (
    company_id = public.get_user_company_id(auth.uid())
    AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager'))
  )
  WITH CHECK (
    company_id = public.get_user_company_id(auth.uid())
    AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager'))
  );

-- 4) stock_lots: restrict update to admin/manager (operators keep SELECT)
DROP POLICY IF EXISTS stocklots_update ON public.stock_lots;
CREATE POLICY stocklots_update ON public.stock_lots
  FOR UPDATE TO authenticated
  USING (
    company_id = public.get_user_company_id(auth.uid())
    AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager'))
  )
  WITH CHECK (
    company_id = public.get_user_company_id(auth.uid())
    AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager'))
  );

-- 5) wms_docks: require admin/manager role for insert
DROP POLICY IF EXISTS wms_docks_insert ON public.wms_docks;
CREATE POLICY wms_docks_insert ON public.wms_docks
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.warehouses w
      WHERE w.id = wms_docks.warehouse_id
        AND w.company_id = public.get_user_company_id(auth.uid())
    )
    AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager'))
  );

-- 6) revoke public/anon EXECUTE on SECURITY DEFINER function
REVOKE EXECUTE ON FUNCTION public.sync_product_bom_ready() FROM PUBLIC, anon;

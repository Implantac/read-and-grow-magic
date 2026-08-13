DO $$ 
BEGIN
  -- 1. HARDENING: PRODUCTION MODULE
  -- production_orders
  DROP POLICY IF EXISTS "Auth users can read production_orders" ON public.production_orders;
  DROP POLICY IF EXISTS "Auth users can update production_orders" ON public.production_orders;
  DROP POLICY IF EXISTS "Auth users can delete production_orders" ON public.production_orders;
  CREATE POLICY "production_orders_tenant_select" ON public.production_orders FOR SELECT TO authenticated USING (company_id = public.get_user_company_id(auth.uid()));
  CREATE POLICY "production_orders_tenant_insert" ON public.production_orders FOR INSERT TO authenticated WITH CHECK (company_id = public.get_user_company_id(auth.uid()));
  CREATE POLICY "production_orders_tenant_update" ON public.production_orders FOR UPDATE TO authenticated USING (company_id = public.get_user_company_id(auth.uid())) WITH CHECK (company_id = public.get_user_company_id(auth.uid()));
  CREATE POLICY "production_orders_tenant_delete" ON public.production_orders FOR DELETE TO authenticated USING (company_id = public.get_user_company_id(auth.uid()));

  -- production_order_steps
  DROP POLICY IF EXISTS "Auth users can read production_order_steps" ON public.production_order_steps;
  CREATE POLICY "production_order_steps_tenant_all" ON public.production_order_steps FOR ALL TO authenticated USING (company_id = public.get_user_company_id(auth.uid())) WITH CHECK (company_id = public.get_user_company_id(auth.uid()));

  -- 2. HARDENING: LOGISTICS (WMS/TMS)
  -- wms_docks
  DROP POLICY IF EXISTS "Auth users can read wms_docks" ON public.wms_docks;
  CREATE POLICY "wms_docks_tenant_all" ON public.wms_docks FOR ALL TO authenticated USING (company_id = public.get_user_company_id(auth.uid())) WITH CHECK (company_id = public.get_user_company_id(auth.uid()));

  -- wms_inventory_items
  DROP POLICY IF EXISTS "Auth users can read wms_inventory_items" ON public.wms_inventory_items;
  CREATE POLICY "wms_inventory_items_tenant_all" ON public.wms_inventory_items FOR ALL TO authenticated USING (company_id = public.get_user_company_id(auth.uid())) WITH CHECK (company_id = public.get_user_company_id(auth.uid()));

  -- stock_movements
  DROP POLICY IF EXISTS "Auth users can read stock_movements" ON public.stock_movements;
  CREATE POLICY "stock_movements_tenant_all" ON public.stock_movements FOR ALL TO authenticated USING (company_id = public.get_user_company_id(auth.uid())) WITH CHECK (company_id = public.get_user_company_id(auth.uid()));

  -- 3. HARDENING: FINANCIAL CORE
  -- accounts_receivable
  DROP POLICY IF EXISTS "Authenticated users can read accounts_receivable" ON public.accounts_receivable;
  DROP POLICY IF EXISTS "Authenticated users can update accounts_receivable" ON public.accounts_receivable;
  DROP POLICY IF EXISTS "Authenticated users can delete accounts_receivable" ON public.accounts_receivable;
  CREATE POLICY "accounts_receivable_tenant_all" ON public.accounts_receivable FOR ALL TO authenticated USING (company_id = public.get_user_company_id(auth.uid())) WITH CHECK (company_id = public.get_user_company_id(auth.uid()));

  -- accounts_payable
  DROP POLICY IF EXISTS "Authenticated users can read accounts_payable" ON public.accounts_payable;
  DROP POLICY IF EXISTS "Authenticated users can update accounts_payable" ON public.accounts_payable;
  DROP POLICY IF EXISTS "Authenticated users can delete accounts_payable" ON public.accounts_payable;
  CREATE POLICY "accounts_payable_tenant_all" ON public.accounts_payable FOR ALL TO authenticated USING (company_id = public.get_user_company_id(auth.uid())) WITH CHECK (company_id = public.get_user_company_id(auth.uid()));

  -- 4. HARDENING: PRODUCTS & INVENTORY
  -- products
  DROP POLICY IF EXISTS "Auth users can read products" ON public.products;
  CREATE POLICY "products_tenant_select" ON public.products FOR SELECT TO authenticated USING (company_id = public.get_user_company_id(auth.uid()));

  -- 5. AUTO-FILL TRIGGERS
  -- Ensuring triggers are active for auto-filling company_id
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_products_set_company_id') THEN
    CREATE TRIGGER trg_products_set_company_id BEFORE INSERT ON public.products FOR EACH ROW EXECUTE FUNCTION public.set_company_id_from_user();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_production_orders_set_company_id') THEN
    CREATE TRIGGER trg_production_orders_set_company_id BEFORE INSERT ON public.production_orders FOR EACH ROW EXECUTE FUNCTION public.set_company_id_from_user();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_stock_movements_set_company_id') THEN
    CREATE TRIGGER trg_stock_movements_set_company_id BEFORE INSERT ON public.stock_movements FOR EACH ROW EXECUTE FUNCTION public.set_company_id_from_user();
  END IF;

END $$;


-- 1. Backfill orders.company_id via client
UPDATE public.orders o SET company_id = c.company_id
FROM public.clients c WHERE o.client_id = c.id AND o.company_id IS NULL AND c.company_id IS NOT NULL;

-- Backfill order_items via parent order
UPDATE public.order_items oi SET company_id = o.company_id
FROM public.orders o WHERE oi.order_id = o.id AND oi.company_id IS NULL AND o.company_id IS NOT NULL;

-- 2. NOT NULL enforcement (only tables without remaining orphans)
ALTER TABLE public.orders ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE public.order_items ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE public.quotations ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE public.quotation_items ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE public.products ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE public.sales ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE public.sale_items ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE public.purchase_orders ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE public.purchase_order_items ALTER COLUMN company_id SET NOT NULL;

-- 3. Rewrite RLS for orders / order_items / quotations: strict tenant scope
DROP POLICY IF EXISTS "Tenant users can read orders" ON public.orders;
DROP POLICY IF EXISTS "Tenant users can insert orders" ON public.orders;
DROP POLICY IF EXISTS "Tenant users can update orders" ON public.orders;
DROP POLICY IF EXISTS "Admins/managers can delete orders" ON public.orders;

CREATE POLICY "orders_tenant_select" ON public.orders FOR SELECT TO authenticated
  USING (company_id = get_user_company_id(auth.uid()));
CREATE POLICY "orders_tenant_insert" ON public.orders FOR INSERT TO authenticated
  WITH CHECK (company_id = get_user_company_id(auth.uid()));
CREATE POLICY "orders_tenant_update" ON public.orders FOR UPDATE TO authenticated
  USING (company_id = get_user_company_id(auth.uid()))
  WITH CHECK (company_id = get_user_company_id(auth.uid()));
CREATE POLICY "orders_tenant_delete" ON public.orders FOR DELETE TO authenticated
  USING (company_id = get_user_company_id(auth.uid())
         AND (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'manager'::app_role)));

DROP POLICY IF EXISTS "Tenant users can read order_items" ON public.order_items;
DROP POLICY IF EXISTS "Tenant users can insert order_items" ON public.order_items;
DROP POLICY IF EXISTS "Tenant users can update order_items" ON public.order_items;
DROP POLICY IF EXISTS "Admins/managers can delete order_items" ON public.order_items;

CREATE POLICY "order_items_tenant_select" ON public.order_items FOR SELECT TO authenticated
  USING (company_id = get_user_company_id(auth.uid()));
CREATE POLICY "order_items_tenant_insert" ON public.order_items FOR INSERT TO authenticated
  WITH CHECK (company_id = get_user_company_id(auth.uid()));
CREATE POLICY "order_items_tenant_update" ON public.order_items FOR UPDATE TO authenticated
  USING (company_id = get_user_company_id(auth.uid()))
  WITH CHECK (company_id = get_user_company_id(auth.uid()));
CREATE POLICY "order_items_tenant_delete" ON public.order_items FOR DELETE TO authenticated
  USING (company_id = get_user_company_id(auth.uid())
         AND (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'manager'::app_role)));

DROP POLICY IF EXISTS "quotations_tenant_select" ON public.quotations;
DROP POLICY IF EXISTS "quotations_tenant_insert" ON public.quotations;
CREATE POLICY "quotations_tenant_select" ON public.quotations FOR SELECT TO authenticated
  USING (company_id = get_user_company_id(auth.uid()));
CREATE POLICY "quotations_tenant_insert" ON public.quotations FOR INSERT TO authenticated
  WITH CHECK (company_id = get_user_company_id(auth.uid())
              AND (has_role(auth.uid(),'admin'::app_role)
                   OR has_role(auth.uid(),'manager'::app_role)
                   OR has_role(auth.uid(),'operator'::app_role)));

-- 4. Per-tenant uniqueness
ALTER TABLE public.products DROP CONSTRAINT IF EXISTS products_code_key;
CREATE UNIQUE INDEX IF NOT EXISTS products_company_code_uk
  ON public.products (company_id, code) WHERE code IS NOT NULL;

ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_number_key;
CREATE UNIQUE INDEX IF NOT EXISTS orders_company_number_uk
  ON public.orders (company_id, number) WHERE number IS NOT NULL;

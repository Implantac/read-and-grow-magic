
-- Add tenant scoping to orders & order_items
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES public.companies(id) ON DELETE SET NULL;
ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES public.companies(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_orders_company_id ON public.orders(company_id);
CREATE INDEX IF NOT EXISTS idx_order_items_company_id ON public.order_items(company_id);

-- Auto-populate company_id from the authenticated user's profile
DROP TRIGGER IF EXISTS set_orders_company_id ON public.orders;
CREATE TRIGGER set_orders_company_id
BEFORE INSERT ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.set_company_id_from_user();

-- For order_items, derive company from parent order if available, else from user
CREATE OR REPLACE FUNCTION public.set_order_items_company_id()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.company_id IS NULL THEN
    SELECT company_id INTO NEW.company_id FROM public.orders WHERE id = NEW.order_id;
  END IF;
  IF NEW.company_id IS NULL AND auth.uid() IS NOT NULL THEN
    NEW.company_id := public.get_user_company_id(auth.uid());
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_order_items_company_id ON public.order_items;
CREATE TRIGGER set_order_items_company_id
BEFORE INSERT ON public.order_items
FOR EACH ROW
EXECUTE FUNCTION public.set_order_items_company_id();

-- Replace permissive policies on orders
DROP POLICY IF EXISTS "Authenticated users can read orders" ON public.orders;
DROP POLICY IF EXISTS "Authenticated users can insert orders" ON public.orders;
DROP POLICY IF EXISTS "Authenticated users can update orders" ON public.orders;
DROP POLICY IF EXISTS "Authenticated users can delete orders" ON public.orders;

CREATE POLICY "Tenant users can read orders"
ON public.orders FOR SELECT TO authenticated
USING (
  company_id IS NULL AND public.has_role(auth.uid(), 'admin')
  OR company_id = public.get_user_company_id(auth.uid())
);

CREATE POLICY "Tenant users can insert orders"
ON public.orders FOR INSERT TO authenticated
WITH CHECK (
  company_id IS NULL OR company_id = public.get_user_company_id(auth.uid())
);

CREATE POLICY "Tenant users can update orders"
ON public.orders FOR UPDATE TO authenticated
USING (company_id = public.get_user_company_id(auth.uid()) OR (company_id IS NULL AND public.has_role(auth.uid(), 'admin')))
WITH CHECK (company_id = public.get_user_company_id(auth.uid()) OR (company_id IS NULL AND public.has_role(auth.uid(), 'admin')));

CREATE POLICY "Admins/managers can delete orders"
ON public.orders FOR DELETE TO authenticated
USING (
  (company_id = public.get_user_company_id(auth.uid()) OR company_id IS NULL)
  AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager'))
);

-- Replace permissive policies on order_items
DROP POLICY IF EXISTS "Authenticated users can read order_items" ON public.order_items;
DROP POLICY IF EXISTS "Authenticated users can insert order_items" ON public.order_items;
DROP POLICY IF EXISTS "Authenticated users can update order_items" ON public.order_items;
DROP POLICY IF EXISTS "Authenticated users can delete order_items" ON public.order_items;

CREATE POLICY "Tenant users can read order_items"
ON public.order_items FOR SELECT TO authenticated
USING (
  company_id IS NULL AND public.has_role(auth.uid(), 'admin')
  OR company_id = public.get_user_company_id(auth.uid())
);

CREATE POLICY "Tenant users can insert order_items"
ON public.order_items FOR INSERT TO authenticated
WITH CHECK (
  company_id IS NULL OR company_id = public.get_user_company_id(auth.uid())
);

CREATE POLICY "Tenant users can update order_items"
ON public.order_items FOR UPDATE TO authenticated
USING (company_id = public.get_user_company_id(auth.uid()) OR (company_id IS NULL AND public.has_role(auth.uid(), 'admin')))
WITH CHECK (company_id = public.get_user_company_id(auth.uid()) OR (company_id IS NULL AND public.has_role(auth.uid(), 'admin')));

CREATE POLICY "Admins/managers can delete order_items"
ON public.order_items FOR DELETE TO authenticated
USING (
  (company_id = public.get_user_company_id(auth.uid()) OR company_id IS NULL)
  AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager'))
);

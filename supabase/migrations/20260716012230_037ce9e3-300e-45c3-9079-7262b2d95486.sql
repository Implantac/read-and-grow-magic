
-- Orders table
CREATE TABLE public.storefront_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  storefront_id UUID NOT NULL REFERENCES public.storefronts(id) ON DELETE CASCADE,
  company_id UUID NOT NULL,
  order_number TEXT NOT NULL,
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT,
  customer_document TEXT,
  shipping_address JSONB NOT NULL DEFAULT '{}'::jsonb,
  payment_method TEXT NOT NULL CHECK (payment_method IN ('credit_card','pix','boleto')),
  payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending','processing','paid','failed','refunded','expired')),
  order_status TEXT NOT NULL DEFAULT 'created' CHECK (order_status IN ('created','confirmed','preparing','shipped','delivered','cancelled')),
  subtotal NUMERIC(14,2) NOT NULL DEFAULT 0,
  shipping NUMERIC(14,2) NOT NULL DEFAULT 0,
  discount NUMERIC(14,2) NOT NULL DEFAULT 0,
  total NUMERIC(14,2) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'BRL',
  pix_qr_code TEXT,
  pix_copy_paste TEXT,
  pix_expires_at TIMESTAMPTZ,
  card_last4 TEXT,
  card_brand TEXT,
  payment_intent_id TEXT,
  notes TEXT,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (storefront_id, order_number)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.storefront_orders TO authenticated;
GRANT SELECT, INSERT ON public.storefront_orders TO anon;
GRANT ALL ON public.storefront_orders TO service_role;

ALTER TABLE public.storefront_orders ENABLE ROW LEVEL SECURITY;

-- Anyone can create an order for a published storefront (public checkout)
CREATE POLICY "Public can create orders on published storefronts"
ON public.storefront_orders FOR INSERT TO anon, authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.storefronts s
    WHERE s.id = storefront_id AND s.status = 'published'
  )
);

-- Company staff can view/manage orders
CREATE POLICY "Company staff can view storefront orders"
ON public.storefront_orders FOR SELECT TO authenticated
USING (
  public.has_role(auth.uid(), 'admin')
  OR public.has_role(auth.uid(), 'manager')
);

CREATE POLICY "Company staff can update storefront orders"
ON public.storefront_orders FOR UPDATE TO authenticated
USING (
  public.has_role(auth.uid(), 'admin')
  OR public.has_role(auth.uid(), 'manager')
)
WITH CHECK (
  public.has_role(auth.uid(), 'admin')
  OR public.has_role(auth.uid(), 'manager')
);

CREATE POLICY "Admins can delete storefront orders"
ON public.storefront_orders FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Order items
CREATE TABLE public.storefront_order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.storefront_orders(id) ON DELETE CASCADE,
  product_id UUID,
  product_name TEXT NOT NULL,
  product_sku TEXT,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price NUMERIC(14,2) NOT NULL,
  total NUMERIC(14,2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.storefront_order_items TO authenticated;
GRANT SELECT, INSERT ON public.storefront_order_items TO anon;
GRANT ALL ON public.storefront_order_items TO service_role;

ALTER TABLE public.storefront_order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can insert items on new orders"
ON public.storefront_order_items FOR INSERT TO anon, authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.storefront_orders o
    JOIN public.storefronts s ON s.id = o.storefront_id
    WHERE o.id = order_id AND s.status = 'published'
  )
);

CREATE POLICY "Company staff can view order items"
ON public.storefront_order_items FOR SELECT TO authenticated
USING (
  public.has_role(auth.uid(), 'admin')
  OR public.has_role(auth.uid(), 'manager')
);

CREATE POLICY "Company staff can manage order items"
ON public.storefront_order_items FOR ALL TO authenticated
USING (
  public.has_role(auth.uid(), 'admin')
  OR public.has_role(auth.uid(), 'manager')
)
WITH CHECK (
  public.has_role(auth.uid(), 'admin')
  OR public.has_role(auth.uid(), 'manager')
);

-- updated_at trigger
CREATE TRIGGER update_storefront_orders_updated_at
BEFORE UPDATE ON public.storefront_orders
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_storefront_orders_storefront ON public.storefront_orders(storefront_id, created_at DESC);
CREATE INDEX idx_storefront_orders_company ON public.storefront_orders(company_id, created_at DESC);
CREATE INDEX idx_storefront_order_items_order ON public.storefront_order_items(order_id);

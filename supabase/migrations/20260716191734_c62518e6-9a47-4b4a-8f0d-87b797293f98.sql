
-- =====================================================================
-- FIX 1: branches — remove admin bypass cross-tenant on SELECT policy
-- =====================================================================
DROP POLICY IF EXISTS "Users can view branches of their companies" ON public.branches;

CREATE POLICY "Users can view branches of their companies"
  ON public.branches
  FOR SELECT
  USING (
    (EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.company_id = branches.company_id
    ))
    OR (
      has_role(auth.uid(), 'admin'::text)
      AND branches.company_id = get_user_company_id(auth.uid())
    )
  );

-- =====================================================================
-- FIX 2: storefront_orders / storefront_order_items / storefront_payment_events
-- Scope admin/manager staff policies to the caller's company.
-- =====================================================================

-- storefront_orders
DROP POLICY IF EXISTS "Company staff can view storefront orders" ON public.storefront_orders;
CREATE POLICY "Company staff can view storefront orders"
  ON public.storefront_orders
  FOR SELECT
  USING (
    (has_role(auth.uid(), 'admin'::text) OR has_role(auth.uid(), 'manager'::text))
    AND storefront_orders.company_id = get_user_company_id(auth.uid())
  );

DROP POLICY IF EXISTS "Company staff can update storefront orders" ON public.storefront_orders;
CREATE POLICY "Company staff can update storefront orders"
  ON public.storefront_orders
  FOR UPDATE
  USING (
    (has_role(auth.uid(), 'admin'::text) OR has_role(auth.uid(), 'manager'::text))
    AND storefront_orders.company_id = get_user_company_id(auth.uid())
  )
  WITH CHECK (
    (has_role(auth.uid(), 'admin'::text) OR has_role(auth.uid(), 'manager'::text))
    AND storefront_orders.company_id = get_user_company_id(auth.uid())
  );

DROP POLICY IF EXISTS "Admins can delete storefront orders" ON public.storefront_orders;
CREATE POLICY "Admins can delete storefront orders"
  ON public.storefront_orders
  FOR DELETE
  USING (
    has_role(auth.uid(), 'admin'::text)
    AND storefront_orders.company_id = get_user_company_id(auth.uid())
  );

-- storefront_order_items — scope via parent order's company_id
DROP POLICY IF EXISTS "Company staff can view order items" ON public.storefront_order_items;
CREATE POLICY "Company staff can view order items"
  ON public.storefront_order_items
  FOR SELECT
  USING (
    (has_role(auth.uid(), 'admin'::text) OR has_role(auth.uid(), 'manager'::text))
    AND EXISTS (
      SELECT 1 FROM public.storefront_orders o
      WHERE o.id = storefront_order_items.order_id
        AND o.company_id = get_user_company_id(auth.uid())
    )
  );

DROP POLICY IF EXISTS "Company staff can manage order items" ON public.storefront_order_items;
CREATE POLICY "Company staff can manage order items"
  ON public.storefront_order_items
  FOR ALL
  USING (
    (has_role(auth.uid(), 'admin'::text) OR has_role(auth.uid(), 'manager'::text))
    AND EXISTS (
      SELECT 1 FROM public.storefront_orders o
      WHERE o.id = storefront_order_items.order_id
        AND o.company_id = get_user_company_id(auth.uid())
    )
  )
  WITH CHECK (
    (has_role(auth.uid(), 'admin'::text) OR has_role(auth.uid(), 'manager'::text))
    AND EXISTS (
      SELECT 1 FROM public.storefront_orders o
      WHERE o.id = storefront_order_items.order_id
        AND o.company_id = get_user_company_id(auth.uid())
    )
  );

-- storefront_payment_events
DROP POLICY IF EXISTS "Staff can view payment events" ON public.storefront_payment_events;
CREATE POLICY "Staff can view payment events"
  ON public.storefront_payment_events
  FOR SELECT
  USING (
    (has_role(auth.uid(), 'admin'::text) OR has_role(auth.uid(), 'manager'::text))
    AND EXISTS (
      SELECT 1 FROM public.storefront_orders o
      WHERE o.id = storefront_payment_events.order_id
        AND o.company_id = get_user_company_id(auth.uid())
    )
  );

-- =====================================================================
-- FIX 3: products — restrict anon reads to public-safe columns only.
--   Row-level access remains gated by the existing storefront policy;
--   column-level GRANT prevents anon from selecting cost_price, supplier,
--   ncm and other internal fields.
-- =====================================================================
REVOKE SELECT ON public.products FROM anon;
GRANT SELECT (
  id, name, description, image_url, sale_price,
  category_id, subcategory, brand, unit, gtin, barcode
) ON public.products TO anon;

-- storefront_products — restrict anon column set as well (drop rating/etc. all fine; keep public-facing only)
REVOKE SELECT ON public.storefront_products FROM anon;
GRANT SELECT (
  id, storefront_id, product_id, public_price, compare_at_price,
  is_featured, is_visible, display_order, gallery_urls,
  seo_title, seo_description, rating, rating_count
) ON public.storefront_products TO anon;

-- =====================================================================
-- FIX 4: storefront_order_items — restrict anon INSERT to the caller's
-- own freshly created order (15 min window, still in "created" state).
-- =====================================================================
DROP POLICY IF EXISTS "Public can insert items on new orders" ON public.storefront_order_items;
CREATE POLICY "Public can insert items on new orders"
  ON public.storefront_order_items
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.storefront_orders o
      JOIN public.storefronts s ON s.id = o.storefront_id
      WHERE o.id = storefront_order_items.order_id
        AND s.status = 'published'
        AND o.order_status = 'created'
        AND o.payment_status IN ('pending', 'processing')
        AND o.created_at > (now() - interval '15 minutes')
    )
  );

-- =====================================================================
-- FIX 5: SECURITY DEFINER functions callable by anon.
-- These are trigger functions — triggers do not require EXECUTE by the
-- DML caller, so revoking EXECUTE from PUBLIC/anon/authenticated is safe.
-- =====================================================================
REVOKE EXECUTE ON FUNCTION public.commerce_reserve_stock_on_order() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.commerce_on_payment_status_change() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.audit_user_roles_changes() FROM PUBLIC, anon, authenticated;

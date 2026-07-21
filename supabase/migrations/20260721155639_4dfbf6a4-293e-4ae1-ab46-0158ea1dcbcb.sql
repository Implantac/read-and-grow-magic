
DROP POLICY IF EXISTS "Public can view categories" ON public.categories;

CREATE POLICY "Public can view categories linked to published storefronts"
ON public.categories
FOR SELECT
TO anon
USING (
  active = true
  AND EXISTS (
    SELECT 1
    FROM public.storefront_products sp
    JOIN public.storefronts s ON s.id = sp.storefront_id
    JOIN public.products p ON p.id = sp.product_id
    WHERE p.category_id = categories.id
      AND s.status = 'published'
      AND sp.is_visible = true
  )
);

REVOKE EXECUTE ON FUNCTION public.audit_logs_immutable_guard() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.audit_order_cancellation() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.audit_product_price_changes() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.audit_stock_adjustment() FROM PUBLIC, anon, authenticated;

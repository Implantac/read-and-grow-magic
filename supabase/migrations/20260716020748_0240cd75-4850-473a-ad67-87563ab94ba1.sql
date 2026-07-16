
-- 1. Avaliações em storefront_products
ALTER TABLE public.storefront_products
  ADD COLUMN IF NOT EXISTS rating NUMERIC(2,1) CHECK (rating IS NULL OR (rating >= 0 AND rating <= 5)),
  ADD COLUMN IF NOT EXISTS rating_count INTEGER NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_storefront_products_rating ON public.storefront_products(rating);
CREATE INDEX IF NOT EXISTS idx_storefront_products_featured ON public.storefront_products(is_featured) WHERE is_featured = true;

-- 2. Leitura pública de storefront_products (lojas publicadas + produtos visíveis)
GRANT SELECT ON public.storefront_products TO anon;

DROP POLICY IF EXISTS "Public can view visible products of published storefronts" ON public.storefront_products;
CREATE POLICY "Public can view visible products of published storefronts"
  ON public.storefront_products
  FOR SELECT
  TO anon, authenticated
  USING (
    is_visible = true
    AND EXISTS (
      SELECT 1 FROM public.storefronts s
      WHERE s.id = storefront_id AND s.status = 'published'
    )
  );

-- 3. Leitura pública de products vinculados a lojas publicadas
GRANT SELECT ON public.products TO anon;

DROP POLICY IF EXISTS "Public can view products linked to published storefronts" ON public.products;
CREATE POLICY "Public can view products linked to published storefronts"
  ON public.products
  FOR SELECT
  TO anon
  USING (
    EXISTS (
      SELECT 1 FROM public.storefront_products sp
      JOIN public.storefronts s ON s.id = sp.storefront_id
      WHERE sp.product_id = products.id
        AND sp.is_visible = true
        AND s.status = 'published'
    )
  );

-- 4. Leitura pública de categorias (necessária para árvore de filtros)
GRANT SELECT ON public.categories TO anon;

DROP POLICY IF EXISTS "Public can view categories" ON public.categories;
CREATE POLICY "Public can view categories"
  ON public.categories
  FOR SELECT
  TO anon
  USING (active = true);

-- 5. Leitura pública de storefronts publicadas (necessária para resolver :slug na busca)
DROP POLICY IF EXISTS "Public can view published storefronts by slug" ON public.storefronts;
CREATE POLICY "Public can view published storefronts by slug"
  ON public.storefronts
  FOR SELECT
  TO anon
  USING (status = 'published');

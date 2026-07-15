
-- ============ 1. commerce_themes (catálogo público de layouts) ============
CREATE TABLE public.commerce_themes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'general',
  preview_url TEXT,
  thumbnail_url TEXT,
  is_premium BOOLEAN NOT NULL DEFAULT false,
  price NUMERIC(10,2) NOT NULL DEFAULT 0,
  author TEXT,
  tags TEXT[] NOT NULL DEFAULT '{}',
  default_config JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_published BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.commerce_themes TO authenticated;
GRANT ALL ON public.commerce_themes TO service_role;

ALTER TABLE public.commerce_themes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view published themes"
  ON public.commerce_themes
  FOR SELECT
  TO authenticated
  USING (is_published = true);

-- ============ 2. storefronts (lojas por empresa) ============
CREATE TABLE public.storefronts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  subdomain TEXT,
  storefront_type TEXT NOT NULL DEFAULT 'b2c'
    CHECK (storefront_type IN ('b2c', 'b2b', 'hybrid')),
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'published', 'paused')),
  theme_id UUID REFERENCES public.commerce_themes(id) ON DELETE SET NULL,
  currency TEXT NOT NULL DEFAULT 'BRL',
  logo_url TEXT,
  favicon_url TEXT,
  primary_color TEXT NOT NULL DEFAULT '#1A2234',
  secondary_color TEXT NOT NULL DEFAULT '#FF9800',
  contact_email TEXT,
  contact_phone TEXT,
  settings JSONB NOT NULL DEFAULT '{}'::jsonb,
  published_at TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (company_id, slug)
);

CREATE INDEX idx_storefronts_company ON public.storefronts(company_id);
CREATE INDEX idx_storefronts_status ON public.storefronts(status);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.storefronts TO authenticated;
GRANT ALL ON public.storefronts TO service_role;

ALTER TABLE public.storefronts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view their company storefronts"
  ON public.storefronts
  FOR SELECT
  TO authenticated
  USING (company_id IN (
    SELECT company_id FROM public.profiles WHERE id = auth.uid()
  ));

CREATE POLICY "Admins and managers can manage storefronts"
  ON public.storefronts
  FOR ALL
  TO authenticated
  USING (
    company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid())
    AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager'))
  )
  WITH CHECK (
    company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid())
    AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager'))
  );

-- ============ 3. storefront_pages (páginas do editor) ============
CREATE TABLE public.storefront_pages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  storefront_id UUID NOT NULL REFERENCES public.storefronts(id) ON DELETE CASCADE,
  slug TEXT NOT NULL,
  title TEXT NOT NULL,
  page_type TEXT NOT NULL DEFAULT 'custom'
    CHECK (page_type IN ('home', 'product', 'collection', 'cart', 'checkout', 'account', 'custom')),
  is_homepage BOOLEAN NOT NULL DEFAULT false,
  is_published BOOLEAN NOT NULL DEFAULT false,
  blocks JSONB NOT NULL DEFAULT '[]'::jsonb,
  seo_title TEXT,
  seo_description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (storefront_id, slug)
);

CREATE INDEX idx_storefront_pages_storefront ON public.storefront_pages(storefront_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.storefront_pages TO authenticated;
GRANT ALL ON public.storefront_pages TO service_role;

ALTER TABLE public.storefront_pages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view pages of their company storefronts"
  ON public.storefront_pages
  FOR SELECT
  TO authenticated
  USING (storefront_id IN (
    SELECT id FROM public.storefronts
    WHERE company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid())
  ));

CREATE POLICY "Admins and managers can manage pages"
  ON public.storefront_pages
  FOR ALL
  TO authenticated
  USING (
    storefront_id IN (
      SELECT id FROM public.storefronts
      WHERE company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid())
    )
    AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager'))
  )
  WITH CHECK (
    storefront_id IN (
      SELECT id FROM public.storefronts
      WHERE company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid())
    )
    AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager'))
  );

-- ============ 4. storefront_products (produtos publicados por loja) ============
CREATE TABLE public.storefront_products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  storefront_id UUID NOT NULL REFERENCES public.storefronts(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  public_price NUMERIC(12,2),
  compare_at_price NUMERIC(12,2),
  is_featured BOOLEAN NOT NULL DEFAULT false,
  is_visible BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER NOT NULL DEFAULT 0,
  gallery_urls TEXT[] NOT NULL DEFAULT '{}',
  seo_title TEXT,
  seo_description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (storefront_id, product_id)
);

CREATE INDEX idx_storefront_products_store ON public.storefront_products(storefront_id);
CREATE INDEX idx_storefront_products_visible ON public.storefront_products(is_visible);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.storefront_products TO authenticated;
GRANT ALL ON public.storefront_products TO service_role;

ALTER TABLE public.storefront_products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view products of their company storefronts"
  ON public.storefront_products
  FOR SELECT
  TO authenticated
  USING (storefront_id IN (
    SELECT id FROM public.storefronts
    WHERE company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid())
  ));

CREATE POLICY "Admins and managers can manage storefront products"
  ON public.storefront_products
  FOR ALL
  TO authenticated
  USING (
    storefront_id IN (
      SELECT id FROM public.storefronts
      WHERE company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid())
    )
    AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager'))
  )
  WITH CHECK (
    storefront_id IN (
      SELECT id FROM public.storefronts
      WHERE company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid())
    )
    AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager'))
  );

-- ============ 5. updated_at triggers ============
CREATE TRIGGER trg_commerce_themes_updated
  BEFORE UPDATE ON public.commerce_themes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trg_storefronts_updated
  BEFORE UPDATE ON public.storefronts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trg_storefront_pages_updated
  BEFORE UPDATE ON public.storefront_pages
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trg_storefront_products_updated
  BEFORE UPDATE ON public.storefront_products
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ 6. Seed inicial de temas (6 layouts) ============
INSERT INTO public.commerce_themes (key, name, description, category, is_premium, price, author, tags, default_config)
VALUES
  ('minimal-mono', 'Minimal Mono', 'Layout minimalista preto e branco, foco em tipografia e produto.', 'fashion', false, 0, 'Use Studio',
   ARRAY['minimal','fashion','monochrome'],
   '{"layout":"grid-3","hero":"fullscreen","typography":"serif"}'::jsonb),
  ('vibrant-market', 'Vibrant Market', 'Cores vivas e blocos em destaque para marketplaces e mercados populares.', 'marketplace', false, 0, 'Use Studio',
   ARRAY['vibrant','marketplace','popular'],
   '{"layout":"grid-4","hero":"carousel","typography":"sans"}'::jsonb),
  ('editorial-lux', 'Editorial Lux', 'Estilo editorial premium para moda, joias e cosméticos de alto padrão.', 'fashion', true, 499.00, 'Studio Nord',
   ARRAY['premium','editorial','luxury'],
   '{"layout":"asymmetric","hero":"video","typography":"display"}'::jsonb),
  ('tech-flow', 'Tech Flow', 'Layout tecnológico para eletrônicos, gadgets e SaaS físicos.', 'electronics', true, 349.00, 'Pixel Labs',
   ARRAY['premium','tech','dark'],
   '{"layout":"grid-3","hero":"split","typography":"mono"}'::jsonb),
  ('agro-fresh', 'Agro Fresh', 'Layout verde e orgânico para produtos rurais, alimentícios e naturais.', 'agro', false, 0, 'Use Studio',
   ARRAY['agro','organic','food'],
   '{"layout":"grid-2","hero":"static","typography":"handwritten"}'::jsonb),
  ('industrial-b2b', 'Industrial B2B', 'Layout técnico para catálogos B2B, indústria e distribuição.', 'industrial', true, 799.00, 'Pixel Labs',
   ARRAY['premium','b2b','industrial'],
   '{"layout":"list","hero":"none","typography":"sans","showsku":true}'::jsonb);

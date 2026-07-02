
-- Etapa 2: Cadastro Universal de Produtos - campos por natureza
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS product_nature text NOT NULL DEFAULT 'commerce'
    CHECK (product_nature IN ('industry','commerce','service')),
  ADD COLUMN IF NOT EXISTS ncm text,
  ADD COLUMN IF NOT EXISTS cest text,
  ADD COLUMN IF NOT EXISTS cfop_default text,
  ADD COLUMN IF NOT EXISTS origin text,
  ADD COLUMN IF NOT EXISTS icms_cst text,
  ADD COLUMN IF NOT EXISTS ipi_cst text,
  ADD COLUMN IF NOT EXISTS pis_cst text,
  ADD COLUMN IF NOT EXISTS cofins_cst text,
  ADD COLUMN IF NOT EXISTS gtin text,
  -- Indústria
  ADD COLUMN IF NOT EXISTS production_route_id uuid,
  ADD COLUMN IF NOT EXISTS bom_id uuid,
  ADD COLUMN IF NOT EXISTS standard_batch_size numeric,
  ADD COLUMN IF NOT EXISTS technical_sheet_url text,
  -- Comércio
  ADD COLUMN IF NOT EXISTS brand text,
  ADD COLUMN IF NOT EXISTS model text,
  ADD COLUMN IF NOT EXISTS warranty_months integer,
  -- Serviços
  ADD COLUMN IF NOT EXISTS service_code_lc116 text,
  ADD COLUMN IF NOT EXISTS iss_rate numeric,
  ADD COLUMN IF NOT EXISTS service_duration_minutes integer,
  ADD COLUMN IF NOT EXISTS is_recurring boolean DEFAULT false;

-- Backfill natureza baseada no type existente
UPDATE public.products
   SET product_nature = CASE
     WHEN type IN ('raw_material','component') THEN 'industry'
     ELSE 'commerce'
   END
 WHERE product_nature = 'commerce' AND type IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_products_nature ON public.products(company_id, product_nature);
CREATE INDEX IF NOT EXISTS idx_products_ncm ON public.products(ncm) WHERE ncm IS NOT NULL;

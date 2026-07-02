-- Remove check antigo restritivo
ALTER TABLE public.products DROP CONSTRAINT IF EXISTS products_item_kind_check;

-- Remapeia valores legacy → PT-BR
UPDATE public.products SET item_kind = CASE
  WHEN item_kind = 'service' THEN 'servico'
  WHEN item_kind = 'resale' THEN 'revenda'
  WHEN item_kind = 'manufactured' THEN 'acabado'
  ELSE LOWER(item_kind)
END
WHERE item_kind IS NOT NULL;

UPDATE public.products SET item_kind = 'acabado'
  WHERE item_kind IS NULL OR item_kind NOT IN ('acabado','materia_prima','servico','kit','insumo','revenda');

-- G2: novo check estendido
ALTER TABLE public.products ADD CONSTRAINT products_item_kind_check
  CHECK (item_kind IN ('acabado','materia_prima','servico','kit','insumo','revenda'));

-- G1: SKU único por tenant
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'products_company_code_unique') THEN
    ALTER TABLE public.products ADD CONSTRAINT products_company_code_unique UNIQUE (company_id, code);
  END IF;
END $$;

-- G3: GTIN único por tenant (partial)
CREATE UNIQUE INDEX IF NOT EXISTS products_company_gtin_unique
  ON public.products (company_id, gtin) WHERE gtin IS NOT NULL AND gtin <> '';

-- G4: NCM 8 dígitos
UPDATE public.products SET ncm = regexp_replace(ncm, '\D', '', 'g')
  WHERE ncm IS NOT NULL AND ncm <> regexp_replace(ncm, '\D', '', 'g');
UPDATE public.products SET ncm = NULL
  WHERE ncm IS NOT NULL AND ncm !~ '^[0-9]{8}$';

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'products_ncm_format_check') THEN
    ALTER TABLE public.products ADD CONSTRAINT products_ncm_format_check
      CHECK (ncm IS NULL OR ncm ~ '^[0-9]{8}$');
  END IF;
END $$;
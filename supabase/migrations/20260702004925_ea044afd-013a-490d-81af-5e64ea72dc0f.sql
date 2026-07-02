
-- Etapa 1: Cadastro Dinâmico de Clientes (PF/PJ)
ALTER TABLE public.clients
  ADD COLUMN IF NOT EXISTS person_type text CHECK (person_type IN ('PF','PJ')),
  ADD COLUMN IF NOT EXISTS rg text,
  ADD COLUMN IF NOT EXISTS birth_date date,
  ADD COLUMN IF NOT EXISTS gender text,
  ADD COLUMN IF NOT EXISTS cnae_primary text,
  ADD COLUMN IF NOT EXISTS cnae_description text,
  ADD COLUMN IF NOT EXISTS receita_status text,
  ADD COLUMN IF NOT EXISTS receita_status_date date,
  ADD COLUMN IF NOT EXISTS receita_synced_at timestamptz;

-- Backfill person_type a partir do document existente
UPDATE public.clients
   SET person_type = CASE
     WHEN length(regexp_replace(coalesce(document,''),'\D','','g')) = 11 THEN 'PF'
     ELSE 'PJ'
   END
 WHERE person_type IS NULL;

-- Índice para lookup de duplicidade
CREATE INDEX IF NOT EXISTS idx_clients_document_company
  ON public.clients (company_id, document);

-- Unicidade por tenant (bloqueia CNPJ/CPF duplicado na mesma empresa)
CREATE UNIQUE INDEX IF NOT EXISTS uq_clients_document_company
  ON public.clients (company_id, document)
  WHERE document IS NOT NULL AND document <> '';

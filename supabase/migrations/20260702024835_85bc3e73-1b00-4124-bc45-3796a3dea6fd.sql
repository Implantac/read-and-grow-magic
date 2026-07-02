UPDATE public.clients SET document_type = UPPER(document_type) WHERE document_type IS NOT NULL AND document_type <> UPPER(document_type);

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'clients_company_document_unique') THEN
    ALTER TABLE public.clients ADD CONSTRAINT clients_company_document_unique UNIQUE (company_id, document);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'clients_person_type_check') THEN
    ALTER TABLE public.clients ADD CONSTRAINT clients_person_type_check CHECK (person_type IN ('PF','PJ'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'clients_document_type_check') THEN
    ALTER TABLE public.clients ADD CONSTRAINT clients_document_type_check CHECK (document_type IN ('CPF','CNPJ'));
  END IF;
END $$;
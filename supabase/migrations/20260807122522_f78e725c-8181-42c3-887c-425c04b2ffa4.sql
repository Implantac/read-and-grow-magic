-- FASE 8: Hardening de Idempotência em Pagamentos
CREATE TABLE IF NOT EXISTS public.idempotency_keys (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    idempotency_key text NOT NULL,
    company_id uuid NOT NULL,
    request_path text NOT NULL,
    response_code integer,
    response_body jsonb,
    created_at timestamptz DEFAULT now(),
    UNIQUE(idempotency_key, company_id)
);

GRANT SELECT, INSERT, UPDATE ON public.idempotency_keys TO authenticated;
GRANT ALL ON public.idempotency_keys TO service_role;

ALTER TABLE public.idempotency_keys ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'idempotency_keys' AND policyname = 'Users can only see their company idempotency keys') THEN
        CREATE POLICY "Users can only see their company idempotency keys"
        ON public.idempotency_keys
        FOR SELECT
        TO authenticated
        USING (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()));
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'idempotency_keys' AND policyname = 'Users can insert idempotency keys for their company') THEN
        CREATE POLICY "Users can insert idempotency keys for their company"
        ON public.idempotency_keys
        FOR INSERT
        TO authenticated
        WITH CHECK (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()));
    END IF;
END $$;

-- Hardening de Tabelas de Pagamento
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='payment_records' AND column_name='idempotency_key') THEN
        ALTER TABLE public.payment_records ADD COLUMN idempotency_key text UNIQUE;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='subscriptions' AND table_schema='public') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='subscriptions' AND column_name='external_idempotency_key') THEN
            ALTER TABLE public.subscriptions ADD COLUMN external_idempotency_key text UNIQUE;
        END IF;
    END IF;
END $$;

-- Tabela para chaves de idempotência (proteção contra duplicidade de transações)
CREATE TABLE IF NOT EXISTS public.idempotency_keys (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    idempotency_key text NOT NULL,
    context text NOT NULL, -- Ex: 'billing-checkout', 'payment-baixa'
    response_body jsonb,
    response_status integer DEFAULT 200,
    expires_at timestamptz NOT NULL,
    created_at timestamptz DEFAULT now(),
    UNIQUE(idempotency_key, context)
);

-- RLS: Apenas service_role acessa diretamente via Edge Functions.
ALTER TABLE public.idempotency_keys ENABLE ROW LEVEL SECURITY;

GRANT ALL ON public.idempotency_keys TO service_role;
-- Usuários autenticados podem ver suas próprias chaves se necessário no futuro, 
-- mas por enquanto deixamos apenas para service_role (backend).

-- Cleanup automático de chaves expiradas (opcional via cron, aqui deixamos o esqueleto)
-- CREATE INDEX idx_idempotency_expiry ON public.idempotency_keys(expires_at);

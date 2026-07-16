
CREATE TABLE public.storefront_payment_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES public.storefront_orders(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  event_type TEXT NOT NULL,
  external_id TEXT,
  status_before TEXT,
  status_after TEXT,
  amount NUMERIC(14,2),
  raw_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  signature_valid BOOLEAN,
  processed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.storefront_payment_events TO authenticated;
GRANT ALL ON public.storefront_payment_events TO service_role;

ALTER TABLE public.storefront_payment_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view payment events"
ON public.storefront_payment_events FOR SELECT TO authenticated
USING (
  public.has_role(auth.uid(), 'admin')
  OR public.has_role(auth.uid(), 'manager')
);

CREATE INDEX idx_payment_events_order ON public.storefront_payment_events(order_id, created_at DESC);
CREATE INDEX idx_payment_events_external ON public.storefront_payment_events(provider, external_id);

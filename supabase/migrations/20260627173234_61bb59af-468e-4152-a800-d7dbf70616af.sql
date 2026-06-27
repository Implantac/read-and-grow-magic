
CREATE TABLE public.billing_meters (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  meter_key TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  unit TEXT NOT NULL DEFAULT 'event',
  unit_price NUMERIC(12,4) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'BRL',
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.billing_meters TO authenticated;
GRANT ALL ON public.billing_meters TO service_role;
ALTER TABLE public.billing_meters ENABLE ROW LEVEL SECURITY;
CREATE POLICY "meters_read_all_auth" ON public.billing_meters FOR SELECT TO authenticated USING (true);

CREATE TABLE public.billing_usage_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL,
  meter_key TEXT NOT NULL REFERENCES public.billing_meters(meter_key),
  quantity NUMERIC(14,4) NOT NULL DEFAULT 1,
  unit_price NUMERIC(12,4) NOT NULL DEFAULT 0,
  amount NUMERIC(14,4) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'BRL',
  source TEXT,
  source_id UUID,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  period_ym TEXT NOT NULL DEFAULT to_char(now(), 'YYYY-MM'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.billing_usage_events TO authenticated;
GRANT ALL ON public.billing_usage_events TO service_role;
ALTER TABLE public.billing_usage_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "usage_events_tenant_read" ON public.billing_usage_events
  FOR SELECT TO authenticated
  USING (company_id = public.get_user_company_id(auth.uid()));
CREATE INDEX idx_usage_events_company_period ON public.billing_usage_events(company_id, period_ym);
CREATE INDEX idx_usage_events_meter ON public.billing_usage_events(meter_key);

CREATE OR REPLACE FUNCTION public.tg_billing_set_period_ym()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  NEW.period_ym := to_char(COALESCE(NEW.occurred_at, now()), 'YYYY-MM');
  RETURN NEW;
END;
$$;
CREATE TRIGGER trg_usage_events_period BEFORE INSERT OR UPDATE OF occurred_at ON public.billing_usage_events
  FOR EACH ROW EXECUTE FUNCTION public.tg_billing_set_period_ym();

CREATE TABLE public.billing_periods (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL,
  period_ym TEXT NOT NULL,
  total_amount NUMERIC(14,4) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'BRL',
  status TEXT NOT NULL DEFAULT 'open',
  breakdown JSONB NOT NULL DEFAULT '{}'::jsonb,
  closed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (company_id, period_ym)
);
GRANT SELECT ON public.billing_periods TO authenticated;
GRANT ALL ON public.billing_periods TO service_role;
ALTER TABLE public.billing_periods ENABLE ROW LEVEL SECURITY;
CREATE POLICY "billing_periods_tenant_read" ON public.billing_periods
  FOR SELECT TO authenticated
  USING (company_id = public.get_user_company_id(auth.uid()));

CREATE OR REPLACE FUNCTION public.record_usage(
  _company_id UUID,
  _meter_key TEXT,
  _quantity NUMERIC DEFAULT 1,
  _source TEXT DEFAULT NULL,
  _source_id UUID DEFAULT NULL,
  _metadata JSONB DEFAULT '{}'::jsonb
) RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _meter public.billing_meters%ROWTYPE;
  _event_id UUID;
BEGIN
  IF _company_id IS NULL THEN RAISE EXCEPTION 'company_id required'; END IF;
  SELECT * INTO _meter FROM public.billing_meters WHERE meter_key = _meter_key AND active LIMIT 1;
  IF NOT FOUND THEN RAISE EXCEPTION 'meter % not found or inactive', _meter_key; END IF;

  INSERT INTO public.billing_usage_events(
    company_id, meter_key, quantity, unit_price, amount, currency, source, source_id, metadata
  ) VALUES (
    _company_id, _meter.meter_key, _quantity, _meter.unit_price,
    ROUND(_quantity * _meter.unit_price, 4), _meter.currency, _source, _source_id, COALESCE(_metadata, '{}'::jsonb)
  ) RETURNING id INTO _event_id;
  RETURN _event_id;
END;
$$;
REVOKE ALL ON FUNCTION public.record_usage(UUID, TEXT, NUMERIC, TEXT, UUID, JSONB) FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.record_usage(UUID, TEXT, NUMERIC, TEXT, UUID, JSONB) TO service_role;

CREATE OR REPLACE FUNCTION public.get_current_usage_summary(_company_id UUID)
RETURNS TABLE (meter_key TEXT, meter_name TEXT, total_quantity NUMERIC, total_amount NUMERIC, currency TEXT)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT e.meter_key, m.name, SUM(e.quantity)::NUMERIC, SUM(e.amount)::NUMERIC, MAX(e.currency)
  FROM public.billing_usage_events e
  JOIN public.billing_meters m ON m.meter_key = e.meter_key
  WHERE e.company_id = _company_id
    AND e.period_ym = to_char(now(), 'YYYY-MM')
    AND public.get_user_company_id(auth.uid()) = _company_id
  GROUP BY e.meter_key, m.name
  ORDER BY SUM(e.amount) DESC;
$$;
GRANT EXECUTE ON FUNCTION public.get_current_usage_summary(UUID) TO authenticated;

CREATE OR REPLACE FUNCTION public.tg_billing_touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;
CREATE TRIGGER trg_billing_meters_updated BEFORE UPDATE ON public.billing_meters
  FOR EACH ROW EXECUTE FUNCTION public.tg_billing_touch_updated_at();
CREATE TRIGGER trg_billing_periods_updated BEFORE UPDATE ON public.billing_periods
  FOR EACH ROW EXECUTE FUNCTION public.tg_billing_touch_updated_at();

INSERT INTO public.billing_meters (meter_key, name, description, unit, unit_price, currency) VALUES
  ('plugin_execution', 'Execução de Plugin', 'Cada chamada a um plugin do Marketplace', 'event', 0.05, 'BRL'),
  ('ai_call', 'Chamada de IA', 'Cada requisição ao gateway de IA (chat/insights)', 'event', 0.02, 'BRL'),
  ('nfe_issued', 'NF-e emitida', 'Cada NF-e autorizada com sucesso', 'event', 0.15, 'BRL'),
  ('workflow_execution', 'Execução de Workflow', 'Cada instância de workflow concluída', 'event', 0.01, 'BRL')
ON CONFLICT (meter_key) DO NOTHING;

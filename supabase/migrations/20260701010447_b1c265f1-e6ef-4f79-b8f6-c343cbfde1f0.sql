
CREATE TABLE IF NOT EXISTS public.reinf_transmissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL,
  period_id UUID NOT NULL REFERENCES public.reinf_periods(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN ('R-2010','R-4020','R-2099','R-4099','LOTE')),
  env TEXT NOT NULL DEFAULT 'simulated' CHECK (env IN ('simulated','sandbox','prod')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','signed','sent','accepted','rejected','simulated','error')),
  protocol TEXT,
  payload_xml TEXT,
  response_xml TEXT,
  error TEXT,
  events_count INT NOT NULL DEFAULT 0,
  transmitted_at TIMESTAMPTZ,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_reinf_tx_company ON public.reinf_transmissions(company_id, period_id);
CREATE INDEX IF NOT EXISTS idx_reinf_tx_status ON public.reinf_transmissions(status);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.reinf_transmissions TO authenticated;
GRANT ALL ON public.reinf_transmissions TO service_role;

ALTER TABLE public.reinf_transmissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "reinf_tx_tenant_read" ON public.reinf_transmissions
  FOR SELECT TO authenticated
  USING (company_id = public.get_user_company_id(auth.uid()));

CREATE POLICY "reinf_tx_service_all" ON public.reinf_transmissions
  FOR ALL TO service_role
  USING (true) WITH CHECK (true);

CREATE TRIGGER trg_reinf_tx_updated
  BEFORE UPDATE ON public.reinf_transmissions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

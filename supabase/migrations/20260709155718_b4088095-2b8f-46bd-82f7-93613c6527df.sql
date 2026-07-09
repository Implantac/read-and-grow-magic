
-- 1) NFe certificates
CREATE TABLE public.nfe_certificates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL, -- e.g. fiscal-certs/{company_id}/{filename}.pfx
  filename TEXT NOT NULL,
  subject TEXT,
  issuer TEXT,
  serial TEXT,
  not_before TIMESTAMPTZ,
  not_after TIMESTAMPTZ,
  environment SMALLINT NOT NULL DEFAULT 2 CHECK (environment IN (1,2)), -- 1=prod 2=homolog
  password_secret_name TEXT NOT NULL, -- name of the Vault/env secret that holds the password
  active BOOLEAN NOT NULL DEFAULT true,
  uploaded_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ON public.nfe_certificates(company_id, active);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.nfe_certificates TO authenticated;
GRANT ALL ON public.nfe_certificates TO service_role;
ALTER TABLE public.nfe_certificates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "nfe_certs_select_tenant" ON public.nfe_certificates
  FOR SELECT TO authenticated
  USING (company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "nfe_certs_write_admin" ON public.nfe_certificates
  FOR ALL TO authenticated
  USING (
    company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid())
    AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager'))
  )
  WITH CHECK (
    company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid())
    AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager'))
  );

-- 2) SEFAZ status cache
CREATE TABLE public.sefaz_status_uf (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  uf CHAR(2) NOT NULL,
  environment SMALLINT NOT NULL CHECK (environment IN (1,2)),
  service TEXT NOT NULL DEFAULT 'nfe', -- nfe|nfce|cte
  status TEXT NOT NULL, -- online|offline|slow|contingency
  status_code TEXT,
  motivo TEXT,
  avg_response_ms INTEGER,
  observed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (uf, environment, service)
);
GRANT SELECT ON public.sefaz_status_uf TO authenticated;
GRANT ALL ON public.sefaz_status_uf TO service_role;
ALTER TABLE public.sefaz_status_uf ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sefaz_status_read_all" ON public.sefaz_status_uf
  FOR SELECT TO authenticated USING (true);

-- 3) NFe post-issue events (cancel, CCe)
CREATE TABLE public.nfe_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  nfe_id UUID NOT NULL REFERENCES public.nfe(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN ('cancel','cce','manifest')),
  sequence INTEGER NOT NULL DEFAULT 1,
  reason TEXT,
  correction TEXT,
  protocol TEXT,
  status TEXT NOT NULL DEFAULT 'pending', -- pending|sent|accepted|rejected
  xml_event TEXT,
  xml_response TEXT,
  status_code TEXT,
  status_reason TEXT,
  sent_at TIMESTAMPTZ,
  processed_at TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ON public.nfe_events(nfe_id);
CREATE INDEX ON public.nfe_events(company_id, event_type, status);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.nfe_events TO authenticated;
GRANT ALL ON public.nfe_events TO service_role;
ALTER TABLE public.nfe_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "nfe_events_select_tenant" ON public.nfe_events
  FOR SELECT TO authenticated
  USING (company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "nfe_events_write_roles" ON public.nfe_events
  FOR ALL TO authenticated
  USING (
    company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid())
    AND (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'manager') OR public.has_role(auth.uid(),'operator'))
  )
  WITH CHECK (
    company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid())
    AND (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'manager') OR public.has_role(auth.uid(),'operator'))
  );

-- 4) Extend nfe table (only add columns if missing)
ALTER TABLE public.nfe
  ADD COLUMN IF NOT EXISTS xml_signed TEXT,
  ADD COLUMN IF NOT EXISTS xml_authorized TEXT,
  ADD COLUMN IF NOT EXISTS danfe_url TEXT,
  ADD COLUMN IF NOT EXISTS environment SMALLINT DEFAULT 2,
  ADD COLUMN IF NOT EXISTS contingency BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS error_details JSONB;

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION public.tg_touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

DROP TRIGGER IF EXISTS trg_nfe_certs_touch ON public.nfe_certificates;
CREATE TRIGGER trg_nfe_certs_touch BEFORE UPDATE ON public.nfe_certificates
  FOR EACH ROW EXECUTE FUNCTION public.tg_touch_updated_at();

DROP TRIGGER IF EXISTS trg_nfe_events_touch ON public.nfe_events;
CREATE TRIGGER trg_nfe_events_touch BEFORE UPDATE ON public.nfe_events
  FOR EACH ROW EXECUTE FUNCTION public.tg_touch_updated_at();

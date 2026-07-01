
CREATE TABLE public.sre_postmortems (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL,
  incident_id UUID REFERENCES public.system_incidents(id) ON DELETE SET NULL,
  slo_id UUID REFERENCES public.sre_slos(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  summary TEXT,
  impact TEXT,
  root_cause TEXT,
  timeline TEXT,
  action_items JSONB NOT NULL DEFAULT '[]'::jsonb,
  severity TEXT NOT NULL DEFAULT 'major',
  status TEXT NOT NULL DEFAULT 'draft',
  author_id UUID,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_sre_postmortems_company ON public.sre_postmortems(company_id);
CREATE INDEX idx_sre_postmortems_slo ON public.sre_postmortems(slo_id);
CREATE INDEX idx_sre_postmortems_incident ON public.sre_postmortems(incident_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.sre_postmortems TO authenticated;
GRANT ALL ON public.sre_postmortems TO service_role;

ALTER TABLE public.sre_postmortems ENABLE ROW LEVEL SECURITY;

CREATE POLICY "postmortems_tenant_select" ON public.sre_postmortems
  FOR SELECT TO authenticated
  USING (company_id = public.get_user_company_id(auth.uid()));

CREATE POLICY "postmortems_tenant_write" ON public.sre_postmortems
  FOR ALL TO authenticated
  USING (company_id = public.get_user_company_id(auth.uid()))
  WITH CHECK (company_id = public.get_user_company_id(auth.uid()));

CREATE TRIGGER trg_sre_postmortems_updated_at
  BEFORE UPDATE ON public.sre_postmortems
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.sre_postmortems_by_slo(_slo_id UUID, _days INT DEFAULT 90)
RETURNS TABLE (
  id UUID, incident_id UUID, title TEXT, severity TEXT, status TEXT,
  published_at TIMESTAMPTZ, created_at TIMESTAMPTZ, action_items_count INT
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT p.id, p.incident_id, p.title, p.severity, p.status,
         p.published_at, p.created_at,
         COALESCE(jsonb_array_length(p.action_items), 0)::int
  FROM public.sre_postmortems p
  WHERE p.slo_id = _slo_id
    AND p.company_id = public.get_user_company_id(auth.uid())
    AND p.created_at >= now() - make_interval(days => _days)
  ORDER BY p.created_at DESC;
$$;

REVOKE ALL ON FUNCTION public.sre_postmortems_by_slo(UUID, INT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.sre_postmortems_by_slo(UUID, INT) TO authenticated, service_role;

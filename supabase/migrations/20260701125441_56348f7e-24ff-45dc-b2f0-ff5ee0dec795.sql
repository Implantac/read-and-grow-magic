-- Sprint 15 — On-call & Runbooks SRE

-- 1) On-call shifts
CREATE TABLE IF NOT EXISTS public.sre_oncall_shifts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  domain text NOT NULL,
  user_id uuid NOT NULL,
  starts_at timestamptz NOT NULL,
  ends_at timestamptz NOT NULL,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (ends_at > starts_at)
);
CREATE INDEX IF NOT EXISTS idx_sre_oncall_lookup ON public.sre_oncall_shifts(company_id, domain, starts_at, ends_at);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.sre_oncall_shifts TO authenticated;
GRANT ALL ON public.sre_oncall_shifts TO service_role;
ALTER TABLE public.sre_oncall_shifts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "oncall_select_tenant" ON public.sre_oncall_shifts
  FOR SELECT TO authenticated
  USING (company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()));
CREATE POLICY "oncall_write_admin" ON public.sre_oncall_shifts
  FOR ALL TO authenticated
  USING (company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()) AND public.has_role(auth.uid(),'admin'))
  WITH CHECK (company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()) AND public.has_role(auth.uid(),'admin'));

-- 2) Runbooks
CREATE TABLE IF NOT EXISTS public.sre_runbooks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  title text NOT NULL,
  domain text,                    -- null = global do tenant
  slo_id uuid REFERENCES public.sre_slos(id) ON DELETE SET NULL,
  severity text NOT NULL DEFAULT 'warning',
  steps_md text NOT NULL,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_sre_runbooks_tenant ON public.sre_runbooks(company_id, domain);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.sre_runbooks TO authenticated;
GRANT ALL ON public.sre_runbooks TO service_role;
ALTER TABLE public.sre_runbooks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "runbooks_select_tenant" ON public.sre_runbooks
  FOR SELECT TO authenticated
  USING (company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()));
CREATE POLICY "runbooks_write_admin" ON public.sre_runbooks
  FOR ALL TO authenticated
  USING (company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()) AND public.has_role(auth.uid(),'admin'))
  WITH CHECK (company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()) AND public.has_role(auth.uid(),'admin'));

-- 3) Trigger updated_at
CREATE TRIGGER trg_sre_oncall_updated BEFORE UPDATE ON public.sre_oncall_shifts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_sre_runbooks_updated BEFORE UPDATE ON public.sre_runbooks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 4) RPC: current on-call para domínio
CREATE OR REPLACE FUNCTION public.sre_current_oncall(_domain text)
RETURNS TABLE(shift_id uuid, user_id uuid, starts_at timestamptz, ends_at timestamptz, notes text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT s.id, s.user_id, s.starts_at, s.ends_at, s.notes
  FROM public.sre_oncall_shifts s
  WHERE s.domain = _domain
    AND s.company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid())
    AND now() BETWEEN s.starts_at AND s.ends_at
  ORDER BY s.starts_at DESC
  LIMIT 1;
$$;
REVOKE ALL ON FUNCTION public.sre_current_oncall(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.sre_current_oncall(text) TO authenticated, service_role;

-- 5) RPC: runbooks aplicáveis a um SLO
CREATE OR REPLACE FUNCTION public.sre_runbooks_for_slo(_slo_id uuid)
RETURNS TABLE(id uuid, title text, domain text, severity text, steps_md text, updated_at timestamptz)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  WITH slo AS (
    SELECT s.id, s.domain, s.company_id
    FROM public.sre_slos s
    WHERE s.id = _slo_id
      AND s.company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid())
  )
  SELECT r.id, r.title, r.domain, r.severity, r.steps_md, r.updated_at
  FROM public.sre_runbooks r, slo
  WHERE r.company_id = slo.company_id
    AND (r.slo_id = slo.id OR r.domain = slo.domain OR r.domain IS NULL)
  ORDER BY (r.slo_id = slo.id) DESC, (r.domain = slo.domain) DESC, r.updated_at DESC;
$$;
REVOKE ALL ON FUNCTION public.sre_runbooks_for_slo(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.sre_runbooks_for_slo(uuid) TO authenticated, service_role;

-- =========================================================
-- Observability & SRE per tenant
-- =========================================================

CREATE TABLE IF NOT EXISTS public.system_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  occurred_at timestamptz NOT NULL DEFAULT now(),
  source text NOT NULL,                 -- 'edge_fn', 'cron', 'trigger', 'client'
  event_type text NOT NULL,             -- 'error', 'warning', 'info', 'audit', 'sla_breach'
  severity text NOT NULL DEFAULT 'info' CHECK (severity IN ('debug','info','warning','error','critical')),
  message text NOT NULL,
  context jsonb NOT NULL DEFAULT '{}'::jsonb,
  correlation_id uuid,
  user_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.system_events TO authenticated;
GRANT ALL ON public.system_events TO service_role;
ALTER TABLE public.system_events ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_sev_company_time ON public.system_events(company_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_sev_company_sev ON public.system_events(company_id, severity, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_sev_correlation ON public.system_events(correlation_id) WHERE correlation_id IS NOT NULL;

CREATE POLICY sev_select ON public.system_events FOR SELECT TO authenticated
  USING (company_id = get_user_company_id(auth.uid()));
-- writes only via service_role / RPC (no insert policy for authenticated)


CREATE TABLE IF NOT EXISTS public.system_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  measured_at timestamptz NOT NULL DEFAULT now(),
  metric_key text NOT NULL,             -- 'edge_fn.duration_ms', 'api.requests', 'errors.count'
  metric_value numeric NOT NULL,
  unit text,                            -- 'ms', 'count', 'pct'
  dimensions jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.system_metrics TO authenticated;
GRANT ALL ON public.system_metrics TO service_role;
ALTER TABLE public.system_metrics ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_smet_company_key_time ON public.system_metrics(company_id, metric_key, measured_at DESC);

CREATE POLICY smet_select ON public.system_metrics FOR SELECT TO authenticated
  USING (company_id = get_user_company_id(auth.uid()));


CREATE TABLE IF NOT EXISTS public.system_incidents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  title text NOT NULL,
  description text,
  severity text NOT NULL DEFAULT 'minor' CHECK (severity IN ('minor','major','critical')),
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open','mitigating','resolved')),
  source text,                          -- 'auto' | 'manual' | rule name
  assigned_to uuid,
  opened_at timestamptz NOT NULL DEFAULT now(),
  acknowledged_at timestamptz,
  resolved_at timestamptz,
  resolution_notes text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.system_incidents TO authenticated;
GRANT ALL ON public.system_incidents TO service_role;
ALTER TABLE public.system_incidents ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_sinc_company_status ON public.system_incidents(company_id, status, opened_at DESC);

CREATE POLICY sinc_select ON public.system_incidents FOR SELECT TO authenticated
  USING (company_id = get_user_company_id(auth.uid()));

CREATE POLICY sinc_write ON public.system_incidents FOR INSERT TO authenticated
  WITH CHECK (
    company_id = get_user_company_id(auth.uid())
    AND (has_role(auth.uid(),'admin'::text,company_id) OR has_role(auth.uid(),'manager'::text,company_id))
  );

CREATE POLICY sinc_update ON public.system_incidents FOR UPDATE TO authenticated
  USING (
    company_id = get_user_company_id(auth.uid())
    AND (has_role(auth.uid(),'admin'::text,company_id) OR has_role(auth.uid(),'manager'::text,company_id))
  )
  WITH CHECK (company_id = get_user_company_id(auth.uid()));

CREATE TRIGGER tg_sinc_updated BEFORE UPDATE ON public.system_incidents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- =========================================================
-- RPCs
-- =========================================================

-- Record an event (used by edge fns, cron, and trusted client paths).
-- Forces the user's company_id when called by an authenticated user, never trusts a passed _company_id from clients.
CREATE OR REPLACE FUNCTION public.fn_record_event(
  _source text,
  _event_type text,
  _severity text,
  _message text,
  _context jsonb DEFAULT '{}'::jsonb,
  _correlation_id uuid DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_company uuid;
  v_id uuid;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;
  v_company := get_user_company_id(v_uid);
  IF v_company IS NULL THEN
    RAISE EXCEPTION 'no_company';
  END IF;
  IF _severity NOT IN ('debug','info','warning','error','critical') THEN
    RAISE EXCEPTION 'invalid_severity';
  END IF;
  INSERT INTO public.system_events(company_id, source, event_type, severity, message, context, correlation_id, user_id)
    VALUES (v_company, _source, _event_type, _severity, _message, COALESCE(_context,'{}'::jsonb), _correlation_id, v_uid)
    RETURNING id INTO v_id;
  RETURN v_id;
END;
$$;

REVOKE ALL ON FUNCTION public.fn_record_event(text,text,text,text,jsonb,uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.fn_record_event(text,text,text,text,jsonb,uuid) TO authenticated;


-- Tenant health summary for SRE dashboard
CREATE OR REPLACE FUNCTION public.fn_tenant_health()
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_company uuid := get_user_company_id(v_uid);
  v_24h timestamptz := now() - interval '24 hours';
  v_events jsonb;
  v_incidents jsonb;
BEGIN
  IF v_uid IS NULL OR v_company IS NULL THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  SELECT jsonb_build_object(
    'critical', COUNT(*) FILTER (WHERE severity='critical'),
    'error',    COUNT(*) FILTER (WHERE severity='error'),
    'warning',  COUNT(*) FILTER (WHERE severity='warning'),
    'info',     COUNT(*) FILTER (WHERE severity='info'),
    'total',    COUNT(*)
  ) INTO v_events
  FROM public.system_events
  WHERE company_id = v_company AND occurred_at >= v_24h;

  SELECT jsonb_build_object(
    'open',       COUNT(*) FILTER (WHERE status='open'),
    'mitigating', COUNT(*) FILTER (WHERE status='mitigating'),
    'resolved_24h', (SELECT COUNT(*) FROM public.system_incidents
                     WHERE company_id=v_company AND status='resolved' AND resolved_at >= v_24h)
  ) INTO v_incidents
  FROM public.system_incidents
  WHERE company_id = v_company AND status <> 'resolved';

  RETURN jsonb_build_object(
    'company_id', v_company,
    'window_hours', 24,
    'events', v_events,
    'incidents', v_incidents,
    'generated_at', now()
  );
END;
$$;

REVOKE ALL ON FUNCTION public.fn_tenant_health() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.fn_tenant_health() TO authenticated;

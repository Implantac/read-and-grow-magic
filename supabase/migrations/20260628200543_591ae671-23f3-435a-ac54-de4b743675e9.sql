
-- Alert rules per tenant
CREATE TABLE public.alert_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL,
  name TEXT NOT NULL,
  source TEXT,                       -- match system_events.source (NULL = any)
  min_severity TEXT NOT NULL DEFAULT 'error',  -- info|warning|error|critical
  threshold INTEGER NOT NULL DEFAULT 5,
  window_minutes INTEGER NOT NULL DEFAULT 5,
  incident_severity TEXT NOT NULL DEFAULT 'major', -- minor|major|critical
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  last_triggered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.alert_rules TO authenticated;
GRANT ALL ON public.alert_rules TO service_role;

ALTER TABLE public.alert_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "alert_rules_tenant_read" ON public.alert_rules
  FOR SELECT TO authenticated
  USING (company_id = public.get_user_company_id(auth.uid()));

CREATE POLICY "alert_rules_tenant_write" ON public.alert_rules
  FOR ALL TO authenticated
  USING (
    company_id = public.get_user_company_id(auth.uid())
    AND public.has_role(auth.uid(), 'admin')
  )
  WITH CHECK (
    company_id = public.get_user_company_id(auth.uid())
    AND public.has_role(auth.uid(), 'admin')
  );

CREATE INDEX idx_alert_rules_company ON public.alert_rules(company_id) WHERE enabled;

-- Link incidents to alert rules (de-dup within window)
ALTER TABLE public.system_incidents
  ADD COLUMN IF NOT EXISTS alert_rule_id UUID REFERENCES public.alert_rules(id) ON DELETE SET NULL;

CREATE OR REPLACE FUNCTION public.update_alert_rules_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER trg_alert_rules_updated
  BEFORE UPDATE ON public.alert_rules
  FOR EACH ROW EXECUTE FUNCTION public.update_alert_rules_updated_at();

-- Severity ranking helper
CREATE OR REPLACE FUNCTION public.severity_rank(_sev TEXT)
RETURNS INTEGER LANGUAGE sql IMMUTABLE SET search_path = public AS $$
  SELECT CASE _sev
    WHEN 'debug' THEN 0
    WHEN 'info' THEN 1
    WHEN 'warning' THEN 2
    WHEN 'error' THEN 3
    WHEN 'critical' THEN 4
    ELSE 0 END
$$;

-- Evaluator: opens an incident when threshold is crossed within window
CREATE OR REPLACE FUNCTION public.fn_evaluate_alert_rules()
RETURNS INTEGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  r RECORD;
  cnt INTEGER;
  opened INTEGER := 0;
  has_open BOOLEAN;
BEGIN
  FOR r IN
    SELECT * FROM public.alert_rules WHERE enabled = TRUE
  LOOP
    SELECT COUNT(*) INTO cnt
    FROM public.system_events e
    WHERE e.company_id = r.company_id
      AND (r.source IS NULL OR e.source = r.source)
      AND public.severity_rank(e.severity) >= public.severity_rank(r.min_severity)
      AND e.occurred_at >= now() - make_interval(mins => r.window_minutes);

    IF cnt >= r.threshold THEN
      -- skip if rule already triggered an OPEN incident within window
      SELECT EXISTS(
        SELECT 1 FROM public.system_incidents i
        WHERE i.alert_rule_id = r.id
          AND i.status IN ('open','mitigating')
          AND i.opened_at >= now() - make_interval(mins => r.window_minutes)
      ) INTO has_open;

      IF NOT has_open THEN
        INSERT INTO public.system_incidents(
          company_id, title, description, severity, status, source, alert_rule_id, opened_at
        ) VALUES (
          r.company_id,
          'Alerta automático: ' || r.name,
          format('%s eventos %s+ %sem %s min (limite=%s)',
            cnt, r.min_severity,
            COALESCE('em "' || r.source || '" ', ''),
            r.window_minutes, r.threshold),
          r.incident_severity,
          'open',
          COALESCE(r.source, 'alert_engine'),
          r.id,
          now()
        );
        UPDATE public.alert_rules SET last_triggered_at = now() WHERE id = r.id;
        opened := opened + 1;
      END IF;
    END IF;
  END LOOP;
  RETURN opened;
END; $$;

REVOKE EXECUTE ON FUNCTION public.fn_evaluate_alert_rules() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.fn_evaluate_alert_rules() TO service_role;

-- Schedule every minute
DO $$
BEGIN
  PERFORM cron.unschedule('evaluate-alert-rules');
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

SELECT cron.schedule(
  'evaluate-alert-rules',
  '* * * * *',
  $$ SELECT public.fn_evaluate_alert_rules(); $$
);

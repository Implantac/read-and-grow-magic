
-- ADR-0008: Auto-notify + SLO incident timeline
-- Trigger: on new critical incident, invoke notify-incident-email via pg_net

CREATE OR REPLACE FUNCTION public.tg_notify_incident_email()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  fn_url text := 'https://arcuhqdiydlvekanychw.supabase.co/functions/v1/notify-incident-email';
  anon_key text := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFyY3VocWRpeWRsdmVrYW55Y2h3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI2MzkwMjcsImV4cCI6MjA4ODIxNTAyN30.A8cr7OwGiu2LvrPk7R5un4Ctd42XfxWy_sh7ViS16Vo';
BEGIN
  IF NEW.severity = 'critical' THEN
    PERFORM net.http_post(
      url := fn_url,
      headers := jsonb_build_object('Content-Type','application/json','apikey',anon_key,'Authorization','Bearer '||anon_key),
      body := jsonb_build_object('incident_id', NEW.id)
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_incident_email ON public.system_incidents;
CREATE TRIGGER trg_notify_incident_email
AFTER INSERT ON public.system_incidents
FOR EACH ROW EXECUTE FUNCTION public.tg_notify_incident_email();

-- Timeline por SLO
CREATE OR REPLACE FUNCTION public.sre_slo_incident_timeline(_slo_id uuid, _days int DEFAULT 30)
RETURNS TABLE (
  id uuid, title text, severity text, status text, source text,
  opened_at timestamptz, acknowledged_at timestamptz, resolved_at timestamptz,
  minutes_to_ack numeric, minutes_to_resolve numeric
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT i.id, i.title, i.severity, i.status, i.source,
         i.opened_at, i.acknowledged_at, i.resolved_at,
         CASE WHEN i.acknowledged_at IS NOT NULL
              THEN EXTRACT(EPOCH FROM (i.acknowledged_at - i.opened_at))/60 END,
         CASE WHEN i.resolved_at IS NOT NULL
              THEN EXTRACT(EPOCH FROM (i.resolved_at - i.opened_at))/60 END
  FROM public.system_incidents i
  JOIN public.sre_slos s ON s.id = i.slo_id
  WHERE i.slo_id = _slo_id
    AND s.company_id = public.get_user_company_id(auth.uid())
    AND i.opened_at >= now() - (_days || ' days')::interval
  ORDER BY i.opened_at DESC;
$$;

REVOKE ALL ON FUNCTION public.sre_slo_incident_timeline(uuid, int) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.sre_slo_incident_timeline(uuid, int) TO authenticated, service_role;

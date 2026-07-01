-- Sprint 16 — SLO burn → on-call alerts

ALTER TABLE public.system_incidents ADD COLUMN IF NOT EXISTS slo_id uuid REFERENCES public.sre_slos(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_incidents_slo ON public.system_incidents(slo_id);

CREATE OR REPLACE FUNCTION public.sre_slo_burn_scan()
RETURNS TABLE(slo_id uuid, action text, incident_id uuid)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  r record;
  v_company uuid;
  v_incident_id uuid;
  v_oncall uuid;
  v_dedupe boolean;
BEGIN
  FOR r IN
    SELECT * FROM public.sre_slo_status()
  LOOP
    IF r.burn_rate_1h < 2 AND r.error_budget_consumed_pct < 80 THEN
      CONTINUE;
    END IF;

    SELECT s.company_id INTO v_company FROM public.sre_slos s WHERE s.id = r.id;

    -- dedupe: incidente aberto para este SLO na última 1h
    SELECT EXISTS(
      SELECT 1 FROM public.system_incidents i
      WHERE i.slo_id = r.id
        AND i.status = 'open'
        AND i.opened_at > now() - interval '1 hour'
    ) INTO v_dedupe;

    IF v_dedupe THEN
      slo_id := r.id; action := 'skipped_dedupe'; incident_id := NULL;
      RETURN NEXT;
      CONTINUE;
    END IF;

    -- resolve on-call ativo
    SELECT s.user_id INTO v_oncall
    FROM public.sre_oncall_shifts s
    WHERE s.company_id = v_company
      AND s.domain = r.domain
      AND now() BETWEEN s.starts_at AND s.ends_at
    ORDER BY s.starts_at DESC LIMIT 1;

    INSERT INTO public.system_incidents (
      company_id, title, description, severity, source, status, opened_at, slo_id
    ) VALUES (
      v_company,
      format('SLO %s em burn (%.2fx)', r.name, r.burn_rate_1h),
      format('Domínio %s · budget consumido %.1f%% · success %.3f%%',
        r.domain, r.error_budget_consumed_pct, r.success_rate),
      CASE WHEN r.status = 'breached' OR r.burn_rate_1h >= 4 THEN 'critical' ELSE 'warning' END,
      'sre_slo_scan', 'open', now(), r.id
    ) RETURNING id INTO v_incident_id;

    IF v_oncall IS NOT NULL THEN
      INSERT INTO public.notifications (user_id, title, message, type, metadata)
      VALUES (
        v_oncall,
        format('[On-call] SLO %s', r.name),
        format('Burn %.2fx no domínio %s — abrir runbook e mitigar.', r.burn_rate_1h, r.domain),
        'incident',
        jsonb_build_object('incident_id', v_incident_id, 'slo_id', r.id, 'domain', r.domain)
      );
    END IF;

    slo_id := r.id; action := 'incident_opened'; incident_id := v_incident_id;
    RETURN NEXT;
  END LOOP;
END;
$$;

REVOKE ALL ON FUNCTION public.sre_slo_burn_scan() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.sre_slo_burn_scan() TO authenticated, service_role;
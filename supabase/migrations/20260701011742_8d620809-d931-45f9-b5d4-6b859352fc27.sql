
CREATE TABLE IF NOT EXISTS public.sre_slos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  name text NOT NULL,
  domain text NOT NULL,
  target_pct numeric NOT NULL DEFAULT 99.5 CHECK (target_pct > 0 AND target_pct <= 100),
  window_days int NOT NULL DEFAULT 30 CHECK (window_days > 0 AND window_days <= 90),
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.sre_slos TO authenticated;
GRANT ALL ON public.sre_slos TO service_role;

ALTER TABLE public.sre_slos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sre_slos tenant read" ON public.sre_slos
  FOR SELECT TO authenticated
  USING (company_id = public.get_user_company_id(auth.uid()));

CREATE POLICY "sre_slos tenant write" ON public.sre_slos
  FOR ALL TO authenticated
  USING (company_id = public.get_user_company_id(auth.uid()))
  WITH CHECK (company_id = public.get_user_company_id(auth.uid()));

CREATE TRIGGER trg_sre_slos_updated
BEFORE UPDATE ON public.sre_slos
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.sre_slo_status()
RETURNS TABLE(
  id uuid,
  name text,
  domain text,
  target_pct numeric,
  window_days int,
  total_events bigint,
  failed_events bigint,
  success_rate numeric,
  error_budget_consumed_pct numeric,
  burn_rate_1h numeric,
  status text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_company uuid := public.get_user_company_id(auth.uid());
BEGIN
  IF v_company IS NULL THEN RETURN; END IF;
  RETURN QUERY
  WITH s AS (
    SELECT * FROM public.sre_slos
    WHERE company_id = v_company AND active = true
  ),
  win AS (
    SELECT
      s.id, s.name, s.domain, s.target_pct, s.window_days,
      COUNT(e.*) FILTER (WHERE e.occurred_at >= now() - (s.window_days || ' days')::interval) AS total_w,
      COUNT(e.*) FILTER (WHERE e.occurred_at >= now() - (s.window_days || ' days')::interval
                          AND e.severity IN ('error','critical')) AS failed_w,
      COUNT(e.*) FILTER (WHERE e.occurred_at >= now() - interval '1 hour') AS total_1h,
      COUNT(e.*) FILTER (WHERE e.occurred_at >= now() - interval '1 hour'
                          AND e.severity IN ('error','critical')) AS failed_1h
    FROM s
    LEFT JOIN public.system_events e
      ON e.company_id = v_company AND e.source = s.domain
    GROUP BY s.id, s.name, s.domain, s.target_pct, s.window_days
  )
  SELECT
    w.id, w.name, w.domain, w.target_pct, w.window_days,
    w.total_w AS total_events,
    w.failed_w AS failed_events,
    CASE WHEN w.total_w > 0 THEN ROUND((1 - w.failed_w::numeric / w.total_w) * 100, 3) ELSE 100 END AS success_rate,
    CASE
      WHEN w.total_w = 0 OR w.target_pct >= 100 THEN 0
      ELSE ROUND( LEAST( (w.failed_w::numeric / w.total_w) / ((100 - w.target_pct)/100) * 100, 999)::numeric, 2)
    END AS error_budget_consumed_pct,
    CASE
      WHEN w.total_1h = 0 OR w.target_pct >= 100 THEN 0
      ELSE ROUND( (w.failed_1h::numeric / w.total_1h) / ((100 - w.target_pct)/100)::numeric, 3)
    END AS burn_rate_1h,
    CASE
      WHEN w.total_w = 0 THEN 'healthy'
      WHEN (w.failed_w::numeric / NULLIF(w.total_w,0)) / NULLIF((100 - w.target_pct)/100,0) >= 1 THEN 'breached'
      WHEN (w.failed_w::numeric / NULLIF(w.total_w,0)) / NULLIF((100 - w.target_pct)/100,0) >= 0.8 THEN 'warning'
      ELSE 'healthy'
    END AS status
  FROM win w
  ORDER BY error_budget_consumed_pct DESC;
END;
$$;

REVOKE ALL ON FUNCTION public.sre_slo_status() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.sre_slo_status() TO authenticated;

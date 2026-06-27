
CREATE OR REPLACE FUNCTION public.close_billing_period(_company_id uuid, _ym text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_total_events bigint;
  v_total_cost numeric;
  v_breakdown jsonb;
BEGIN
  SELECT
    COALESCE(SUM(e.quantity), 0),
    COALESCE(SUM(e.quantity * COALESCE(m.unit_price, 0)), 0),
    COALESCE(jsonb_object_agg(m.code, jsonb_build_object(
      'events', e_sum.events,
      'cost', e_sum.cost
    )), '{}'::jsonb)
  INTO v_total_events, v_total_cost, v_breakdown
  FROM public.billing_usage_events e
  JOIN public.billing_meters m ON m.id = e.meter_id
  JOIN LATERAL (
    SELECT SUM(e2.quantity) AS events,
           SUM(e2.quantity * COALESCE(m.unit_price, 0)) AS cost
    FROM public.billing_usage_events e2
    WHERE e2.company_id = _company_id
      AND e2.period_ym = _ym
      AND e2.meter_id = e.meter_id
  ) e_sum ON true
  WHERE e.company_id = _company_id
    AND e.period_ym = _ym;

  INSERT INTO public.billing_periods (company_id, period_ym, total_events, total_cost, breakdown, closed_at)
  VALUES (_company_id, _ym, v_total_events, v_total_cost, v_breakdown, now())
  ON CONFLICT (company_id, period_ym) DO UPDATE
  SET total_events = EXCLUDED.total_events,
      total_cost = EXCLUDED.total_cost,
      breakdown = EXCLUDED.breakdown,
      closed_at = now(),
      updated_at = now();
END;
$$;

CREATE OR REPLACE FUNCTION public.close_all_billing_periods()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  r record;
  v_ym text := to_char(now(), 'YYYY-MM');
BEGIN
  FOR r IN
    SELECT DISTINCT company_id
    FROM public.billing_usage_events
    WHERE period_ym = v_ym
  LOOP
    PERFORM public.close_billing_period(r.company_id, v_ym);
  END LOOP;
END;
$$;

REVOKE ALL ON FUNCTION public.close_billing_period(uuid, text) FROM public, anon, authenticated;
REVOKE ALL ON FUNCTION public.close_all_billing_periods() FROM public, anon, authenticated;

SELECT cron.unschedule('billing-close-periods')
WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'billing-close-periods');

SELECT cron.schedule(
  'billing-close-periods',
  '0 3 * * *',
  $$ SELECT public.close_all_billing_periods(); $$
);

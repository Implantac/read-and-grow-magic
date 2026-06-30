
-- get_current_plan: returns active plan for caller's company
CREATE OR REPLACE FUNCTION public.get_current_plan()
RETURNS TABLE(
  plan_id uuid, plan_slug text, plan_name text,
  max_users int, max_companies int, max_branches int,
  max_orders_month int, nfe_per_month int, ai_calls_per_month int,
  storage_mb int, allowed_modules text[],
  subscription_status text, trial_end timestamptz
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT p.id, p.slug, p.name,
         p.max_users, p.max_companies, p.max_branches,
         p.max_orders_month, p.nfe_per_month, p.ai_calls_per_month,
         p.storage_mb, p.allowed_modules,
         s.status, s.trial_end
  FROM public.profiles pr
  JOIN public.subscriptions s ON s.company_id = pr.company_id
  JOIN public.plans p ON p.id = s.plan_id
  WHERE pr.id = auth.uid()
    AND s.status IN ('active','trialing','past_due')
  ORDER BY (s.status='active') DESC, s.current_period_end DESC NULLS LAST
  LIMIT 1;
$$;

-- check_quota: returns usage status for given metric
CREATE OR REPLACE FUNCTION public.check_quota(p_metric text)
RETURNS TABLE(metric text, current_value int, limit_value int, percent numeric, ok boolean)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_company uuid;
  v_period text := to_char(now(), 'YYYY-MM');
  v_current int := 0;
  v_limit int := 0;
BEGIN
  SELECT company_id INTO v_company FROM public.profiles WHERE id = auth.uid();
  IF v_company IS NULL THEN
    RETURN QUERY SELECT p_metric, 0, 0, 0::numeric, false; RETURN;
  END IF;

  SELECT ut.current_value, ut.limit_value INTO v_current, v_limit
    FROM public.usage_tracking ut
   WHERE ut.company_id = v_company AND ut.metric = p_metric AND ut.period = v_period
   LIMIT 1;

  v_current := COALESCE(v_current, 0);
  v_limit := COALESCE(v_limit, 0);

  RETURN QUERY SELECT
    p_metric,
    v_current,
    v_limit,
    CASE WHEN v_limit > 0 THEN ROUND((v_current::numeric / v_limit) * 100, 1) ELSE 0 END,
    CASE WHEN v_limit <= 0 THEN true ELSE v_current < v_limit END;
END;
$$;

-- get_usage_summary: all metrics for current company
CREATE OR REPLACE FUNCTION public.get_usage_summary()
RETURNS TABLE(metric text, current_value int, limit_value int, percent numeric, period text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT ut.metric, ut.current_value, ut.limit_value,
    CASE WHEN ut.limit_value > 0 THEN ROUND((ut.current_value::numeric / ut.limit_value) * 100, 1) ELSE 0 END,
    ut.period
  FROM public.usage_tracking ut
  JOIN public.profiles pr ON pr.company_id = ut.company_id
  WHERE pr.id = auth.uid()
    AND ut.period = to_char(now(), 'YYYY-MM');
$$;

GRANT EXECUTE ON FUNCTION public.get_current_plan() TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_quota(text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_usage_summary() TO authenticated;

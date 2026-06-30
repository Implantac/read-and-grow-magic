
DROP VIEW IF EXISTS public.v_current_usage CASCADE;

CREATE OR REPLACE FUNCTION public.get_current_plan()
RETURNS TABLE (
  plan_id UUID, plan_slug TEXT, plan_name TEXT,
  max_users INT, max_companies INT, max_branches INT,
  max_orders_month INT, nfe_per_month INT, ai_calls_per_month INT,
  storage_mb INT, allowed_modules TEXT[],
  subscription_status TEXT, trial_end TIMESTAMPTZ
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT p.id, p.slug, p.name,
         p.max_users, p.max_companies, p.max_branches,
         p.max_orders_month, p.nfe_per_month, p.ai_calls_per_month,
         p.storage_mb, p.allowed_modules,
         s.status, s.trial_end
    FROM public.subscriptions s
    JOIN public.plans p ON p.id = s.plan_id
   WHERE s.company_id = public.get_user_company_id(auth.uid())
     AND s.status IN ('active','trialing','past_due')
   ORDER BY s.current_period_end DESC NULLS LAST
   LIMIT 1;
$$;
REVOKE EXECUTE ON FUNCTION public.get_current_plan() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_current_plan() TO authenticated;

CREATE OR REPLACE FUNCTION public.record_usage(
  _company_id UUID, _meter_key TEXT, _quantity NUMERIC DEFAULT 1, _metadata JSONB DEFAULT '{}'::jsonb
) RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_unit_price NUMERIC := 0; v_currency TEXT := 'BRL';
  v_period TEXT := to_char(now(), 'YYYY-MM'); v_metric TEXT; v_limit INT;
BEGIN
  SELECT COALESCE(unit_price,0), COALESCE(currency,'BRL') INTO v_unit_price, v_currency
    FROM public.billing_meters WHERE meter_key = _meter_key;

  INSERT INTO public.billing_usage_events (
    company_id, meter_key, quantity, unit_price, amount, currency, source, metadata, occurred_at
  ) VALUES (
    _company_id, _meter_key, _quantity, v_unit_price, v_unit_price * _quantity, v_currency, 'system', _metadata, now()
  );

  v_metric := CASE _meter_key
    WHEN 'ai_call' THEN 'ai_calls'
    WHEN 'nfe_issued' THEN 'nfe'
    WHEN 'order_created' THEN 'orders'
    ELSE _meter_key END;

  SELECT CASE v_metric
    WHEN 'ai_calls' THEN p.ai_calls_per_month
    WHEN 'nfe' THEN p.nfe_per_month
    WHEN 'orders' THEN p.max_orders_month
    ELSE NULL END INTO v_limit
   FROM public.subscriptions s
   JOIN public.plans p ON p.id = s.plan_id
  WHERE s.company_id = _company_id
    AND s.status IN ('active','trialing','past_due')
  ORDER BY s.current_period_end DESC NULLS LAST LIMIT 1;

  INSERT INTO public.usage_tracking (company_id, metric, current_value, limit_value, period, updated_at)
  VALUES (_company_id, v_metric, _quantity, v_limit, v_period, now())
  ON CONFLICT (company_id, metric, period)
  DO UPDATE SET current_value = public.usage_tracking.current_value + EXCLUDED.current_value,
                limit_value = EXCLUDED.limit_value, updated_at = now();
END;
$$;
REVOKE EXECUTE ON FUNCTION public.record_usage(UUID, TEXT, NUMERIC, JSONB) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.record_usage(UUID, TEXT, NUMERIC, JSONB) TO service_role;

CREATE UNIQUE INDEX IF NOT EXISTS uq_usage_tracking_period
  ON public.usage_tracking (company_id, metric, period);

CREATE OR REPLACE FUNCTION public.check_quota(_company_id UUID, _metric TEXT)
RETURNS JSONB
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_caller UUID := public.get_user_company_id(auth.uid());
  v_current NUMERIC := 0; v_limit INT; v_period TEXT := to_char(now(), 'YYYY-MM');
BEGIN
  IF auth.uid() IS NOT NULL AND v_caller IS DISTINCT FROM _company_id THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;

  SELECT CASE _metric
    WHEN 'ai_calls' THEN p.ai_calls_per_month
    WHEN 'nfe' THEN p.nfe_per_month
    WHEN 'orders' THEN p.max_orders_month
    WHEN 'users' THEN p.max_users
    WHEN 'branches' THEN p.max_branches
    ELSE NULL END INTO v_limit
   FROM public.subscriptions s
   JOIN public.plans p ON p.id = s.plan_id
  WHERE s.company_id = _company_id
    AND s.status IN ('active','trialing','past_due')
  ORDER BY s.current_period_end DESC NULLS LAST LIMIT 1;

  IF _metric = 'users' THEN
    SELECT COUNT(*) INTO v_current FROM public.profiles WHERE company_id = _company_id;
  ELSIF _metric = 'branches' THEN
    SELECT COUNT(*) INTO v_current FROM public.branches WHERE company_id = _company_id;
  ELSE
    SELECT COALESCE(current_value,0) INTO v_current
      FROM public.usage_tracking
     WHERE company_id = _company_id AND metric = _metric AND period = v_period;
  END IF;

  RETURN jsonb_build_object(
    'allowed', (v_limit IS NULL OR v_limit = 0 OR v_current < v_limit),
    'current', v_current,
    'limit', v_limit,
    'remaining', CASE WHEN v_limit IS NULL THEN NULL ELSE GREATEST(v_limit - v_current, 0) END
  );
END;
$$;
REVOKE EXECUTE ON FUNCTION public.check_quota(UUID, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.check_quota(UUID, TEXT) TO authenticated, service_role;

CREATE VIEW public.v_current_usage
WITH (security_invoker = true) AS
SELECT company_id, metric, current_value, limit_value, period, updated_at,
       CASE WHEN limit_value IS NULL OR limit_value = 0 THEN 0
            ELSE ROUND(LEAST(current_value::numeric / limit_value * 100, 999), 2) END AS usage_percent
  FROM public.usage_tracking
 WHERE period = to_char(now(), 'YYYY-MM');

GRANT SELECT ON public.v_current_usage TO authenticated;

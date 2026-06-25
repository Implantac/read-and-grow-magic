
-- Módulo 1.3: Medidor de Uso e Bloqueio Gracioso

-- Garante unicidade por (company_id, metric, period) para upsert
CREATE UNIQUE INDEX IF NOT EXISTS usage_tracking_company_metric_period_key
  ON public.usage_tracking (company_id, metric, period);

-- Helper: período corrente (YYYY-MM)
CREATE OR REPLACE FUNCTION public.current_billing_period()
RETURNS text
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT to_char(now(), 'YYYY-MM');
$$;

REVOKE EXECUTE ON FUNCTION public.current_billing_period() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.current_billing_period() TO authenticated, service_role;

-- Função: increment_usage (chamada pelas edges / triggers)
CREATE OR REPLACE FUNCTION public.increment_usage(
  _company_id uuid,
  _metric text,
  _delta integer DEFAULT 1
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _period text := public.current_billing_period();
  _plan_limit integer;
  _new_value integer;
BEGIN
  IF _company_id IS NULL OR _metric IS NULL THEN
    RAISE EXCEPTION 'company_id and metric are required';
  END IF;

  -- Resolve limite do plano
  SELECT CASE _metric
           WHEN 'orders'    THEN p.max_orders_month
           WHEN 'nfe'       THEN p.nfe_per_month
           WHEN 'ai_calls'  THEN p.ai_calls_per_month
           WHEN 'users'     THEN p.max_users
           WHEN 'branches'  THEN p.max_branches
           ELSE NULL
         END
    INTO _plan_limit
    FROM public.subscriptions s
    JOIN public.plans p ON p.id = s.plan_id
   WHERE s.company_id = _company_id
     AND s.status IN ('active','trialing')
   ORDER BY s.created_at DESC
   LIMIT 1;

  INSERT INTO public.usage_tracking (company_id, metric, current_value, limit_value, period, updated_at)
  VALUES (_company_id, _metric, GREATEST(_delta, 0), _plan_limit, _period, now())
  ON CONFLICT (company_id, metric, period)
  DO UPDATE SET
    current_value = public.usage_tracking.current_value + _delta,
    limit_value   = COALESCE(EXCLUDED.limit_value, public.usage_tracking.limit_value),
    updated_at    = now()
  RETURNING current_value INTO _new_value;

  RETURN _new_value;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.increment_usage(uuid, text, integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.increment_usage(uuid, text, integer) TO service_role;

-- Função: check_quota (retorna jsonb com {allowed, current, limit, metric})
CREATE OR REPLACE FUNCTION public.check_quota(
  _company_id uuid,
  _metric text
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _period text := public.current_billing_period();
  _row public.usage_tracking%ROWTYPE;
  _plan_limit integer;
BEGIN
  IF _company_id IS NULL OR _metric IS NULL THEN
    RETURN jsonb_build_object('allowed', false, 'reason', 'invalid_params');
  END IF;

  SELECT CASE _metric
           WHEN 'orders'    THEN p.max_orders_month
           WHEN 'nfe'       THEN p.nfe_per_month
           WHEN 'ai_calls'  THEN p.ai_calls_per_month
           WHEN 'users'     THEN p.max_users
           WHEN 'branches'  THEN p.max_branches
           ELSE NULL
         END
    INTO _plan_limit
    FROM public.subscriptions s
    JOIN public.plans p ON p.id = s.plan_id
   WHERE s.company_id = _company_id
     AND s.status IN ('active','trialing')
   ORDER BY s.created_at DESC
   LIMIT 1;

  SELECT * INTO _row
    FROM public.usage_tracking
   WHERE company_id = _company_id AND metric = _metric AND period = _period;

  RETURN jsonb_build_object(
    'metric', _metric,
    'period', _period,
    'current', COALESCE(_row.current_value, 0),
    'limit', _plan_limit,
    'allowed', (_plan_limit IS NULL OR _plan_limit <= 0 OR COALESCE(_row.current_value, 0) < _plan_limit),
    'remaining', CASE WHEN _plan_limit IS NULL OR _plan_limit <= 0 THEN NULL
                      ELSE GREATEST(_plan_limit - COALESCE(_row.current_value, 0), 0) END
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.check_quota(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.check_quota(uuid, text) TO authenticated, service_role;

-- View consolidada de uso vs limite para o tenant atual
CREATE OR REPLACE VIEW public.v_current_usage AS
SELECT
  ut.company_id,
  ut.metric,
  ut.current_value,
  ut.limit_value,
  ut.period,
  CASE
    WHEN ut.limit_value IS NULL OR ut.limit_value <= 0 THEN 0
    ELSE LEAST(ROUND((ut.current_value::numeric / ut.limit_value) * 100, 2), 999)
  END AS usage_percent,
  ut.updated_at
FROM public.usage_tracking ut
WHERE ut.period = public.current_billing_period();

GRANT SELECT ON public.v_current_usage TO authenticated, service_role;


-- Fase 9 — Snapshots de forecast multi-tenant
ALTER TABLE public.ai_forecast_snapshots
  ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS period_key TEXT,
  ADD COLUMN IF NOT EXISTS actual_revenue NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS target_revenue NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS gap NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS variance_pct NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS snapshot_type TEXT DEFAULT 'auto_forecast',
  ADD COLUMN IF NOT EXISTS created_by UUID;

CREATE INDEX IF NOT EXISTS idx_ai_forecast_snapshots_company_period
  ON public.ai_forecast_snapshots(company_id, period_key, forecast_date DESC);

-- Rebuild RLS with tenant scope
DROP POLICY IF EXISTS "authenticated_read_ai_forecasts" ON public.ai_forecast_snapshots;
DROP POLICY IF EXISTS "authenticated_insert_ai_forecasts" ON public.ai_forecast_snapshots;

CREATE POLICY "forecast_snap_select_company"
  ON public.ai_forecast_snapshots FOR SELECT TO authenticated
  USING (
    company_id IS NULL
    OR company_id = public.get_user_company_id(auth.uid())
    OR public.has_role(auth.uid(), 'admin'::app_role, company_id)
  );

CREATE POLICY "forecast_snap_insert_company"
  ON public.ai_forecast_snapshots FOR INSERT TO authenticated
  WITH CHECK (
    company_id = public.get_user_company_id(auth.uid())
    OR public.has_role(auth.uid(), 'admin'::app_role, company_id)
  );

CREATE POLICY "forecast_snap_service_all"
  ON public.ai_forecast_snapshots FOR ALL TO service_role
  USING (true) WITH CHECK (true);

GRANT SELECT, INSERT ON public.ai_forecast_snapshots TO authenticated;
GRANT ALL ON public.ai_forecast_snapshots TO service_role;

-- Consolidation function
CREATE OR REPLACE FUNCTION public.record_forecast_snapshot(
  _company_id UUID,
  _period_key TEXT,
  _snapshot_type TEXT DEFAULT 'auto_forecast'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _period_start DATE;
  _period_end   DATE;
  _target       NUMERIC := 0;
  _actual       NUMERIC := 0;
  _confirmed    NUMERIC := 0;
  _weighted     NUMERIC := 0;
  _predicted    NUMERIC := 0;
  _gap          NUMERIC := 0;
  _variance     NUMERIC := 0;
  _by_rep       JSONB   := '{}'::jsonb;
  _snap_id      UUID;
BEGIN
  IF _company_id IS NULL OR _period_key IS NULL THEN
    RAISE EXCEPTION 'company_id and period_key are required';
  END IF;

  _period_start := to_date(_period_key || '-01', 'YYYY-MM-DD');
  _period_end   := (_period_start + INTERVAL '1 month')::date;

  -- Target for the period (any entity, aggregated)
  SELECT COALESCE(SUM(target_amount), 0) INTO _target
  FROM public.sales_targets
  WHERE company_id = _company_id
    AND period_start >= _period_start
    AND period_start <  _period_end;

  -- Actual realized (orders faturados / confirmados)
  SELECT COALESCE(SUM(total_amount), 0) INTO _actual
  FROM public.orders
  WHERE company_id = _company_id
    AND created_at >= _period_start
    AND created_at <  _period_end
    AND status IN ('faturado','entregue','concluido','completed','delivered','invoiced');

  -- Confirmed pipeline (aprovados aguardando faturamento)
  SELECT COALESCE(SUM(total_amount), 0) INTO _confirmed
  FROM public.orders
  WHERE company_id = _company_id
    AND created_at >= _period_start
    AND created_at <  _period_end
    AND status IN ('aprovado','approved','em_producao','em_separacao');

  -- Weighted pipeline from CRM opportunities
  SELECT COALESCE(SUM(COALESCE(value,0) * COALESCE(probability,0) / 100.0), 0)
    INTO _weighted
  FROM public.crm_opportunities
  WHERE company_id = _company_id
    AND (expected_close_date IS NULL
         OR (expected_close_date >= _period_start AND expected_close_date < _period_end))
    AND COALESCE(status, 'open') NOT IN ('won','lost','ganho','perdido');

  _predicted := _actual + _confirmed + _weighted;
  _gap       := _predicted - _target;
  IF _target > 0 THEN
    _variance := ROUND(((_predicted - _target) / _target) * 100.0, 2);
  END IF;

  -- Per-rep breakdown (JSONB)
  SELECT COALESCE(jsonb_object_agg(rep_id::text, amount), '{}'::jsonb) INTO _by_rep
  FROM (
    SELECT seller_id AS rep_id, SUM(total_amount) AS amount
    FROM public.orders
    WHERE company_id = _company_id
      AND created_at >= _period_start
      AND created_at <  _period_end
      AND seller_id IS NOT NULL
    GROUP BY seller_id
  ) t;

  INSERT INTO public.ai_forecast_snapshots(
    company_id, forecast_date, period, period_key, snapshot_type,
    predicted_revenue, best_case, worst_case, confidence,
    actual_revenue, target_revenue, gap, variance_pct,
    by_rep, factors, created_by
  ) VALUES (
    _company_id, CURRENT_DATE, 'monthly', _period_key, _snapshot_type,
    _predicted, _predicted + _weighted * 0.25, _actual + _confirmed, 0.7,
    _actual, _target, _gap, _variance,
    _by_rep,
    jsonb_build_object('confirmed', _confirmed, 'weighted_pipeline', _weighted),
    auth.uid()
  )
  RETURNING id INTO _snap_id;

  RETURN _snap_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.record_forecast_snapshot(UUID, TEXT, TEXT) TO authenticated, service_role;

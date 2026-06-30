
-- 1) wms_events
CREATE TABLE IF NOT EXISTS public.wms_events (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id uuid NOT NULL DEFAULT get_user_company_id(auth.uid()),
  event_type text NOT NULL,
  source_module text NOT NULL,
  entity_type text NOT NULL,
  entity_id uuid,
  actor_user_id uuid,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.wms_events TO authenticated;
GRANT ALL ON public.wms_events TO service_role;
ALTER TABLE public.wms_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "wms_events_tenant_read" ON public.wms_events FOR SELECT TO authenticated
  USING (company_id = get_user_company_id(auth.uid()));
CREATE POLICY "wms_events_tenant_insert" ON public.wms_events FOR INSERT TO authenticated
  WITH CHECK (company_id = get_user_company_id(auth.uid()));
CREATE INDEX IF NOT EXISTS idx_wms_events_company_created ON public.wms_events (company_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_wms_events_company_entity ON public.wms_events (company_id, entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_wms_events_company_type ON public.wms_events (company_id, event_type, created_at DESC);

-- 2) wms_recommendations
CREATE TABLE IF NOT EXISTS public.wms_recommendations (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id uuid NOT NULL DEFAULT get_user_company_id(auth.uid()),
  type text NOT NULL,
  severity text NOT NULL DEFAULT 'info' CHECK (severity IN ('info','low','medium','high','critical')),
  title text NOT NULL,
  body text,
  evidence jsonb NOT NULL DEFAULT '{}'::jsonb,
  suggested_action jsonb NOT NULL DEFAULT '{}'::jsonb,
  target_entity text,
  target_id uuid,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open','applied','dismissed','expired')),
  applied_at timestamptz,
  applied_by uuid,
  dismissed_at timestamptz,
  dismissed_by uuid,
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.wms_recommendations TO authenticated;
GRANT ALL ON public.wms_recommendations TO service_role;
ALTER TABLE public.wms_recommendations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "wms_recommendations_tenant_select" ON public.wms_recommendations FOR SELECT TO authenticated
  USING (company_id = get_user_company_id(auth.uid()));
CREATE POLICY "wms_recommendations_tenant_update" ON public.wms_recommendations FOR UPDATE TO authenticated
  USING (company_id = get_user_company_id(auth.uid()))
  WITH CHECK (company_id = get_user_company_id(auth.uid()));
CREATE POLICY "wms_recommendations_tenant_insert" ON public.wms_recommendations FOR INSERT TO authenticated
  WITH CHECK (company_id = get_user_company_id(auth.uid()));
CREATE INDEX IF NOT EXISTS idx_wms_recs_company_status ON public.wms_recommendations (company_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_wms_recs_company_type ON public.wms_recommendations (company_id, type, severity);

CREATE OR REPLACE FUNCTION public.touch_wms_recommendations()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;
DROP TRIGGER IF EXISTS trg_touch_wms_recommendations ON public.wms_recommendations;
CREATE TRIGGER trg_touch_wms_recommendations BEFORE UPDATE ON public.wms_recommendations
  FOR EACH ROW EXECUTE FUNCTION public.touch_wms_recommendations();

-- 3) slotting_profiles
CREATE TABLE IF NOT EXISTS public.slotting_profiles (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id uuid NOT NULL DEFAULT get_user_company_id(auth.uid()),
  name text NOT NULL,
  description text,
  warehouse_id uuid REFERENCES public.warehouses(id) ON DELETE CASCADE,
  weights jsonb NOT NULL DEFAULT '{"abc":0.4,"distance":0.3,"capacity":0.15,"compatibility":0.15}'::jsonb,
  constraints jsonb NOT NULL DEFAULT '{}'::jsonb,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.slotting_profiles TO authenticated;
GRANT ALL ON public.slotting_profiles TO service_role;
ALTER TABLE public.slotting_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "slotting_profiles_tenant_all" ON public.slotting_profiles FOR ALL TO authenticated
  USING (company_id = get_user_company_id(auth.uid()))
  WITH CHECK (company_id = get_user_company_id(auth.uid()));
CREATE INDEX IF NOT EXISTS idx_slotting_profiles_company ON public.slotting_profiles (company_id, active);

-- 4) slotting_suggestions
CREATE TABLE IF NOT EXISTS public.slotting_suggestions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id uuid NOT NULL DEFAULT get_user_company_id(auth.uid()),
  profile_id uuid REFERENCES public.slotting_profiles(id) ON DELETE SET NULL,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  current_location_id uuid REFERENCES public.wms_storage_locations(id) ON DELETE SET NULL,
  suggested_location_id uuid NOT NULL REFERENCES public.wms_storage_locations(id) ON DELETE CASCADE,
  score numeric NOT NULL DEFAULT 0,
  abc_class text,
  reason jsonb NOT NULL DEFAULT '{}'::jsonb,
  estimated_distance_saved_m numeric DEFAULT 0,
  estimated_picks_per_day numeric DEFAULT 0,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','executed','rejected','expired')),
  executed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.slotting_suggestions TO authenticated;
GRANT ALL ON public.slotting_suggestions TO service_role;
ALTER TABLE public.slotting_suggestions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "slotting_suggestions_tenant_select" ON public.slotting_suggestions FOR SELECT TO authenticated
  USING (company_id = get_user_company_id(auth.uid()));
CREATE POLICY "slotting_suggestions_tenant_update" ON public.slotting_suggestions FOR UPDATE TO authenticated
  USING (company_id = get_user_company_id(auth.uid()))
  WITH CHECK (company_id = get_user_company_id(auth.uid()));
CREATE POLICY "slotting_suggestions_tenant_insert" ON public.slotting_suggestions FOR INSERT TO authenticated
  WITH CHECK (company_id = get_user_company_id(auth.uid()));
CREATE INDEX IF NOT EXISTS idx_slotting_sug_company_status ON public.slotting_suggestions (company_id, status, score DESC);
CREATE INDEX IF NOT EXISTS idx_slotting_sug_product ON public.slotting_suggestions (company_id, product_id);

-- 5) KPI views (security_invoker so RLS of underlying tables applies)
CREATE OR REPLACE VIEW public.v_wms_kpi_dock_to_stock
WITH (security_invoker = true) AS
SELECT
  ro.company_id,
  date_trunc('day', ro.received_date) AS day,
  AVG(EXTRACT(EPOCH FROM (pt.completed_at - ro.received_date)) / 3600.0) AS avg_hours,
  COUNT(*) AS samples
FROM public.wms_receiving_orders ro
JOIN public.putaway_tasks pt ON pt.receiving_order_id = ro.id
WHERE ro.received_date IS NOT NULL AND pt.completed_at IS NOT NULL
GROUP BY ro.company_id, date_trunc('day', ro.received_date);

CREATE OR REPLACE VIEW public.v_wms_kpi_picking_accuracy
WITH (security_invoker = true) AS
SELECT
  company_id,
  date_trunc('day', COALESCE(completed_at, created_at)) AS day,
  COUNT(*) FILTER (WHERE status = 'completed' AND picked_qty = requested_qty) AS accurate,
  COUNT(*) FILTER (WHERE status = 'completed') AS total,
  CASE WHEN COUNT(*) FILTER (WHERE status = 'completed') > 0
       THEN (COUNT(*) FILTER (WHERE status = 'completed' AND picked_qty = requested_qty)::numeric
             / COUNT(*) FILTER (WHERE status = 'completed')::numeric) * 100
       ELSE NULL END AS accuracy_pct
FROM public.picking_tasks
GROUP BY company_id, date_trunc('day', COALESCE(completed_at, created_at));

CREATE OR REPLACE VIEW public.v_wms_kpi_inventory_accuracy
WITH (security_invoker = true) AS
SELECT
  company_id,
  date_trunc('day', COALESCE(completed_at, created_at)) AS day,
  SUM(GREATEST(items_count - discrepancies, 0)) AS exact_matches,
  SUM(items_count) AS total_items,
  CASE WHEN SUM(items_count) > 0
       THEN (SUM(GREATEST(items_count - discrepancies, 0))::numeric / SUM(items_count)::numeric) * 100
       ELSE NULL END AS accuracy_pct
FROM public.wms_inventory_counts
WHERE status IN ('completed','closed')
GROUP BY company_id, date_trunc('day', COALESCE(completed_at, created_at));

CREATE OR REPLACE VIEW public.v_wms_kpi_otif
WITH (security_invoker = true) AS
SELECT
  company_id,
  date_trunc('day', COALESCE(delivered_at, created_at)) AS day,
  COUNT(*) FILTER (WHERE status = 'delivered'
                    AND (delivered_at IS NULL OR scheduled_date IS NULL OR delivered_at <= scheduled_date)) AS on_time,
  COUNT(*) FILTER (WHERE status = 'delivered') AS delivered,
  CASE WHEN COUNT(*) FILTER (WHERE status = 'delivered') > 0
       THEN (COUNT(*) FILTER (WHERE status = 'delivered'
                              AND (delivered_at IS NULL OR scheduled_date IS NULL OR delivered_at <= scheduled_date))::numeric
             / COUNT(*) FILTER (WHERE status = 'delivered')::numeric) * 100
       ELSE NULL END AS otif_pct
FROM public.wms_shipments
GROUP BY company_id, date_trunc('day', COALESCE(delivered_at, created_at));

CREATE OR REPLACE VIEW public.v_wms_kpi_occupancy
WITH (security_invoker = true) AS
SELECT
  company_id, zone,
  SUM(occupied) AS occupied,
  SUM(capacity) AS capacity,
  CASE WHEN SUM(capacity) > 0 THEN (SUM(occupied)::numeric / SUM(capacity)::numeric) * 100 ELSE 0 END AS occupancy_pct,
  COUNT(*) AS locations
FROM public.wms_storage_locations
WHERE active = true
GROUP BY company_id, zone;

CREATE OR REPLACE VIEW public.v_wms_kpi_productivity_operator
WITH (security_invoker = true) AS
SELECT
  company_id,
  assigned_to AS operator_id,
  COUNT(*) FILTER (WHERE status = 'completed') AS tasks_completed,
  COUNT(*) AS tasks_total,
  COUNT(*) FILTER (WHERE status = 'completed')::numeric
    / GREATEST(1, EXTRACT(EPOCH FROM (now() - MIN(created_at))) / 3600.0) AS tasks_per_hour
FROM public.picking_tasks
WHERE assigned_to IS NOT NULL AND created_at >= now() - interval '24 hours'
GROUP BY company_id, assigned_to;

GRANT SELECT ON public.v_wms_kpi_dock_to_stock TO authenticated;
GRANT SELECT ON public.v_wms_kpi_picking_accuracy TO authenticated;
GRANT SELECT ON public.v_wms_kpi_inventory_accuracy TO authenticated;
GRANT SELECT ON public.v_wms_kpi_otif TO authenticated;
GRANT SELECT ON public.v_wms_kpi_occupancy TO authenticated;
GRANT SELECT ON public.v_wms_kpi_productivity_operator TO authenticated;

-- 6) Consolidated KPI function
CREATE OR REPLACE FUNCTION public.get_wms_kpis(_days int DEFAULT 7)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_company uuid := get_user_company_id(auth.uid());
  v_result jsonb;
BEGIN
  IF v_company IS NULL THEN RETURN jsonb_build_object('error', 'no_company'); END IF;
  SELECT jsonb_build_object(
    'period_days', _days,
    'dock_to_stock_hours', (
      SELECT ROUND(AVG(avg_hours)::numeric, 2) FROM v_wms_kpi_dock_to_stock
      WHERE company_id = v_company AND day >= now() - (_days || ' days')::interval),
    'picking_accuracy_pct', (
      SELECT ROUND(AVG(accuracy_pct)::numeric, 2) FROM v_wms_kpi_picking_accuracy
      WHERE company_id = v_company AND day >= now() - (_days || ' days')::interval),
    'inventory_accuracy_pct', (
      SELECT ROUND(AVG(accuracy_pct)::numeric, 2) FROM v_wms_kpi_inventory_accuracy
      WHERE company_id = v_company AND day >= now() - (_days || ' days')::interval),
    'otif_pct', (
      SELECT ROUND(AVG(otif_pct)::numeric, 2) FROM v_wms_kpi_otif
      WHERE company_id = v_company AND day >= now() - (_days || ' days')::interval),
    'occupancy_by_zone', (
      SELECT COALESCE(jsonb_agg(jsonb_build_object(
        'zone', zone, 'occupied', occupied, 'capacity', capacity, 'pct', ROUND(occupancy_pct::numeric, 2)
      ) ORDER BY occupancy_pct DESC), '[]'::jsonb)
      FROM v_wms_kpi_occupancy WHERE company_id = v_company),
    'top_operators', (
      SELECT COALESCE(jsonb_agg(jsonb_build_object(
        'operator_id', operator_id, 'completed', tasks_completed, 'per_hour', ROUND(tasks_per_hour::numeric, 2)
      )), '[]'::jsonb)
      FROM (SELECT * FROM v_wms_kpi_productivity_operator
            WHERE company_id = v_company ORDER BY tasks_per_hour DESC LIMIT 10) t),
    'open_recommendations', (
      SELECT COUNT(*) FROM wms_recommendations WHERE company_id = v_company AND status = 'open'),
    'generated_at', now()
  ) INTO v_result;
  RETURN v_result;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.get_wms_kpis(int) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_wms_kpis(int) TO authenticated, service_role;

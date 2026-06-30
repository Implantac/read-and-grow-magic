
-- 1. Trigger function to emit unified events
CREATE OR REPLACE FUNCTION public.fn_emit_wms_event()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_company uuid;
  v_event text;
  v_entity text;
  v_entity_id uuid;
  v_payload jsonb;
BEGIN
  v_company := COALESCE((to_jsonb(NEW)->>'company_id')::uuid, (to_jsonb(OLD)->>'company_id')::uuid);
  IF v_company IS NULL THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  v_event := lower(TG_TABLE_NAME) || '.' || lower(TG_OP);
  v_entity := TG_TABLE_NAME;
  v_entity_id := COALESCE((to_jsonb(NEW)->>'id')::uuid, (to_jsonb(OLD)->>'id')::uuid);
  v_payload := jsonb_build_object(
    'op', TG_OP,
    'new', CASE WHEN TG_OP <> 'DELETE' THEN to_jsonb(NEW) ELSE NULL END,
    'old', CASE WHEN TG_OP <> 'INSERT' THEN to_jsonb(OLD) ELSE NULL END
  );

  BEGIN
    INSERT INTO public.wms_events (company_id, event_type, source_module, entity_type, entity_id, payload)
    VALUES (v_company, v_event, 'wms', v_entity, v_entity_id, v_payload);
  EXCEPTION WHEN OTHERS THEN
    -- never block the parent mutation
    NULL;
  END;

  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Attach triggers (drop+recreate is idempotent)
DROP TRIGGER IF EXISTS trg_wms_event_movements ON public.wms_movements;
CREATE TRIGGER trg_wms_event_movements
AFTER INSERT OR UPDATE OR DELETE ON public.wms_movements
FOR EACH ROW EXECUTE FUNCTION public.fn_emit_wms_event();

DROP TRIGGER IF EXISTS trg_wms_event_receiving ON public.wms_receiving_orders;
CREATE TRIGGER trg_wms_event_receiving
AFTER INSERT OR UPDATE OR DELETE ON public.wms_receiving_orders
FOR EACH ROW EXECUTE FUNCTION public.fn_emit_wms_event();

DROP TRIGGER IF EXISTS trg_wms_event_picking ON public.wms_picking_orders;
CREATE TRIGGER trg_wms_event_picking
AFTER INSERT OR UPDATE OR DELETE ON public.wms_picking_orders
FOR EACH ROW EXECUTE FUNCTION public.fn_emit_wms_event();

DROP TRIGGER IF EXISTS trg_wms_event_putaway ON public.putaway_tasks;
CREATE TRIGGER trg_wms_event_putaway
AFTER INSERT OR UPDATE OR DELETE ON public.putaway_tasks
FOR EACH ROW EXECUTE FUNCTION public.fn_emit_wms_event();

DROP TRIGGER IF EXISTS trg_wms_event_recs ON public.wms_recommendations;
CREATE TRIGGER trg_wms_event_recs
AFTER INSERT OR UPDATE ON public.wms_recommendations
FOR EACH ROW EXECUTE FUNCTION public.fn_emit_wms_event();

-- 2. KPI cache table
CREATE TABLE IF NOT EXISTS public.wms_kpi_cache (
  company_id uuid PRIMARY KEY,
  kpis jsonb NOT NULL DEFAULT '{}'::jsonb,
  refreshed_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.wms_kpi_cache TO authenticated;
GRANT ALL ON public.wms_kpi_cache TO service_role;

ALTER TABLE public.wms_kpi_cache ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "wms_kpi_cache_select_own" ON public.wms_kpi_cache;
CREATE POLICY "wms_kpi_cache_select_own"
ON public.wms_kpi_cache
FOR SELECT
TO authenticated
USING (
  company_id IN (SELECT p.company_id FROM public.profiles p WHERE p.id = auth.uid())
);

-- 3. Refresh helper
CREATE OR REPLACE FUNCTION public.refresh_wms_kpi_cache(p_company_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_kpis jsonb;
BEGIN
  SELECT to_jsonb(k) INTO v_kpis FROM public.get_wms_kpis(p_company_id) k;
  INSERT INTO public.wms_kpi_cache (company_id, kpis, refreshed_at)
  VALUES (p_company_id, COALESCE(v_kpis, '{}'::jsonb), now())
  ON CONFLICT (company_id) DO UPDATE
    SET kpis = EXCLUDED.kpis, refreshed_at = now();
END;
$$;

REVOKE ALL ON FUNCTION public.refresh_wms_kpi_cache(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.refresh_wms_kpi_cache(uuid) TO authenticated, service_role;

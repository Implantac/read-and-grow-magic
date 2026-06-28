
-- TMS v2: paradas e custos por rota

CREATE TABLE IF NOT EXISTS public.route_stops (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  route_id uuid NOT NULL REFERENCES public.delivery_routes(id) ON DELETE CASCADE,
  sequence integer NOT NULL,
  stop_type text NOT NULL DEFAULT 'delivery' CHECK (stop_type IN ('pickup','delivery','depot')),
  customer_id uuid,
  order_id uuid,
  address text NOT NULL,
  city text,
  state text,
  zip_code text,
  latitude numeric(10,7),
  longitude numeric(10,7),
  weight numeric(14,3) DEFAULT 0,
  volume numeric(14,3) DEFAULT 0,
  planned_eta timestamptz,
  actual_arrival timestamptz,
  actual_departure timestamptz,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','en_route','arrived','completed','failed','skipped')),
  failure_reason text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (route_id, sequence)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.route_stops TO authenticated;
GRANT ALL ON public.route_stops TO service_role;

ALTER TABLE public.route_stops ENABLE ROW LEVEL SECURITY;

CREATE POLICY route_stops_tenant_select ON public.route_stops
  FOR SELECT TO authenticated
  USING (company_id = public.get_user_company_id(auth.uid()));

CREATE POLICY route_stops_tenant_write ON public.route_stops
  FOR ALL TO authenticated
  USING (company_id = public.get_user_company_id(auth.uid()))
  WITH CHECK (company_id = public.get_user_company_id(auth.uid()));

CREATE INDEX IF NOT EXISTS idx_route_stops_route ON public.route_stops(route_id, sequence);
CREATE INDEX IF NOT EXISTS idx_route_stops_company ON public.route_stops(company_id);
CREATE INDEX IF NOT EXISTS idx_route_stops_status ON public.route_stops(status);

CREATE TRIGGER trg_route_stops_updated_at
  BEFORE UPDATE ON public.route_stops
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Custos por rota
CREATE TABLE IF NOT EXISTS public.route_costs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  route_id uuid NOT NULL REFERENCES public.delivery_routes(id) ON DELETE CASCADE,
  fuel_liters numeric(12,3) DEFAULT 0,
  fuel_cost numeric(14,2) DEFAULT 0,
  toll_cost numeric(14,2) DEFAULT 0,
  driver_cost numeric(14,2) DEFAULT 0,
  maintenance_cost numeric(14,2) DEFAULT 0,
  other_cost numeric(14,2) DEFAULT 0,
  total_distance_km numeric(12,2) DEFAULT 0,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (route_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.route_costs TO authenticated;
GRANT ALL ON public.route_costs TO service_role;

ALTER TABLE public.route_costs ENABLE ROW LEVEL SECURITY;

CREATE POLICY route_costs_tenant_select ON public.route_costs
  FOR SELECT TO authenticated
  USING (company_id = public.get_user_company_id(auth.uid()));

CREATE POLICY route_costs_tenant_write ON public.route_costs
  FOR ALL TO authenticated
  USING (company_id = public.get_user_company_id(auth.uid()))
  WITH CHECK (company_id = public.get_user_company_id(auth.uid()));

CREATE INDEX IF NOT EXISTS idx_route_costs_company ON public.route_costs(company_id);

CREATE TRIGGER trg_route_costs_updated_at
  BEFORE UPDATE ON public.route_costs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Realtime para acompanhamento
ALTER TABLE public.route_stops REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.route_stops;

-- Atualiza progresso da rota quando uma parada muda
CREATE OR REPLACE FUNCTION public.fn_route_stops_progress()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_total int;
  v_done int;
BEGIN
  SELECT count(*), count(*) FILTER (WHERE status = 'completed')
    INTO v_total, v_done
  FROM public.route_stops
  WHERE route_id = COALESCE(NEW.route_id, OLD.route_id);

  UPDATE public.delivery_routes
    SET total_stops = v_total,
        completed_stops = v_done
  WHERE id = COALESCE(NEW.route_id, OLD.route_id);

  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER trg_route_stops_progress
AFTER INSERT OR UPDATE OF status OR DELETE ON public.route_stops
FOR EACH ROW EXECUTE FUNCTION public.fn_route_stops_progress();

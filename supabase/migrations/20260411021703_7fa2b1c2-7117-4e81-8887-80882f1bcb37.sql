
-- 1. ENDEREÇOS DE ARMAZÉM
CREATE TABLE IF NOT EXISTS public.warehouse_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  zone_id UUID NOT NULL REFERENCES public.warehouse_zones(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  street TEXT,
  column_code TEXT,
  level_code TEXT,
  position_code TEXT,
  location_type TEXT NOT NULL DEFAULT 'storage',
  max_weight NUMERIC DEFAULT 0,
  max_volume NUMERIC DEFAULT 0,
  current_weight NUMERIC DEFAULT 0,
  current_volume NUMERIC DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'free',
  active BOOLEAN NOT NULL DEFAULT true,
  abc_classification TEXT DEFAULT 'C',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_wl_zone ON public.warehouse_locations(zone_id);
CREATE INDEX IF NOT EXISTS idx_wl_status ON public.warehouse_locations(status);
CREATE INDEX IF NOT EXISTS idx_wl_type ON public.warehouse_locations(location_type);
ALTER TABLE public.warehouse_locations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth_wl_select" ON public.warehouse_locations FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_wl_all" ON public.warehouse_locations FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 2. TAREFAS OPERACIONAIS WMS
CREATE TABLE IF NOT EXISTS public.wms_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_number TEXT NOT NULL,
  task_type TEXT NOT NULL,
  reference_type TEXT,
  reference_id UUID,
  priority INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending',
  assigned_to TEXT,
  product_id UUID,
  product_code TEXT,
  product_name TEXT,
  from_location_id UUID,
  from_location_code TEXT,
  to_location_id UUID,
  to_location_code TEXT,
  quantity NUMERIC DEFAULT 0,
  completed_qty NUMERIC DEFAULT 0,
  lot_number TEXT,
  instructions TEXT,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  completed_by TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_wt_type ON public.wms_tasks(task_type);
CREATE INDEX IF NOT EXISTS idx_wt_status ON public.wms_tasks(status);
ALTER TABLE public.wms_tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth_wt_select" ON public.wms_tasks FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_wt_all" ON public.wms_tasks FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 3. TRANSPORTADORAS
CREATE TABLE IF NOT EXISTS public.carriers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  document TEXT,
  contact_name TEXT,
  phone TEXT,
  email TEXT,
  address TEXT,
  service_types TEXT[] DEFAULT '{}',
  active BOOLEAN NOT NULL DEFAULT true,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.carriers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth_carriers_select" ON public.carriers FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_carriers_all" ON public.carriers FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 4. VEÍCULOS
CREATE TABLE IF NOT EXISTS public.vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  carrier_id UUID REFERENCES public.carriers(id) ON DELETE CASCADE,
  plate TEXT NOT NULL,
  model TEXT,
  vehicle_type TEXT DEFAULT 'truck',
  max_weight NUMERIC DEFAULT 0,
  max_volume NUMERIC DEFAULT 0,
  driver_name TEXT,
  driver_phone TEXT,
  status TEXT NOT NULL DEFAULT 'available',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth_vehicles_select" ON public.vehicles FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_vehicles_all" ON public.vehicles FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 5. ROTAS DE ENTREGA
CREATE TABLE IF NOT EXISTS public.delivery_routes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  route_number TEXT NOT NULL,
  carrier_id UUID REFERENCES public.carriers(id) ON DELETE SET NULL,
  vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE SET NULL,
  driver_name TEXT,
  planned_date DATE NOT NULL,
  departure_time TIMESTAMPTZ,
  arrival_time TIMESTAMPTZ,
  total_stops INTEGER DEFAULT 0,
  completed_stops INTEGER DEFAULT 0,
  total_weight NUMERIC DEFAULT 0,
  total_volume NUMERIC DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'planned',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.delivery_routes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth_dr_select" ON public.delivery_routes FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_dr_all" ON public.delivery_routes FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 6. PROVA DE ENTREGA
CREATE TABLE IF NOT EXISTS public.delivery_proof (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  route_id UUID REFERENCES public.delivery_routes(id) ON DELETE CASCADE,
  shipment_id UUID,
  order_number TEXT,
  customer_name TEXT,
  delivered_at TIMESTAMPTZ,
  received_by TEXT,
  signature_url TEXT,
  photo_url TEXT,
  latitude NUMERIC,
  longitude NUMERIC,
  status TEXT NOT NULL DEFAULT 'pending',
  refusal_reason TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.delivery_proof ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth_dp_select" ON public.delivery_proof FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_dp_all" ON public.delivery_proof FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 7. LOG DE AUDITORIA WMS
CREATE TABLE IF NOT EXISTS public.wms_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT NOT NULL,
  entity_id UUID,
  action TEXT NOT NULL,
  description TEXT,
  old_values JSONB,
  new_values JSONB,
  user_id UUID,
  user_name TEXT,
  ip_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_wal_entity ON public.wms_audit_log(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_wal_date ON public.wms_audit_log(created_at);
ALTER TABLE public.wms_audit_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth_wal_select" ON public.wms_audit_log FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_wal_insert" ON public.wms_audit_log FOR INSERT TO authenticated WITH CHECK (true);

-- 8. EXPANDIR PRODUCTS
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS volume NUMERIC DEFAULT 0;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS unit_conversions JSONB DEFAULT '[]';
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS lot_control BOOLEAN DEFAULT false;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS expiration_control BOOLEAN DEFAULT false;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS shelf_life_days INTEGER;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS abc_classification TEXT DEFAULT 'C';


-- =============================================
-- WMS AVANÇADO - MIGRAÇÃO ENTERPRISE
-- =============================================

-- 1. CENTROS DE DISTRIBUIÇÃO
CREATE TABLE IF NOT EXISTS public.distribution_centers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  address TEXT,
  city TEXT,
  state TEXT,
  zip_code TEXT,
  phone TEXT,
  manager TEXT,
  total_capacity_m3 NUMERIC DEFAULT 0,
  used_capacity_m3 NUMERIC DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.distribution_centers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can manage distribution_centers" ON public.distribution_centers FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 2. EXPAND WAREHOUSES WITH DC LINK
ALTER TABLE public.warehouses
  ADD COLUMN IF NOT EXISTS distribution_center_id UUID REFERENCES public.distribution_centers(id),
  ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'standard',
  ADD COLUMN IF NOT EXISTS manager TEXT,
  ADD COLUMN IF NOT EXISTS total_locations INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS occupied_locations INTEGER DEFAULT 0;

-- 3. WAREHOUSE ZONES
CREATE TABLE IF NOT EXISTS public.warehouse_zones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  warehouse_id UUID NOT NULL REFERENCES public.warehouses(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  zone_type TEXT NOT NULL DEFAULT 'storage',
  parent_zone_id UUID REFERENCES public.warehouse_zones(id),
  temperature_range TEXT,
  is_picking_zone BOOLEAN DEFAULT false,
  is_bulk_zone BOOLEAN DEFAULT false,
  priority INTEGER DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(warehouse_id, code)
);

ALTER TABLE public.warehouse_zones ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can manage warehouse_zones" ON public.warehouse_zones FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 4. EXPAND STORAGE LOCATIONS
ALTER TABLE public.wms_storage_locations
  ADD COLUMN IF NOT EXISTS zone_id UUID REFERENCES public.warehouse_zones(id),
  ADD COLUMN IF NOT EXISTS subzone TEXT,
  ADD COLUMN IF NOT EXISTS street TEXT,
  ADD COLUMN IF NOT EXISTS column_pos TEXT,
  ADD COLUMN IF NOT EXISTS position_type TEXT DEFAULT 'storage',
  ADD COLUMN IF NOT EXISTS current_weight NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS current_volume NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS restriction_rules JSONB,
  ADD COLUMN IF NOT EXISTS min_replenish_qty NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS max_replenish_qty NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_count_date TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS pick_sequence INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS distance_to_dock NUMERIC DEFAULT 0;

-- 5. STOCK BALANCES (real-time by product/lot/location/CD/status)
CREATE TABLE IF NOT EXISTS public.stock_balances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES public.products(id),
  product_code TEXT NOT NULL,
  product_name TEXT NOT NULL,
  lot_id UUID REFERENCES public.stock_lots(id),
  lot_number TEXT,
  location_id UUID REFERENCES public.wms_storage_locations(id),
  location_code TEXT,
  warehouse_id UUID REFERENCES public.warehouses(id),
  dc_id UUID REFERENCES public.distribution_centers(id),
  stock_status TEXT NOT NULL DEFAULT 'available',
  quantity NUMERIC NOT NULL DEFAULT 0,
  reserved_qty NUMERIC NOT NULL DEFAULT 0,
  available_qty NUMERIC GENERATED ALWAYS AS (quantity - reserved_qty) STORED,
  unit TEXT NOT NULL DEFAULT 'UN',
  last_movement_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.stock_balances ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can manage stock_balances" ON public.stock_balances FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE INDEX idx_stock_balances_product ON public.stock_balances(product_id);
CREATE INDEX idx_stock_balances_location ON public.stock_balances(location_id);
CREATE INDEX idx_stock_balances_lot ON public.stock_balances(lot_id);
CREATE INDEX idx_stock_balances_warehouse ON public.stock_balances(warehouse_id);
CREATE INDEX idx_stock_balances_dc ON public.stock_balances(dc_id);
CREATE INDEX idx_stock_balances_status ON public.stock_balances(stock_status);

-- 6. PUTAWAY TASKS
CREATE TABLE IF NOT EXISTS public.putaway_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_number TEXT NOT NULL UNIQUE,
  receiving_order_id UUID REFERENCES public.wms_receiving_orders(id),
  product_id UUID REFERENCES public.products(id),
  product_code TEXT NOT NULL,
  product_name TEXT NOT NULL,
  lot_id UUID REFERENCES public.stock_lots(id),
  lot_number TEXT,
  quantity NUMERIC NOT NULL DEFAULT 0,
  unit TEXT NOT NULL DEFAULT 'UN',
  source_location TEXT,
  suggested_location_id UUID REFERENCES public.wms_storage_locations(id),
  suggested_location_code TEXT,
  actual_location_id UUID REFERENCES public.wms_storage_locations(id),
  actual_location_code TEXT,
  suggestion_reason TEXT,
  priority TEXT NOT NULL DEFAULT 'medium',
  status TEXT NOT NULL DEFAULT 'pending',
  assigned_to TEXT,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  sla_deadline TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.putaway_tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can manage putaway_tasks" ON public.putaway_tasks FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE INDEX idx_putaway_status ON public.putaway_tasks(status);

-- 7. REPLENISHMENT TASKS
CREATE TABLE IF NOT EXISTS public.replenishment_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_number TEXT NOT NULL UNIQUE,
  product_id UUID REFERENCES public.products(id),
  product_code TEXT NOT NULL,
  product_name TEXT NOT NULL,
  source_location_id UUID REFERENCES public.wms_storage_locations(id),
  source_location_code TEXT,
  target_location_id UUID REFERENCES public.wms_storage_locations(id),
  target_location_code TEXT,
  required_qty NUMERIC NOT NULL DEFAULT 0,
  moved_qty NUMERIC NOT NULL DEFAULT 0,
  unit TEXT NOT NULL DEFAULT 'UN',
  trigger_type TEXT NOT NULL DEFAULT 'min_stock',
  priority TEXT NOT NULL DEFAULT 'medium',
  status TEXT NOT NULL DEFAULT 'pending',
  assigned_to TEXT,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  sla_deadline TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.replenishment_tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can manage replenishment_tasks" ON public.replenishment_tasks FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE INDEX idx_replenishment_status ON public.replenishment_tasks(status);

-- 8. PICKING WAVES
CREATE TABLE IF NOT EXISTS public.picking_waves (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wave_number TEXT NOT NULL UNIQUE,
  name TEXT,
  status TEXT NOT NULL DEFAULT 'planned',
  strategy TEXT NOT NULL DEFAULT 'wave',
  carrier TEXT,
  route TEXT,
  shipping_window_start TIMESTAMPTZ,
  shipping_window_end TIMESTAMPTZ,
  orders_count INTEGER DEFAULT 0,
  items_count INTEGER DEFAULT 0,
  picked_items INTEGER DEFAULT 0,
  priority TEXT NOT NULL DEFAULT 'medium',
  assigned_to TEXT,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.picking_waves ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can manage picking_waves" ON public.picking_waves FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Link picking orders to waves
ALTER TABLE public.wms_picking_orders
  ADD COLUMN IF NOT EXISTS wave_id_ref UUID REFERENCES public.picking_waves(id),
  ADD COLUMN IF NOT EXISTS batch_id TEXT,
  ADD COLUMN IF NOT EXISTS cluster_id TEXT;

-- 9. PICKING TASKS (operator-level granularity)
CREATE TABLE IF NOT EXISTS public.picking_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_number TEXT NOT NULL,
  picking_order_id UUID REFERENCES public.wms_picking_orders(id),
  wave_id UUID REFERENCES public.picking_waves(id),
  product_id UUID REFERENCES public.products(id),
  product_code TEXT NOT NULL,
  product_name TEXT NOT NULL,
  lot_id UUID REFERENCES public.stock_lots(id),
  lot_number TEXT,
  location_id UUID REFERENCES public.wms_storage_locations(id),
  location_code TEXT NOT NULL,
  requested_qty NUMERIC NOT NULL DEFAULT 0,
  picked_qty NUMERIC NOT NULL DEFAULT 0,
  unit TEXT NOT NULL DEFAULT 'UN',
  route_sequence INTEGER DEFAULT 0,
  priority TEXT NOT NULL DEFAULT 'medium',
  status TEXT NOT NULL DEFAULT 'pending',
  assigned_to TEXT,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.picking_tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can manage picking_tasks" ON public.picking_tasks FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE INDEX idx_picking_tasks_order ON public.picking_tasks(picking_order_id);
CREATE INDEX idx_picking_tasks_wave ON public.picking_tasks(wave_id);
CREATE INDEX idx_picking_tasks_status ON public.picking_tasks(status);

-- 10. CHECKING TASKS (multi-stage)
CREATE TABLE IF NOT EXISTS public.checking_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_number TEXT NOT NULL,
  check_type TEXT NOT NULL DEFAULT 'picking',
  reference_type TEXT NOT NULL,
  reference_id UUID NOT NULL,
  order_number TEXT,
  customer_name TEXT,
  expected_items INTEGER DEFAULT 0,
  checked_items INTEGER DEFAULT 0,
  divergent_items INTEGER DEFAULT 0,
  blind_check BOOLEAN DEFAULT false,
  status TEXT NOT NULL DEFAULT 'pending',
  assigned_to TEXT,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  approved BOOLEAN,
  approved_by TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.checking_tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can manage checking_tasks" ON public.checking_tasks FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE INDEX idx_checking_tasks_status ON public.checking_tasks(status);

-- 11. LOADING DOCKS
CREATE TABLE IF NOT EXISTS public.loading_docks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  warehouse_id UUID REFERENCES public.warehouses(id),
  dock_code TEXT NOT NULL,
  dock_name TEXT,
  dock_type TEXT NOT NULL DEFAULT 'outbound',
  status TEXT NOT NULL DEFAULT 'free',
  current_shipment_id UUID,
  carrier TEXT,
  vehicle_plate TEXT,
  driver_name TEXT,
  driver_document TEXT,
  scheduled_start TIMESTAMPTZ,
  scheduled_end TIMESTAMPTZ,
  actual_start TIMESTAMPTZ,
  actual_end TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.loading_docks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can manage loading_docks" ON public.loading_docks FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Expand shipments
ALTER TABLE public.wms_shipments
  ADD COLUMN IF NOT EXISTS dock_id UUID REFERENCES public.loading_docks(id),
  ADD COLUMN IF NOT EXISTS vehicle_plate TEXT,
  ADD COLUMN IF NOT EXISTS driver_name TEXT,
  ADD COLUMN IF NOT EXISTS driver_document TEXT,
  ADD COLUMN IF NOT EXISTS route TEXT,
  ADD COLUMN IF NOT EXISTS loading_started_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS loading_completed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS departure_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS wave_id UUID REFERENCES public.picking_waves(id);

-- 12. INVENTORY SESSIONS
CREATE TABLE IF NOT EXISTS public.inventory_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_number TEXT NOT NULL UNIQUE,
  session_type TEXT NOT NULL DEFAULT 'general',
  warehouse_id UUID REFERENCES public.warehouses(id),
  zone_id UUID REFERENCES public.warehouse_zones(id),
  abc_class TEXT,
  blind_count BOOLEAN DEFAULT false,
  max_recount INTEGER DEFAULT 2,
  status TEXT NOT NULL DEFAULT 'planned',
  planned_date TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  total_locations INTEGER DEFAULT 0,
  counted_locations INTEGER DEFAULT 0,
  divergent_locations INTEGER DEFAULT 0,
  approved BOOLEAN,
  approved_by TEXT,
  approved_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.inventory_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can manage inventory_sessions" ON public.inventory_sessions FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 13. WMS RETURNS (reverse logistics)
CREATE TABLE IF NOT EXISTS public.wms_returns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  return_number TEXT NOT NULL UNIQUE,
  return_type TEXT NOT NULL DEFAULT 'customer',
  reference_number TEXT,
  customer_name TEXT,
  supplier_name TEXT,
  reason TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  total_items INTEGER DEFAULT 0,
  inspected_items INTEGER DEFAULT 0,
  approved_items INTEGER DEFAULT 0,
  rejected_items INTEGER DEFAULT 0,
  destination TEXT DEFAULT 'restock',
  warehouse_id UUID REFERENCES public.warehouses(id),
  received_by TEXT,
  inspected_by TEXT,
  received_at TIMESTAMPTZ,
  inspected_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.wms_returns ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can manage wms_returns" ON public.wms_returns FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE INDEX idx_wms_returns_status ON public.wms_returns(status);
CREATE INDEX idx_wms_returns_type ON public.wms_returns(return_type);

-- 14. WMS TASK LOGS (unified audit)
CREATE TABLE IF NOT EXISTS public.wms_task_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_type TEXT NOT NULL,
  task_id UUID,
  task_number TEXT,
  action TEXT NOT NULL,
  operator TEXT,
  operator_id UUID,
  details JSONB,
  location_code TEXT,
  product_code TEXT,
  quantity NUMERIC,
  duration_seconds INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.wms_task_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can manage wms_task_logs" ON public.wms_task_logs FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE INDEX idx_wms_task_logs_type ON public.wms_task_logs(task_type);
CREATE INDEX idx_wms_task_logs_operator ON public.wms_task_logs(operator_id);
CREATE INDEX idx_wms_task_logs_created ON public.wms_task_logs(created_at DESC);

-- 15. WMS AI INSIGHTS
CREATE TABLE IF NOT EXISTS public.wms_ai_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  insight_type TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'general',
  title TEXT NOT NULL,
  description TEXT,
  severity TEXT NOT NULL DEFAULT 'info',
  data_points JSONB,
  recommended_actions JSONB,
  affected_products JSONB,
  affected_locations JSONB,
  warehouse_id UUID REFERENCES public.warehouses(id),
  dc_id UUID REFERENCES public.distribution_centers(id),
  status TEXT NOT NULL DEFAULT 'active',
  dismissed_at TIMESTAMPTZ,
  dismissed_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ
);

ALTER TABLE public.wms_ai_insights ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can manage wms_ai_insights" ON public.wms_ai_insights FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE INDEX idx_wms_ai_insights_type ON public.wms_ai_insights(insight_type);
CREATE INDEX idx_wms_ai_insights_status ON public.wms_ai_insights(status);

-- 16. EXPAND STOCK_RESERVATIONS
ALTER TABLE public.stock_reservations
  ADD COLUMN IF NOT EXISTS reservation_type TEXT DEFAULT 'sales_order',
  ADD COLUMN IF NOT EXISTS lot_id UUID REFERENCES public.stock_lots(id),
  ADD COLUMN IF NOT EXISTS warehouse_id UUID REFERENCES public.warehouses(id),
  ADD COLUMN IF NOT EXISTS dc_id UUID REFERENCES public.distribution_centers(id),
  ADD COLUMN IF NOT EXISTS policy TEXT DEFAULT 'FIFO',
  ADD COLUMN IF NOT EXISTS priority INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;

-- 17. EXPAND STOCK_LOTS
ALTER TABLE public.stock_lots
  ADD COLUMN IF NOT EXISTS dc_id UUID REFERENCES public.distribution_centers(id),
  ADD COLUMN IF NOT EXISTS received_qty NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS consumed_qty NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS quality_status TEXT DEFAULT 'approved',
  ADD COLUMN IF NOT EXISTS inspection_date TIMESTAMPTZ;

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_wms_locations_zone ON public.wms_storage_locations(zone_id);
CREATE INDEX IF NOT EXISTS idx_wms_locations_type ON public.wms_storage_locations(position_type);
CREATE INDEX IF NOT EXISTS idx_wms_locations_warehouse ON public.wms_storage_locations(warehouse_id);
CREATE INDEX IF NOT EXISTS idx_warehouse_zones_warehouse ON public.warehouse_zones(warehouse_id);
CREATE INDEX IF NOT EXISTS idx_warehouses_dc ON public.warehouses(distribution_center_id);

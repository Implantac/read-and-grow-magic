
-- 1. Warehouses (armazéns)
CREATE TABLE IF NOT EXISTS public.warehouses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  address TEXT,
  total_capacity NUMERIC DEFAULT 0,
  used_capacity NUMERIC DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.warehouses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "warehouses_public_read" ON public.warehouses FOR SELECT USING (true);
CREATE POLICY "warehouses_public_write" ON public.warehouses FOR ALL USING (true) WITH CHECK (true);

-- 2. Stock Lots (controle de lotes)
CREATE TABLE IF NOT EXISTS public.stock_lots (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lot_number TEXT NOT NULL,
  product_id UUID REFERENCES public.products(id),
  product_code TEXT NOT NULL,
  product_name TEXT NOT NULL,
  supplier TEXT,
  manufacture_date DATE,
  expiration_date DATE,
  quantity NUMERIC NOT NULL DEFAULT 0,
  remaining_qty NUMERIC NOT NULL DEFAULT 0,
  origin TEXT NOT NULL DEFAULT 'purchase',
  origin_reference TEXT,
  location TEXT,
  warehouse_id UUID REFERENCES public.warehouses(id),
  status TEXT NOT NULL DEFAULT 'available',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(lot_number, product_code)
);
ALTER TABLE public.stock_lots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "stock_lots_public_read" ON public.stock_lots FOR SELECT USING (true);
CREATE POLICY "stock_lots_public_write" ON public.stock_lots FOR ALL USING (true) WITH CHECK (true);

-- 3. WMS Shipments (expedição)
CREATE TABLE IF NOT EXISTS public.wms_shipments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  shipment_number TEXT NOT NULL UNIQUE,
  packing_order_id UUID REFERENCES public.wms_packing_orders(id),
  order_number TEXT,
  customer_name TEXT NOT NULL,
  carrier TEXT,
  carrier_code TEXT,
  tracking_number TEXT,
  volumes INTEGER NOT NULL DEFAULT 1,
  total_weight NUMERIC DEFAULT 0,
  total_value NUMERIC DEFAULT 0,
  shipping_address TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  scheduled_date TIMESTAMPTZ,
  shipped_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  romaneio_number TEXT,
  notes TEXT,
  operator TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.wms_shipments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "wms_shipments_public_read" ON public.wms_shipments FOR SELECT USING (true);
CREATE POLICY "wms_shipments_public_write" ON public.wms_shipments FOR ALL USING (true) WITH CHECK (true);

-- 4. WMS Logs (auditoria)
CREATE TABLE IF NOT EXISTS public.wms_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  operation TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  entity_ref TEXT,
  operator TEXT,
  user_id UUID,
  details JSONB,
  ip_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.wms_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "wms_logs_public_read" ON public.wms_logs FOR SELECT USING (true);
CREATE POLICY "wms_logs_public_write" ON public.wms_logs FOR ALL USING (true) WITH CHECK (true);

-- 5. Conference Records (conferência)
CREATE TABLE IF NOT EXISTS public.wms_conference_records (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conference_number TEXT NOT NULL UNIQUE,
  reference_type TEXT NOT NULL DEFAULT 'receiving',
  reference_id UUID,
  reference_number TEXT,
  conference_type TEXT NOT NULL DEFAULT 'normal',
  status TEXT NOT NULL DEFAULT 'pending',
  operator TEXT,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  total_items INTEGER NOT NULL DEFAULT 0,
  checked_items INTEGER NOT NULL DEFAULT 0,
  divergences INTEGER NOT NULL DEFAULT 0,
  approved_by TEXT,
  approved_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.wms_conference_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "wms_conference_public_read" ON public.wms_conference_records FOR SELECT USING (true);
CREATE POLICY "wms_conference_public_write" ON public.wms_conference_records FOR ALL USING (true) WITH CHECK (true);

-- 6. Conference Items
CREATE TABLE IF NOT EXISTS public.wms_conference_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conference_id UUID NOT NULL REFERENCES public.wms_conference_records(id) ON DELETE CASCADE,
  product_code TEXT NOT NULL,
  product_name TEXT NOT NULL,
  expected_qty NUMERIC NOT NULL DEFAULT 0,
  checked_qty NUMERIC NOT NULL DEFAULT 0,
  divergence NUMERIC GENERATED ALWAYS AS (checked_qty - expected_qty) STORED,
  barcode TEXT,
  lot_number TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  checked_at TIMESTAMPTZ,
  notes TEXT
);
ALTER TABLE public.wms_conference_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "wms_conf_items_public_read" ON public.wms_conference_items FOR SELECT USING (true);
CREATE POLICY "wms_conf_items_public_write" ON public.wms_conference_items FOR ALL USING (true) WITH CHECK (true);

-- 7. Expand wms_storage_locations
ALTER TABLE public.wms_storage_locations
  ADD COLUMN IF NOT EXISTS warehouse_id UUID REFERENCES public.warehouses(id),
  ADD COLUMN IF NOT EXISTS max_weight NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS max_volume NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS storage_category TEXT DEFAULT 'general',
  ADD COLUMN IF NOT EXISTS abc_class TEXT DEFAULT 'C',
  ADD COLUMN IF NOT EXISTS picking_zone BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- 8. Expand wms_picking_orders with strategy
ALTER TABLE public.wms_picking_orders
  ADD COLUMN IF NOT EXISTS picking_strategy TEXT DEFAULT 'order',
  ADD COLUMN IF NOT EXISTS wave_id TEXT,
  ADD COLUMN IF NOT EXISTS zone_filter TEXT,
  ADD COLUMN IF NOT EXISTS route_sequence JSONB;

-- 9. Expand wms_receiving_orders
ALTER TABLE public.wms_receiving_orders
  ADD COLUMN IF NOT EXISTS conference_type TEXT DEFAULT 'normal',
  ADD COLUMN IF NOT EXISTS items_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS received_items INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS notes TEXT;

-- 10. Performance indexes
CREATE INDEX IF NOT EXISTS idx_stock_lots_product ON public.stock_lots(product_id);
CREATE INDEX IF NOT EXISTS idx_stock_lots_lot ON public.stock_lots(lot_number);
CREATE INDEX IF NOT EXISTS idx_stock_lots_status ON public.stock_lots(status);
CREATE INDEX IF NOT EXISTS idx_wms_logs_entity ON public.wms_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_wms_logs_created ON public.wms_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_wms_shipments_status ON public.wms_shipments(status);
CREATE INDEX IF NOT EXISTS idx_wms_conference_status ON public.wms_conference_records(status);
CREATE INDEX IF NOT EXISTS idx_wms_movements_created ON public.wms_movements(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_wms_storage_warehouse ON public.wms_storage_locations(warehouse_id);
CREATE INDEX IF NOT EXISTS idx_wms_storage_zone ON public.wms_storage_locations(zone);

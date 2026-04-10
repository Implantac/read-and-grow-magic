
-- 1. Order Status History
CREATE TABLE public.order_status_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  from_status TEXT,
  to_status TEXT NOT NULL,
  changed_by TEXT,
  changed_by_user_id UUID,
  observation TEXT,
  block_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_order_status_history_order ON public.order_status_history(order_id);
CREATE INDEX idx_order_status_history_created ON public.order_status_history(created_at DESC);
ALTER TABLE public.order_status_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can read order_status_history" ON public.order_status_history FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert order_status_history" ON public.order_status_history FOR INSERT TO authenticated WITH CHECK (true);

-- 2. Stock Reservations
CREATE TABLE public.stock_reservations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  order_item_id UUID REFERENCES public.order_items(id) ON DELETE SET NULL,
  product_id UUID REFERENCES public.products(id),
  product_code TEXT NOT NULL,
  product_name TEXT NOT NULL,
  requested_qty NUMERIC NOT NULL DEFAULT 0,
  reserved_qty NUMERIC NOT NULL DEFAULT 0,
  picked_qty NUMERIC NOT NULL DEFAULT 0,
  location TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  reserved_by TEXT,
  reserved_at TIMESTAMPTZ,
  released_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_stock_reservations_order ON public.stock_reservations(order_id);
CREATE INDEX idx_stock_reservations_product ON public.stock_reservations(product_id);
CREATE INDEX idx_stock_reservations_status ON public.stock_reservations(status);
ALTER TABLE public.stock_reservations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can manage stock_reservations" ON public.stock_reservations FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 3. Conference Records
CREATE TABLE public.conference_records (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  conference_number TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  conferee TEXT,
  conferee_user_id UUID,
  total_items INTEGER NOT NULL DEFAULT 0,
  checked_items INTEGER NOT NULL DEFAULT 0,
  divergent_items INTEGER NOT NULL DEFAULT 0,
  approved BOOLEAN DEFAULT false,
  approved_by TEXT,
  approved_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_conference_records_order ON public.conference_records(order_id);
CREATE INDEX idx_conference_records_status ON public.conference_records(status);
ALTER TABLE public.conference_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can manage conference_records" ON public.conference_records FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 4. Conference Record Items
CREATE TABLE public.conference_record_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conference_id UUID NOT NULL REFERENCES public.conference_records(id) ON DELETE CASCADE,
  order_item_id UUID REFERENCES public.order_items(id),
  product_code TEXT NOT NULL,
  product_name TEXT NOT NULL,
  expected_qty NUMERIC NOT NULL DEFAULT 0,
  checked_qty NUMERIC NOT NULL DEFAULT 0,
  divergence NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending',
  notes TEXT
);
CREATE INDEX idx_conference_items_conf ON public.conference_record_items(conference_id);
ALTER TABLE public.conference_record_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can manage conference_record_items" ON public.conference_record_items FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 5. Billing Queue
CREATE TABLE public.billing_queue (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  nfe_id UUID REFERENCES public.nfe(id),
  status TEXT NOT NULL DEFAULT 'awaiting_billing',
  billing_type TEXT NOT NULL DEFAULT 'full',
  amount NUMERIC NOT NULL DEFAULT 0,
  billed_amount NUMERIC NOT NULL DEFAULT 0,
  pending_amount NUMERIC NOT NULL DEFAULT 0,
  validation_errors TEXT[],
  validated_at TIMESTAMPTZ,
  billed_at TIMESTAMPTZ,
  billed_by TEXT,
  invoice_number TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_billing_queue_order ON public.billing_queue(order_id);
CREATE INDEX idx_billing_queue_status ON public.billing_queue(status);
ALTER TABLE public.billing_queue ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can manage billing_queue" ON public.billing_queue FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 6. Shipment Orders
CREATE TABLE public.shipment_orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  shipment_number TEXT NOT NULL,
  carrier TEXT,
  carrier_document TEXT,
  tracking_code TEXT,
  volumes INTEGER NOT NULL DEFAULT 1,
  total_weight NUMERIC NOT NULL DEFAULT 0,
  total_value NUMERIC NOT NULL DEFAULT 0,
  freight_cost NUMERIC NOT NULL DEFAULT 0,
  freight_type TEXT DEFAULT 'CIF',
  status TEXT NOT NULL DEFAULT 'pending',
  departure_date TIMESTAMPTZ,
  expected_delivery TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  delivery_confirmed_by TEXT,
  vehicle_plate TEXT,
  driver_name TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_shipment_orders_order ON public.shipment_orders(order_id);
CREATE INDEX idx_shipment_orders_status ON public.shipment_orders(status);
ALTER TABLE public.shipment_orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can manage shipment_orders" ON public.shipment_orders FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 7. Shipment Items
CREATE TABLE public.shipment_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  shipment_id UUID NOT NULL REFERENCES public.shipment_orders(id) ON DELETE CASCADE,
  order_item_id UUID REFERENCES public.order_items(id),
  product_code TEXT NOT NULL,
  product_name TEXT NOT NULL,
  quantity NUMERIC NOT NULL DEFAULT 0,
  weight NUMERIC NOT NULL DEFAULT 0,
  volume_number INTEGER DEFAULT 1,
  notes TEXT
);
CREATE INDEX idx_shipment_items_shipment ON public.shipment_items(shipment_id);
ALTER TABLE public.shipment_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can manage shipment_items" ON public.shipment_items FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 8. Enhance production_orders with sales order linkage
ALTER TABLE public.production_orders
  ADD COLUMN IF NOT EXISTS sales_order_id UUID REFERENCES public.orders(id),
  ADD COLUMN IF NOT EXISTS order_item_id UUID REFERENCES public.order_items(id),
  ADD COLUMN IF NOT EXISTS estimated_time_minutes INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS realized_time_minutes INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS sector TEXT;

CREATE INDEX IF NOT EXISTS idx_production_orders_sales_order ON public.production_orders(sales_order_id);

-- 9. Add partial fulfillment tracking to orders
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS fulfillment_status TEXT DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS production_status TEXT DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS separation_status TEXT DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS conference_status TEXT DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS billing_status TEXT DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS shipment_status TEXT DEFAULT 'none';

-- 10. Trigger to auto-record status history
CREATE OR REPLACE FUNCTION public.record_order_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.order_status_history (order_id, from_status, to_status)
    VALUES (NEW.id, OLD.status, NEW.status);
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_order_status_history
BEFORE UPDATE ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.record_order_status_change();

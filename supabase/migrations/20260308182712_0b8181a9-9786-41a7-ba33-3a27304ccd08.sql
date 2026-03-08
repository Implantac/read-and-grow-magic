
-- Create WMS movements table
CREATE TABLE public.wms_movements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID REFERENCES public.products(id),
  product_code TEXT NOT NULL,
  product_name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'inbound',
  from_location TEXT,
  to_location TEXT,
  quantity NUMERIC NOT NULL DEFAULT 0,
  reason TEXT NOT NULL DEFAULT '',
  reference TEXT,
  operator TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.wms_movements ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Auth users can read wms_movements" ON public.wms_movements FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth users can insert wms_movements" ON public.wms_movements FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth users can update wms_movements" ON public.wms_movements FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Auth users can delete wms_movements" ON public.wms_movements FOR DELETE TO authenticated USING (true);

-- Create stock_movements table for ERP integration (Kardex)
CREATE TABLE public.stock_movements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  document_number TEXT NOT NULL DEFAULT '',
  product_id UUID REFERENCES public.products(id),
  product_code TEXT NOT NULL,
  product_name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'adjustment',
  direction TEXT NOT NULL DEFAULT 'in',
  quantity NUMERIC NOT NULL DEFAULT 0,
  unit_cost NUMERIC NOT NULL DEFAULT 0,
  total_cost NUMERIC NOT NULL DEFAULT 0,
  batch TEXT,
  from_warehouse TEXT,
  to_warehouse TEXT,
  reference TEXT,
  notes TEXT,
  operator TEXT NOT NULL DEFAULT '',
  source TEXT DEFAULT 'erp',
  wms_movement_id UUID REFERENCES public.wms_movements(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Auth users can read stock_movements" ON public.stock_movements FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth users can insert stock_movements" ON public.stock_movements FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth users can update stock_movements" ON public.stock_movements FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Auth users can delete stock_movements" ON public.stock_movements FOR DELETE TO authenticated USING (true);

-- Trigger function: when a WMS movement is inserted, create a corresponding ERP stock movement
CREATE OR REPLACE FUNCTION public.sync_wms_movement_to_stock()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_direction TEXT;
  v_erp_type TEXT;
  v_doc_number TEXT;
BEGIN
  -- Determine direction and ERP type based on WMS movement type
  CASE NEW.type
    WHEN 'inbound' THEN
      v_direction := 'in';
      v_erp_type := 'purchase';
    WHEN 'outbound' THEN
      v_direction := 'out';
      v_erp_type := 'sale';
    WHEN 'transfer' THEN
      v_direction := 'in';
      v_erp_type := 'transfer';
    WHEN 'adjustment' THEN
      IF NEW.quantity >= 0 THEN
        v_direction := 'in';
      ELSE
        v_direction := 'out';
      END IF;
      v_erp_type := 'adjustment';
    ELSE
      v_direction := 'in';
      v_erp_type := 'adjustment';
  END CASE;

  -- Generate document number
  v_doc_number := 'WMS-' || to_char(now(), 'YYYYMMDD') || '-' || substring(NEW.id::text, 1, 8);

  -- Insert into stock_movements
  INSERT INTO public.stock_movements (
    document_number, product_id, product_code, product_name,
    type, direction, quantity, operator, source, wms_movement_id,
    from_warehouse, to_warehouse, reference, notes
  ) VALUES (
    v_doc_number, NEW.product_id, NEW.product_code, NEW.product_name,
    v_erp_type, v_direction, abs(NEW.quantity), COALESCE(NEW.operator, 'WMS'),
    'wms', NEW.id,
    NEW.from_location, NEW.to_location, NEW.reference, NEW.reason
  );

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_sync_wms_to_stock
  AFTER INSERT ON public.wms_movements
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_wms_movement_to_stock();

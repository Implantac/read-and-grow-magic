
-- Add missing columns to production_orders
ALTER TABLE public.production_orders
  ADD COLUMN IF NOT EXISTS client_name text,
  ADD COLUMN IF NOT EXISTS client_id uuid,
  ADD COLUMN IF NOT EXISTS color text,
  ADD COLUMN IF NOT EXISTS size_grid text,
  ADD COLUMN IF NOT EXISTS model_variant text,
  ADD COLUMN IF NOT EXISTS rejected_quantity numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS defect_notes text,
  ADD COLUMN IF NOT EXISTS delivery_type text DEFAULT 'full',
  ADD COLUMN IF NOT EXISTS partial_delivered_qty numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS released_at timestamptz,
  ADD COLUMN IF NOT EXISTS batch_code text;

-- production_steps (configurable step definitions)
CREATE TABLE IF NOT EXISTS public.production_steps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  code text NOT NULL UNIQUE,
  description text,
  sequence integer NOT NULL DEFAULT 0,
  estimated_time_minutes integer NOT NULL DEFAULT 0,
  sector text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.production_steps ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can manage production_steps" ON public.production_steps FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- production_order_steps (steps per OP)
CREATE TABLE IF NOT EXISTS public.production_order_steps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  production_order_id uuid NOT NULL REFERENCES public.production_orders(id) ON DELETE CASCADE,
  step_id uuid NOT NULL,
  sequence integer NOT NULL DEFAULT 0,
  responsible text,
  estimated_time_minutes integer NOT NULL DEFAULT 0,
  realized_time_minutes integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending',
  quantity_produced numeric NOT NULL DEFAULT 0,
  quantity_pending numeric NOT NULL DEFAULT 0,
  quantity_rejected numeric NOT NULL DEFAULT 0,
  defect_reason text,
  started_at timestamptz,
  completed_at timestamptz,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.production_order_steps ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can manage production_order_steps" ON public.production_order_steps FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- product_technical_sheets (ficha técnica)
CREATE TABLE IF NOT EXISTS public.product_technical_sheets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES public.products(id),
  product_code text NOT NULL,
  product_name text NOT NULL,
  steps jsonb NOT NULL DEFAULT '[]',
  materials jsonb NOT NULL DEFAULT '[]',
  total_time_minutes integer NOT NULL DEFAULT 0,
  standard_cost numeric NOT NULL DEFAULT 0,
  version text NOT NULL DEFAULT '1.0',
  is_active boolean NOT NULL DEFAULT true,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.product_technical_sheets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can manage product_technical_sheets" ON public.product_technical_sheets FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- production_capacity
CREATE TABLE IF NOT EXISTS public.production_capacity (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sector text NOT NULL,
  machine text,
  operator_name text,
  shift text NOT NULL DEFAULT 'diurno',
  capacity_per_hour numeric NOT NULL DEFAULT 0,
  max_hours_per_day numeric NOT NULL DEFAULT 8,
  current_load_pct numeric NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.production_capacity ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can manage production_capacity" ON public.production_capacity FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- production_logs (rastreabilidade)
CREATE TABLE IF NOT EXISTS public.production_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  production_order_id uuid REFERENCES public.production_orders(id) ON DELETE CASCADE,
  step_id uuid,
  event_type text NOT NULL DEFAULT 'info',
  operator text,
  quantity numeric DEFAULT 0,
  description text,
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.production_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can manage production_logs" ON public.production_logs FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ai_production_insights
CREATE TABLE IF NOT EXISTS public.ai_production_insights (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  insight_type text NOT NULL DEFAULT 'bottleneck',
  severity text NOT NULL DEFAULT 'medium',
  title text NOT NULL,
  description text,
  affected_order_id uuid REFERENCES public.production_orders(id),
  affected_sector text,
  recommended_action text,
  status text NOT NULL DEFAULT 'active',
  impact_estimate text,
  resolved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.ai_production_insights ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can manage ai_production_insights" ON public.ai_production_insights FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Trigger to auto-generate OP from approved orders
CREATE OR REPLACE FUNCTION public.generate_production_order_from_order()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_item RECORD;
  v_op_number TEXT;
  v_seq INTEGER := 1;
BEGIN
  IF NEW.status = 'approved' AND (OLD.status IS DISTINCT FROM NEW.status) THEN
    FOR v_item IN
      SELECT * FROM public.order_items WHERE order_id = NEW.id
    LOOP
      IF NOT EXISTS (
        SELECT 1 FROM public.production_orders
        WHERE sales_order_id = NEW.id AND order_item_id = v_item.id
      ) THEN
        v_op_number := 'OP-' || to_char(now(), 'YYYYMMDD') || '-' || substring(NEW.id::text, 1, 4) || '-' || v_seq;
        
        INSERT INTO public.production_orders (
          order_number, product_id, product_code, product_name,
          quantity, unit, status, priority, due_date,
          sales_order_id, order_item_id, client_name, client_id, notes
        ) VALUES (
          v_op_number, v_item.product_id, v_item.product_code, v_item.product_name,
          v_item.quantity, 'UN', 'planned', NEW.priority, NEW.delivery_date,
          NEW.id, v_item.id, NEW.client_name, NEW.client_id,
          'Gerada automaticamente do pedido ' || NEW.number
        );
        v_seq := v_seq + 1;
      END IF;
    END LOOP;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_generate_production_order ON public.orders;
CREATE TRIGGER trigger_generate_production_order
  AFTER UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_production_order_from_order();

-- Enable realtime for key tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.production_order_steps;
ALTER PUBLICATION supabase_realtime ADD TABLE public.production_logs;

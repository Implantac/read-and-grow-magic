
-- Add priority_score to production_orders
ALTER TABLE public.production_orders
ADD COLUMN IF NOT EXISTS priority_score FLOAT DEFAULT 0;

-- Kanban WIP Limits
CREATE TABLE IF NOT EXISTS public.kanban_limits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  column_name VARCHAR(50) NOT NULL UNIQUE,
  wip_limit INT NOT NULL DEFAULT 10,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.kanban_limits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view kanban_limits"
ON public.kanban_limits FOR SELECT USING (true);

CREATE POLICY "Authenticated can manage kanban_limits"
ON public.kanban_limits FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Insert default WIP limits
INSERT INTO public.kanban_limits (column_name, wip_limit) VALUES
  ('planned', 20),
  ('waiting_material', 10),
  ('in_progress', 15),
  ('outsourced', 10),
  ('paused', 5),
  ('finishing', 10),
  ('completed', 50)
ON CONFLICT (column_name) DO NOTHING;

-- Order Stage History
CREATE TABLE IF NOT EXISTS public.order_stage_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES public.production_orders(id) ON DELETE CASCADE,
  from_status VARCHAR(30),
  to_status VARCHAR(30) NOT NULL,
  changed_by TEXT,
  changed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.order_stage_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view order_stage_history"
ON public.order_stage_history FOR SELECT USING (true);

CREATE POLICY "Authenticated can insert order_stage_history"
ON public.order_stage_history FOR INSERT TO authenticated WITH CHECK (true);

CREATE INDEX idx_order_stage_history_order_id ON public.order_stage_history(order_id);
CREATE INDEX idx_order_stage_history_changed_at ON public.order_stage_history(changed_at DESC);

-- Supplier Metrics
CREATE TABLE IF NOT EXISTS public.supplier_metrics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  supplier_name TEXT NOT NULL,
  avg_delay_days FLOAT DEFAULT 0,
  on_time_rate FLOAT DEFAULT 100,
  total_orders INT DEFAULT 0,
  late_orders INT DEFAULT 0,
  last_calculated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.supplier_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view supplier_metrics"
ON public.supplier_metrics FOR SELECT USING (true);

CREATE POLICY "Authenticated can manage supplier_metrics"
ON public.supplier_metrics FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Trigger: auto-record stage history on production_orders status change
CREATE OR REPLACE FUNCTION public.record_production_order_stage_history()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.order_stage_history (order_id, from_status, to_status, changed_by)
    VALUES (NEW.id, OLD.status, NEW.status, NEW.operator);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_record_production_stage_history ON public.production_orders;
CREATE TRIGGER trg_record_production_stage_history
AFTER UPDATE ON public.production_orders
FOR EACH ROW
EXECUTE FUNCTION public.record_production_order_stage_history();

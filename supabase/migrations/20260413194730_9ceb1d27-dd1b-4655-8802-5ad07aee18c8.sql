
-- 1. Event Bus table for Industry 4.0 event-driven architecture
CREATE TABLE public.production_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_type TEXT NOT NULL DEFAULT 'generic',
  source TEXT NOT NULL DEFAULT 'system',
  entity_type TEXT,
  entity_id TEXT,
  entity_name TEXT,
  operator TEXT,
  sector TEXT,
  machine_id UUID REFERENCES public.production_machines(id),
  payload JSONB DEFAULT '{}'::jsonb,
  severity TEXT NOT NULL DEFAULT 'info',
  processed BOOLEAN NOT NULL DEFAULT false,
  processed_at TIMESTAMPTZ,
  processing_result JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_production_events_type ON public.production_events(event_type);
CREATE INDEX idx_production_events_entity ON public.production_events(entity_type, entity_id);
CREATE INDEX idx_production_events_created ON public.production_events(created_at DESC);
CREATE INDEX idx_production_events_unprocessed ON public.production_events(processed) WHERE processed = false;

-- 2. IoT telemetry table for sensor data
CREATE TABLE public.iot_telemetry (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  device_id TEXT NOT NULL,
  device_type TEXT NOT NULL DEFAULT 'sensor',
  machine_id UUID REFERENCES public.production_machines(id),
  metric_name TEXT NOT NULL,
  metric_value NUMERIC NOT NULL,
  unit TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_iot_telemetry_device ON public.iot_telemetry(device_id, created_at DESC);
CREATE INDEX idx_iot_telemetry_machine ON public.iot_telemetry(machine_id, created_at DESC);

-- 3. Enable Realtime on key tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.production_events;
ALTER PUBLICATION supabase_realtime ADD TABLE public.iot_telemetry;

-- 4. RLS policies
ALTER TABLE public.production_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.iot_telemetry ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read production events"
  ON public.production_events FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert production events"
  ON public.production_events FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update production events"
  ON public.production_events FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can read IoT telemetry"
  ON public.iot_telemetry FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert IoT telemetry"
  ON public.iot_telemetry FOR INSERT TO authenticated WITH CHECK (true);

-- 5. Trigger to auto-emit events from production_orders changes
CREATE OR REPLACE FUNCTION public.emit_production_order_event()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.production_events (event_type, source, entity_type, entity_id, entity_name, operator, sector, payload)
    VALUES ('op_created', 'trigger', 'production_order', NEW.id::text, NEW.order_number, NEW.operator, NEW.sector,
      jsonb_build_object('product_name', NEW.product_name, 'quantity', NEW.quantity, 'priority', NEW.priority, 'due_date', NEW.due_date));
  ELSIF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.production_events (event_type, source, entity_type, entity_id, entity_name, operator, sector, payload,
      severity)
    VALUES (
      CASE NEW.status
        WHEN 'in_progress' THEN 'op_started'
        WHEN 'completed' THEN 'op_completed'
        WHEN 'cancelled' THEN 'op_cancelled'
        ELSE 'op_status_changed'
      END,
      'trigger', 'production_order', NEW.id::text, NEW.order_number, NEW.operator, NEW.sector,
      jsonb_build_object('from_status', OLD.status, 'to_status', NEW.status, 'product_name', NEW.product_name, 'produced', NEW.produced_quantity),
      CASE WHEN NEW.status = 'cancelled' THEN 'warning' ELSE 'info' END
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_production_order_events
  AFTER INSERT OR UPDATE ON public.production_orders
  FOR EACH ROW EXECUTE FUNCTION public.emit_production_order_event();

-- 6. Trigger for time_entries (apontamentos) events
CREATE OR REPLACE FUNCTION public.emit_time_entry_event()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.production_events (event_type, source, entity_type, entity_id, entity_name, operator, sector, machine_id, payload)
  VALUES (
    CASE
      WHEN TG_OP = 'INSERT' AND NEW.status = 'started' THEN 'step_started'
      WHEN NEW.status = 'paused' THEN 'step_paused'
      WHEN NEW.status = 'completed' THEN 'step_completed'
      ELSE 'step_updated'
    END,
    'trigger', 'time_entry', NEW.id::text, NEW.order_number, NEW.operator, NEW.work_center, NEW.machine_id,
    jsonb_build_object('operation', NEW.operation_name, 'produced', NEW.produced_quantity, 'rejected', NEW.rejected_quantity)
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_time_entry_events
  AFTER INSERT OR UPDATE ON public.time_entries
  FOR EACH ROW EXECUTE FUNCTION public.emit_time_entry_event();


-- Production machines table for Industry 4.0 machine tracking
CREATE TABLE public.production_machines (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'general',
  sector TEXT,
  status TEXT NOT NULL DEFAULT 'available',
  capacity_per_hour NUMERIC DEFAULT 0,
  current_operator TEXT,
  current_order_id UUID REFERENCES public.production_orders(id) ON DELETE SET NULL,
  notes TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.production_machines ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view machines" ON public.production_machines FOR SELECT USING (true);
CREATE POLICY "Authenticated can insert machines" ON public.production_machines FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update machines" ON public.production_machines FOR UPDATE TO authenticated USING (true);

-- Add machine columns to time_entries
ALTER TABLE public.time_entries ADD COLUMN IF NOT EXISTS machine_id UUID REFERENCES public.production_machines(id) ON DELETE SET NULL;
ALTER TABLE public.time_entries ADD COLUMN IF NOT EXISTS machine_name TEXT;

-- Enable realtime for machines
ALTER PUBLICATION supabase_realtime ADD TABLE public.production_machines;

-- Function: auto-update machine status based on time entry changes
CREATE OR REPLACE FUNCTION public.sync_machine_status_from_time_entry()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.machine_id IS NOT NULL THEN
    IF NEW.status = 'started' THEN
      UPDATE public.production_machines
      SET status = 'running', current_operator = NEW.operator, current_order_id = NEW.production_order_id, updated_at = now()
      WHERE id = NEW.machine_id;
    ELSIF NEW.status = 'paused' THEN
      UPDATE public.production_machines
      SET status = 'stopped', updated_at = now()
      WHERE id = NEW.machine_id;
    ELSIF NEW.status = 'completed' THEN
      UPDATE public.production_machines
      SET status = 'available', current_operator = NULL, current_order_id = NULL, updated_at = now()
      WHERE id = NEW.machine_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_sync_machine_status
AFTER INSERT OR UPDATE ON public.time_entries
FOR EACH ROW
EXECUTE FUNCTION public.sync_machine_status_from_time_entry();

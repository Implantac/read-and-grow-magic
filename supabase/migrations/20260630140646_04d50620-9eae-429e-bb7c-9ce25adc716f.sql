
-- ============== yard_vehicles ==============
CREATE TABLE public.yard_vehicles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL,
  plate TEXT NOT NULL,
  carrier_name TEXT,
  driver_name TEXT,
  driver_doc TEXT,
  vehicle_type TEXT NOT NULL DEFAULT 'truck',
  operation_type TEXT NOT NULL DEFAULT 'inbound', -- inbound | outbound
  status TEXT NOT NULL DEFAULT 'waiting', -- waiting | docked | loading | unloading | finished | cancelled
  dock_id UUID,
  appointment_id UUID,
  linked_order TEXT,
  arrived_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  docked_at TIMESTAMPTZ,
  finished_at TIMESTAMPTZ,
  notes TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.yard_vehicles TO authenticated;
GRANT ALL ON public.yard_vehicles TO service_role;

ALTER TABLE public.yard_vehicles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "yard_vehicles tenant access"
ON public.yard_vehicles FOR ALL TO authenticated
USING (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()))
WITH CHECK (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

CREATE INDEX idx_yard_vehicles_company_status ON public.yard_vehicles(company_id, status);
CREATE INDEX idx_yard_vehicles_arrived ON public.yard_vehicles(arrived_at DESC);

-- ============== yard_appointments ==============
CREATE TABLE public.yard_appointments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL,
  dock_id UUID NOT NULL,
  carrier_name TEXT,
  plate TEXT,
  operation_type TEXT NOT NULL DEFAULT 'inbound',
  scheduled_start TIMESTAMPTZ NOT NULL,
  scheduled_end TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'scheduled', -- scheduled | confirmed | in_progress | done | no_show | cancelled
  linked_order TEXT,
  notes TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.yard_appointments TO authenticated;
GRANT ALL ON public.yard_appointments TO service_role;

ALTER TABLE public.yard_appointments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "yard_appointments tenant access"
ON public.yard_appointments FOR ALL TO authenticated
USING (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()))
WITH CHECK (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

CREATE INDEX idx_yard_appt_company_dock_time ON public.yard_appointments(company_id, dock_id, scheduled_start);
CREATE INDEX idx_yard_appt_status ON public.yard_appointments(company_id, status);

-- Triggers updated_at (reusa função pública existente update_updated_at_column)
CREATE TRIGGER trg_yard_vehicles_updated BEFORE UPDATE ON public.yard_vehicles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_yard_appointments_updated BEFORE UPDATE ON public.yard_appointments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

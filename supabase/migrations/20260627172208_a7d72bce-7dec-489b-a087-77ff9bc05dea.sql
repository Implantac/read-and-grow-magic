
-- PATIENTS
CREATE TABLE public.health_patients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL DEFAULT get_user_company_id(auth.uid()),
  full_name text NOT NULL,
  cpf text,
  birth_date date,
  gender text,
  phone text,
  email text,
  notes text,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.health_patients TO authenticated;
GRANT ALL ON public.health_patients TO service_role;
ALTER TABLE public.health_patients ENABLE ROW LEVEL SECURITY;
CREATE POLICY "health_patients_tenant" ON public.health_patients FOR ALL TO authenticated
  USING (company_id = get_user_company_id(auth.uid()))
  WITH CHECK (company_id = get_user_company_id(auth.uid()));
CREATE INDEX idx_health_patients_company ON public.health_patients(company_id);

-- PROFESSIONALS
CREATE TABLE public.health_professionals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL DEFAULT get_user_company_id(auth.uid()),
  full_name text NOT NULL,
  registry_number text,
  specialty text,
  email text,
  phone text,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.health_professionals TO authenticated;
GRANT ALL ON public.health_professionals TO service_role;
ALTER TABLE public.health_professionals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "health_professionals_tenant" ON public.health_professionals FOR ALL TO authenticated
  USING (company_id = get_user_company_id(auth.uid()))
  WITH CHECK (company_id = get_user_company_id(auth.uid()));
CREATE INDEX idx_health_professionals_company ON public.health_professionals(company_id);

-- APPOINTMENTS
CREATE TABLE public.health_appointments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL DEFAULT get_user_company_id(auth.uid()),
  patient_id uuid NOT NULL REFERENCES public.health_patients(id) ON DELETE CASCADE,
  professional_id uuid REFERENCES public.health_professionals(id) ON DELETE SET NULL,
  scheduled_at timestamptz NOT NULL,
  duration_minutes integer NOT NULL DEFAULT 30,
  status text NOT NULL DEFAULT 'scheduled', -- scheduled|confirmed|done|canceled|no_show
  reason text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.health_appointments TO authenticated;
GRANT ALL ON public.health_appointments TO service_role;
ALTER TABLE public.health_appointments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "health_appointments_tenant" ON public.health_appointments FOR ALL TO authenticated
  USING (company_id = get_user_company_id(auth.uid()))
  WITH CHECK (company_id = get_user_company_id(auth.uid()));
CREATE INDEX idx_health_appointments_company ON public.health_appointments(company_id);
CREATE INDEX idx_health_appointments_patient ON public.health_appointments(patient_id);
CREATE INDEX idx_health_appointments_sched ON public.health_appointments(scheduled_at);

-- RECORDS (prontuário)
CREATE TABLE public.health_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL DEFAULT get_user_company_id(auth.uid()),
  patient_id uuid NOT NULL REFERENCES public.health_patients(id) ON DELETE CASCADE,
  appointment_id uuid REFERENCES public.health_appointments(id) ON DELETE SET NULL,
  complaint text,
  diagnosis text,
  prescription text,
  notes text,
  created_by uuid DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.health_records TO authenticated;
GRANT ALL ON public.health_records TO service_role;
ALTER TABLE public.health_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "health_records_tenant" ON public.health_records FOR ALL TO authenticated
  USING (company_id = get_user_company_id(auth.uid()))
  WITH CHECK (company_id = get_user_company_id(auth.uid()));
CREATE INDEX idx_health_records_company ON public.health_records(company_id);
CREATE INDEX idx_health_records_patient ON public.health_records(patient_id);

-- updated_at triggers
CREATE TRIGGER trg_health_patients_updated BEFORE UPDATE ON public.health_patients
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_health_professionals_updated BEFORE UPDATE ON public.health_professionals
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_health_appointments_updated BEFORE UPDATE ON public.health_appointments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_health_records_updated BEFORE UPDATE ON public.health_records
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

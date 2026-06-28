
CREATE TABLE public.sre_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL UNIQUE REFERENCES public.companies(id) ON DELETE CASCADE,
  from_email TEXT,
  extra_recipients TEXT[] NOT NULL DEFAULT '{}',
  quiet_hours_start TIME,
  quiet_hours_end TIME,
  quiet_timezone TEXT NOT NULL DEFAULT 'America/Sao_Paulo',
  silence_weekends BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.sre_settings TO authenticated;
GRANT ALL ON public.sre_settings TO service_role;

ALTER TABLE public.sre_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sre_settings_admin_select" ON public.sre_settings
  FOR SELECT TO authenticated
  USING (
    company_id = public.get_user_company_id(auth.uid())
    AND public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "sre_settings_admin_write" ON public.sre_settings
  FOR ALL TO authenticated
  USING (
    company_id = public.get_user_company_id(auth.uid())
    AND public.has_role(auth.uid(), 'admin')
  )
  WITH CHECK (
    company_id = public.get_user_company_id(auth.uid())
    AND public.has_role(auth.uid(), 'admin')
  );

CREATE OR REPLACE FUNCTION public.tg_sre_settings_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

CREATE TRIGGER trg_sre_settings_updated_at
  BEFORE UPDATE ON public.sre_settings
  FOR EACH ROW EXECUTE FUNCTION public.tg_sre_settings_updated_at();

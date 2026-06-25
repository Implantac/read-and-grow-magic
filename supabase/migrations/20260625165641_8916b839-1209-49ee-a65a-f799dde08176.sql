
CREATE TABLE public.custom_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id uuid NOT NULL REFERENCES public.custom_entities(id) ON DELETE CASCADE,
  company_id uuid NOT NULL,
  branch_id uuid,
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by uuid,
  updated_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_custom_records_entity ON public.custom_records(entity_id);
CREATE INDEX idx_custom_records_company ON public.custom_records(company_id);
CREATE INDEX idx_custom_records_branch ON public.custom_records(branch_id);
CREATE INDEX idx_custom_records_data_gin ON public.custom_records USING gin(data);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.custom_records TO authenticated;
GRANT ALL ON public.custom_records TO service_role;

ALTER TABLE public.custom_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant read custom_records"
  ON public.custom_records FOR SELECT TO authenticated
  USING (company_id = public.get_user_company_id(auth.uid()));

CREATE POLICY "tenant insert custom_records"
  ON public.custom_records FOR INSERT TO authenticated
  WITH CHECK (
    company_id = public.get_user_company_id(auth.uid())
    AND (
      public.has_role(auth.uid(), 'admin'::app_role)
      OR public.has_role(auth.uid(), 'manager'::app_role)
      OR public.has_role(auth.uid(), 'operator'::app_role)
    )
  );

CREATE POLICY "tenant update custom_records"
  ON public.custom_records FOR UPDATE TO authenticated
  USING (company_id = public.get_user_company_id(auth.uid()))
  WITH CHECK (company_id = public.get_user_company_id(auth.uid()));

CREATE POLICY "admin delete custom_records"
  ON public.custom_records FOR DELETE TO authenticated
  USING (
    company_id = public.get_user_company_id(auth.uid())
    AND (
      public.has_role(auth.uid(), 'admin'::app_role)
      OR public.has_role(auth.uid(), 'manager'::app_role)
    )
  );

CREATE TRIGGER trg_custom_records_updated_at
  BEFORE UPDATE ON public.custom_records
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

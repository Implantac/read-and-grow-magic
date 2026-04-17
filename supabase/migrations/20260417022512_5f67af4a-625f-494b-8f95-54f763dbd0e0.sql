ALTER TABLE public.credit_audit_logs
  ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES public.companies(id);

DO $$
DECLARE
  v_count int;
  v_company uuid;
BEGIN
  SELECT count(*) INTO v_count FROM public.companies;
  IF v_count = 1 THEN
    SELECT id INTO v_company FROM public.companies LIMIT 1;
    UPDATE public.credit_audit_logs SET company_id = v_company WHERE company_id IS NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_credit_audit_logs_company_id
  ON public.credit_audit_logs (company_id);

DROP TRIGGER IF EXISTS set_credit_audit_logs_company_id ON public.credit_audit_logs;
CREATE TRIGGER set_credit_audit_logs_company_id
  BEFORE INSERT ON public.credit_audit_logs
  FOR EACH ROW EXECUTE FUNCTION public.set_company_id_from_user();

DROP POLICY IF EXISTS "Auth users can read credit_audit_logs" ON public.credit_audit_logs;
DROP POLICY IF EXISTS "Auth users can insert credit_audit_logs" ON public.credit_audit_logs;

CREATE POLICY "Company admins/managers can read credit_audit_logs"
  ON public.credit_audit_logs
  FOR SELECT
  TO authenticated
  USING (
    (
      company_id IS NOT NULL
      AND company_id = public.get_user_company_id(auth.uid())
      AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager'))
    )
    OR (company_id IS NULL AND public.has_role(auth.uid(), 'admin'))
  );

CREATE POLICY "Authenticated can insert credit_audit_logs for own company"
  ON public.credit_audit_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (
    company_id IS NULL
    OR company_id = public.get_user_company_id(auth.uid())
  );
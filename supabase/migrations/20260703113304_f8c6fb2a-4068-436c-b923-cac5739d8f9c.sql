
REVOKE EXECUTE ON FUNCTION public.fn_profiles_guard_admin_update() FROM anon, public;

DROP POLICY IF EXISTS sre_settings_admin_select ON public.sre_settings;
DROP POLICY IF EXISTS sre_settings_admin_write  ON public.sre_settings;

CREATE POLICY sre_settings_admin_select
  ON public.sre_settings FOR SELECT TO authenticated
  USING (
    company_id = get_user_company_id(auth.uid())
    AND has_role(auth.uid(), 'admin'::app_role)
  );

CREATE POLICY sre_settings_admin_write
  ON public.sre_settings FOR ALL TO authenticated
  USING (
    company_id = get_user_company_id(auth.uid())
    AND has_role(auth.uid(), 'admin'::app_role)
  )
  WITH CHECK (
    company_id = get_user_company_id(auth.uid())
    AND has_role(auth.uid(), 'admin'::app_role)
  );

CREATE OR REPLACE FUNCTION public.fn_system_parameters_autoflag_sensitive()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  IF NEW.code IS NOT NULL
     AND lower(NEW.code) ~ '(api[_-]?key|secret|token|password|passwd|private[_-]?key|webhook[_-]?secret|hmac|oauth|client[_-]?secret|access[_-]?key)'
  THEN
    NEW.sensitive := true;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_system_parameters_autoflag_sensitive ON public.system_parameters;
CREATE TRIGGER trg_system_parameters_autoflag_sensitive
  BEFORE INSERT OR UPDATE OF code, sensitive
  ON public.system_parameters
  FOR EACH ROW
  EXECUTE FUNCTION public.fn_system_parameters_autoflag_sensitive();

UPDATE public.system_parameters
   SET sensitive = true
 WHERE sensitive = false
   AND code IS NOT NULL
   AND lower(code) ~ '(api[_-]?key|secret|token|password|passwd|private[_-]?key|webhook[_-]?secret|hmac|oauth|client[_-]?secret|access[_-]?key)';


DO $$
DECLARE
  v_user uuid := '9f07c8a3-eaec-42c9-9a22-6603fe7a1125';
  v_company uuid;
BEGIN
  FOR v_company IN SELECT id FROM public.companies LOOP
    IF NOT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id=v_user AND company_id=v_company AND role='admin') THEN
      INSERT INTO public.user_roles (user_id, company_id, role) VALUES (v_user, v_company, 'admin');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id=v_user AND company_id=v_company AND role='system_admin') THEN
      INSERT INTO public.user_roles (user_id, company_id, role) VALUES (v_user, v_company, 'system_admin');
    END IF;
  END LOOP;

  DELETE FROM public.user_permission_overrides WHERE user_id = v_user AND granted = false;
END $$;

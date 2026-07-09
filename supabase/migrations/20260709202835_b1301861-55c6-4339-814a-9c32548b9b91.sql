
CREATE OR REPLACE FUNCTION public.audit_user_roles_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_company_id uuid;
BEGIN
  v_company_id := COALESCE(NEW.company_id, OLD.company_id);

  INSERT INTO public.system_audit_logs (user_id, company_id, action, module, entity_name, entity_id, old_data, new_data)
  VALUES (
    auth.uid(),
    v_company_id,
    TG_OP,
    'user_roles',
    'user_role',
    COALESCE(NEW.id, OLD.id),
    CASE WHEN TG_OP IN ('UPDATE','DELETE') THEN to_jsonb(OLD) ELSE NULL END,
    CASE WHEN TG_OP IN ('INSERT','UPDATE') THEN to_jsonb(NEW) ELSE NULL END
  );

  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trg_audit_user_roles ON public.user_roles;
CREATE TRIGGER trg_audit_user_roles
AFTER INSERT OR UPDATE OR DELETE ON public.user_roles
FOR EACH ROW EXECUTE FUNCTION public.audit_user_roles_changes();

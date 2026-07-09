-- Hardening: trigger to prevent privilege escalation via user_roles
-- Defense in depth on top of existing RLS.
CREATE OR REPLACE FUNCTION public.fn_user_roles_guard()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller uuid := auth.uid();
  v_is_system_admin boolean;
BEGIN
  -- Service role / no auth context bypass (edge functions & migrations)
  IF v_caller IS NULL THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  v_is_system_admin := public.has_role(v_caller, 'system_admin'::app_role);

  -- Block any attempt to touch own row unless system_admin
  IF TG_OP IN ('INSERT','UPDATE') AND NEW.user_id = v_caller AND NOT v_is_system_admin THEN
    RAISE EXCEPTION 'Users cannot assign or modify their own roles';
  END IF;
  IF TG_OP = 'DELETE' AND OLD.user_id = v_caller AND NOT v_is_system_admin THEN
    RAISE EXCEPTION 'Users cannot delete their own role rows';
  END IF;

  -- Block non-system_admin from ever creating/modifying admin/system_admin rows
  IF TG_OP IN ('INSERT','UPDATE')
     AND NEW.role IN ('admin'::app_role, 'system_admin'::app_role)
     AND NOT v_is_system_admin THEN
    RAISE EXCEPTION 'Only system_admin can grant admin or system_admin roles';
  END IF;
  IF TG_OP = 'UPDATE'
     AND OLD.role IN ('admin'::app_role, 'system_admin'::app_role)
     AND NOT v_is_system_admin THEN
    RAISE EXCEPTION 'Only system_admin can modify admin or system_admin roles';
  END IF;
  IF TG_OP = 'DELETE'
     AND OLD.role IN ('admin'::app_role, 'system_admin'::app_role)
     AND NOT v_is_system_admin THEN
    RAISE EXCEPTION 'Only system_admin can delete admin or system_admin roles';
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trg_user_roles_guard ON public.user_roles;
CREATE TRIGGER trg_user_roles_guard
BEFORE INSERT OR UPDATE OR DELETE ON public.user_roles
FOR EACH ROW EXECUTE FUNCTION public.fn_user_roles_guard();

REVOKE EXECUTE ON FUNCTION public.fn_user_roles_guard() FROM PUBLIC, anon, authenticated;
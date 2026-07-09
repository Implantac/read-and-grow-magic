
CREATE OR REPLACE FUNCTION public.prevent_profile_tenant_hijack()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Service role bypasses (edge functions / admin code)
  IF current_setting('request.jwt.claim.role', true) = 'service_role' THEN
    RETURN NEW;
  END IF;

  -- Admins can change tenant assignment (admin-mediated flow)
  IF public.has_role(auth.uid(), 'admin') THEN
    RETURN NEW;
  END IF;

  IF NEW.company_id IS DISTINCT FROM OLD.company_id THEN
    RAISE EXCEPTION 'not_allowed: company_id can only be changed by an admin';
  END IF;
  IF NEW.branch_id IS DISTINCT FROM OLD.branch_id THEN
    RAISE EXCEPTION 'not_allowed: branch_id can only be changed by an admin';
  END IF;
  IF NEW.default_branch_id IS DISTINCT FROM OLD.default_branch_id THEN
    RAISE EXCEPTION 'not_allowed: default_branch_id can only be changed by an admin';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_prevent_tenant_hijack ON public.profiles;
CREATE TRIGGER profiles_prevent_tenant_hijack
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_profile_tenant_hijack();


-- 1) billing_meters: meters are a global pricing catalog (non-sensitive),
--    needed by the frontend to render usage/pricing. Allow authenticated
--    SELECT but keep writes restricted to service_role.
DROP POLICY IF EXISTS "meters_read_all_auth" ON public.billing_meters;
CREATE POLICY "meters_read_all_auth"
ON public.billing_meters
FOR SELECT
TO authenticated
USING (true);
GRANT SELECT ON public.billing_meters TO authenticated;

-- 2) Harden has_role two-argument overload by blocking users from
--    changing their own profiles.company_id (the value that drives
--    get_user_company_id used by the two-arg has_role overload).
--    Only service_role (or SECURITY DEFINER admin RPCs) may change it.
CREATE OR REPLACE FUNCTION public.prevent_profile_company_id_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.company_id IS DISTINCT FROM OLD.company_id THEN
    -- Allow only when the caller is the service role (edge functions / admin RPCs)
    IF current_setting('request.jwt.claims', true)::jsonb->>'role' <> 'service_role' THEN
      RAISE EXCEPTION 'company_id cannot be modified by end users'
        USING ERRCODE = '42501';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_profile_company_id_change ON public.profiles;
CREATE TRIGGER trg_prevent_profile_company_id_change
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.prevent_profile_company_id_change();

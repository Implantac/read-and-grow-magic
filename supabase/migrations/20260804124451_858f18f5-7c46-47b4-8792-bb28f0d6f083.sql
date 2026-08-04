-- Hardening Security: Revoke EXECUTE on sensitive triggers from PUBLIC
-- This targets standard security definer functions that shouldn't be callable directly.

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;

-- Revoke anon access to sensitive NPS tables
REVOKE ALL ON public.nps_campaigns FROM anon;
REVOKE ALL ON public.nps_invites FROM anon;
GRANT SELECT ON public.nps_campaigns TO authenticated;
GRANT SELECT ON public.nps_invites TO authenticated;
GRANT ALL ON public.nps_campaigns TO service_role;
GRANT ALL ON public.nps_invites TO service_role;

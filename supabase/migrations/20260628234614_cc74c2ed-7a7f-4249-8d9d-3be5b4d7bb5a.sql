CREATE OR REPLACE FUNCTION public.is_system_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = 'system_admin'::public.app_role
  )
$$;

GRANT EXECUTE ON FUNCTION public.is_system_admin(uuid) TO authenticated;

DROP POLICY IF EXISTS plugins_system_admin_write ON public.plugins;
CREATE POLICY plugins_system_admin_write
  ON public.plugins
  FOR ALL
  TO authenticated
  USING (public.is_system_admin(auth.uid()))
  WITH CHECK (public.is_system_admin(auth.uid()));

DROP POLICY IF EXISTS plugins_system_admin_read ON public.plugins;
CREATE POLICY plugins_system_admin_read
  ON public.plugins
  FOR SELECT
  TO authenticated
  USING (public.is_system_admin(auth.uid()));
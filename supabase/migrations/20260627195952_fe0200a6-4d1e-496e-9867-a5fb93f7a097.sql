DROP POLICY IF EXISTS upo_read_own_or_admin ON public.user_permission_overrides;
CREATE POLICY upo_read_own_or_admin ON public.user_permission_overrides
FOR SELECT TO authenticated
USING (
  user_id = auth.uid()
  OR (company_id = get_user_company_id(auth.uid())
      AND has_role(auth.uid(), 'admin'::app_role, get_user_company_id(auth.uid())))
);
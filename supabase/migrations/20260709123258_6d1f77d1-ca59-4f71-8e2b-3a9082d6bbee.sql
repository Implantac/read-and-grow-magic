
-- 1) Revoke anon EXECUTE on SECURITY DEFINER function
REVOKE EXECUTE ON FUNCTION public.increment_nps_bank_usage(uuid[]) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.increment_nps_bank_usage(uuid[]) TO authenticated, service_role;

-- 2) Fix lgpd_data_requests insert policy: bind company_id to caller's company
DROP POLICY IF EXISTS lgpd_requests_owner_insert ON public.lgpd_data_requests;
CREATE POLICY lgpd_requests_owner_insert ON public.lgpd_data_requests
  FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND status = 'pending'::text
    AND company_id = public.get_user_company_id(auth.uid())
  );

-- 3) Fix nfce_returns delete policy: use app_role enum overload
DROP POLICY IF EXISTS nfce_returns_delete ON public.nfce_returns;
CREATE POLICY nfce_returns_delete ON public.nfce_returns
  FOR DELETE TO authenticated
  USING (
    has_role(auth.uid(), 'admin'::app_role)
    AND company_id = public.get_user_company_id(auth.uid())
  );

-- 4) Scope admin realtime topics per-company (admin:{company_id}:%)
DROP POLICY IF EXISTS "Authenticated can publish company-scoped realtime topics" ON realtime.messages;
DROP POLICY IF EXISTS "Authenticated can read company-scoped realtime topics" ON realtime.messages;

CREATE POLICY "Authenticated can publish company-scoped realtime topics"
  ON realtime.messages
  FOR INSERT TO authenticated
  WITH CHECK (
    realtime.topic() LIKE ('company:' || COALESCE(public.get_user_company_id(auth.uid())::text, '__none__') || ':%')
    OR realtime.topic() LIKE ('user:' || auth.uid()::text || ':%')
    OR realtime.topic() = ('user:' || auth.uid()::text)
    OR (
      has_role(auth.uid(), 'admin'::app_role)
      AND realtime.topic() LIKE ('admin:' || COALESCE(public.get_user_company_id(auth.uid())::text, '__none__') || ':%')
    )
  );

CREATE POLICY "Authenticated can read company-scoped realtime topics"
  ON realtime.messages
  FOR SELECT TO authenticated
  USING (
    realtime.topic() LIKE ('company:' || COALESCE(public.get_user_company_id(auth.uid())::text, '__none__') || ':%')
    OR realtime.topic() LIKE ('user:' || auth.uid()::text || ':%')
    OR realtime.topic() = ('user:' || auth.uid()::text)
    OR (
      has_role(auth.uid(), 'admin'::app_role)
      AND realtime.topic() LIKE ('admin:' || COALESCE(public.get_user_company_id(auth.uid())::text, '__none__') || ':%')
    )
  );

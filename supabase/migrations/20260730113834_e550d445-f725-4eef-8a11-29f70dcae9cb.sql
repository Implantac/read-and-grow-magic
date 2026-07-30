-- 1. WMS docks insert: enforce company_id
DROP POLICY IF EXISTS wms_docks_insert ON public.wms_docks;
CREATE POLICY wms_docks_insert ON public.wms_docks
FOR INSERT TO authenticated
WITH CHECK (
  company_id = get_user_company_id(auth.uid())
  AND (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role))
  AND EXISTS (
    SELECT 1 FROM warehouses w
    WHERE w.id = wms_docks.warehouse_id
      AND w.company_id = get_user_company_id(auth.uid())
  )
);

-- 2. NPS tables: restrict tenant policies to authenticated role
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'nps_alerts_config','nps_answer_items','nps_answers','nps_automations',
    'nps_campaigns','nps_invites','nps_logs','nps_questions','nps_reports',
    'nps_templates','nps_tokens','nps_webhooks'
  ] LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', t || '_tenant', t);
    EXECUTE format($f$
      CREATE POLICY %I ON public.%I
      AS PERMISSIVE FOR ALL TO authenticated
      USING (company_id IN (SELECT p.company_id FROM public.profiles p WHERE p.id = auth.uid()))
      WITH CHECK (company_id IN (SELECT p.company_id FROM public.profiles p WHERE p.id = auth.uid()))
    $f$, t || '_tenant', t);
    EXECUTE format('REVOKE ALL ON public.%I FROM anon', t);
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON public.%I TO authenticated', t);
    EXECUTE format('GRANT ALL ON public.%I TO service_role', t);
  END LOOP;
END $$;

-- 3. Revoke public/anon EXECUTE on privileged SECURITY DEFINER functions
REVOKE ALL ON FUNCTION public.prevent_profile_tenant_self_change() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.notify_alert_assignee_change() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.enforce_fiscal_close_lock() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.notifications_track_resolution() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.reopen_fiscal_day(uuid, date, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.reopen_fiscal_day(uuid, date, text) TO authenticated;
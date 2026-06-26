
CREATE OR REPLACE FUNCTION public.purge_old_logs_all()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  r jsonb := '{}'::jsonb;
  c integer;
BEGIN
  DELETE FROM public.system_audit_logs WHERE created_at < now() - interval '180 days';
  GET DIAGNOSTICS c = ROW_COUNT; r := r || jsonb_build_object('system_audit_logs', c);

  DELETE FROM public.financial_audit_logs WHERE created_at < now() - interval '365 days';
  GET DIAGNOSTICS c = ROW_COUNT; r := r || jsonb_build_object('financial_audit_logs', c);

  DELETE FROM public.financial_security_logs WHERE created_at < now() - interval '365 days';
  GET DIAGNOSTICS c = ROW_COUNT; r := r || jsonb_build_object('financial_security_logs', c);

  DELETE FROM public.financial_operations_log WHERE created_at < now() - interval '365 days';
  GET DIAGNOSTICS c = ROW_COUNT; r := r || jsonb_build_object('financial_operations_log', c);

  DELETE FROM public.credit_audit_logs WHERE created_at < now() - interval '365 days';
  GET DIAGNOSTICS c = ROW_COUNT; r := r || jsonb_build_object('credit_audit_logs', c);

  DELETE FROM public.ai_action_logs WHERE created_at < now() - interval '90 days';
  GET DIAGNOSTICS c = ROW_COUNT; r := r || jsonb_build_object('ai_action_logs', c);

  DELETE FROM public.ai_prompt_audit_logs WHERE created_at < now() - interval '90 days';
  GET DIAGNOSTICS c = ROW_COUNT; r := r || jsonb_build_object('ai_prompt_audit_logs', c);

  DELETE FROM public.wms_audit_log WHERE created_at < now() - interval '180 days';
  GET DIAGNOSTICS c = ROW_COUNT; r := r || jsonb_build_object('wms_audit_log', c);

  DELETE FROM public.wms_task_logs WHERE created_at < now() - interval '180 days';
  GET DIAGNOSTICS c = ROW_COUNT; r := r || jsonb_build_object('wms_task_logs', c);

  DELETE FROM public.wms_logs WHERE created_at < now() - interval '180 days';
  GET DIAGNOSTICS c = ROW_COUNT; r := r || jsonb_build_object('wms_logs', c);

  DELETE FROM public.pix_webhook_events WHERE created_at < now() - interval '90 days';
  GET DIAGNOSTICS c = ROW_COUNT; r := r || jsonb_build_object('pix_webhook_events', c);

  DELETE FROM public.automation_runs WHERE created_at < now() - interval '90 days';
  GET DIAGNOSTICS c = ROW_COUNT; r := r || jsonb_build_object('automation_runs', c);

  DELETE FROM public.lot_migration_audit WHERE created_at < now() - interval '365 days';
  GET DIAGNOSTICS c = ROW_COUNT; r := r || jsonb_build_object('lot_migration_audit', c);

  DELETE FROM public.financial_charges_log WHERE created_at < now() - interval '365 days';
  GET DIAGNOSTICS c = ROW_COUNT; r := r || jsonb_build_object('financial_charges_log', c);

  RETURN r;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.purge_old_logs_all() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.purge_old_logs_all() TO service_role;

-- Schedule daily at 03:00 UTC
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    PERFORM cron.unschedule('daily-log-retention')
      WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'daily-log-retention');
    PERFORM cron.schedule(
      'daily-log-retention',
      '0 3 * * *',
      $cron$ SELECT public.purge_old_logs_all(); $cron$
    );
  END IF;
END $$;

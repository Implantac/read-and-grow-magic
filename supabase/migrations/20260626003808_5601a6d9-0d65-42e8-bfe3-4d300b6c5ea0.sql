
-- Remove duplicated cron jobs (keep the canonical ones using app.settings.service_role_key)
SELECT cron.unschedule('ai-brain-autopilot-daily');
SELECT cron.unschedule('ai-brain-weekly-learning');

-- Schedule daily audit log purge (180 days retention)
SELECT cron.schedule(
  'purge-audit-logs-daily',
  '0 3 * * *',
  $$SELECT public.purge_old_audit_logs(180);$$
);

CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Remove agendamento anterior se existir
DO $$
BEGIN
  PERFORM cron.unschedule('ai-brain-daily-autopilot');
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

SELECT cron.schedule(
  'ai-brain-daily-autopilot',
  '0 7 * * *',
  $$
  SELECT net.http_post(
    url := 'https://arcuhqdiydlvekanychw.supabase.co/functions/v1/ai-brain',
    headers := '{"Content-Type":"application/json","Authorization":"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFyY3VocWRpeWRsdmVrYW55Y2h3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI2MzkwMjcsImV4cCI6MjA4ODIxNTAyN30.A8cr7OwGiu2LvrPk7R5un4Ctd42XfxWy_sh7ViS16Vo"}'::jsonb,
    body := '{"action":"cron_run"}'::jsonb
  ) AS request_id;
  $$
);
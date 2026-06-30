
SELECT cron.unschedule(jobname) FROM cron.job WHERE jobname IN ('wms-intelligence-30min','wms-slotting-daily');

SELECT cron.schedule(
  'wms-intelligence-30min',
  '*/30 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://arcuhqdiydlvekanychw.supabase.co/functions/v1/wms-intelligence',
    headers := '{"Content-Type":"application/json","Authorization":"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFyY3VocWRpeWRsdmVrYW55Y2h3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI2MzkwMjcsImV4cCI6MjA4ODIxNTAyN30.A8cr7OwGiu2LvrPk7R5un4Ctd42XfxWy_sh7ViS16Vo"}'::jsonb,
    body := '{}'::jsonb
  ) AS request_id;
  $$
);

SELECT cron.schedule(
  'wms-slotting-daily',
  '0 3 * * *',
  $$
  SELECT net.http_post(
    url := 'https://arcuhqdiydlvekanychw.supabase.co/functions/v1/wms-slotting-recompute',
    headers := '{"Content-Type":"application/json","Authorization":"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFyY3VocWRpeWRsdmVrYW55Y2h3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI2MzkwMjcsImV4cCI6MjA4ODIxNTAyN30.A8cr7OwGiu2LvrPk7R5un4Ctd42XfxWy_sh7ViS16Vo"}'::jsonb,
    body := '{}'::jsonb
  ) AS request_id;
  $$
);

CREATE OR REPLACE FUNCTION public.get_operator_productivity(p_days int DEFAULT 7)
RETURNS TABLE (
  operator_id uuid,
  operator_name text,
  tasks_completed bigint,
  avg_seconds_per_task numeric,
  picks bigint,
  putaways bigint,
  last_activity timestamptz
)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  WITH caller AS (
    SELECT company_id FROM public.profiles WHERE id = auth.uid()
  ),
  logs AS (
    SELECT tl.operator_id,
           tl.task_type,
           tl.duration_seconds,
           tl.created_at
    FROM public.wms_task_logs tl
    WHERE tl.company_id = (SELECT company_id FROM caller)
      AND tl.created_at >= now() - (p_days || ' days')::interval
  )
  SELECT
    l.operator_id,
    COALESCE(p.name, p.email, l.operator_id::text) AS operator_name,
    COUNT(*) AS tasks_completed,
    ROUND(AVG(NULLIF(l.duration_seconds, 0))::numeric, 1) AS avg_seconds_per_task,
    COUNT(*) FILTER (WHERE l.task_type ILIKE '%pick%') AS picks,
    COUNT(*) FILTER (WHERE l.task_type ILIKE '%putaway%') AS putaways,
    MAX(l.created_at) AS last_activity
  FROM logs l
  LEFT JOIN public.profiles p ON p.id = l.operator_id
  GROUP BY l.operator_id, p.name, p.email
  ORDER BY tasks_completed DESC
  LIMIT 50;
$$;

REVOKE EXECUTE ON FUNCTION public.get_operator_productivity(int) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_operator_productivity(int) TO authenticated, service_role;

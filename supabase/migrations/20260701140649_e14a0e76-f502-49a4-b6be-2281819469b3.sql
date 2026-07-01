
-- Sprint 21: Lembretes de action items vencendo
CREATE OR REPLACE FUNCTION public.sre_actions_due_scan(_within_hours integer DEFAULT 24)
RETURNS TABLE(action_id uuid, company_id uuid, postmortem_id uuid, title text, owner_id uuid, owner_email text, owner_name text, due_at timestamptz, priority text, hours_remaining numeric, overdue boolean)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT a.id, a.company_id, a.postmortem_id, a.title, a.owner_id,
         p.email, p.name, a.due_at, a.priority,
         EXTRACT(EPOCH FROM (a.due_at - now()))/3600.0 AS hours_remaining,
         (a.due_at < now()) AS overdue
  FROM public.sre_postmortem_actions a
  LEFT JOIN public.profiles p ON p.id = a.owner_id
  WHERE a.status IN ('open','in_progress')
    AND a.due_at IS NOT NULL
    AND a.due_at <= now() + make_interval(hours => _within_hours)
    AND a.owner_id IS NOT NULL
  ORDER BY a.due_at ASC
$$;

REVOKE ALL ON FUNCTION public.sre_actions_due_scan(integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.sre_actions_due_scan(integer) TO authenticated, service_role;

-- Auto-notify: create a notification for owner when due_at is near / overdue
CREATE OR REPLACE FUNCTION public.sre_actions_notify_due()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  r record;
  created_count int := 0;
BEGIN
  FOR r IN SELECT * FROM public.sre_actions_due_scan(24) LOOP
    -- avoid duplicate: skip if notification already created in last 12h
    IF NOT EXISTS (
      SELECT 1 FROM public.notifications n
      WHERE n.user_id = r.owner_id
        AND n.type = 'sre_action_due'
        AND n.metadata->>'action_id' = r.action_id::text
        AND n.created_at > now() - interval '12 hours'
    ) THEN
      INSERT INTO public.notifications (user_id, type, title, message, metadata, company_id)
      VALUES (
        r.owner_id,
        'sre_action_due',
        CASE WHEN r.overdue THEN 'Ação SRE vencida' ELSE 'Ação SRE vencendo' END,
        r.title || ' — ' || CASE WHEN r.overdue THEN 'vencida' ELSE 'vence em ' || round(r.hours_remaining,1) || 'h' END,
        jsonb_build_object('action_id', r.action_id, 'postmortem_id', r.postmortem_id, 'priority', r.priority, 'due_at', r.due_at, 'overdue', r.overdue),
        r.company_id
      );
      created_count := created_count + 1;
    END IF;
  END LOOP;
  RETURN jsonb_build_object('notifications_created', created_count, 'scanned_at', now());
END;
$$;

REVOKE ALL ON FUNCTION public.sre_actions_notify_due() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.sre_actions_notify_due() TO authenticated, service_role;

-- Cron: run every hour
SELECT cron.schedule(
  'sre-actions-due-hourly',
  '0 * * * *',
  $$ SELECT public.sre_actions_notify_due(); $$
);

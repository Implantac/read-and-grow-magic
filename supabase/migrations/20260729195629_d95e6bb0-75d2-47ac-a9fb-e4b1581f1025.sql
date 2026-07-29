CREATE TABLE IF NOT EXISTS public.internal_fn_secrets (
  name text PRIMARY KEY,
  value text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

REVOKE ALL ON public.internal_fn_secrets FROM anon, authenticated;
GRANT ALL ON public.internal_fn_secrets TO service_role;
ALTER TABLE public.internal_fn_secrets ENABLE ROW LEVEL SECURITY;

INSERT INTO public.internal_fn_secrets (name, value)
VALUES ('edge_internal', encode(gen_random_bytes(32), 'hex'))
ON CONFLICT (name) DO NOTHING;

CREATE OR REPLACE FUNCTION public.get_internal_fn_secret()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT value FROM public.internal_fn_secrets WHERE name = 'edge_internal';
$$;

REVOKE ALL ON FUNCTION public.get_internal_fn_secret() FROM PUBLIC, anon, authenticated;

-- Trigger: alerta atribuído -> envia segredo interno
CREATE OR REPLACE FUNCTION public.notify_alert_assignee_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_url text;
BEGIN
  IF NEW.assigned_to IS NULL THEN
    RETURN NEW;
  END IF;
  IF TG_OP = 'UPDATE' AND OLD.assigned_to IS NOT DISTINCT FROM NEW.assigned_to THEN
    RETURN NEW;
  END IF;

  BEGIN
    v_url := current_setting('app.supabase_url', true);
    IF v_url IS NULL OR v_url = '' THEN
      v_url := 'https://arcuhqdiydlvekanychw.supabase.co';
    END IF;

    PERFORM net.http_post(
      url := v_url || '/functions/v1/notify-alert-assignee',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'x-internal-secret', public.get_internal_fn_secret()
      ),
      body := jsonb_build_object('notification_id', NEW.id, 'mode', 'assigned')
    );
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;

  RETURN NEW;
END;
$$;

-- Escalonamento: chama a function com segredo interno
CREATE OR REPLACE FUNCTION public.escalate_overdue_alerts()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row record;
  v_target uuid;
  v_count integer := 0;
BEGIN
  FOR v_row IN
    SELECT n.id, n.company_id, n.assigned_to, n.title, n.due_at
    FROM public.notifications n
    WHERE n.resolved_at IS NULL
      AND n.escalated_at IS NULL
      AND n.assigned_to IS NOT NULL
      AND n.due_at IS NOT NULL
      AND n.due_at < now()
      AND n.type IN ('warning','error','alert','reconciliation','sla')
    LIMIT 200
  LOOP
    SELECT ur.user_id INTO v_target
      FROM public.user_roles ur
      JOIN public.profiles p ON p.id = ur.user_id
     WHERE p.company_id = v_row.company_id
       AND ur.role = 'admin_matriz'
       AND ur.user_id <> v_row.assigned_to
     ORDER BY ur.user_id
     LIMIT 1;

    IF v_target IS NULL THEN
      SELECT ur.user_id INTO v_target
        FROM public.user_roles ur
        JOIN public.profiles p ON p.id = ur.user_id
       WHERE p.company_id = v_row.company_id
         AND ur.role = 'admin'
         AND ur.user_id <> v_row.assigned_to
       ORDER BY ur.user_id
       LIMIT 1;
    END IF;

    IF v_target IS NULL THEN
      CONTINUE;
    END IF;

    UPDATE public.notifications
       SET escalated_at   = now(),
           escalated_from = assigned_to,
           escalated_to   = v_target,
           assigned_to    = v_target,
           sla_warned_at  = NULL,
           metadata       = COALESCE(metadata,'{}'::jsonb) || jsonb_build_object(
             'escalation', jsonb_build_object(
               'at', now(),
               'from', v_row.assigned_to,
               'to', v_target,
               'reason', 'sla_overdue'
             )
           )
     WHERE id = v_row.id;

    PERFORM net.http_post(
      url := 'https://arcuhqdiydlvekanychw.supabase.co/functions/v1/notify-alert-assignee',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'x-internal-secret', public.get_internal_fn_secret()
      ),
      body := jsonb_build_object('notification_id', v_row.id, 'mode', 'escalated')
    );

    v_count := v_count + 1;
  END LOOP;

  RETURN v_count;
END;
$$;

-- Trigger de incidente crítico -> segredo interno em vez de anon key
CREATE OR REPLACE FUNCTION public.tg_notify_incident_email()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  fn_url text := 'https://arcuhqdiydlvekanychw.supabase.co/functions/v1/notify-incident-email';
BEGIN
  IF NEW.severity = 'critical' THEN
    PERFORM net.http_post(
      url := fn_url,
      headers := jsonb_build_object(
        'Content-Type','application/json',
        'x-internal-secret', public.get_internal_fn_secret()
      ),
      body := jsonb_build_object('incident_id', NEW.id)
    );
  END IF;
  RETURN NEW;
END;
$$;

-- Cron de aviso de SLA passa a enviar o segredo interno
DO $$
DECLARE
  v_secret text := public.get_internal_fn_secret();
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    BEGIN
      PERFORM cron.unschedule('alert-sla-warning');
    EXCEPTION WHEN OTHERS THEN NULL;
    END;
    PERFORM cron.schedule(
      'alert-sla-warning',
      '*/15 * * * *',
      format(
        $cron$SELECT net.http_post(
          url := 'https://arcuhqdiydlvekanychw.supabase.co/functions/v1/notify-alert-assignee',
          headers := jsonb_build_object('Content-Type','application/json','x-internal-secret', %L),
          body := jsonb_build_object('mode','sla_warning')
        );$cron$, v_secret)
    );
  END IF;
END $$;

-- Allow service_role / SECURITY DEFINER triggers to insert notifications for any user
DROP POLICY IF EXISTS "Service role can insert notifications" ON public.notifications;
CREATE POLICY "Service role can insert notifications"
ON public.notifications FOR INSERT
TO service_role
WITH CHECK (true);

-- Trigger function: when a system_incident is opened, notify all admins of the tenant
CREATE OR REPLACE FUNCTION public.fn_notify_incident_opened()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_admin RECORD;
  v_type TEXT;
BEGIN
  IF NEW.status <> 'open' THEN
    RETURN NEW;
  END IF;

  v_type := CASE NEW.severity
    WHEN 'critical' THEN 'error'
    WHEN 'major' THEN 'error'
    ELSE 'warning'
  END;

  FOR v_admin IN
    SELECT ur.user_id
    FROM public.user_roles ur
    JOIN public.profiles p ON p.id = ur.user_id
    WHERE ur.role = 'admin'
      AND p.company_id = NEW.company_id
  LOOP
    INSERT INTO public.notifications (user_id, company_id, type, title, description, module)
    VALUES (
      v_admin.user_id,
      NEW.company_id,
      v_type,
      'Incidente ' || NEW.severity || ' aberto: ' || NEW.title,
      COALESCE(NEW.description, 'Fonte: ' || COALESCE(NEW.source, 'manual')),
      'SRE'
    );
  END LOOP;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_incident_opened ON public.system_incidents;
CREATE TRIGGER trg_notify_incident_opened
AFTER INSERT ON public.system_incidents
FOR EACH ROW
EXECUTE FUNCTION public.fn_notify_incident_opened();

REVOKE EXECUTE ON FUNCTION public.fn_notify_incident_opened() FROM PUBLIC, anon, authenticated;

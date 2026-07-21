
ALTER TABLE public.notifications
  ADD COLUMN IF NOT EXISTS assigned_to uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS due_at timestamptz,
  ADD COLUMN IF NOT EXISTS resolved_at timestamptz,
  ADD COLUMN IF NOT EXISTS resolved_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_notifications_assigned_to ON public.notifications(assigned_to);
CREATE INDEX IF NOT EXISTS idx_notifications_due_at ON public.notifications(due_at);

-- Trigger: fill resolved_at/resolved_by when read flips true; clear when reopened
CREATE OR REPLACE FUNCTION public.notifications_track_resolution()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.read = true AND (OLD.read IS DISTINCT FROM NEW.read) THEN
    NEW.resolved_at := now();
    NEW.resolved_by := auth.uid();
  ELSIF NEW.read = false AND (OLD.read IS DISTINCT FROM NEW.read) THEN
    NEW.resolved_at := NULL;
    NEW.resolved_by := NULL;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notifications_track_resolution ON public.notifications;
CREATE TRIGGER trg_notifications_track_resolution
  BEFORE UPDATE ON public.notifications
  FOR EACH ROW EXECUTE FUNCTION public.notifications_track_resolution();

-- RPC: admins assign responsible + SLA
CREATE OR REPLACE FUNCTION public.assign_notification(
  _notification_id uuid,
  _assigned_to uuid,
  _due_at timestamptz
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_company uuid;
BEGIN
  SELECT company_id INTO v_company FROM public.notifications WHERE id = _notification_id;
  IF v_company IS NULL THEN
    RAISE EXCEPTION 'Notification not found';
  END IF;

  IF NOT (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR public.has_role(auth.uid(), 'admin_matriz'::app_role)
  ) THEN
    RAISE EXCEPTION 'Only admins can assign notifications';
  END IF;

  UPDATE public.notifications
    SET assigned_to = _assigned_to,
        due_at = _due_at
  WHERE id = _notification_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.assign_notification(uuid, uuid, timestamptz) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.assign_notification(uuid, uuid, timestamptz) TO authenticated;

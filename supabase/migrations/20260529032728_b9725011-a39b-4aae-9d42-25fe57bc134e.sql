CREATE OR REPLACE FUNCTION public.notify_critical_brain_decision()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'pending' AND NEW.impact_level IN ('critical', 'high') THEN
    INSERT INTO public.notifications (user_id, type, title, description, module)
    SELECT
      ur.user_id,
      CASE WHEN NEW.impact_level = 'critical' THEN 'error' ELSE 'warning' END,
      '🧠 Decisão ' || UPPER(NEW.impact_level) || ' do Cérebro',
      NEW.title || ' — ' || COALESCE(LEFT(NEW.rationale, 160), ''),
      'Cérebro'
    FROM public.user_roles ur
    WHERE ur.role = 'admin';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_critical_brain_decision ON public.ai_brain_decisions;
CREATE TRIGGER trg_notify_critical_brain_decision
AFTER INSERT ON public.ai_brain_decisions
FOR EACH ROW
EXECUTE FUNCTION public.notify_critical_brain_decision();
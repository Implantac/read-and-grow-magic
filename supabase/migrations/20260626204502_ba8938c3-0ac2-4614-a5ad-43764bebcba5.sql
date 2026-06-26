
CREATE TABLE IF NOT EXISTS public.workflow_triggers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  workflow_definition_id uuid NOT NULL REFERENCES public.workflow_definitions(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  source_module text,
  condition jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_active boolean NOT NULL DEFAULT true,
  description text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.workflow_triggers TO authenticated;
GRANT ALL ON public.workflow_triggers TO service_role;
ALTER TABLE public.workflow_triggers ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_wf_triggers_company ON public.workflow_triggers(company_id);
CREATE INDEX IF NOT EXISTS idx_wf_triggers_event ON public.workflow_triggers(event_type, is_active) WHERE is_active;

CREATE POLICY "wft_tenant_select" ON public.workflow_triggers FOR SELECT TO authenticated
  USING (company_id = public.get_user_company_id(auth.uid()));
CREATE POLICY "wft_admin_write" ON public.workflow_triggers FOR ALL TO authenticated
  USING (company_id = public.get_user_company_id(auth.uid()) AND public.has_role(auth.uid(), 'admin'))
  WITH CHECK (company_id = public.get_user_company_id(auth.uid()) AND public.has_role(auth.uid(), 'admin'));

-- Safe condition evaluator (subset of JsonLogic, no recursion explosion)
CREATE OR REPLACE FUNCTION public.eval_wf_condition(cond jsonb, ctx jsonb)
RETURNS boolean
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $$
DECLARE
  op text;
  args jsonb;
  path text;
  expected jsonb;
  actual jsonb;
  child jsonb;
BEGIN
  IF cond IS NULL OR cond = '{}'::jsonb THEN RETURN true; END IF;
  SELECT k, v INTO op, args FROM jsonb_each(cond) LIMIT 1;
  IF op = 'and' THEN
    FOR child IN SELECT * FROM jsonb_array_elements(args) LOOP
      IF NOT public.eval_wf_condition(child, ctx) THEN RETURN false; END IF;
    END LOOP;
    RETURN true;
  ELSIF op = 'or' THEN
    FOR child IN SELECT * FROM jsonb_array_elements(args) LOOP
      IF public.eval_wf_condition(child, ctx) THEN RETURN true; END IF;
    END LOOP;
    RETURN false;
  ELSIF op IN ('==','!=','>','>=','<','<=') THEN
    path := (args->0)::text;
    path := trim(both '"' FROM path);
    expected := args->1;
    actual := ctx #> string_to_array(path,'.');
    IF actual IS NULL THEN RETURN false; END IF;
    IF op = '==' THEN RETURN actual = expected;
    ELSIF op = '!=' THEN RETURN actual <> expected;
    ELSIF op = '>'  THEN RETURN (actual)::text::numeric >  (expected)::text::numeric;
    ELSIF op = '>=' THEN RETURN (actual)::text::numeric >= (expected)::text::numeric;
    ELSIF op = '<'  THEN RETURN (actual)::text::numeric <  (expected)::text::numeric;
    ELSIF op = '<=' THEN RETURN (actual)::text::numeric <= (expected)::text::numeric;
    END IF;
  END IF;
  RETURN false;
EXCEPTION WHEN OTHERS THEN
  RETURN false;
END;
$$;

-- Trigger that fires after cross_module_events insert
CREATE OR REPLACE FUNCTION public.evaluate_workflow_triggers()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  trg RECORD;
  first_step text;
BEGIN
  FOR trg IN
    SELECT wt.id, wt.workflow_definition_id, wt.condition, wd.steps
    FROM public.workflow_triggers wt
    JOIN public.workflow_definitions wd ON wd.id = wt.workflow_definition_id
    WHERE wt.is_active = true
      AND wt.company_id = NEW.company_id
      AND wt.event_type = NEW.event_type
      AND (wt.source_module IS NULL OR wt.source_module = NEW.source_module)
      AND wd.is_active = true
  LOOP
    IF public.eval_wf_condition(trg.condition, COALESCE(NEW.payload, '{}'::jsonb)) THEN
      first_step := COALESCE((trg.steps->0->>'id'), 'start');
      INSERT INTO public.workflow_instances(
        company_id, workflow_definition_id, current_step, status, context, started_at
      ) VALUES (
        NEW.company_id, trg.workflow_definition_id, first_step, 'in_progress',
        jsonb_build_object('trigger_event_id', NEW.id, 'event_type', NEW.event_type, 'payload', NEW.payload),
        now()
      );
    END IF;
  END LOOP;
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_evaluate_workflow_triggers ON public.cross_module_events;
CREATE TRIGGER trg_evaluate_workflow_triggers
AFTER INSERT ON public.cross_module_events
FOR EACH ROW EXECUTE FUNCTION public.evaluate_workflow_triggers();

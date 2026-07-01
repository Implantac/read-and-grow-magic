CREATE TABLE IF NOT EXISTS public.sre_postmortem_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  postmortem_id uuid NOT NULL REFERENCES public.sre_postmortems(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  owner_id uuid,
  due_at timestamptz,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open','in_progress','done','cancelled')),
  priority text NOT NULL DEFAULT 'medium' CHECK (priority IN ('low','medium','high','critical')),
  completed_at timestamptz,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.sre_postmortem_actions TO authenticated;
GRANT ALL ON public.sre_postmortem_actions TO service_role;

ALTER TABLE public.sre_postmortem_actions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sre_pm_actions_tenant_read" ON public.sre_postmortem_actions
  FOR SELECT TO authenticated
  USING (company_id = public.get_user_company_id(auth.uid()));

CREATE POLICY "sre_pm_actions_tenant_write" ON public.sre_postmortem_actions
  FOR ALL TO authenticated
  USING (company_id = public.get_user_company_id(auth.uid()))
  WITH CHECK (company_id = public.get_user_company_id(auth.uid()));

CREATE INDEX IF NOT EXISTS idx_sre_pm_actions_pm ON public.sre_postmortem_actions(postmortem_id);
CREATE INDEX IF NOT EXISTS idx_sre_pm_actions_owner ON public.sre_postmortem_actions(owner_id, status);
CREATE INDEX IF NOT EXISTS idx_sre_pm_actions_company ON public.sre_postmortem_actions(company_id, status);

CREATE TRIGGER trg_sre_pm_actions_updated
  BEFORE UPDATE ON public.sre_postmortem_actions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.sre_postmortem_action_upsert(
  _id uuid,
  _postmortem_id uuid,
  _title text,
  _description text DEFAULT NULL,
  _owner_id uuid DEFAULT NULL,
  _due_at timestamptz DEFAULT NULL,
  _priority text DEFAULT 'medium'
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_company uuid;
  v_id uuid;
  v_user_company uuid;
BEGIN
  v_user_company := public.get_user_company_id(auth.uid());
  SELECT company_id INTO v_company FROM public.sre_postmortems WHERE id = _postmortem_id;
  IF v_company IS NULL OR v_company <> v_user_company THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  IF _id IS NULL THEN
    INSERT INTO public.sre_postmortem_actions(company_id, postmortem_id, title, description, owner_id, due_at, priority, created_by)
    VALUES (v_company, _postmortem_id, _title, _description, _owner_id, _due_at, _priority, auth.uid())
    RETURNING id INTO v_id;
  ELSE
    UPDATE public.sre_postmortem_actions
       SET title = _title, description = _description, owner_id = _owner_id,
           due_at = _due_at, priority = _priority, updated_at = now()
     WHERE id = _id AND company_id = v_company
     RETURNING id INTO v_id;
  END IF;
  RETURN v_id;
END;
$$;

REVOKE ALL ON FUNCTION public.sre_postmortem_action_upsert(uuid,uuid,text,text,uuid,timestamptz,text) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.sre_postmortem_action_upsert(uuid,uuid,text,text,uuid,timestamptz,text) TO authenticated;

CREATE OR REPLACE FUNCTION public.sre_postmortem_action_set_status(_id uuid, _status text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF _status NOT IN ('open','in_progress','done','cancelled') THEN
    RAISE EXCEPTION 'invalid status';
  END IF;
  UPDATE public.sre_postmortem_actions
     SET status = _status,
         completed_at = CASE WHEN _status = 'done' THEN now() ELSE NULL END,
         updated_at = now()
   WHERE id = _id AND company_id = public.get_user_company_id(auth.uid());
END;
$$;

REVOKE ALL ON FUNCTION public.sre_postmortem_action_set_status(uuid, text) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.sre_postmortem_action_set_status(uuid, text) TO authenticated;

CREATE OR REPLACE FUNCTION public.sre_postmortem_actions_inbox(_only_mine boolean DEFAULT true)
RETURNS TABLE(
  id uuid, postmortem_id uuid, postmortem_title text,
  title text, status text, priority text,
  owner_id uuid, due_at timestamptz, overdue boolean
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT a.id, a.postmortem_id, p.title,
         a.title, a.status, a.priority,
         a.owner_id, a.due_at,
         (a.due_at IS NOT NULL AND a.due_at < now() AND a.status IN ('open','in_progress')) AS overdue
    FROM public.sre_postmortem_actions a
    JOIN public.sre_postmortems p ON p.id = a.postmortem_id
   WHERE a.company_id = public.get_user_company_id(auth.uid())
     AND a.status IN ('open','in_progress')
     AND (NOT _only_mine OR a.owner_id = auth.uid())
   ORDER BY (a.due_at IS NULL), a.due_at ASC, a.priority DESC;
$$;

REVOKE ALL ON FUNCTION public.sre_postmortem_actions_inbox(boolean) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.sre_postmortem_actions_inbox(boolean) TO authenticated;
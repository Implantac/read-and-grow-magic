
-- Workflow Engine v3: parallel approvals + delegation

CREATE TABLE IF NOT EXISTS public.workflow_approvals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  instance_id uuid NOT NULL REFERENCES public.workflow_instances(id) ON DELETE CASCADE,
  step_key text NOT NULL,
  approver_id uuid NOT NULL,
  required boolean NOT NULL DEFAULT true,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected','delegated','skipped')),
  decision_comment text,
  decided_at timestamptz,
  delegated_to uuid,
  delegated_from uuid,
  due_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.workflow_approvals TO authenticated;
GRANT ALL ON public.workflow_approvals TO service_role;
ALTER TABLE public.workflow_approvals ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_wa_instance ON public.workflow_approvals(instance_id);
CREATE INDEX IF NOT EXISTS idx_wa_company_approver ON public.workflow_approvals(company_id, approver_id, status);
CREATE INDEX IF NOT EXISTS idx_wa_delegated ON public.workflow_approvals(company_id, delegated_to) WHERE delegated_to IS NOT NULL;

CREATE POLICY wa_select ON public.workflow_approvals FOR SELECT TO authenticated
  USING (company_id = get_user_company_id(auth.uid()));

CREATE POLICY wa_insert ON public.workflow_approvals FOR INSERT TO authenticated
  WITH CHECK (
    company_id = get_user_company_id(auth.uid())
    AND (has_role(auth.uid(),'admin'::text,company_id) OR has_role(auth.uid(),'manager'::text,company_id))
  );

CREATE POLICY wa_update_self ON public.workflow_approvals FOR UPDATE TO authenticated
  USING (
    company_id = get_user_company_id(auth.uid())
    AND (
      approver_id = auth.uid()
      OR delegated_to = auth.uid()
      OR has_role(auth.uid(),'admin'::text,company_id)
    )
  )
  WITH CHECK (company_id = get_user_company_id(auth.uid()));

CREATE TRIGGER tg_wa_updated BEFORE UPDATE ON public.workflow_approvals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Delegations table: standing rules (vacation, out-of-office)
CREATE TABLE IF NOT EXISTS public.workflow_delegations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  from_user uuid NOT NULL,
  to_user uuid NOT NULL,
  reason text,
  starts_at timestamptz NOT NULL DEFAULT now(),
  ends_at timestamptz,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (from_user <> to_user)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.workflow_delegations TO authenticated;
GRANT ALL ON public.workflow_delegations TO service_role;
ALTER TABLE public.workflow_delegations ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_wdel_company_active ON public.workflow_delegations(company_id, is_active) WHERE is_active;
CREATE INDEX IF NOT EXISTS idx_wdel_from ON public.workflow_delegations(company_id, from_user);

CREATE POLICY wdel_select ON public.workflow_delegations FOR SELECT TO authenticated
  USING (company_id = get_user_company_id(auth.uid()));

CREATE POLICY wdel_write_self_or_admin ON public.workflow_delegations FOR ALL TO authenticated
  USING (
    company_id = get_user_company_id(auth.uid())
    AND (from_user = auth.uid() OR has_role(auth.uid(),'admin'::text,company_id))
  )
  WITH CHECK (
    company_id = get_user_company_id(auth.uid())
    AND (from_user = auth.uid() OR has_role(auth.uid(),'admin'::text,company_id))
  );

CREATE TRIGGER tg_wdel_updated BEFORE UPDATE ON public.workflow_delegations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RPC: register a decision (approve/reject/delegate) on a parallel approval
CREATE OR REPLACE FUNCTION public.fn_workflow_decide(
  _approval_id uuid,
  _decision text,
  _comment text DEFAULT NULL,
  _delegate_to uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_approval public.workflow_approvals%ROWTYPE;
  v_company uuid;
  v_uid uuid := auth.uid();
  v_remaining int;
  v_rejected int;
  v_instance public.workflow_instances%ROWTYPE;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;

  SELECT * INTO v_approval FROM public.workflow_approvals WHERE id = _approval_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'approval_not_found'; END IF;

  v_company := get_user_company_id(v_uid);
  IF v_approval.company_id <> v_company THEN RAISE EXCEPTION 'forbidden'; END IF;
  IF v_approval.status <> 'pending' THEN RAISE EXCEPTION 'already_decided'; END IF;

  IF v_approval.approver_id <> v_uid
     AND COALESCE(v_approval.delegated_to,'00000000-0000-0000-0000-000000000000'::uuid) <> v_uid
     AND NOT has_role(v_uid,'admin'::text,v_company) THEN
    RAISE EXCEPTION 'not_approver';
  END IF;

  IF _decision = 'delegate' THEN
    IF _delegate_to IS NULL THEN RAISE EXCEPTION 'delegate_target_required'; END IF;
    UPDATE public.workflow_approvals
      SET status='delegated', delegated_to=_delegate_to, delegated_from=v_uid,
          decision_comment=_comment, decided_at=now()
      WHERE id=_approval_id;
    -- create a new pending approval for the delegate
    INSERT INTO public.workflow_approvals(company_id,instance_id,step_key,approver_id,required,due_at)
      VALUES (v_approval.company_id,v_approval.instance_id,v_approval.step_key,_delegate_to,v_approval.required,v_approval.due_at);
    RETURN jsonb_build_object('ok',true,'action','delegated');
  END IF;

  IF _decision NOT IN ('approve','reject') THEN
    RAISE EXCEPTION 'invalid_decision';
  END IF;

  UPDATE public.workflow_approvals
    SET status = CASE _decision WHEN 'approve' THEN 'approved' ELSE 'rejected' END,
        decision_comment = _comment,
        decided_at = now()
    WHERE id = _approval_id;

  -- Evaluate step completion (all required approvers acted)
  SELECT COUNT(*) FILTER (WHERE status='pending' AND required),
         COUNT(*) FILTER (WHERE status='rejected' AND required)
    INTO v_remaining, v_rejected
    FROM public.workflow_approvals
    WHERE instance_id = v_approval.instance_id AND step_key = v_approval.step_key;

  IF v_rejected > 0 THEN
    UPDATE public.workflow_instances SET status='rejected', completed_at=now()
      WHERE id = v_approval.instance_id;
    INSERT INTO public.workflow_transitions(company_id,instance_id,from_step,to_step,actor_id,comment)
      VALUES (v_approval.company_id,v_approval.instance_id,v_approval.step_key,'rejected',v_uid,_comment);
  ELSIF v_remaining = 0 THEN
    INSERT INTO public.workflow_transitions(company_id,instance_id,from_step,to_step,actor_id,comment)
      VALUES (v_approval.company_id,v_approval.instance_id,v_approval.step_key,'approved',v_uid,_comment);
    -- Caller workflow advances the instance to next step using existing engine
  END IF;

  RETURN jsonb_build_object('ok',true,'action',_decision,'remaining',v_remaining,'rejected',v_rejected);
END;
$$;

REVOKE ALL ON FUNCTION public.fn_workflow_decide(uuid,text,text,uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.fn_workflow_decide(uuid,text,text,uuid) TO authenticated;

-- Helper: open approvals for the current user (including via active delegation)
CREATE OR REPLACE FUNCTION public.fn_my_pending_approvals()
RETURNS SETOF public.workflow_approvals
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT a.* FROM public.workflow_approvals a
  WHERE a.status='pending'
    AND a.company_id = get_user_company_id(auth.uid())
    AND (
      a.approver_id = auth.uid()
      OR a.delegated_to = auth.uid()
      OR EXISTS (
        SELECT 1 FROM public.workflow_delegations d
        WHERE d.company_id = a.company_id
          AND d.from_user = a.approver_id
          AND d.to_user = auth.uid()
          AND d.is_active
          AND d.starts_at <= now()
          AND (d.ends_at IS NULL OR d.ends_at >= now())
      )
    )
  ORDER BY COALESCE(a.due_at, a.created_at + interval '7 days') ASC;
$$;

REVOKE ALL ON FUNCTION public.fn_my_pending_approvals() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.fn_my_pending_approvals() TO authenticated;

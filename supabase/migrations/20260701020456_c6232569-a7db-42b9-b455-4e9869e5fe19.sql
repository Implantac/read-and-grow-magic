
CREATE TABLE IF NOT EXISTS public.purchase_approval_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  level int NOT NULL,
  min_amount numeric NOT NULL DEFAULT 0,
  max_amount numeric,
  approver_role text NOT NULL,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (company_id, level)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.purchase_approval_rules TO authenticated;
GRANT ALL ON public.purchase_approval_rules TO service_role;

ALTER TABLE public.purchase_approval_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "par_tenant_read" ON public.purchase_approval_rules
  FOR SELECT TO authenticated
  USING (company_id = public.get_user_company_id(auth.uid()));

CREATE POLICY "par_tenant_admin_write" ON public.purchase_approval_rules
  FOR ALL TO authenticated
  USING (company_id = public.get_user_company_id(auth.uid())
         AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager')))
  WITH CHECK (company_id = public.get_user_company_id(auth.uid())
         AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager')));

DROP TRIGGER IF EXISTS trg_par_updated_at ON public.purchase_approval_rules;
CREATE TRIGGER trg_par_updated_at
  BEFORE UPDATE ON public.purchase_approval_rules
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.purchase_submit_for_approval(p_po_id uuid)
RETURNS TABLE(level int, approver_role text, approval_id uuid)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_company uuid; v_total numeric; v_instance uuid; r record; v_created uuid; v_user_co uuid;
BEGIN
  v_user_co := public.get_user_company_id(auth.uid());
  SELECT company_id, total INTO v_company, v_total FROM public.purchase_orders WHERE id = p_po_id;
  IF v_company IS NULL THEN RAISE EXCEPTION 'PO % not found', p_po_id; END IF;
  IF v_company <> v_user_co THEN RAISE EXCEPTION 'Cross-tenant access denied'; END IF;

  v_instance := p_po_id;

  DELETE FROM public.workflow_approvals
    WHERE company_id = v_company AND instance_id = v_instance AND status = 'pending';

  FOR r IN
    SELECT par.level, par.approver_role
    FROM public.purchase_approval_rules par
    WHERE par.company_id = v_company AND par.active
      AND v_total >= par.min_amount
      AND (par.max_amount IS NULL OR v_total <= par.max_amount)
    ORDER BY par.level ASC
  LOOP
    INSERT INTO public.workflow_approvals (company_id, instance_id, step_key, required, status)
    VALUES (v_company, v_instance, 'po_l' || r.level || ':' || r.approver_role, true, 'pending')
    RETURNING id INTO v_created;
    level := r.level; approver_role := r.approver_role; approval_id := v_created;
    RETURN NEXT;
  END LOOP;

  UPDATE public.purchase_orders SET status = 'awaiting_approval', updated_at = now() WHERE id = p_po_id;
END;
$$;

REVOKE ALL ON FUNCTION public.purchase_submit_for_approval(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.purchase_submit_for_approval(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.purchase_approval_decide(
  p_approval_id uuid, p_approve boolean, p_comment text DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_company uuid; v_po uuid; v_role text; v_pending int; v_user_co uuid;
BEGIN
  v_user_co := public.get_user_company_id(auth.uid());
  SELECT wa.company_id, wa.instance_id, split_part(wa.step_key, ':', 2)
    INTO v_company, v_po, v_role
  FROM public.workflow_approvals wa WHERE wa.id = p_approval_id;
  IF v_company IS NULL THEN RAISE EXCEPTION 'Approval not found'; END IF;
  IF v_company <> v_user_co THEN RAISE EXCEPTION 'Cross-tenant access denied'; END IF;
  IF NOT public.has_role(auth.uid(), v_role::app_role) THEN
    RAISE EXCEPTION 'User lacks role % for this approval', v_role;
  END IF;

  UPDATE public.workflow_approvals
    SET status = CASE WHEN p_approve THEN 'approved' ELSE 'rejected' END,
        approver_id = auth.uid(), decision_comment = p_comment,
        decided_at = now(), updated_at = now()
    WHERE id = p_approval_id;

  IF NOT p_approve THEN
    UPDATE public.purchase_orders SET status = 'rejected', updated_at = now() WHERE id = v_po;
    RETURN jsonb_build_object('status','rejected','po_id', v_po);
  END IF;

  SELECT count(*) INTO v_pending FROM public.workflow_approvals
    WHERE instance_id = v_po AND company_id = v_company AND status = 'pending';

  IF v_pending = 0 THEN
    UPDATE public.purchase_orders SET status = 'approved', updated_at = now() WHERE id = v_po;
    RETURN jsonb_build_object('status','approved','po_id', v_po);
  END IF;

  RETURN jsonb_build_object('status','pending_next','po_id', v_po, 'pending', v_pending);
END;
$$;

REVOKE ALL ON FUNCTION public.purchase_approval_decide(uuid, boolean, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.purchase_approval_decide(uuid, boolean, text) TO authenticated;

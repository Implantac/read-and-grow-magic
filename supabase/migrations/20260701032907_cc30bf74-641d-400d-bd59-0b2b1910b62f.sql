
ALTER TABLE public.purchase_approval_rules
  ADD COLUMN IF NOT EXISTS sla_hours integer NOT NULL DEFAULT 24;

ALTER TABLE public.workflow_approvals
  ADD COLUMN IF NOT EXISTS due_at timestamptz,
  ADD COLUMN IF NOT EXISTS breach_notified_at timestamptz,
  ADD COLUMN IF NOT EXISTS pending_notified_at timestamptz;

DROP FUNCTION IF EXISTS public.purchase_submit_for_approval(uuid);

CREATE FUNCTION public.purchase_submit_for_approval(p_po_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_company uuid;
  v_amount numeric;
  v_rule record;
  v_count int := 0;
BEGIN
  SELECT company_id, total_amount INTO v_company, v_amount
    FROM public.purchase_orders WHERE id = p_po_id;
  IF v_company IS NULL THEN
    RAISE EXCEPTION 'purchase_order_not_found';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND company_id = v_company
  ) THEN
    RAISE EXCEPTION 'not_authorized';
  END IF;

  DELETE FROM public.workflow_approvals
    WHERE entity_type = 'purchase_order' AND entity_id = p_po_id AND status = 'pending';

  FOR v_rule IN
    SELECT * FROM public.purchase_approval_rules
     WHERE company_id = v_company
       AND active = true
       AND v_amount >= min_amount
       AND (max_amount IS NULL OR v_amount <= max_amount)
     ORDER BY level ASC
  LOOP
    INSERT INTO public.workflow_approvals(
      company_id, entity_type, entity_id, step_key,
      required_role, status, due_at
    ) VALUES (
      v_company, 'purchase_order', p_po_id,
      'po_l' || v_rule.level,
      v_rule.approver_role,
      'pending',
      now() + make_interval(hours => v_rule.sla_hours)
    );
    v_count := v_count + 1;
  END LOOP;

  UPDATE public.purchase_orders
     SET status = 'pending_approval', updated_at = now()
   WHERE id = p_po_id;

  RETURN jsonb_build_object('ok', true, 'levels', v_count);
END;
$$;

REVOKE ALL ON FUNCTION public.purchase_submit_for_approval(uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.purchase_submit_for_approval(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.purchase_approval_sla_status(p_approval_id uuid)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'due_at', wa.due_at,
    'now', now(),
    'status',
      CASE
        WHEN wa.status <> 'pending' THEN 'closed'
        WHEN wa.due_at IS NULL THEN 'on_track'
        WHEN now() >= wa.due_at THEN 'breached'
        WHEN now() >= wa.due_at - interval '4 hours' THEN 'at_risk'
        ELSE 'on_track'
      END
  )
  FROM public.workflow_approvals wa
  WHERE wa.id = p_approval_id
    AND wa.company_id IN (
      SELECT company_id FROM public.profiles WHERE id = auth.uid()
    );
$$;

GRANT EXECUTE ON FUNCTION public.purchase_approval_sla_status(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.purchase_approvals_sla_scan()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_company uuid;
  v_row record;
  v_user record;
  v_breached int := 0;
  v_pending int := 0;
BEGIN
  SELECT company_id INTO v_company FROM public.profiles WHERE id = auth.uid();
  IF v_company IS NULL THEN
    RAISE EXCEPTION 'no_company_scope';
  END IF;

  FOR v_row IN
    SELECT wa.* FROM public.workflow_approvals wa
     WHERE wa.company_id = v_company
       AND wa.status = 'pending'
       AND wa.entity_type = 'purchase_order'
       AND wa.due_at IS NOT NULL
       AND now() >= wa.due_at
       AND wa.breach_notified_at IS NULL
  LOOP
    FOR v_user IN
      SELECT DISTINCT ur.user_id
        FROM public.user_roles ur
        JOIN public.profiles p ON p.id = ur.user_id
       WHERE ur.role::text = v_row.required_role
         AND p.company_id = v_company
    LOOP
      INSERT INTO public.notifications(user_id, type, title, description, module, read)
      VALUES (
        v_user.user_id, 'error',
        'Aprovação de compra vencida',
        'Ordem #' || v_row.entity_id || ' — nível ' || v_row.step_key || ' ultrapassou o SLA.',
        'purchasing', false
      );
    END LOOP;
    UPDATE public.workflow_approvals SET breach_notified_at = now() WHERE id = v_row.id;
    v_breached := v_breached + 1;
  END LOOP;

  FOR v_row IN
    SELECT wa.* FROM public.workflow_approvals wa
     WHERE wa.company_id = v_company
       AND wa.status = 'pending'
       AND wa.entity_type = 'purchase_order'
       AND wa.pending_notified_at IS NULL
  LOOP
    FOR v_user IN
      SELECT DISTINCT ur.user_id
        FROM public.user_roles ur
        JOIN public.profiles p ON p.id = ur.user_id
       WHERE ur.role::text = v_row.required_role
         AND p.company_id = v_company
    LOOP
      INSERT INTO public.notifications(user_id, type, title, description, module, read)
      VALUES (
        v_user.user_id, 'warning',
        'Nova aprovação de compra pendente',
        'Ordem #' || v_row.entity_id || ' aguarda sua decisão (' || v_row.step_key || ').',
        'purchasing', false
      );
    END LOOP;
    UPDATE public.workflow_approvals SET pending_notified_at = now() WHERE id = v_row.id;
    v_pending := v_pending + 1;
  END LOOP;

  RETURN jsonb_build_object('breached', v_breached, 'pending', v_pending);
END;
$$;

REVOKE ALL ON FUNCTION public.purchase_approvals_sla_scan() FROM public;
GRANT EXECUTE ON FUNCTION public.purchase_approvals_sla_scan() TO authenticated;

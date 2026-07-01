
CREATE OR REPLACE FUNCTION public.purchase_approvals_metrics(
  p_from timestamptz DEFAULT (now() - interval '30 days'),
  p_to   timestamptz DEFAULT now()
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_company uuid := public.get_user_company_id(auth.uid());
  v_result jsonb;
  v_totals jsonb;
  v_by_approver jsonb;
  v_by_requester jsonb;
  v_timeline jsonb;
BEGIN
  IF v_company IS NULL THEN
    RETURN jsonb_build_object('error','no_company');
  END IF;

  WITH base AS (
    SELECT wa.*
    FROM public.workflow_approvals wa
    WHERE wa.company_id = v_company
      AND wa.step_key LIKE 'po_l%'
      AND wa.created_at BETWEEN p_from AND p_to
  )
  SELECT jsonb_build_object(
    'total', COUNT(*),
    'pending', COUNT(*) FILTER (WHERE status='pending'),
    'approved', COUNT(*) FILTER (WHERE status='approved'),
    'rejected', COUNT(*) FILTER (WHERE status='rejected'),
    'breached', COUNT(*) FILTER (WHERE breach_notified_at IS NOT NULL),
    'breach_rate', ROUND(
      COALESCE(
        COUNT(*) FILTER (WHERE breach_notified_at IS NOT NULL)::numeric
        / NULLIF(COUNT(*),0) * 100, 0), 2),
    'avg_lead_time_hours', ROUND(
      COALESCE(AVG(
        EXTRACT(EPOCH FROM (decided_at - created_at))/3600.0
      ) FILTER (WHERE decided_at IS NOT NULL), 0)::numeric, 2)
  )
  INTO v_totals
  FROM base;

  SELECT COALESCE(jsonb_agg(row_to_json(t) ORDER BY t.total DESC), '[]'::jsonb)
  INTO v_by_approver
  FROM (
    SELECT
      COALESCE(decided_by::text, 'não decidido') AS approver,
      COUNT(*) AS total,
      COUNT(*) FILTER (WHERE status='approved') AS approved,
      COUNT(*) FILTER (WHERE status='rejected') AS rejected,
      ROUND(COALESCE(AVG(
        EXTRACT(EPOCH FROM (decided_at - created_at))/3600.0
      ) FILTER (WHERE decided_at IS NOT NULL), 0)::numeric, 2) AS avg_hours
    FROM public.workflow_approvals
    WHERE company_id = v_company
      AND step_key LIKE 'po_l%'
      AND created_at BETWEEN p_from AND p_to
      AND decided_by IS NOT NULL
    GROUP BY decided_by
    LIMIT 20
  ) t;

  SELECT COALESCE(jsonb_agg(row_to_json(t) ORDER BY t.total DESC), '[]'::jsonb)
  INTO v_by_requester
  FROM (
    SELECT
      COALESCE(po.created_by::text, 'desconhecido') AS requester,
      COUNT(*) AS total,
      COUNT(*) FILTER (WHERE wa.status='approved') AS approved,
      COUNT(*) FILTER (WHERE wa.status='rejected') AS rejected,
      ROUND(COALESCE(SUM(po.total_amount),0)::numeric, 2) AS total_amount
    FROM public.workflow_approvals wa
    LEFT JOIN public.purchase_orders po ON po.id::text = wa.entity_id
    WHERE wa.company_id = v_company
      AND wa.step_key LIKE 'po_l%'
      AND wa.created_at BETWEEN p_from AND p_to
    GROUP BY po.created_by
    LIMIT 20
  ) t;

  SELECT COALESCE(jsonb_agg(row_to_json(t) ORDER BY t.day), '[]'::jsonb)
  INTO v_timeline
  FROM (
    SELECT
      date_trunc('day', created_at)::date AS day,
      COUNT(*) AS submitted,
      COUNT(*) FILTER (WHERE status='approved') AS approved,
      COUNT(*) FILTER (WHERE status='rejected') AS rejected,
      COUNT(*) FILTER (WHERE breach_notified_at IS NOT NULL) AS breached
    FROM public.workflow_approvals
    WHERE company_id = v_company
      AND step_key LIKE 'po_l%'
      AND created_at BETWEEN p_from AND p_to
    GROUP BY 1
  ) t;

  v_result := jsonb_build_object(
    'from', p_from,
    'to', p_to,
    'totals', v_totals,
    'by_approver', v_by_approver,
    'by_requester', v_by_requester,
    'timeline', v_timeline
  );
  RETURN v_result;
END;
$$;

REVOKE ALL ON FUNCTION public.purchase_approvals_metrics(timestamptz, timestamptz) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.purchase_approvals_metrics(timestamptz, timestamptz) TO authenticated;

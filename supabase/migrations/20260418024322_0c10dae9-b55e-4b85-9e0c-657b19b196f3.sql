
CREATE TABLE IF NOT EXISTS public.financial_audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  audit_run_id uuid NOT NULL,
  level text NOT NULL CHECK (level IN ('low','medium','high')),
  category text NOT NULL,
  check_name text NOT NULL,
  description text NOT NULL,
  details jsonb,
  affected_count integer DEFAULT 0,
  affected_amount numeric DEFAULT 0,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open','resolved','ignored','auto_fixed')),
  auto_fixed boolean DEFAULT false,
  resolved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_fal_created ON public.financial_audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_fal_level_status ON public.financial_audit_logs(level, status);
CREATE INDEX IF NOT EXISTS idx_fal_run ON public.financial_audit_logs(audit_run_id);

ALTER TABLE public.financial_audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins/managers view audit logs" ON public.financial_audit_logs;
CREATE POLICY "Admins/managers view audit logs" ON public.financial_audit_logs
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'manager'));

DROP POLICY IF EXISTS "System inserts audit logs" ON public.financial_audit_logs;
CREATE POLICY "System inserts audit logs" ON public.financial_audit_logs
  FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Admins update audit logs" ON public.financial_audit_logs;
CREATE POLICY "Admins update audit logs" ON public.financial_audit_logs
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin'));

CREATE OR REPLACE FUNCTION public.run_financial_audit(_mode text DEFAULT 'light')
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public
AS $$
DECLARE
  v_run uuid := gen_random_uuid();
  v_open int;
  v_fixed int;
  r record;
  v_count int;
BEGIN
  -- A) Divergência ledger vs saldo bancário
  FOR r IN
    SELECT ba.id, ba.name, ba.balance,
           COALESCE((SELECT SUM(CASE WHEN type='inflow' THEN amount ELSE -amount END)
                     FROM financial_ledger WHERE bank_account_id = ba.id),0) AS ledger_sum
    FROM bank_accounts ba WHERE ba.active=true
  LOOP
    IF abs(r.balance - r.ledger_sum) > 0.01 THEN
      INSERT INTO financial_audit_logs(audit_run_id, level, category, check_name, description, details, affected_amount)
      VALUES (v_run,'high','ledger','balance_mismatch',
        format('Divergência saldo conta "%s": banco=%s ledger=%s', r.name, r.balance, r.ledger_sum),
        jsonb_build_object('account_id',r.id,'bank_balance',r.balance,'ledger_sum',r.ledger_sum),
        abs(r.balance - r.ledger_sum));
    END IF;
  END LOOP;

  -- B) Contas pagas sem ledger
  INSERT INTO financial_audit_logs(audit_run_id, level, category, check_name, description, affected_count, affected_amount)
  SELECT v_run,'high','transactions','paid_without_ledger',
         format('%s contas %s pagas sem lançamento no ledger', c, s), c, a
    FROM (
      SELECT 'receivable' s, count(*)::int c, COALESCE(sum(amount),0) a FROM accounts_receivable ar
       WHERE ar.status='paid' AND NOT EXISTS (SELECT 1 FROM financial_ledger l WHERE l.source='receivable' AND l.source_id=ar.id)
      UNION ALL
      SELECT 'payable', count(*)::int, COALESCE(sum(amount),0) FROM accounts_payable ap
       WHERE ap.status='paid' AND NOT EXISTS (SELECT 1 FROM financial_ledger l WHERE l.source='payable' AND l.source_id=ap.id)
    ) o WHERE c > 0;

  -- C) Vencidos não reclassificados (auto-fix)
  WITH fixed_ar AS (
    UPDATE accounts_receivable SET status='overdue', updated_at=now()
     WHERE status='pending' AND due_date < CURRENT_DATE RETURNING 1
  ), fixed_ap AS (
    UPDATE accounts_payable SET status='overdue', updated_at=now()
     WHERE status='pending' AND due_date < CURRENT_DATE RETURNING 1
  )
  SELECT (SELECT count(*) FROM fixed_ar) + (SELECT count(*) FROM fixed_ap) INTO v_count;
  IF v_count > 0 THEN
    INSERT INTO financial_audit_logs(audit_run_id, level, category, check_name, description, affected_count, status, auto_fixed)
    VALUES (v_run,'medium','transactions','overdue_reclassified',
            format('Reclassificados %s títulos vencidos', v_count), v_count,'auto_fixed',true);
  END IF;

  -- D) Saldo negativo
  INSERT INTO financial_audit_logs(audit_run_id, level, category, check_name, description, details, affected_count)
  SELECT v_run,'high','treasury','negative_balance',
         format('Conta "%s" com saldo negativo: %s', name, balance),
         jsonb_build_object('account_id',id,'balance',balance),1
    FROM bank_accounts WHERE active=true AND balance < 0;

  IF _mode = 'full' THEN
    -- E) Lançamentos sem categoria
    SELECT count(*)::int INTO v_count FROM financial_ledger WHERE category_id IS NULL;
    IF v_count > 0 THEN
      INSERT INTO financial_audit_logs(audit_run_id, level, category, check_name, description, affected_count, affected_amount)
      SELECT v_run,'low','dre','ledger_no_category',
             format('%s lançamentos sem categoria DRE', v_count), v_count, COALESCE(sum(amount),0)
        FROM financial_ledger WHERE category_id IS NULL;
    END IF;

    -- F) Recalcular open_amount (auto-fix)
    WITH ar_fix AS (
      UPDATE accounts_receivable SET open_amount = GREATEST(amount - COALESCE(paid_amount,0),0)
       WHERE open_amount IS DISTINCT FROM GREATEST(amount - COALESCE(paid_amount,0),0) RETURNING 1
    ), ap_fix AS (
      UPDATE accounts_payable SET open_amount = GREATEST(amount - COALESCE(paid_amount,0),0)
       WHERE open_amount IS DISTINCT FROM GREATEST(amount - COALESCE(paid_amount,0),0) RETURNING 1
    )
    SELECT (SELECT count(*) FROM ar_fix)+(SELECT count(*) FROM ap_fix) INTO v_count;
    IF v_count > 0 THEN
      INSERT INTO financial_audit_logs(audit_run_id, level, category, check_name, description, affected_count, status, auto_fixed)
      VALUES (v_run,'low','transactions','open_amount_recalc',
              format('Recalculados %s open_amount', v_count), v_count,'auto_fixed',true);
    END IF;

    -- G) Bank transactions não conciliadas
    SELECT count(*)::int INTO v_count FROM bank_transactions WHERE status != 'matched' AND date < CURRENT_DATE - 7;
    IF v_count > 0 THEN
      INSERT INTO financial_audit_logs(audit_run_id, level, category, check_name, description, affected_count)
      VALUES (v_run,'medium','reconciliation','unmatched_bank_tx',
              format('%s transações bancárias não conciliadas há +7 dias', v_count), v_count);
    END IF;
  END IF;

  SELECT count(*)::int INTO v_open FROM financial_audit_logs WHERE audit_run_id = v_run AND status='open';
  SELECT count(*)::int INTO v_fixed FROM financial_audit_logs WHERE audit_run_id = v_run AND auto_fixed=true;

  RETURN jsonb_build_object(
    'run_id', v_run, 'mode', _mode,
    'issues_open', v_open, 'auto_fixed', v_fixed,
    'executed_at', now()
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.run_financial_audit(text) TO authenticated, service_role;

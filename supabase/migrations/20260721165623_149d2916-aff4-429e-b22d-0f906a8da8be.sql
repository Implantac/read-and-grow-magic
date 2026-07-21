
CREATE OR REPLACE FUNCTION public.auto_resolve_reconciliation_alerts()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_company RECORD;
  v_bill_div int;
  v_bank_div numeric;
  v_since timestamptz := now() - interval '7 days';
  v_resolved_bill int := 0;
  v_resolved_bank int := 0;
  v_upd int;
BEGIN
  FOR v_company IN
    SELECT DISTINCT company_id
    FROM public.notifications
    WHERE company_id IS NOT NULL
      AND resolved_at IS NULL
      AND type = 'warning'
      AND title IN ('Divergência faturamento × estoque','Divergência bancária por canal')
  LOOP
    -- Recalcula faturamento x estoque
    SELECT count(*) INTO v_bill_div
    FROM public.order_items oi
    JOIN public.orders o ON o.id = oi.order_id
    WHERE o.company_id = v_company.company_id
      AND o.created_at >= v_since
      AND o.status IN ('billed','shipped','delivered','invoiced')
      AND NOT EXISTS (
        SELECT 1 FROM public.stock_movements sm
        WHERE sm.company_id = o.company_id
          AND sm.reference_id = o.id::text
          AND sm.movement_type IN ('out','sale','shipment')
      );

    IF v_bill_div = 0 THEN
      UPDATE public.notifications
      SET read = true,
          resolved_at = now(),
          resolved_by = NULL,
          description = coalesce(description,'') || E'\n[Auto-resolvido pelo sistema em ' || to_char(now(),'DD/MM/YYYY HH24:MI') || ']'
      WHERE company_id = v_company.company_id
        AND resolved_at IS NULL
        AND type = 'warning'
        AND title = 'Divergência faturamento × estoque';
      GET DIAGNOSTICS v_upd = ROW_COUNT;
      v_resolved_bill := v_resolved_bill + v_upd;
    END IF;

    -- Recalcula conciliação bancária
    SELECT coalesce(sum(abs(bt.amount)),0) INTO v_bank_div
    FROM public.bank_transactions bt
    WHERE bt.company_id = v_company.company_id
      AND bt.transaction_date >= v_since::date
      AND NOT EXISTS (
        SELECT 1 FROM public.financial_ledger fl
        WHERE fl.company_id = bt.company_id
          AND fl.reference_id = bt.id::text
      );

    IF v_bank_div = 0 THEN
      UPDATE public.notifications
      SET read = true,
          resolved_at = now(),
          resolved_by = NULL,
          description = coalesce(description,'') || E'\n[Auto-resolvido pelo sistema em ' || to_char(now(),'DD/MM/YYYY HH24:MI') || ']'
      WHERE company_id = v_company.company_id
        AND resolved_at IS NULL
        AND type = 'warning'
        AND title = 'Divergência bancária por canal';
      GET DIAGNOSTICS v_upd = ROW_COUNT;
      v_resolved_bank := v_resolved_bank + v_upd;
    END IF;
  END LOOP;

  RETURN jsonb_build_object(
    'resolved_billing', v_resolved_bill,
    'resolved_bank', v_resolved_bank,
    'ran_at', now()
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.auto_resolve_reconciliation_alerts() FROM PUBLIC, anon, authenticated;

-- Agenda cron a cada hora
DO $$
BEGIN
  PERFORM cron.unschedule('auto-resolve-reconciliation-alerts');
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

SELECT cron.schedule(
  'auto-resolve-reconciliation-alerts',
  '15 * * * *',
  $$SELECT public.auto_resolve_reconciliation_alerts();$$
);

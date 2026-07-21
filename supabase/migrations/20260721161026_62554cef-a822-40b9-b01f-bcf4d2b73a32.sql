
CREATE EXTENSION IF NOT EXISTS pg_cron;

CREATE OR REPLACE FUNCTION public.run_daily_reconciliation_alerts()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_company RECORD;
  v_admin RECORD;
  v_bill_div int;
  v_bank_div numeric;
  v_since timestamptz := now() - interval '7 days';
BEGIN
  FOR v_company IN
    SELECT DISTINCT company_id
    FROM public.profiles
    WHERE company_id IS NOT NULL
  LOOP
    -- Faturamento x Estoque: itens faturados sem baixa no ledger nos últimos 7d
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

    -- Conciliação bancária por canal: transações bancárias sem match no ledger nos últimos 7d
    SELECT coalesce(sum(abs(bt.amount)),0) INTO v_bank_div
    FROM public.bank_transactions bt
    WHERE bt.company_id = v_company.company_id
      AND bt.transaction_date >= v_since::date
      AND NOT EXISTS (
        SELECT 1 FROM public.financial_ledger fl
        WHERE fl.company_id = bt.company_id
          AND fl.reference_id = bt.id::text
      );

    IF v_bill_div = 0 AND v_bank_div = 0 THEN
      CONTINUE;
    END IF;

    FOR v_admin IN
      SELECT ur.user_id
      FROM public.user_roles ur
      JOIN public.profiles p ON p.id = ur.user_id
      WHERE p.company_id = v_company.company_id
        AND ur.role IN ('admin','admin_matriz')
    LOOP
      IF v_bill_div > 0 THEN
        INSERT INTO public.notifications (user_id, company_id, type, title, description, module, read)
        VALUES (
          v_admin.user_id,
          v_company.company_id,
          'warning',
          'Divergência faturamento × estoque',
          v_bill_div || ' pedido(s) faturado(s) nos últimos 7 dias sem baixa no ledger. Abra /comercial/reconciliacao-faturamento-estoque.',
          'financial',
          false
        );
      END IF;

      IF v_bank_div > 0 THEN
        INSERT INTO public.notifications (user_id, company_id, type, title, description, module, read)
        VALUES (
          v_admin.user_id,
          v_company.company_id,
          'warning',
          'Divergência bancária por canal',
          'R$ ' || to_char(v_bank_div,'FM999G999G990D00') || ' em movimentações bancárias sem conciliação nos últimos 7 dias. Abra /financeiro/conciliacao-canal.',
          'financial',
          false
        );
      END IF;
    END LOOP;
  END LOOP;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.run_daily_reconciliation_alerts() FROM PUBLIC, anon, authenticated;

-- Remover schedule antigo se existir
DO $$
BEGIN
  PERFORM cron.unschedule('daily-reconciliation-alerts');
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

SELECT cron.schedule(
  'daily-reconciliation-alerts',
  '0 8 * * *',
  $$SELECT public.run_daily_reconciliation_alerts();$$
);

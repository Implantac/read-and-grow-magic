
-- 1) Snapshot table
CREATE TABLE IF NOT EXISTS public.daily_fiscal_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  branch_id uuid,
  canal_operacional text,
  snapshot_date date NOT NULL,
  stock_in_qty numeric NOT NULL DEFAULT 0,
  stock_out_qty numeric NOT NULL DEFAULT 0,
  stock_in_cost numeric NOT NULL DEFAULT 0,
  stock_out_cost numeric NOT NULL DEFAULT 0,
  financial_in numeric NOT NULL DEFAULT 0,
  financial_out numeric NOT NULL DEFAULT 0,
  net_flow numeric NOT NULL DEFAULT 0,
  closed_at timestamptz NOT NULL DEFAULT now(),
  closed_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (company_id, branch_id, canal_operacional, snapshot_date)
);

GRANT SELECT ON public.daily_fiscal_snapshots TO authenticated;
GRANT ALL ON public.daily_fiscal_snapshots TO service_role;

ALTER TABLE public.daily_fiscal_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "snapshots_company_read"
ON public.daily_fiscal_snapshots
FOR SELECT
TO authenticated
USING (company_id = public.get_user_company_id(auth.uid()));

CREATE INDEX IF NOT EXISTS idx_daily_snap_company_date
  ON public.daily_fiscal_snapshots (company_id, snapshot_date DESC);

-- 2) Function that closes the previous day
CREATE OR REPLACE FUNCTION public.close_fiscal_day(p_date date DEFAULT (current_date - 1))
RETURNS int
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_rows int := 0;
BEGIN
  INSERT INTO public.daily_fiscal_snapshots (
    company_id, branch_id, canal_operacional, snapshot_date,
    stock_in_qty, stock_out_qty, stock_in_cost, stock_out_cost,
    financial_in, financial_out, net_flow
  )
  SELECT
    company_id, branch_id, canal_operacional::text, p_date,
    coalesce(sum(CASE WHEN direction = 'in'  THEN quantity ELSE 0 END),0),
    coalesce(sum(CASE WHEN direction = 'out' THEN quantity ELSE 0 END),0),
    coalesce(sum(CASE WHEN direction = 'in'  THEN total_cost ELSE 0 END),0),
    coalesce(sum(CASE WHEN direction = 'out' THEN total_cost ELSE 0 END),0),
    0, 0, 0
  FROM public.stock_movements
  WHERE created_at::date = p_date
    AND company_id IS NOT NULL
  GROUP BY company_id, branch_id, canal_operacional
  ON CONFLICT (company_id, branch_id, canal_operacional, snapshot_date) DO NOTHING;

  -- Financial rollup
  INSERT INTO public.daily_fiscal_snapshots (
    company_id, branch_id, canal_operacional, snapshot_date,
    financial_in, financial_out, net_flow
  )
  SELECT
    company_id, branch_id, canal_operacional::text, p_date,
    coalesce(sum(CASE WHEN type = 'in'  THEN amount ELSE 0 END),0),
    coalesce(sum(CASE WHEN type = 'out' THEN amount ELSE 0 END),0),
    coalesce(sum(CASE WHEN type = 'in'  THEN amount ELSE -amount END),0)
  FROM public.financial_ledger
  WHERE entry_date = p_date AND company_id IS NOT NULL
  GROUP BY company_id, branch_id, canal_operacional
  ON CONFLICT (company_id, branch_id, canal_operacional, snapshot_date)
  DO UPDATE SET
    financial_in  = EXCLUDED.financial_in,
    financial_out = EXCLUDED.financial_out,
    net_flow      = EXCLUDED.net_flow,
    closed_at     = now();

  GET DIAGNOSTICS v_rows = ROW_COUNT;
  RETURN v_rows;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.close_fiscal_day(date) FROM PUBLIC, anon, authenticated;

-- 3) Retroactive-lock guard
CREATE OR REPLACE FUNCTION public.enforce_fiscal_close_lock()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_target_date date;
  v_company uuid;
  v_locked boolean;
BEGIN
  -- Service role / authorized bypass (legacy ledger flag) may write retroactively
  IF auth.role() = 'service_role' THEN
    RETURN NEW;
  END IF;

  BEGIN
    IF current_setting('app.allow_ledger_bypass', true) = 'on' THEN
      RETURN NEW;
    END IF;
  EXCEPTION WHEN OTHERS THEN NULL;
  END;

  IF TG_TABLE_NAME = 'stock_movements' THEN
    v_target_date := (NEW.created_at)::date;
    v_company := NEW.company_id;
  ELSE
    v_target_date := NEW.entry_date;
    v_company := NEW.company_id;
  END IF;

  IF v_company IS NULL OR v_target_date IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM public.daily_fiscal_snapshots
    WHERE company_id = v_company AND snapshot_date >= v_target_date
  ) INTO v_locked;

  IF v_locked AND NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Lançamento bloqueado: data % já está em período fiscal fechado', v_target_date
      USING HINT = 'Contate um administrador para reabrir o período.';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_fiscal_lock_stock ON public.stock_movements;
CREATE TRIGGER trg_fiscal_lock_stock
BEFORE INSERT ON public.stock_movements
FOR EACH ROW EXECUTE FUNCTION public.enforce_fiscal_close_lock();

DROP TRIGGER IF EXISTS trg_fiscal_lock_ledger ON public.financial_ledger;
CREATE TRIGGER trg_fiscal_lock_ledger
BEFORE INSERT ON public.financial_ledger
FOR EACH ROW EXECUTE FUNCTION public.enforce_fiscal_close_lock();

-- 4) Schedule daily close at 23:55 UTC
DO $$
BEGIN
  PERFORM cron.unschedule('daily-fiscal-close');
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

SELECT cron.schedule(
  'daily-fiscal-close',
  '55 23 * * *',
  $$SELECT public.close_fiscal_day();$$
);

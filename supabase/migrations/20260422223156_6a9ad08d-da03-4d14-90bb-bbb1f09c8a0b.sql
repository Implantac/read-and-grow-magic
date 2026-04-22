-- Cross-module audit events table
CREATE TABLE IF NOT EXISTS public.cross_module_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_type TEXT NOT NULL, -- 'nfe_transmitted', 'nfe_authorized', 'nfe_cancelled', 'order_confirmed', 'payment_settled', etc
  source_module TEXT NOT NULL, -- 'fiscal', 'financial', 'commercial', 'accounting'
  source_table TEXT NOT NULL,
  source_id UUID,
  source_reference TEXT, -- e.g. NF-e number, order code
  affected_modules TEXT[] NOT NULL DEFAULT '{}', -- ['financial', 'accounting']
  affected_tables TEXT[] NOT NULL DEFAULT '{}', -- ['accounts_receivable', 'journal_entries']
  affected_records JSONB DEFAULT '[]'::jsonb, -- [{table, id, action}]
  status TEXT NOT NULL DEFAULT 'success', -- success, partial, failed
  description TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cross_module_events_created ON public.cross_module_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_cross_module_events_type ON public.cross_module_events(event_type);
CREATE INDEX IF NOT EXISTS idx_cross_module_events_module ON public.cross_module_events(source_module);

ALTER TABLE public.cross_module_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read cross-module events"
ON public.cross_module_events FOR SELECT
TO authenticated USING (true);

CREATE POLICY "Authenticated can insert cross-module events"
ON public.cross_module_events FOR INSERT
TO authenticated WITH CHECK (true);

-- Realtime
ALTER TABLE public.cross_module_events REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.cross_module_events;

-- Trigger: NF-e status changes generate cross-module events
CREATE OR REPLACE FUNCTION public.log_nfe_cross_module_event()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_affected_records JSONB := '[]'::jsonb;
  v_ar_count INT := 0;
  v_ledger_count INT := 0;
  v_journal_count INT := 0;
  v_event_type TEXT;
  v_affected_modules TEXT[] := '{}';
  v_affected_tables TEXT[] := '{}';
BEGIN
  -- Determine event type based on status transition
  IF (TG_OP = 'INSERT') THEN
    v_event_type := 'nfe_created';
  ELSIF (OLD.status IS DISTINCT FROM NEW.status) THEN
    IF NEW.status = 'pending' THEN
      v_event_type := 'nfe_transmitted';
    ELSIF NEW.status = 'authorized' THEN
      v_event_type := 'nfe_authorized';
    ELSIF NEW.status = 'cancelled' THEN
      v_event_type := 'nfe_cancelled';
    ELSIF NEW.status = 'rejected' THEN
      v_event_type := 'nfe_rejected';
    ELSE
      RETURN NEW;
    END IF;
  ELSE
    RETURN NEW;
  END IF;

  -- For authorized: count AR/ledger/journal entries created via existing triggers
  IF v_event_type = 'nfe_authorized' THEN
    SELECT COUNT(*) INTO v_ar_count FROM accounts_receivable WHERE nfe_id = NEW.id;
    IF v_ar_count > 0 THEN
      v_affected_modules := array_append(v_affected_modules, 'financial');
      v_affected_tables := array_append(v_affected_tables, 'accounts_receivable');
      v_affected_records := v_affected_records || jsonb_build_object('table', 'accounts_receivable', 'count', v_ar_count, 'action', 'created');
    END IF;

    SELECT COUNT(*) INTO v_journal_count FROM journal_entries WHERE source_id = NEW.id::text OR description LIKE '%' || NEW.number || '%';
    IF v_journal_count > 0 THEN
      v_affected_modules := array_append(v_affected_modules, 'accounting');
      v_affected_tables := array_append(v_affected_tables, 'journal_entries');
      v_affected_records := v_affected_records || jsonb_build_object('table', 'journal_entries', 'count', v_journal_count, 'action', 'created');
    END IF;

    v_affected_modules := array_append(v_affected_modules, 'fiscal');
    v_affected_tables := array_append(v_affected_tables, 'fiscal_reports');
  END IF;

  IF v_event_type = 'nfe_cancelled' THEN
    v_affected_modules := ARRAY['fiscal', 'financial', 'accounting'];
    v_affected_tables := ARRAY['nfe', 'accounts_receivable', 'journal_entries'];
    v_affected_records := jsonb_build_array(
      jsonb_build_object('table', 'accounts_receivable', 'action', 'reversed'),
      jsonb_build_object('table', 'journal_entries', 'action', 'reversed')
    );
  END IF;

  INSERT INTO cross_module_events (
    event_type, source_module, source_table, source_id, source_reference,
    affected_modules, affected_tables, affected_records, status, description
  ) VALUES (
    v_event_type, 'fiscal', 'nfe', NEW.id, NEW.number,
    v_affected_modules, v_affected_tables, v_affected_records, 'success',
    'NF-e ' || NEW.number || ' — ' || COALESCE(NEW.client_name, '') || ' — R$ ' || NEW.total::text
  );

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Don't break NF-e flow on logging failure
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_nfe_cross_module_event ON public.nfe;
CREATE TRIGGER trg_nfe_cross_module_event
AFTER INSERT OR UPDATE OF status ON public.nfe
FOR EACH ROW EXECUTE FUNCTION public.log_nfe_cross_module_event();

-- Trigger for orders status changes (commercial → operational)
CREATE OR REPLACE FUNCTION public.log_order_cross_module_event()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_event_type TEXT;
BEGIN
  IF (TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status) THEN
    IF NEW.status = 'confirmed' THEN
      v_event_type := 'order_confirmed';
    ELSIF NEW.status = 'cancelled' THEN
      v_event_type := 'order_cancelled';
    ELSIF NEW.status = 'invoiced' THEN
      v_event_type := 'order_invoiced';
    ELSE
      RETURN NEW;
    END IF;

    INSERT INTO cross_module_events (
      event_type, source_module, source_table, source_id, source_reference,
      affected_modules, affected_tables, status, description
    ) VALUES (
      v_event_type, 'commercial', 'orders', NEW.id, NEW.code,
      ARRAY['commercial', 'operational', 'inventory'],
      ARRAY['orders', 'production_orders', 'stock_movements'],
      'success',
      'Pedido ' || NEW.code || ' — ' || COALESCE(NEW.client_name, '') || ' — R$ ' || COALESCE(NEW.total, 0)::text
    );
  END IF;
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_order_cross_module_event ON public.orders;
CREATE TRIGGER trg_order_cross_module_event
AFTER UPDATE OF status ON public.orders
FOR EACH ROW EXECUTE FUNCTION public.log_order_cross_module_event();

-- Trigger for payment settlements (financial → accounting)
CREATE OR REPLACE FUNCTION public.log_payment_cross_module_event()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF (TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status AND NEW.status = 'paid') THEN
    INSERT INTO cross_module_events (
      event_type, source_module, source_table, source_id, source_reference,
      affected_modules, affected_tables, status, description
    ) VALUES (
      CASE WHEN TG_TABLE_NAME = 'accounts_receivable' THEN 'ar_settled' ELSE 'ap_settled' END,
      'financial', TG_TABLE_NAME, NEW.id,
      COALESCE(NEW.invoice_number, NEW.description),
      ARRAY['financial', 'accounting'],
      ARRAY['financial_ledger', 'journal_entries', 'bank_accounts'],
      'success',
      CASE WHEN TG_TABLE_NAME = 'accounts_receivable'
        THEN 'Recebimento — ' || COALESCE(NEW.client_name, '') || ' — R$ ' || NEW.amount::text
        ELSE 'Pagamento — ' || COALESCE(NEW.supplier, '') || ' — R$ ' || NEW.amount::text
      END
    );
  END IF;
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_ar_payment_event ON public.accounts_receivable;
CREATE TRIGGER trg_ar_payment_event
AFTER UPDATE OF status ON public.accounts_receivable
FOR EACH ROW EXECUTE FUNCTION public.log_payment_cross_module_event();

DROP TRIGGER IF EXISTS trg_ap_payment_event ON public.accounts_payable;
CREATE TRIGGER trg_ap_payment_event
AFTER UPDATE OF status ON public.accounts_payable
FOR EACH ROW EXECUTE FUNCTION public.log_payment_cross_module_event();
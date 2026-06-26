
CREATE OR REPLACE FUNCTION public.log_payment_cross_module_event()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF (TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status AND NEW.status = 'paid') THEN
    INSERT INTO cross_module_events (
      event_type, source_module, source_table, source_id, source_reference,
      affected_modules, affected_tables, status, description, company_id
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
      END,
      NEW.company_id
    );
  END IF;
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RETURN NEW;
END;
$function$;

-- Wrap nfe and order trigger functions to inject company_id at the INSERT
-- We rebuild via dynamic safe path: append company_id by reading current def and replacing the INSERT column list & VALUES list is risky.
-- Instead, recreate from scratch with the same logic plus company_id.

CREATE OR REPLACE FUNCTION public.log_nfe_cross_module_event()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_affected_records JSONB := '[]'::jsonb;
  v_ar_count INT := 0;
  v_journal_count INT := 0;
  v_event_type TEXT;
  v_affected_modules TEXT[] := '{}';
  v_affected_tables TEXT[] := '{}';
BEGIN
  IF (TG_OP = 'INSERT') THEN
    v_event_type := 'nfe_created';
  ELSIF (OLD.status IS DISTINCT FROM NEW.status) THEN
    IF NEW.status = 'pending' THEN v_event_type := 'nfe_transmitted';
    ELSIF NEW.status = 'authorized' THEN v_event_type := 'nfe_authorized';
    ELSIF NEW.status = 'cancelled' THEN v_event_type := 'nfe_cancelled';
    ELSIF NEW.status = 'rejected' THEN v_event_type := 'nfe_rejected';
    ELSE RETURN NEW;
    END IF;
  ELSE
    RETURN NEW;
  END IF;

  IF v_event_type = 'nfe_authorized' THEN
    SELECT COUNT(*) INTO v_ar_count FROM accounts_receivable WHERE nfe_id = NEW.id;
    IF v_ar_count > 0 THEN
      v_affected_modules := array_append(v_affected_modules, 'financial');
      v_affected_tables := array_append(v_affected_tables, 'accounts_receivable');
      v_affected_records := v_affected_records || jsonb_build_object('table','accounts_receivable','count',v_ar_count,'action','created');
    END IF;
    SELECT COUNT(*) INTO v_journal_count FROM journal_entries WHERE source_id = NEW.id::text OR description LIKE '%' || NEW.number || '%';
    IF v_journal_count > 0 THEN
      v_affected_modules := array_append(v_affected_modules, 'accounting');
      v_affected_tables := array_append(v_affected_tables, 'journal_entries');
      v_affected_records := v_affected_records || jsonb_build_object('table','journal_entries','count',v_journal_count,'action','created');
    END IF;
    v_affected_modules := array_append(v_affected_modules, 'fiscal');
    v_affected_tables := array_append(v_affected_tables, 'fiscal_reports');
  END IF;

  INSERT INTO cross_module_events (
    event_type, source_module, source_table, source_id, source_reference,
    affected_modules, affected_tables, affected_records, status, description, company_id
  ) VALUES (
    v_event_type, 'fiscal', 'nfe', NEW.id, NEW.number,
    COALESCE(NULLIF(v_affected_modules,'{}'), ARRAY['fiscal']),
    COALESCE(NULLIF(v_affected_tables,'{}'), ARRAY['nfe']),
    v_affected_records, 'success',
    'NF-e ' || NEW.number || ' — ' || v_event_type,
    NEW.company_id
  );
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.log_order_cross_module_event()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF (TG_OP = 'INSERT') OR (TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status) THEN
    INSERT INTO cross_module_events (
      event_type, source_module, source_table, source_id, source_reference,
      affected_modules, affected_tables, status, description, company_id
    ) VALUES (
      CASE WHEN TG_OP = 'INSERT' THEN 'order_created' ELSE 'order_status_changed' END,
      'commercial', 'orders', NEW.id, NEW.order_number,
      ARRAY['commercial','operational'],
      ARRAY['orders','order_items'],
      'success',
      'Pedido ' || COALESCE(NEW.order_number,'') || ' — ' || COALESCE(NEW.status,''),
      NEW.company_id
    );
  END IF;
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RETURN NEW;
END;
$function$;

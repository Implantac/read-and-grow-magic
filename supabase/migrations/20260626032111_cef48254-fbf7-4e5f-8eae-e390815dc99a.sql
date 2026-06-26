
-- 1) generate_accounting_from_ledger: propagate NEW.company_id
CREATE OR REPLACE FUNCTION public.generate_accounting_from_ledger()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_pair RECORD;
  v_je_id uuid;
  v_number text;
BEGIN
  IF NEW.company_id IS NULL THEN
    RETURN NEW;
  END IF;

  IF EXISTS (SELECT 1 FROM public.journal_entries WHERE description LIKE 'LEDGER:' || NEW.id || '%') THEN
    RETURN NEW;
  END IF;

  SELECT * INTO v_pair FROM public.resolve_accounting_pair(
    NEW.type, NEW.category_id, NEW.chart_account_id, NEW.bank_account_id
  );

  IF v_pair.cash_account_id IS NULL OR v_pair.result_account_id IS NULL THEN
    RETURN NEW;
  END IF;

  v_number := 'AUTO-' || to_char(NEW.entry_date, 'YYYYMMDD') || '-' || substring(NEW.id::text, 1, 8);

  INSERT INTO public.journal_entries (number, date, description, status, total_debit, total_credit, created_by, company_id)
  VALUES (v_number, NEW.entry_date, 'LEDGER:' || NEW.id || ' ' || NEW.description,
          'posted', NEW.amount, NEW.amount, 'auto', NEW.company_id)
  RETURNING id INTO v_je_id;

  IF NEW.type = 'inflow' THEN
    INSERT INTO public.journal_entry_lines (journal_entry_id, account_id, account_code, account_name, debit, credit, description, company_id)
    VALUES
      (v_je_id, v_pair.cash_account_id, v_pair.cash_code, v_pair.cash_name, NEW.amount, 0, NEW.description, NEW.company_id),
      (v_je_id, v_pair.result_account_id, v_pair.result_code, v_pair.result_name, 0, NEW.amount, NEW.description, NEW.company_id);
  ELSE
    INSERT INTO public.journal_entry_lines (journal_entry_id, account_id, account_code, account_name, debit, credit, description, company_id)
    VALUES
      (v_je_id, v_pair.result_account_id, v_pair.result_code, v_pair.result_name, NEW.amount, 0, NEW.description, NEW.company_id),
      (v_je_id, v_pair.cash_account_id, v_pair.cash_code, v_pair.cash_name, 0, NEW.amount, NEW.description, NEW.company_id);
  END IF;

  RETURN NEW;
END;
$function$;

-- 2) nfe_authorized_to_ar: propagate NEW.company_id to AR
CREATE OR REPLACE FUNCTION public.nfe_authorized_to_ar()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.status = 'authorized'
     AND (OLD.status IS DISTINCT FROM 'authorized')
     AND NEW.operation_type = 'saida'
     AND NEW.total > 0
     AND NEW.company_id IS NOT NULL THEN

    IF NOT EXISTS (SELECT 1 FROM public.accounts_receivable WHERE nfe_id = NEW.id) THEN
      INSERT INTO public.accounts_receivable (
        description, client_name, client_id, category, amount, original_amount, open_amount,
        due_date, issue_date, status, invoice_number, nfe_id, order_id, source_type, source_id, company_id
      ) VALUES (
        'NF-e ' || NEW.number || ' - ' || NEW.client_name,
        NEW.client_name, NEW.client_id, 'Vendas',
        NEW.total, NEW.total, NEW.total,
        (NEW.issue_date::date + INTERVAL '30 days')::date,
        NEW.issue_date::date, 'pending',
        NEW.number, NEW.id, NEW.order_id, 'nfe', NEW.id::text, NEW.company_id
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$function$;

-- 3) notify_critical_brain_decision: filter admins by company
CREATE OR REPLACE FUNCTION public.notify_critical_brain_decision()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.status = 'pending'
     AND NEW.impact_level IN ('critical', 'high')
     AND NEW.company_id IS NOT NULL THEN
    INSERT INTO public.notifications (user_id, type, title, description, module, company_id)
    SELECT
      ur.user_id,
      CASE WHEN NEW.impact_level = 'critical' THEN 'error' ELSE 'warning' END,
      '🧠 Decisão ' || UPPER(NEW.impact_level) || ' do Cérebro',
      NEW.title || ' — ' || COALESCE(LEFT(NEW.rationale, 160), ''),
      'Cérebro',
      NEW.company_id
    FROM public.user_roles ur
    WHERE ur.role = 'admin'
      AND ur.company_id = NEW.company_id;
  END IF;
  RETURN NEW;
END;
$function$;

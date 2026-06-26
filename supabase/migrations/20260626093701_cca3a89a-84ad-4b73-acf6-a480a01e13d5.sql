
CREATE OR REPLACE FUNCTION public.fraud_check_ledger_insert()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_eval jsonb;
  v_entity_id uuid;
  v_entity_type text;
  v_label text;
  v_anomaly boolean := false;
BEGIN
  IF NEW.source = 'receivable' THEN
    SELECT client_id, client_name INTO v_entity_id, v_label
      FROM accounts_receivable WHERE id = NEW.source_id AND company_id = NEW.company_id;
    v_entity_type := 'client';
  ELSIF NEW.source = 'payable' THEN
    v_entity_type := 'supplier';
    SELECT supplier INTO v_label FROM accounts_payable WHERE id = NEW.source_id AND company_id = NEW.company_id;
  ELSIF NEW.source = 'pix' THEN
    v_entity_type := 'external';
    v_label := 'PIX';
  END IF;

  v_eval := evaluate_transaction_risk(NEW.amount, v_entity_type, v_entity_id, NEW.source, NEW.payment_method);

  IF (v_eval->>'score')::int >= 50 THEN
    v_anomaly := true;
    INSERT INTO financial_security_logs (
      company_id, event_type, severity, category, title, description,
      entity_type, entity_id, reference_table, reference_id,
      amount, risk_score, decision, details
    ) VALUES (
      NEW.company_id,
      'transaction_evaluated', v_eval->>'level', 'antifraud',
      'Transação de risco detectada — R$ ' || NEW.amount,
      COALESCE(v_label,'') || ' · ' || COALESCE(NEW.description,''),
      v_entity_type, v_entity_id, 'financial_ledger', NEW.id,
      NEW.amount, (v_eval->>'score')::int, v_eval->>'decision', v_eval
    );
  END IF;

  PERFORM update_entity_risk_profile(v_entity_type, v_entity_id, v_label, NEW.amount, v_anomaly);

  RETURN NEW;
END; $function$;

CREATE OR REPLACE FUNCTION public.update_bank_balance_from_ledger()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.bank_account_id IS NOT NULL THEN
    UPDATE public.bank_accounts
       SET balance = COALESCE(balance,0) + CASE WHEN NEW.type='inflow' THEN NEW.amount ELSE -NEW.amount END,
           updated_at = now()
     WHERE id = NEW.bank_account_id
       AND company_id = NEW.company_id;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Conta bancária inválida ou pertence a outro tenant';
    END IF;
  ELSIF TG_OP = 'DELETE' AND OLD.bank_account_id IS NOT NULL THEN
    UPDATE public.bank_accounts
       SET balance = COALESCE(balance,0) - CASE WHEN OLD.type='inflow' THEN OLD.amount ELSE -OLD.amount END,
           updated_at = now()
     WHERE id = OLD.bank_account_id
       AND company_id = OLD.company_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$function$;

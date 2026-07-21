
-- 1) Function: aplica um stock_movement ao stock_balances correspondente
CREATE OR REPLACE FUNCTION public.apply_stock_movement_to_balance()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_delta numeric;
  v_canal canal_operacional;
BEGIN
  IF NEW.product_id IS NULL THEN
    RETURN NEW;
  END IF;

  v_delta := CASE lower(coalesce(NEW.direction,'in'))
    WHEN 'in' THEN NEW.quantity
    WHEN 'out' THEN -NEW.quantity
    ELSE 0
  END;

  IF v_delta = 0 THEN
    RETURN NEW;
  END IF;

  v_canal := coalesce(NEW.canal_operacional, 'ATACADO_INDUSTRIA'::canal_operacional);

  -- upsert por (company, branch, canal, product, lot)
  UPDATE public.stock_balances sb
     SET quantity = sb.quantity + v_delta,
         last_movement_at = now(),
         updated_at = now()
   WHERE sb.company_id = NEW.company_id
     AND sb.product_id = NEW.product_id
     AND coalesce(sb.branch_id::text,'') = coalesce(NEW.branch_id::text,'')
     AND sb.canal_operacional = v_canal
     AND coalesce(sb.lot_id::text,'') = coalesce(NEW.lot_id::text,'');

  IF NOT FOUND THEN
    INSERT INTO public.stock_balances (
      company_id, branch_id, canal_operacional,
      product_id, product_code, product_name,
      lot_id, quantity, unit, last_movement_at
    ) VALUES (
      NEW.company_id, NEW.branch_id, v_canal,
      NEW.product_id, NEW.product_code, NEW.product_name,
      NEW.lot_id, v_delta, 'UN', now()
    );
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_apply_stock_movement_to_balance ON public.stock_movements;
CREATE TRIGGER trg_apply_stock_movement_to_balance
AFTER INSERT ON public.stock_movements
FOR EACH ROW
EXECUTE FUNCTION public.apply_stock_movement_to_balance();

-- 2) Guard: bloqueia UPDATE/DELETE diretos em stock_balances (permitido apenas dentro de trigger)
CREATE OR REPLACE FUNCTION public.guard_stock_balances_immutable()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  -- pg_trigger_depth() > 0 significa que a operação veio de outro trigger (ledger)
  IF pg_trigger_depth() > 1 THEN
    RETURN CASE TG_OP WHEN 'DELETE' THEN OLD ELSE NEW END;
  END IF;

  RAISE EXCEPTION 'stock_balances é imutável — registre um stock_movement para alterar o saldo (op=%).', TG_OP
    USING ERRCODE = 'check_violation';
END;
$$;

DROP TRIGGER IF EXISTS trg_guard_stock_balances_update ON public.stock_balances;
CREATE TRIGGER trg_guard_stock_balances_update
BEFORE UPDATE ON public.stock_balances
FOR EACH ROW
EXECUTE FUNCTION public.guard_stock_balances_immutable();

DROP TRIGGER IF EXISTS trg_guard_stock_balances_delete ON public.stock_balances;
CREATE TRIGGER trg_guard_stock_balances_delete
BEFORE DELETE ON public.stock_balances
FOR EACH ROW
EXECUTE FUNCTION public.guard_stock_balances_immutable();

-- 3) Utilitário: reconstrói o saldo de um produto (opcional, admin)
CREATE OR REPLACE FUNCTION public.recompute_stock_balance(_product_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_company uuid := get_user_company_id(auth.uid());
BEGIN
  IF NOT (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'manager'::app_role)) THEN
    RAISE EXCEPTION 'permissão negada';
  END IF;

  -- zera saldos do produto na empresa (via trigger guard: exige contexto de trigger, então
  -- usamos DELETE com SET session_replication_role para bypass controlado)
  PERFORM set_config('session_replication_role','replica', true);
  DELETE FROM public.stock_balances
   WHERE company_id = v_company AND product_id = _product_id;
  PERFORM set_config('session_replication_role','origin', true);

  -- reconstrói via inserts sintéticos no ledger? Não — só recalcula a partir do histórico existente:
  INSERT INTO public.stock_balances (
    company_id, branch_id, canal_operacional,
    product_id, product_code, product_name,
    lot_id, quantity, unit, last_movement_at
  )
  SELECT
    m.company_id,
    m.branch_id,
    coalesce(m.canal_operacional,'ATACADO_INDUSTRIA'::canal_operacional),
    m.product_id,
    max(m.product_code),
    max(m.product_name),
    m.lot_id,
    sum(CASE lower(m.direction) WHEN 'in' THEN m.quantity WHEN 'out' THEN -m.quantity ELSE 0 END),
    'UN',
    max(m.created_at)
  FROM public.stock_movements m
  WHERE m.company_id = v_company
    AND m.product_id = _product_id
  GROUP BY m.company_id, m.branch_id, m.canal_operacional, m.product_id, m.lot_id;
END;
$$;

REVOKE ALL ON FUNCTION public.recompute_stock_balance(uuid) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.recompute_stock_balance(uuid) TO authenticated;

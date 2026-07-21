
CREATE OR REPLACE FUNCTION public.guard_stock_balances_immutable()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  -- Escritas encadeadas por outro trigger (ex.: apply_stock_movement_to_balance) são liberadas
  IF pg_trigger_depth() > 1 THEN
    RETURN CASE TG_OP WHEN 'DELETE' THEN OLD ELSE NEW END;
  END IF;

  -- Reserva é hold lógico — permite mudar reserved_qty desde que quantity não mude
  IF TG_OP = 'UPDATE'
     AND NEW.quantity IS NOT DISTINCT FROM OLD.quantity
     AND NEW.product_id IS NOT DISTINCT FROM OLD.product_id
     AND NEW.company_id IS NOT DISTINCT FROM OLD.company_id
     AND NEW.branch_id  IS NOT DISTINCT FROM OLD.branch_id
     AND NEW.canal_operacional IS NOT DISTINCT FROM OLD.canal_operacional
     AND NEW.lot_id     IS NOT DISTINCT FROM OLD.lot_id
  THEN
    RETURN NEW;
  END IF;

  RAISE EXCEPTION 'stock_balances é imutável — registre um stock_movement para alterar o saldo (op=%).', TG_OP
    USING ERRCODE = 'check_violation';
END;
$$;

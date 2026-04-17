
-- ============================================================
-- EVOLUÇÃO INCREMENTAL: Controle por Lote + Consignação Fábrica
-- 100% aditivo. Nenhum DROP. Nenhum dado existente alterado.
-- ============================================================

-- ETAPA 1.A — Estender stock_lots com campos de consignação (aditivo)
ALTER TABLE public.stock_lots
  ADD COLUMN IF NOT EXISTS supplier_id      uuid REFERENCES public.suppliers(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS initial_quantity numeric,
  ADD COLUMN IF NOT EXISTS unit_cost        numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS origin_type      text   NOT NULL DEFAULT 'PADRAO',
  ADD COLUMN IF NOT EXISTS is_consigned     boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS auto_generated   boolean NOT NULL DEFAULT false;

-- Backfill initial_quantity onde estiver nulo (preserva dado existente)
UPDATE public.stock_lots
   SET initial_quantity = quantity
 WHERE initial_quantity IS NULL;

-- Validação de origin_type
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'stock_lots_origin_type_check'
  ) THEN
    ALTER TABLE public.stock_lots
      ADD CONSTRAINT stock_lots_origin_type_check
      CHECK (origin_type IN ('PADRAO','CONSIGNADO','PRODUCAO','COMPRA','TRANSFERENCIA','AJUSTE'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_stock_lots_supplier_id  ON public.stock_lots(supplier_id);
CREATE INDEX IF NOT EXISTS idx_stock_lots_origin_type  ON public.stock_lots(origin_type);
CREATE INDEX IF NOT EXISTS idx_stock_lots_product_id   ON public.stock_lots(product_id);

-- ============================================================
-- ETAPA 1.B — Expandir stock_movements (aditivo)
-- ============================================================
ALTER TABLE public.stock_movements
  ADD COLUMN IF NOT EXISTS lot_id  uuid REFERENCES public.stock_lots(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS origin  text,
  ADD COLUMN IF NOT EXISTS destination text;

CREATE INDEX IF NOT EXISTS idx_stock_movements_lot_id ON public.stock_movements(lot_id);

-- ============================================================
-- ETAPA 4 — Feature Flags (transição controlada)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.feature_flags (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  flag_key    text UNIQUE NOT NULL,
  enabled     boolean NOT NULL DEFAULT false,
  description text,
  updated_by  uuid,
  updated_at  timestamptz NOT NULL DEFAULT now(),
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='feature_flags' AND policyname='feature_flags_read_authenticated') THEN
    CREATE POLICY feature_flags_read_authenticated ON public.feature_flags
      FOR SELECT TO authenticated USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='feature_flags' AND policyname='feature_flags_write_admin') THEN
    CREATE POLICY feature_flags_write_admin ON public.feature_flags
      FOR ALL TO authenticated
      USING (public.has_role(auth.uid(),'admin'))
      WITH CHECK (public.has_role(auth.uid(),'admin'));
  END IF;
END $$;

INSERT INTO public.feature_flags (flag_key, enabled, description)
VALUES ('usar_lote', false, 'Quando ativo, novas operações de estoque exigem lot_id; antigas continuam válidas.')
ON CONFLICT (flag_key) DO NOTHING;

-- ============================================================
-- ETAPA 7 — Auditoria de migração
-- ============================================================
CREATE TABLE IF NOT EXISTS public.lot_migration_audit (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type   text NOT NULL, -- 'lot_created' | 'movements_linked' | 'inconsistency' | 'backfill_summary'
  product_id   uuid,
  lot_id       uuid,
  details      jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at   timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.lot_migration_audit ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='lot_migration_audit' AND policyname='lot_audit_read_admin') THEN
    CREATE POLICY lot_audit_read_admin ON public.lot_migration_audit
      FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'manager'));
  END IF;
END $$;

-- ============================================================
-- ETAPA 2 — Backfill: cria lote PADRAO por produto sem dados antigos
-- ============================================================
CREATE OR REPLACE FUNCTION public.backfill_default_lots()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_product RECORD;
  v_lot_id  uuid;
  v_qty     numeric;
  v_lots_created int := 0;
  v_movs_linked  int := 0;
  v_skipped      int := 0;
BEGIN
  FOR v_product IN
    SELECT p.id, p.code, p.name, p.cost_price
      FROM public.products p
     WHERE p.status = 'active'
  LOOP
    -- Pula se já existe ao menos um lote para o produto (não duplica)
    IF EXISTS (SELECT 1 FROM public.stock_lots WHERE product_id = v_product.id) THEN
      v_skipped := v_skipped + 1;
      CONTINUE;
    END IF;

    -- Estoque atual = saldo agregado em stock_balances (se existir) ou 0
    SELECT COALESCE(SUM(sb.quantity),0) INTO v_qty
      FROM public.stock_balances sb
     WHERE sb.product_id = v_product.id;

    IF v_qty IS NULL THEN v_qty := 0; END IF;

    INSERT INTO public.stock_lots (
      lot_number, product_id, product_code, product_name,
      quantity, remaining_qty, initial_quantity,
      unit_cost, origin, origin_type, status, auto_generated
    ) VALUES (
      'LOTE-PADRAO-' || v_product.code || '-' || to_char(now(),'YYYYMMDD'),
      v_product.id, v_product.code, v_product.name,
      v_qty, v_qty, v_qty,
      COALESCE(v_product.cost_price,0), 'backfill', 'PADRAO', 'available', true
    ) RETURNING id INTO v_lot_id;
    v_lots_created := v_lots_created + 1;

    INSERT INTO public.lot_migration_audit (event_type, product_id, lot_id, details)
    VALUES ('lot_created', v_product.id, v_lot_id,
            jsonb_build_object('quantity', v_qty, 'source','backfill'));

    -- Vincula movimentações antigas SEM lot_id deste produto ao lote padrão
    UPDATE public.stock_movements
       SET lot_id = v_lot_id
     WHERE product_id = v_product.id AND lot_id IS NULL;
    GET DIAGNOSTICS v_movs_linked = ROW_COUNT;

    INSERT INTO public.lot_migration_audit (event_type, product_id, lot_id, details)
    VALUES ('movements_linked', v_product.id, v_lot_id,
            jsonb_build_object('count', v_movs_linked));
  END LOOP;

  INSERT INTO public.lot_migration_audit (event_type, details)
  VALUES ('backfill_summary',
          jsonb_build_object(
            'lots_created', v_lots_created,
            'products_skipped', v_skipped,
            'executed_at', now()
          ));

  RETURN jsonb_build_object(
    'lots_created', v_lots_created,
    'products_skipped', v_skipped
  );
END;
$$;

-- ============================================================
-- ETAPA 5 — Validação: divergência entre soma de lotes vs estoque
-- ============================================================
CREATE OR REPLACE FUNCTION public.validate_lot_stock_consistency()
RETURNS TABLE(product_id uuid, product_code text, stock_balance numeric, lot_sum numeric, diff numeric)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  WITH sb AS (
    SELECT product_id, SUM(quantity) AS qty
      FROM public.stock_balances GROUP BY product_id
  ),
  ls AS (
    SELECT product_id, SUM(remaining_qty) AS qty
      FROM public.stock_lots WHERE status='available' GROUP BY product_id
  )
  SELECT p.id, p.code,
         COALESCE(sb.qty,0), COALESCE(ls.qty,0),
         COALESCE(sb.qty,0) - COALESCE(ls.qty,0)
    FROM public.products p
    LEFT JOIN sb ON sb.product_id = p.id
    LEFT JOIN ls ON ls.product_id = p.id
   WHERE COALESCE(sb.qty,0) <> COALESCE(ls.qty,0);
$$;

-- ============================================================
-- ETAPA 3 — Compatibilidade: trigger leve em stock_movements
-- Se lote_id IS NULL → comportamento antigo (não altera nada).
-- Se lote_id existir → debita remaining_qty do lote (nova lógica).
-- Só atua quando feature flag 'usar_lote' está habilitada,
-- garantindo que o sistema antigo continua funcionando.
-- ============================================================
CREATE OR REPLACE FUNCTION public.apply_lot_movement()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_enabled boolean;
  v_remaining numeric;
BEGIN
  SELECT enabled INTO v_enabled FROM public.feature_flags WHERE flag_key='usar_lote';
  IF NOT COALESCE(v_enabled,false) THEN RETURN NEW; END IF;
  IF NEW.lot_id IS NULL THEN RETURN NEW; END IF;

  IF NEW.direction = 'out' THEN
    SELECT remaining_qty INTO v_remaining FROM public.stock_lots WHERE id = NEW.lot_id FOR UPDATE;
    IF v_remaining IS NULL THEN
      RAISE EXCEPTION 'Lote % não encontrado', NEW.lot_id;
    END IF;
    IF v_remaining < NEW.quantity THEN
      INSERT INTO public.lot_migration_audit (event_type, lot_id, details)
      VALUES ('inconsistency', NEW.lot_id,
              jsonb_build_object('reason','insufficient_lot_qty','requested',NEW.quantity,'available',v_remaining));
      RAISE EXCEPTION 'Quantidade insuficiente no lote (disp: %, req: %)', v_remaining, NEW.quantity;
    END IF;
    UPDATE public.stock_lots
       SET remaining_qty = remaining_qty - NEW.quantity, updated_at = now()
     WHERE id = NEW.lot_id;
  ELSIF NEW.direction = 'in' THEN
    UPDATE public.stock_lots
       SET remaining_qty = remaining_qty + NEW.quantity, updated_at = now()
     WHERE id = NEW.lot_id;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_apply_lot_movement ON public.stock_movements;
CREATE TRIGGER trg_apply_lot_movement
AFTER INSERT ON public.stock_movements
FOR EACH ROW EXECUTE FUNCTION public.apply_lot_movement();

-- ============================================================
-- ETAPA 2 — Executa backfill imediatamente (idempotente)
-- ============================================================
SELECT public.backfill_default_lots();

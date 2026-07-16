
-- ============================================================
-- Bridge Commerce → ERP: reservas de estoque + emissão NFC-e
-- ============================================================

-- 1) Reservar estoque ao criar pedido
CREATE OR REPLACE FUNCTION public.commerce_reserve_stock_on_order()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  item RECORD;
BEGIN
  FOR item IN
    SELECT * FROM public.storefront_order_items WHERE order_id = NEW.id
  LOOP
    IF item.product_id IS NOT NULL THEN
      INSERT INTO public.stock_reservations (
        order_id, order_item_id, product_id, product_name,
        requested_qty, reserved_qty, status,
        reservation_type, policy, priority, company_id, reserved_at
      ) VALUES (
        NEW.id, item.id, item.product_id, item.product_name,
        item.quantity, item.quantity, 'pending',
        'commerce_order', 'fifo', 5, NEW.company_id, now()
      );
    END IF;
  END LOOP;

  INSERT INTO public.cross_module_events (
    event_type, source_module, target_module, payload, company_id
  ) VALUES (
    'commerce.order.created', 'commerce', 'wms',
    jsonb_build_object('order_id', NEW.id, 'order_number', NEW.order_number, 'total', NEW.total),
    NEW.company_id
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_commerce_reserve_stock ON public.storefront_orders;
CREATE TRIGGER trg_commerce_reserve_stock
  AFTER INSERT ON public.storefront_orders
  FOR EACH ROW
  EXECUTE FUNCTION public.commerce_reserve_stock_on_order();

-- 2) Ao pagar → confirmar reservas + criar NFC-e draft + evento
CREATE OR REPLACE FUNCTION public.commerce_on_payment_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  nfce_number TEXT;
  next_seq INT;
BEGIN
  IF NEW.payment_status = OLD.payment_status THEN
    RETURN NEW;
  END IF;

  -- Pagamento confirmado
  IF NEW.payment_status = 'paid' AND OLD.payment_status <> 'paid' THEN
    -- Confirma reservas
    UPDATE public.stock_reservations
       SET status = 'confirmed', updated_at = now()
     WHERE order_id = NEW.id
       AND status IN ('pending', 'active');

    -- Sequência NFC-e por empresa
    SELECT COALESCE(MAX(NULLIF(regexp_replace(number, '\D', '', 'g'), '')::int), 0) + 1
      INTO next_seq
      FROM public.nfce
     WHERE company_id = NEW.company_id;
    nfce_number := LPAD(next_seq::text, 9, '0');

    -- Cria NFC-e em rascunho
    INSERT INTO public.nfce (
      number, series, issue_date, subtotal, discount, total,
      payment_method, amount_paid, change_amount,
      customer_document, customer_name, status, company_id
    ) VALUES (
      nfce_number, '1', now(),
      NEW.subtotal, NEW.discount, NEW.total,
      CASE NEW.payment_method
        WHEN 'credit_card' THEN 'card'
        WHEN 'pix' THEN 'pix'
        WHEN 'boleto' THEN 'boleto'
        ELSE 'cash'
      END,
      NEW.total, 0,
      NEW.customer_document, NEW.customer_name,
      'draft', NEW.company_id
    );

    INSERT INTO public.cross_module_events (
      event_type, source_module, target_module, payload, company_id
    ) VALUES (
      'commerce.order.paid', 'commerce', 'fiscal',
      jsonb_build_object(
        'order_id', NEW.id,
        'order_number', NEW.order_number,
        'nfce_number', nfce_number,
        'total', NEW.total,
        'payment_method', NEW.payment_method
      ),
      NEW.company_id
    );
  END IF;

  -- Cancelamento / reembolso → libera reservas
  IF NEW.payment_status IN ('failed', 'refunded', 'expired')
     AND OLD.payment_status NOT IN ('failed', 'refunded', 'expired') THEN
    UPDATE public.stock_reservations
       SET status = 'released', released_at = now(), updated_at = now()
     WHERE order_id = NEW.id
       AND status IN ('pending', 'active', 'confirmed');

    INSERT INTO public.cross_module_events (
      event_type, source_module, target_module, payload, company_id
    ) VALUES (
      'commerce.order.cancelled', 'commerce', 'wms',
      jsonb_build_object('order_id', NEW.id, 'reason', NEW.payment_status),
      NEW.company_id
    );
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_commerce_payment_change ON public.storefront_orders;
CREATE TRIGGER trg_commerce_payment_change
  AFTER UPDATE OF payment_status ON public.storefront_orders
  FOR EACH ROW
  EXECUTE FUNCTION public.commerce_on_payment_status_change();

-- 3) Índices auxiliares
CREATE INDEX IF NOT EXISTS idx_stock_reservations_order_id
  ON public.stock_reservations(order_id);
CREATE INDEX IF NOT EXISTS idx_storefront_orders_payment_status
  ON public.storefront_orders(payment_status);

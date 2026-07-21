
-- 1) Storefronts flag
ALTER TABLE public.storefronts
  ADD COLUMN IF NOT EXISTS auto_authorize_nfce boolean NOT NULL DEFAULT false;

-- 2) Notifications log table
CREATE TABLE IF NOT EXISTS public.storefront_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.storefront_orders(id) ON DELETE CASCADE,
  storefront_id uuid NOT NULL REFERENCES public.storefronts(id) ON DELETE CASCADE,
  company_id uuid NOT NULL,
  event_type text NOT NULL, -- order_created | order_paid | order_shipped | order_cancelled | order_status_changed
  channel text NOT NULL DEFAULT 'email', -- email | whatsapp | sms
  recipient text,
  subject text,
  body text,
  status text NOT NULL DEFAULT 'pending', -- pending | sent | failed | skipped
  attempts int NOT NULL DEFAULT 0,
  last_error text,
  payload jsonb DEFAULT '{}'::jsonb,
  sent_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.storefront_notifications TO authenticated;
GRANT ALL ON public.storefront_notifications TO service_role;

ALTER TABLE public.storefront_notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS storefront_notifications_select ON public.storefront_notifications;
CREATE POLICY storefront_notifications_select
ON public.storefront_notifications FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.storefronts s
    WHERE s.id = storefront_notifications.storefront_id
      AND s.company_id = public.get_user_company_id(auth.uid())
  )
);

DROP POLICY IF EXISTS storefront_notifications_update ON public.storefront_notifications;
CREATE POLICY storefront_notifications_update
ON public.storefront_notifications FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.storefronts s
    WHERE s.id = storefront_notifications.storefront_id
      AND s.company_id = public.get_user_company_id(auth.uid())
  )
)
WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_sf_notif_order ON public.storefront_notifications(order_id);
CREATE INDEX IF NOT EXISTS idx_sf_notif_status ON public.storefront_notifications(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sf_notif_storefront ON public.storefront_notifications(storefront_id);

-- 3) Trigger to log notifications on order lifecycle changes
CREATE OR REPLACE FUNCTION public.commerce_log_order_notifications()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_company uuid;
  v_event text;
BEGIN
  SELECT company_id INTO v_company FROM public.storefronts WHERE id = NEW.storefront_id;
  IF v_company IS NULL THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    v_event := 'order_created';
  ELSIF NEW.payment_status IS DISTINCT FROM OLD.payment_status AND NEW.payment_status = 'paid' THEN
    v_event := 'order_paid';
  ELSIF NEW.status IS DISTINCT FROM OLD.status AND NEW.status IN ('shipped','delivered') THEN
    v_event := 'order_shipped';
  ELSIF NEW.status IS DISTINCT FROM OLD.status AND NEW.status = 'cancelled' THEN
    v_event := 'order_cancelled';
  ELSIF NEW.status IS DISTINCT FROM OLD.status THEN
    v_event := 'order_status_changed';
  ELSE
    RETURN NEW;
  END IF;

  INSERT INTO public.storefront_notifications(
    order_id, storefront_id, company_id,
    event_type, channel, recipient, subject, body, payload
  ) VALUES (
    NEW.id, NEW.storefront_id, v_company,
    v_event, 'email',
    NEW.customer_email,
    CASE v_event
      WHEN 'order_created' THEN 'Recebemos seu pedido #' || COALESCE(NEW.order_number, LEFT(NEW.id::text,8))
      WHEN 'order_paid'    THEN 'Pagamento confirmado — pedido #' || COALESCE(NEW.order_number, LEFT(NEW.id::text,8))
      WHEN 'order_shipped' THEN 'Seu pedido foi enviado #' || COALESCE(NEW.order_number, LEFT(NEW.id::text,8))
      WHEN 'order_cancelled' THEN 'Pedido cancelado #' || COALESCE(NEW.order_number, LEFT(NEW.id::text,8))
      ELSE 'Atualização do pedido #' || COALESCE(NEW.order_number, LEFT(NEW.id::text,8))
    END,
    'Olá ' || COALESCE(NEW.customer_name,'') || ', seu pedido teve uma atualização.',
    jsonb_build_object(
      'order_id', NEW.id,
      'order_number', NEW.order_number,
      'total', NEW.total,
      'status', NEW.status,
      'payment_status', NEW.payment_status,
      'previous_status', CASE WHEN TG_OP='UPDATE' THEN OLD.status ELSE NULL END,
      'previous_payment_status', CASE WHEN TG_OP='UPDATE' THEN OLD.payment_status ELSE NULL END
    )
  );

  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.commerce_log_order_notifications() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_commerce_log_notifications_ins ON public.storefront_orders;
CREATE TRIGGER trg_commerce_log_notifications_ins
  AFTER INSERT ON public.storefront_orders
  FOR EACH ROW EXECUTE FUNCTION public.commerce_log_order_notifications();

DROP TRIGGER IF EXISTS trg_commerce_log_notifications_upd ON public.storefront_orders;
CREATE TRIGGER trg_commerce_log_notifications_upd
  AFTER UPDATE ON public.storefront_orders
  FOR EACH ROW EXECUTE FUNCTION public.commerce_log_order_notifications();

-- 4) updated_at trigger
CREATE OR REPLACE FUNCTION public.tg_touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at := now(); RETURN NEW; END; $$;

DROP TRIGGER IF EXISTS trg_sf_notif_updated_at ON public.storefront_notifications;
CREATE TRIGGER trg_sf_notif_updated_at
  BEFORE UPDATE ON public.storefront_notifications
  FOR EACH ROW EXECUTE FUNCTION public.tg_touch_updated_at();

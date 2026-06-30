
-- RPC para atualizar/avançar o estágio de expedição de um pedido,
-- criando o wms_shipments se necessário e gravando evento em delivery_tracking.
-- Isolado por tenant: valida company_id do pedido vs. usuário.
CREATE OR REPLACE FUNCTION public.wms_update_shipment_stage(
  p_order_id uuid,
  p_stage text,                -- 'conferred' | 'labeled' | 'collected' | 'shipped' | 'delivered'
  p_tracking_number text DEFAULT NULL,
  p_carrier text DEFAULT NULL,
  p_location text DEFAULT NULL,
  p_notes text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_company uuid := get_user_company_id(auth.uid());
  v_order RECORD;
  v_shipment_id uuid;
  v_shipment_number text;
  v_event_type text;
  v_description text;
  v_now timestamptz := now();
BEGIN
  IF v_user_company IS NULL THEN
    RAISE EXCEPTION 'auth_required';
  END IF;

  IF p_stage NOT IN ('conferred','labeled','collected','shipped','delivered') THEN
    RAISE EXCEPTION 'invalid_stage';
  END IF;

  SELECT id, number, client_name, company_id, total
    INTO v_order
    FROM public.orders
   WHERE id = p_order_id;

  IF NOT FOUND OR v_order.company_id <> v_user_company THEN
    RAISE EXCEPTION 'order_not_found_or_cross_tenant';
  END IF;

  -- Localiza shipment existente (mesmo tenant + mesmo order_number)
  SELECT id, shipment_number
    INTO v_shipment_id, v_shipment_number
    FROM public.wms_shipments
   WHERE company_id = v_user_company
     AND order_number = v_order.number
   ORDER BY created_at DESC
   LIMIT 1;

  IF v_shipment_id IS NULL THEN
    v_shipment_number := 'EXP-' || to_char(v_now,'YYYYMMDD') || '-' || upper(substr(md5(random()::text),1,6));
    INSERT INTO public.wms_shipments (
      company_id, shipment_number, romaneio_number, order_number,
      customer_name, carrier, tracking_number, volumes, total_value, status
    ) VALUES (
      v_user_company, v_shipment_number, 'ROM-' || substr(v_shipment_number,5),
      v_order.number, v_order.client_name, p_carrier, p_tracking_number,
      0, COALESCE(v_order.total,0), p_stage
    )
    RETURNING id INTO v_shipment_id;
  ELSE
    UPDATE public.wms_shipments
       SET status         = p_stage,
           tracking_number = COALESCE(p_tracking_number, tracking_number),
           carrier         = COALESCE(p_carrier, carrier),
           shipped_at      = CASE WHEN p_stage IN ('shipped','delivered') AND shipped_at IS NULL THEN v_now ELSE shipped_at END,
           delivered_at    = CASE WHEN p_stage = 'delivered' AND delivered_at IS NULL THEN v_now ELSE delivered_at END,
           updated_at      = v_now
     WHERE id = v_shipment_id;
  END IF;

  v_event_type := CASE p_stage
    WHEN 'conferred' THEN 'conference_completed'
    WHEN 'labeled'   THEN 'labeled'
    WHEN 'collected' THEN 'collected_by_carrier'
    WHEN 'shipped'   THEN 'shipped'
    WHEN 'delivered' THEN 'delivered'
  END;

  v_description := CASE p_stage
    WHEN 'conferred' THEN 'Conferência concluída'
    WHEN 'labeled'   THEN 'Volumes etiquetados'
    WHEN 'collected' THEN 'Coletado pela transportadora'
    WHEN 'shipped'   THEN 'Carga expedida'
    WHEN 'delivered' THEN 'Entrega confirmada'
  END;
  IF p_notes IS NOT NULL AND length(trim(p_notes)) > 0 THEN
    v_description := v_description || ' — ' || p_notes;
  END IF;

  INSERT INTO public.delivery_tracking (
    shipment_id, event_type, description, location, registered_by, occurred_at, company_id
  ) VALUES (
    v_shipment_id, v_event_type, v_description, p_location,
    COALESCE((SELECT email FROM auth.users WHERE id = auth.uid()), 'sistema'),
    v_now, v_user_company
  );

  RETURN jsonb_build_object(
    'shipment_id', v_shipment_id,
    'shipment_number', v_shipment_number,
    'stage', p_stage,
    'event', v_event_type
  );
END;
$$;

REVOKE ALL ON FUNCTION public.wms_update_shipment_stage(uuid, text, text, text, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.wms_update_shipment_stage(uuid, text, text, text, text, text) TO authenticated, service_role;


ALTER TABLE public.picking_waves
  ADD COLUMN IF NOT EXISTS planned_operators integer,
  ADD COLUMN IF NOT EXISTS zone text,
  ADD COLUMN IF NOT EXISTS cutoff_at timestamptz;

CREATE OR REPLACE FUNCTION public.wms_wave_plan_v2(
  _cutoff timestamptz DEFAULT NULL,
  _carrier text DEFAULT NULL,
  _zone text DEFAULT NULL,
  _min_priority text DEFAULT NULL,
  _max_orders_per_wave int DEFAULT 20,
  _operators int DEFAULT 1,
  _commit boolean DEFAULT false
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_company uuid := public.get_user_company_id(auth.uid());
  v_orders jsonb;
  v_ord record;
  v_wave_count int := 0;
  v_orders_total int := 0;
  v_ops int := GREATEST(1, COALESCE(_operators, 1));
  v_cap int := GREATEST(1, COALESCE(_max_orders_per_wave, 20));
  v_priority_rank jsonb := '{"low":1,"medium":2,"high":3,"urgent":4}'::jsonb;
  v_min_rank int := COALESCE( (v_priority_rank->>COALESCE(_min_priority,'low'))::int, 1 );
  v_waves jsonb := '[]'::jsonb;
  v_current_wave jsonb;
  v_current_orders jsonb := '[]'::jsonb;
  v_idx int := 0;
  v_wave_id uuid;
  v_wave_number text;
BEGIN
  IF v_company IS NULL THEN
    RAISE EXCEPTION 'no_tenant';
  END IF;

  FOR v_ord IN
    SELECT po.id, po.order_number, po.priority, po.items_count, po.created_at
    FROM public.wms_picking_orders po
    WHERE po.company_id = v_company
      AND po.status = 'pending'
      AND po.wave_id_ref IS NULL
      AND ( _cutoff IS NULL OR po.created_at <= _cutoff )
      AND COALESCE( (v_priority_rank->>po.priority)::int, 1 ) >= v_min_rank
    ORDER BY
      COALESCE((v_priority_rank->>po.priority)::int,1) DESC,
      po.created_at ASC
  LOOP
    v_orders_total := v_orders_total + 1;
    v_current_orders := v_current_orders || jsonb_build_object(
      'id', v_ord.id,
      'order_number', v_ord.order_number,
      'priority', v_ord.priority,
      'items', COALESCE(v_ord.items_count,0),
      'operator', ((v_idx % v_ops) + 1)
    );
    v_idx := v_idx + 1;

    IF jsonb_array_length(v_current_orders) >= v_cap THEN
      v_waves := v_waves || jsonb_build_object('orders', v_current_orders);
      v_current_orders := '[]'::jsonb;
      v_idx := 0;
    END IF;
  END LOOP;

  IF jsonb_array_length(v_current_orders) > 0 THEN
    v_waves := v_waves || jsonb_build_object('orders', v_current_orders);
  END IF;

  v_wave_count := jsonb_array_length(v_waves);

  IF _commit AND v_wave_count > 0 THEN
    FOR v_idx IN 0..v_wave_count-1 LOOP
      v_wave_number := 'WV-' || to_char(now(),'YYYYMMDDHH24MISS') || '-' || (v_idx+1);
      INSERT INTO public.picking_waves(
        company_id, wave_number, name, status, strategy,
        carrier, zone, cutoff_at, priority,
        planned_operators, orders_count, items_count
      ) VALUES (
        v_company, v_wave_number,
        'Wave v2 auto ' || (v_idx+1), 'planned', 'wave_v2',
        _carrier, _zone, _cutoff, 'medium',
        v_ops,
        jsonb_array_length(v_waves->v_idx->'orders'),
        (SELECT COALESCE(SUM((o->>'items')::int),0)
           FROM jsonb_array_elements(v_waves->v_idx->'orders') o)
      ) RETURNING id INTO v_wave_id;

      UPDATE public.wms_picking_orders po
      SET wave_id_ref = v_wave_id
      WHERE po.company_id = v_company
        AND po.id IN (
          SELECT (o->>'id')::uuid
          FROM jsonb_array_elements(v_waves->v_idx->'orders') o
        );
    END LOOP;
  END IF;

  RETURN jsonb_build_object(
    'company_id', v_company,
    'orders_total', v_orders_total,
    'waves_planned', v_wave_count,
    'operators', v_ops,
    'committed', _commit,
    'waves', v_waves
  );
END;
$$;

REVOKE ALL ON FUNCTION public.wms_wave_plan_v2(timestamptz,text,text,text,int,int,boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.wms_wave_plan_v2(timestamptz,text,text,text,int,int,boolean) TO authenticated;

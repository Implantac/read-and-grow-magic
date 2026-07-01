
CREATE OR REPLACE FUNCTION public.aps_schedule_multi(_horizon_days int DEFAULT 14)
RETURNS TABLE(
  order_id uuid,
  order_number text,
  product_name text,
  quantity numeric,
  due_date timestamptz,
  priority text,
  machine_id uuid,
  machine_name text,
  machine_sector text,
  operator text,
  duration_minutes int,
  planned_start timestamptz,
  planned_end timestamptz,
  is_late boolean,
  conflicts text[],
  sequence_no int
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_company uuid := public.get_user_company_id(auth.uid());
  v_horizon_end timestamptz := now() + make_interval(days => greatest(_horizon_days,1));
  v_order record;
  v_machine record;
  v_start timestamptz;
  v_end timestamptz;
  v_dur int;
  v_seq int := 0;
  v_conflicts text[];
  v_late boolean;
  -- transient machine clock via temp table
BEGIN
  IF v_company IS NULL THEN
    RAISE EXCEPTION 'no_company';
  END IF;

  CREATE TEMP TABLE IF NOT EXISTS _aps_clock(
    machine_id uuid PRIMARY KEY,
    available_at timestamptz
  ) ON COMMIT DROP;
  DELETE FROM _aps_clock;

  INSERT INTO _aps_clock(machine_id, available_at)
  SELECT id, now()
  FROM production_machines
  WHERE company_id = v_company AND coalesce(active, true) = true;

  FOR v_order IN
    SELECT o.*
    FROM production_orders o
    WHERE o.company_id = v_company
      AND o.status IN ('planned','in_progress','paused','released')
    ORDER BY
      CASE lower(coalesce(o.priority,'medium'))
        WHEN 'urgent' THEN 0 WHEN 'high' THEN 1
        WHEN 'medium' THEN 2 WHEN 'low' THEN 3 ELSE 4 END,
      coalesce(o.due_date, now() + interval '365 days') ASC,
      o.created_at ASC
  LOOP
    v_conflicts := ARRAY[]::text[];

    -- pick candidate machine: same sector if defined, else any; earliest available
    SELECT m.id, m.name, m.sector, m.current_operator, m.capacity_per_hour, c.available_at
      INTO v_machine
      FROM production_machines m
      JOIN _aps_clock c ON c.machine_id = m.id
      WHERE m.company_id = v_company AND coalesce(m.active,true)=true
        AND (v_order.sector IS NULL OR m.sector IS NULL OR m.sector = v_order.sector)
      ORDER BY c.available_at ASC, coalesce(m.capacity_per_hour,0) DESC
      LIMIT 1;

    IF v_machine.id IS NULL THEN
      v_conflicts := v_conflicts || 'no_machine_available';
      v_seq := v_seq + 1;
      order_id := v_order.id;
      order_number := v_order.order_number;
      product_name := v_order.product_name;
      quantity := v_order.quantity;
      due_date := v_order.due_date;
      priority := v_order.priority;
      machine_id := NULL; machine_name := NULL; machine_sector := NULL;
      operator := v_order.operator;
      duration_minutes := coalesce(v_order.estimated_time_minutes, 0);
      planned_start := NULL; planned_end := NULL;
      is_late := true;
      conflicts := v_conflicts;
      sequence_no := v_seq;
      RETURN NEXT;
      CONTINUE;
    END IF;

    v_dur := coalesce(
      v_order.estimated_time_minutes,
      CASE
        WHEN coalesce(v_machine.capacity_per_hour,0) > 0
          THEN ceil((v_order.quantity / v_machine.capacity_per_hour) * 60)::int
        ELSE 60
      END
    );

    v_start := v_machine.available_at;
    v_end := v_start + make_interval(mins => v_dur);

    v_late := v_order.due_date IS NOT NULL AND v_end > v_order.due_date;
    IF v_late THEN v_conflicts := v_conflicts || 'past_due'; END IF;
    IF v_end > v_horizon_end THEN v_conflicts := v_conflicts || 'beyond_horizon'; END IF;
    IF v_order.operator IS NULL AND v_machine.current_operator IS NULL THEN
      v_conflicts := v_conflicts || 'no_operator_assigned';
    END IF;

    UPDATE _aps_clock SET available_at = v_end WHERE machine_id = v_machine.id;

    v_seq := v_seq + 1;
    order_id := v_order.id;
    order_number := v_order.order_number;
    product_name := v_order.product_name;
    quantity := v_order.quantity;
    due_date := v_order.due_date;
    priority := v_order.priority;
    machine_id := v_machine.id;
    machine_name := v_machine.name;
    machine_sector := v_machine.sector;
    operator := coalesce(v_order.operator, v_machine.current_operator);
    duration_minutes := v_dur;
    planned_start := v_start;
    planned_end := v_end;
    is_late := v_late;
    conflicts := v_conflicts;
    sequence_no := v_seq;
    RETURN NEXT;
  END LOOP;
END;
$$;

REVOKE ALL ON FUNCTION public.aps_schedule_multi(int) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.aps_schedule_multi(int) TO authenticated, service_role;

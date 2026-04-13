
-- Trigger function to auto-generate OP steps from production routes
CREATE OR REPLACE FUNCTION public.generate_op_steps_from_route()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_route RECORD;
  v_step RECORD;
  v_seq INTEGER := 1;
BEGIN
  -- Only on insert, skip if product_id is null
  IF NEW.product_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Find active route for this product
  SELECT * INTO v_route
  FROM public.production_routes
  WHERE product_id = NEW.product_id AND is_active = true
  ORDER BY created_at DESC
  LIMIT 1;

  IF v_route.id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Link route to OP
  UPDATE public.production_orders SET route_id = v_route.id WHERE id = NEW.id;

  -- Check if steps already exist
  IF EXISTS (SELECT 1 FROM public.production_order_steps WHERE production_order_id = NEW.id LIMIT 1) THEN
    RETURN NEW;
  END IF;

  -- Generate steps from route steps
  FOR v_step IN
    SELECT rs.*, ps.name as sector_name
    FROM public.production_route_steps rs
    LEFT JOIN public.production_sectors ps ON ps.id = rs.sector_id
    WHERE rs.route_id = v_route.id
    ORDER BY rs.sequence
  LOOP
    -- Try to find matching production_step by name
    DECLARE
      v_step_id UUID;
    BEGIN
      SELECT id INTO v_step_id
      FROM public.production_steps
      WHERE name = v_step.step_name
      LIMIT 1;

      INSERT INTO public.production_order_steps (
        production_order_id, step_id, sequence,
        estimated_time_minutes, quantity_pending, status
      ) VALUES (
        NEW.id,
        v_step_id,
        v_step.sequence,
        v_step.setup_time_minutes + v_step.operation_time_minutes,
        NEW.quantity,
        'pending'
      );
    END;
  END LOOP;

  -- Update estimated time on OP
  UPDATE public.production_orders
  SET estimated_time_minutes = v_route.total_time_minutes
  WHERE id = NEW.id AND estimated_time_minutes = 0;

  RETURN NEW;
END;
$$;

-- Create trigger on production_orders insert
DROP TRIGGER IF EXISTS trg_generate_op_steps_from_route ON public.production_orders;
CREATE TRIGGER trg_generate_op_steps_from_route
  AFTER INSERT ON public.production_orders
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_op_steps_from_route();

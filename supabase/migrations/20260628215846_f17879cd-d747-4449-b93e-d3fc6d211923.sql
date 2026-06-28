
ALTER TABLE public.delivery_routes
  ADD COLUMN IF NOT EXISTS depot_latitude numeric(10,7),
  ADD COLUMN IF NOT EXISTS depot_longitude numeric(10,7),
  ADD COLUMN IF NOT EXISTS avg_speed_kmh numeric(6,2) NOT NULL DEFAULT 50,
  ADD COLUMN IF NOT EXISTS service_time_minutes integer NOT NULL DEFAULT 10,
  ADD COLUMN IF NOT EXISTS planned_start_at timestamptz;

CREATE OR REPLACE FUNCTION public.fn_route_compute_eta(_route_id uuid)
RETURNS TABLE(stop_id uuid, stop_sequence integer, distance_km numeric, eta timestamptz)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_route delivery_routes%ROWTYPE;
  v_caller_company uuid;
  v_start timestamptz;
  v_speed numeric;
  v_service interval;
  v_prev_lat numeric;
  v_prev_lng numeric;
  v_cursor_time timestamptz;
  v_stop record;
  v_seg_km numeric;
  v_earth_km constant numeric := 6371;
BEGIN
  SELECT * INTO v_route FROM delivery_routes WHERE id = _route_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'route_not_found'; END IF;

  v_caller_company := get_user_company_id(auth.uid());
  IF v_caller_company IS NULL OR v_caller_company <> v_route.company_id THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  v_start := COALESCE(v_route.planned_start_at, v_route.departure_time,
                      (v_route.planned_date::timestamptz + interval '8 hours'));
  v_speed := GREATEST(COALESCE(v_route.avg_speed_kmh, 50), 1);
  v_service := make_interval(mins => COALESCE(v_route.service_time_minutes, 10));

  v_prev_lat := v_route.depot_latitude;
  v_prev_lng := v_route.depot_longitude;
  v_cursor_time := v_start;

  FOR v_stop IN
    SELECT id, sequence AS seq, latitude, longitude
    FROM route_stops
    WHERE route_id = _route_id
    ORDER BY sequence
  LOOP
    IF v_stop.latitude IS NULL OR v_stop.longitude IS NULL THEN
      stop_id := v_stop.id; stop_sequence := v_stop.seq; distance_km := NULL; eta := NULL;
      RETURN NEXT;
      CONTINUE;
    END IF;

    IF v_prev_lat IS NULL OR v_prev_lng IS NULL THEN
      v_seg_km := 0;
    ELSE
      v_seg_km := 2 * v_earth_km * asin(sqrt(
        sin(radians((v_stop.latitude - v_prev_lat)/2))^2 +
        cos(radians(v_prev_lat)) * cos(radians(v_stop.latitude)) *
        sin(radians((v_stop.longitude - v_prev_lng)/2))^2
      ));
    END IF;

    v_cursor_time := v_cursor_time + make_interval(secs => (v_seg_km / v_speed) * 3600);
    UPDATE route_stops SET planned_eta = v_cursor_time WHERE id = v_stop.id;

    stop_id := v_stop.id;
    stop_sequence := v_stop.seq;
    distance_km := round(v_seg_km::numeric, 3);
    eta := v_cursor_time;
    RETURN NEXT;

    v_cursor_time := v_cursor_time + v_service;
    v_prev_lat := v_stop.latitude;
    v_prev_lng := v_stop.longitude;
  END LOOP;
END;
$$;

REVOKE ALL ON FUNCTION public.fn_route_compute_eta(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.fn_route_compute_eta(uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.fn_route_compute_eta(uuid) TO authenticated, service_role;

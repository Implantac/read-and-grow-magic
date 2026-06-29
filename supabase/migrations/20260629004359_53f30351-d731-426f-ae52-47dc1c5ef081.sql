
ALTER TABLE public.route_stops
  ADD COLUMN IF NOT EXISTS time_window_start time,
  ADD COLUMN IF NOT EXISTS time_window_end time,
  ADD COLUMN IF NOT EXISTS service_minutes integer NOT NULL DEFAULT 10;

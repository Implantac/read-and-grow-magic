-- Ciclo 15: Ensure REPLICA IDENTITY FULL on realtime-published tables
ALTER TABLE public.delivery_tracking REPLICA IDENTITY FULL;
ALTER TABLE public.follow_ups REPLICA IDENTITY FULL;
ALTER TABLE public.industrial_alerts REPLICA IDENTITY FULL;
ALTER TABLE public.iot_telemetry REPLICA IDENTITY FULL;
ALTER TABLE public.outsourcing_orders REPLICA IDENTITY FULL;
ALTER TABLE public.production_events REPLICA IDENTITY FULL;
ALTER TABLE public.production_logs REPLICA IDENTITY FULL;
ALTER TABLE public.production_machines REPLICA IDENTITY FULL;
ALTER TABLE public.production_order_steps REPLICA IDENTITY FULL;
ALTER TABLE public.production_orders REPLICA IDENTITY FULL;
ALTER TABLE public.rfid_events REPLICA IDENTITY FULL;
ALTER TABLE public.sales_opportunities REPLICA IDENTITY FULL;
ALTER TABLE public.time_entries REPLICA IDENTITY FULL;
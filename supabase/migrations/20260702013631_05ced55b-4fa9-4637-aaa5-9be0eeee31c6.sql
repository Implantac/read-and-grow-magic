ALTER PUBLICATION supabase_realtime ADD TABLE public.commercial_alerts;
ALTER TABLE public.commercial_alerts REPLICA IDENTITY FULL;
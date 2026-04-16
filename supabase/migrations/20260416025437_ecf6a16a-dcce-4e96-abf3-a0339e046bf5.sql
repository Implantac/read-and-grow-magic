
CREATE TABLE public.production_time_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES public.production_orders(id) ON DELETE CASCADE,
  action TEXT NOT NULL DEFAULT 'start',
  started_at TIMESTAMPTZ,
  paused_at TIMESTAMPTZ,
  finished_at TIMESTAMPTZ,
  elapsed_seconds INTEGER NOT NULL DEFAULT 0,
  operator TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_production_time_logs_order ON public.production_time_logs(order_id);

ALTER TABLE public.production_time_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view time logs"
  ON public.production_time_logs FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert time logs"
  ON public.production_time_logs FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update time logs"
  ON public.production_time_logs FOR UPDATE TO authenticated USING (true);

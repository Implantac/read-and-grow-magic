
CREATE TABLE public.daily_executive_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  report_date DATE NOT NULL DEFAULT CURRENT_DATE,
  report_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  generated_by TEXT DEFAULT 'system',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.daily_executive_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view reports"
  ON public.daily_executive_reports FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "System can insert reports"
  ON public.daily_executive_reports FOR INSERT
  TO authenticated WITH CHECK (true);

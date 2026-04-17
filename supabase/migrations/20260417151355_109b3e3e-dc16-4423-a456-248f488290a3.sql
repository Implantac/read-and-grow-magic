
CREATE TABLE IF NOT EXISTS public.ai_learning (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pattern_type text NOT NULL,
  pattern_key text NOT NULL,
  value numeric DEFAULT 0,
  frequency integer NOT NULL DEFAULT 1,
  metadata jsonb DEFAULT '{}'::jsonb,
  last_updated timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (pattern_type, pattern_key)
);
CREATE INDEX IF NOT EXISTS idx_ai_learning_type ON public.ai_learning(pattern_type);
CREATE INDEX IF NOT EXISTS idx_ai_learning_updated ON public.ai_learning(last_updated DESC);

ALTER TABLE public.ai_learning ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated read ai_learning"
  ON public.ai_learning FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins manage ai_learning"
  ON public.ai_learning FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TABLE IF NOT EXISTS public.ai_kpis (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  snapshot_date date NOT NULL DEFAULT CURRENT_DATE,
  kpi_name text NOT NULL,
  category text NOT NULL DEFAULT 'general',
  current_value numeric DEFAULT 0,
  target_value numeric DEFAULT 0,
  status text NOT NULL DEFAULT 'ok',
  trend text,
  explanation text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_ai_kpis_date ON public.ai_kpis(snapshot_date DESC);
CREATE INDEX IF NOT EXISTS idx_ai_kpis_name ON public.ai_kpis(kpi_name);

ALTER TABLE public.ai_kpis ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated read ai_kpis"
  ON public.ai_kpis FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins manage ai_kpis"
  ON public.ai_kpis FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

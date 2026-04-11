
-- Playbooks por etapa do funil
CREATE TABLE public.sales_playbooks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  stage TEXT NOT NULL,
  title TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'general',
  scripts JSONB DEFAULT '[]'::jsonb,
  actions JSONB DEFAULT '[]'::jsonb,
  next_steps JSONB DEFAULT '[]'::jsonb,
  tips TEXT,
  closing_techniques JSONB DEFAULT '[]'::jsonb,
  ideal_timing TEXT,
  priority INTEGER DEFAULT 0,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Banco de objeções
CREATE TABLE public.sales_objections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  objection TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'price',
  response TEXT NOT NULL,
  strategy TEXT,
  context TEXT,
  stage TEXT,
  success_rate NUMERIC DEFAULT 0,
  usage_count INTEGER DEFAULT 0,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Log de uso do playbook
CREATE TABLE public.playbook_usage_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  sales_rep_id TEXT,
  playbook_id UUID REFERENCES public.sales_playbooks(id),
  objection_id UUID REFERENCES public.sales_objections(id),
  action_type TEXT NOT NULL,
  context TEXT,
  result TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.sales_playbooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_objections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.playbook_usage_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read playbooks" ON public.sales_playbooks FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can read objections" ON public.sales_objections FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert usage logs" ON public.playbook_usage_logs FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can read usage logs" ON public.playbook_usage_logs FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage playbooks" ON public.sales_playbooks FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage objections" ON public.sales_objections FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

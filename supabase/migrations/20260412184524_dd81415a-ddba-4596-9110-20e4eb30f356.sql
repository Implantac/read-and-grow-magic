
-- Follow-up tasks table
CREATE TABLE public.follow_up_tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
  client_name TEXT NOT NULL,
  sales_rep_id TEXT,
  action_type TEXT NOT NULL DEFAULT 'call',
  title TEXT NOT NULL,
  description TEXT,
  scheduled_date DATE NOT NULL,
  scheduled_time TIME,
  status TEXT NOT NULL DEFAULT 'pending',
  priority TEXT NOT NULL DEFAULT 'medium',
  channel TEXT DEFAULT 'phone',
  suggested_message TEXT,
  ai_generated BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  result TEXT,
  next_follow_up_id UUID,
  order_id UUID REFERENCES public.orders(id),
  funnel_id UUID REFERENCES public.sales_funnel(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.follow_up_tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can manage follow_up_tasks" ON public.follow_up_tasks FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE INDEX idx_follow_up_tasks_client ON public.follow_up_tasks(client_id);
CREATE INDEX idx_follow_up_tasks_date ON public.follow_up_tasks(scheduled_date);
CREATE INDEX idx_follow_up_tasks_status ON public.follow_up_tasks(status);

-- WhatsApp message templates
CREATE TABLE public.whatsapp_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'general',
  subject TEXT,
  body TEXT NOT NULL,
  variables TEXT[] DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.whatsapp_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can manage whatsapp_templates" ON public.whatsapp_templates FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Lead nurturing sequences
CREATE TABLE public.lead_nurturing_sequences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  target_segment TEXT,
  trigger_event TEXT NOT NULL DEFAULT 'manual',
  is_active BOOLEAN DEFAULT true,
  steps JSONB NOT NULL DEFAULT '[]',
  total_enrolled INTEGER DEFAULT 0,
  conversion_rate NUMERIC(5,2) DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.lead_nurturing_sequences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can manage lead_nurturing_sequences" ON public.lead_nurturing_sequences FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Lead nurturing enrollments
CREATE TABLE public.lead_nurturing_enrollments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sequence_id UUID NOT NULL REFERENCES public.lead_nurturing_sequences(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  current_step INTEGER DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active',
  enrolled_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_action_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  converted BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.lead_nurturing_enrollments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can manage lead_nurturing_enrollments" ON public.lead_nurturing_enrollments FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE INDEX idx_nurturing_enrollments_sequence ON public.lead_nurturing_enrollments(sequence_id);
CREATE INDEX idx_nurturing_enrollments_client ON public.lead_nurturing_enrollments(client_id);

-- Insert default WhatsApp templates
INSERT INTO public.whatsapp_templates (name, category, body, variables) VALUES
('Follow-up Pós-Reunião', 'follow_up', 'Olá {{nome}}! Agradeço pela reunião de hoje. Conforme conversamos, seguem os próximos passos: {{detalhes}}. Fico à disposição!', ARRAY['nome', 'detalhes']),
('Proposta Enviada', 'proposal', 'Olá {{nome}}! Enviei a proposta comercial por e-mail. O valor é {{valor}} com condições especiais válidas até {{prazo}}. Posso esclarecer alguma dúvida?', ARRAY['nome', 'valor', 'prazo']),
('Reativação de Cliente', 'reactivation', 'Olá {{nome}}! Faz tempo que não conversamos. Temos novidades que podem interessar: {{novidade}}. Podemos marcar um bate-papo rápido?', ARRAY['nome', 'novidade']),
('Lembrete de Pagamento', 'reminder', 'Olá {{nome}}! Passando para lembrar sobre o vencimento do título no valor de {{valor}} com vencimento em {{data}}. Qualquer dúvida estou à disposição.', ARRAY['nome', 'valor', 'data']),
('Boas-vindas Novo Cliente', 'onboarding', 'Olá {{nome}}! Seja bem-vindo(a)! Sou {{vendedor}}, seu consultor comercial. Estou aqui para ajudar no que precisar. Como posso auxiliá-lo hoje?', ARRAY['nome', 'vendedor']),
('Pesquisa de Satisfação', 'satisfaction', 'Olá {{nome}}! Como está sua experiência com nossos produtos/serviços? Sua opinião é muito importante para nós. Pode nos dar um feedback rápido?', ARRAY['nome']);


-- Sales contact logs (tracks every sales rep interaction)
CREATE TABLE public.sales_contact_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sales_rep_id UUID REFERENCES public.sales_reps(id) ON DELETE CASCADE,
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  funnel_id UUID REFERENCES public.sales_funnel(id) ON DELETE SET NULL,
  contact_type TEXT NOT NULL DEFAULT 'phone', -- phone, email, visit, whatsapp, meeting
  result TEXT NOT NULL DEFAULT 'no_answer', -- answered, no_answer, callback, proposal_sent, order_placed, rejected
  notes TEXT,
  duration_minutes INTEGER DEFAULT 0,
  next_action TEXT, -- description of required follow-up
  next_action_date TIMESTAMPTZ,
  response_time_minutes INTEGER, -- time from lead creation/last contact to this contact
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.sales_contact_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can manage contact logs" ON public.sales_contact_logs FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE INDEX idx_contact_logs_rep ON public.sales_contact_logs(sales_rep_id);
CREATE INDEX idx_contact_logs_client ON public.sales_contact_logs(client_id);
CREATE INDEX idx_contact_logs_date ON public.sales_contact_logs(created_at);

-- Sales daily goals (daily targets per rep)
CREATE TABLE public.sales_daily_goals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sales_rep_id UUID REFERENCES public.sales_reps(id) ON DELETE CASCADE NOT NULL,
  goal_date DATE NOT NULL DEFAULT CURRENT_DATE,
  target_contacts INTEGER NOT NULL DEFAULT 10,
  target_proposals INTEGER NOT NULL DEFAULT 3,
  target_value NUMERIC NOT NULL DEFAULT 0,
  achieved_contacts INTEGER NOT NULL DEFAULT 0,
  achieved_proposals INTEGER NOT NULL DEFAULT 0,
  achieved_value NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(sales_rep_id, goal_date)
);

ALTER TABLE public.sales_daily_goals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can manage daily goals" ON public.sales_daily_goals FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE INDEX idx_daily_goals_rep_date ON public.sales_daily_goals(sales_rep_id, goal_date);

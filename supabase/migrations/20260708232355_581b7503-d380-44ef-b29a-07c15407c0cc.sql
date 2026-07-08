
-- ===== NPS MODULE =====

-- Templates visuais
CREATE TABLE public.nps_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  logo_url TEXT,
  primary_color TEXT DEFAULT '#FF9800',
  background_color TEXT DEFAULT '#1A2234',
  font_family TEXT DEFAULT 'Inter',
  banner_url TEXT,
  footer_text TEXT,
  social_links JSONB DEFAULT '{}'::jsonb,
  custom_domain TEXT,
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.nps_templates TO authenticated;
GRANT ALL ON public.nps_templates TO service_role;
ALTER TABLE public.nps_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY nps_templates_tenant ON public.nps_templates FOR ALL
  USING (company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()))
  WITH CHECK (company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

-- Campanhas
CREATE TABLE public.nps_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  template_id UUID REFERENCES public.nps_templates(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT,
  message TEXT,
  title TEXT,
  subtitle TEXT,
  logo_url TEXT,
  primary_color TEXT,
  banner_url TEXT,
  thanks_title TEXT DEFAULT 'Obrigado!',
  thanks_message TEXT DEFAULT 'Sua opinião é muito importante.',
  survey_type TEXT NOT NULL DEFAULT 'rnps',
  status TEXT NOT NULL DEFAULT 'draft',
  scheduled_at TIMESTAMPTZ,
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  target_filter JSONB DEFAULT '{}'::jsonb,
  send_channels JSONB DEFAULT '["email"]'::jsonb,
  require_open_comment BOOLEAN DEFAULT true,
  recaptcha_enabled BOOLEAN DEFAULT false,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT nps_campaigns_status_ck CHECK (status IN ('draft','scheduled','active','paused','ended')),
  CONSTRAINT nps_campaigns_type_ck CHECK (survey_type IN ('rnps','tnps','enps','custom'))
);
CREATE INDEX ON public.nps_campaigns(company_id, status);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.nps_campaigns TO authenticated;
GRANT ALL ON public.nps_campaigns TO service_role;
ALTER TABLE public.nps_campaigns ENABLE ROW LEVEL SECURITY;
CREATE POLICY nps_campaigns_tenant ON public.nps_campaigns FOR ALL
  USING (company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()))
  WITH CHECK (company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

-- Perguntas adicionais
CREATE TABLE public.nps_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  campaign_id UUID NOT NULL REFERENCES public.nps_campaigns(id) ON DELETE CASCADE,
  order_index INTEGER NOT NULL DEFAULT 0,
  question_text TEXT NOT NULL,
  question_type TEXT NOT NULL DEFAULT 'text',
  required BOOLEAN NOT NULL DEFAULT false,
  options JSONB DEFAULT '[]'::jsonb,
  condition JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT nps_questions_type_ck CHECK (question_type IN ('text','multi_choice','checkbox','radio','stars','emoji','likert','dropdown','date','number','file'))
);
CREATE INDEX ON public.nps_questions(campaign_id, order_index);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.nps_questions TO authenticated;
GRANT ALL ON public.nps_questions TO service_role;
ALTER TABLE public.nps_questions ENABLE ROW LEVEL SECURITY;
CREATE POLICY nps_questions_tenant ON public.nps_questions FOR ALL
  USING (company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()))
  WITH CHECK (company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

-- Convites
CREATE TABLE public.nps_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  campaign_id UUID NOT NULL REFERENCES public.nps_campaigns(id) ON DELETE CASCADE,
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  channel TEXT NOT NULL DEFAULT 'email',
  destination TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  attempts INTEGER NOT NULL DEFAULT 0,
  scheduled_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  opened_at TIMESTAMPTZ,
  responded_at TIMESTAMPTZ,
  error TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT nps_invites_channel_ck CHECK (channel IN ('email','whatsapp','sms','link','qr','api','webhook')),
  CONSTRAINT nps_invites_status_ck CHECK (status IN ('pending','scheduled','sending','sent','delivered','opened','responded','failed','bounced'))
);
CREATE INDEX ON public.nps_invites(company_id, campaign_id, status);
CREATE INDEX ON public.nps_invites(client_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.nps_invites TO authenticated;
GRANT ALL ON public.nps_invites TO service_role;
ALTER TABLE public.nps_invites ENABLE ROW LEVEL SECURITY;
CREATE POLICY nps_invites_tenant ON public.nps_invites FOR ALL
  USING (company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()))
  WITH CHECK (company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

-- Tokens públicos seguros
CREATE TABLE public.nps_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  campaign_id UUID NOT NULL REFERENCES public.nps_campaigns(id) ON DELETE CASCADE,
  invite_id UUID REFERENCES public.nps_invites(id) ON DELETE SET NULL,
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  token TEXT NOT NULL UNIQUE,
  single_use BOOLEAN NOT NULL DEFAULT true,
  expires_at TIMESTAMPTZ,
  used_at TIMESTAMPTZ,
  used_ip INET,
  used_user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ON public.nps_tokens(token);
CREATE INDEX ON public.nps_tokens(campaign_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.nps_tokens TO authenticated;
GRANT ALL ON public.nps_tokens TO service_role;
ALTER TABLE public.nps_tokens ENABLE ROW LEVEL SECURITY;
CREATE POLICY nps_tokens_tenant ON public.nps_tokens FOR ALL
  USING (company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()))
  WITH CHECK (company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

-- Respostas NPS
CREATE TABLE public.nps_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  campaign_id UUID NOT NULL REFERENCES public.nps_campaigns(id) ON DELETE CASCADE,
  invite_id UUID REFERENCES public.nps_invites(id) ON DELETE SET NULL,
  token_id UUID REFERENCES public.nps_tokens(id) ON DELETE SET NULL,
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  score SMALLINT NOT NULL,
  category TEXT NOT NULL,
  comment TEXT,
  sentiment TEXT,
  ai_summary TEXT,
  ai_categories JSONB DEFAULT '[]'::jsonb,
  ai_keywords JSONB DEFAULT '[]'::jsonb,
  ip INET,
  city TEXT,
  region TEXT,
  country TEXT,
  device TEXT,
  browser TEXT,
  os TEXT,
  response_time_seconds INTEGER,
  origin TEXT,
  channel TEXT,
  seller_id UUID,
  branch_id UUID,
  product_id UUID,
  order_id UUID,
  metadata JSONB DEFAULT '{}'::jsonb,
  anonymized BOOLEAN NOT NULL DEFAULT false,
  responded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT nps_answers_score_ck CHECK (score BETWEEN 0 AND 10),
  CONSTRAINT nps_answers_category_ck CHECK (category IN ('promoter','passive','detractor'))
);
CREATE INDEX ON public.nps_answers(company_id, campaign_id, responded_at DESC);
CREATE INDEX ON public.nps_answers(client_id);
CREATE INDEX ON public.nps_answers(category);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.nps_answers TO authenticated;
GRANT ALL ON public.nps_answers TO service_role;
ALTER TABLE public.nps_answers ENABLE ROW LEVEL SECURITY;
CREATE POLICY nps_answers_tenant ON public.nps_answers FOR ALL
  USING (company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()))
  WITH CHECK (company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

-- Itens de respostas adicionais
CREATE TABLE public.nps_answer_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  answer_id UUID NOT NULL REFERENCES public.nps_answers(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES public.nps_questions(id) ON DELETE CASCADE,
  value_text TEXT,
  value_number NUMERIC,
  value_json JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ON public.nps_answer_items(answer_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.nps_answer_items TO authenticated;
GRANT ALL ON public.nps_answer_items TO service_role;
ALTER TABLE public.nps_answer_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY nps_answer_items_tenant ON public.nps_answer_items FOR ALL
  USING (company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()))
  WITH CHECK (company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

-- Automações
CREATE TABLE public.nps_automations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  campaign_id UUID REFERENCES public.nps_campaigns(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  trigger TEXT NOT NULL,
  delay_value INTEGER DEFAULT 0,
  delay_unit TEXT DEFAULT 'hours',
  channel TEXT NOT NULL DEFAULT 'email',
  filter JSONB DEFAULT '{}'::jsonb,
  active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT nps_automations_trigger_ck CHECK (trigger IN ('order_created','order_billed','invoice_issued','delivered','service_closed','os_closed','contract_closed','payment_received','after_days','after_hours','last_purchase')),
  CONSTRAINT nps_automations_delay_unit_ck CHECK (delay_unit IN ('minutes','hours','days')),
  CONSTRAINT nps_automations_channel_ck CHECK (channel IN ('email','whatsapp','sms'))
);
CREATE INDEX ON public.nps_automations(company_id, active);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.nps_automations TO authenticated;
GRANT ALL ON public.nps_automations TO service_role;
ALTER TABLE public.nps_automations ENABLE ROW LEVEL SECURITY;
CREATE POLICY nps_automations_tenant ON public.nps_automations FOR ALL
  USING (company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()))
  WITH CHECK (company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

-- Webhooks
CREATE TABLE public.nps_webhooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  secret TEXT,
  events JSONB NOT NULL DEFAULT '[]'::jsonb,
  active BOOLEAN NOT NULL DEFAULT true,
  last_delivery_at TIMESTAMPTZ,
  last_status INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.nps_webhooks TO authenticated;
GRANT ALL ON public.nps_webhooks TO service_role;
ALTER TABLE public.nps_webhooks ENABLE ROW LEVEL SECURITY;
CREATE POLICY nps_webhooks_tenant ON public.nps_webhooks FOR ALL
  USING (company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()))
  WITH CHECK (company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

-- Logs
CREATE TABLE public.nps_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  campaign_id UUID REFERENCES public.nps_campaigns(id) ON DELETE SET NULL,
  event TEXT NOT NULL,
  level TEXT NOT NULL DEFAULT 'info',
  payload JSONB DEFAULT '{}'::jsonb,
  user_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ON public.nps_logs(company_id, created_at DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.nps_logs TO authenticated;
GRANT ALL ON public.nps_logs TO service_role;
ALTER TABLE public.nps_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY nps_logs_tenant ON public.nps_logs FOR ALL
  USING (company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()))
  WITH CHECK (company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

-- Relatórios salvos
CREATE TABLE public.nps_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  report_type TEXT NOT NULL,
  filters JSONB DEFAULT '{}'::jsonb,
  schedule_cron TEXT,
  last_generated_at TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.nps_reports TO authenticated;
GRANT ALL ON public.nps_reports TO service_role;
ALTER TABLE public.nps_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY nps_reports_tenant ON public.nps_reports FOR ALL
  USING (company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()))
  WITH CHECK (company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

-- Configuração de alertas
CREATE TABLE public.nps_alerts_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  score_max SMALLINT NOT NULL DEFAULT 6,
  notify_roles JSONB DEFAULT '["manager"]'::jsonb,
  notify_users JSONB DEFAULT '[]'::jsonb,
  channels JSONB DEFAULT '["system"]'::jsonb,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.nps_alerts_config TO authenticated;
GRANT ALL ON public.nps_alerts_config TO service_role;
ALTER TABLE public.nps_alerts_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY nps_alerts_config_tenant ON public.nps_alerts_config FOR ALL
  USING (company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()))
  WITH CHECK (company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

-- Triggers updated_at
CREATE OR REPLACE FUNCTION public.nps_touch_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

CREATE TRIGGER trg_nps_templates_updated BEFORE UPDATE ON public.nps_templates FOR EACH ROW EXECUTE FUNCTION public.nps_touch_updated_at();
CREATE TRIGGER trg_nps_campaigns_updated BEFORE UPDATE ON public.nps_campaigns FOR EACH ROW EXECUTE FUNCTION public.nps_touch_updated_at();
CREATE TRIGGER trg_nps_invites_updated BEFORE UPDATE ON public.nps_invites FOR EACH ROW EXECUTE FUNCTION public.nps_touch_updated_at();
CREATE TRIGGER trg_nps_automations_updated BEFORE UPDATE ON public.nps_automations FOR EACH ROW EXECUTE FUNCTION public.nps_touch_updated_at();
CREATE TRIGGER trg_nps_webhooks_updated BEFORE UPDATE ON public.nps_webhooks FOR EACH ROW EXECUTE FUNCTION public.nps_touch_updated_at();
CREATE TRIGGER trg_nps_reports_updated BEFORE UPDATE ON public.nps_reports FOR EACH ROW EXECUTE FUNCTION public.nps_touch_updated_at();
CREATE TRIGGER trg_nps_alerts_updated BEFORE UPDATE ON public.nps_alerts_config FOR EACH ROW EXECUTE FUNCTION public.nps_touch_updated_at();

-- Auto categoria por score
CREATE OR REPLACE FUNCTION public.nps_set_category()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.score >= 9 THEN NEW.category := 'promoter';
  ELSIF NEW.score >= 7 THEN NEW.category := 'passive';
  ELSE NEW.category := 'detractor';
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER trg_nps_answers_category BEFORE INSERT OR UPDATE OF score ON public.nps_answers FOR EACH ROW EXECUTE FUNCTION public.nps_set_category();

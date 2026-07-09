
-- =========================================================
-- CX Center — Ondas 11..16 (retrocompatível, aditivo)
-- =========================================================

-- Onda 11 — Customer Health Score
CREATE TABLE IF NOT EXISTS public.cx_health_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL,
  client_id UUID NOT NULL,
  score INTEGER NOT NULL CHECK (score >= 0 AND score <= 100),
  tier TEXT NOT NULL CHECK (tier IN ('excellent','good','attention','critical')),
  factors JSONB NOT NULL DEFAULT '{}'::jsonb,
  computed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (company_id, client_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cx_health_scores TO authenticated;
GRANT ALL ON public.cx_health_scores TO service_role;
ALTER TABLE public.cx_health_scores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cx_health_scores tenant read"
  ON public.cx_health_scores FOR SELECT TO authenticated
  USING (company_id = public.get_user_company_id(auth.uid()));
CREATE POLICY "cx_health_scores tenant write"
  ON public.cx_health_scores FOR ALL TO authenticated
  USING (company_id = public.get_user_company_id(auth.uid()))
  WITH CHECK (company_id = public.get_user_company_id(auth.uid()));
CREATE INDEX IF NOT EXISTS idx_cx_health_company_tier ON public.cx_health_scores (company_id, tier);
CREATE INDEX IF NOT EXISTS idx_cx_health_score ON public.cx_health_scores (company_id, score);

-- Pesos configuráveis por tenant
CREATE TABLE IF NOT EXISTS public.cx_health_weights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL UNIQUE,
  weights JSONB NOT NULL DEFAULT jsonb_build_object(
    'purchase_frequency', 20,
    'purchase_value',      15,
    'recency',             15,
    'nps',                 20,
    'tickets',             10,
    'overdue_payments',    10,
    'returns',              5,
    'engagement',           5
  ),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cx_health_weights TO authenticated;
GRANT ALL ON public.cx_health_weights TO service_role;
ALTER TABLE public.cx_health_weights ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cx_health_weights tenant read"
  ON public.cx_health_weights FOR SELECT TO authenticated
  USING (company_id = public.get_user_company_id(auth.uid()));
CREATE POLICY "cx_health_weights admin manage"
  ON public.cx_health_weights FOR ALL TO authenticated
  USING (company_id = public.get_user_company_id(auth.uid())
         AND public.has_role(auth.uid(),'admin'::app_role))
  WITH CHECK (company_id = public.get_user_company_id(auth.uid())
              AND public.has_role(auth.uid(),'admin'::app_role));

-- Onda 12 — Churn Prediction
CREATE TABLE IF NOT EXISTS public.cx_churn_predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL,
  client_id UUID NOT NULL,
  probability NUMERIC(5,2) NOT NULL CHECK (probability >= 0 AND probability <= 100),
  risk_level TEXT NOT NULL CHECK (risk_level IN ('low','medium','high','critical')),
  reasons JSONB NOT NULL DEFAULT '[]'::jsonb,
  ai_summary TEXT,
  suggested_actions JSONB NOT NULL DEFAULT '[]'::jsonb,
  predicted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  model TEXT DEFAULT 'gemini-2.5-flash',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (company_id, client_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cx_churn_predictions TO authenticated;
GRANT ALL ON public.cx_churn_predictions TO service_role;
ALTER TABLE public.cx_churn_predictions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cx_churn tenant read"
  ON public.cx_churn_predictions FOR SELECT TO authenticated
  USING (company_id = public.get_user_company_id(auth.uid()));
CREATE POLICY "cx_churn tenant write"
  ON public.cx_churn_predictions FOR ALL TO authenticated
  USING (company_id = public.get_user_company_id(auth.uid()))
  WITH CHECK (company_id = public.get_user_company_id(auth.uid()));
CREATE INDEX IF NOT EXISTS idx_cx_churn_risk ON public.cx_churn_predictions (company_id, risk_level, probability DESC);

-- Onda 13 — Survey Templates (multi-metric)
CREATE TABLE IF NOT EXISTS public.cx_survey_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID,           -- NULL = template global do sistema
  name TEXT NOT NULL,
  metric TEXT NOT NULL CHECK (metric IN ('nps','csat','ces','ces2','likert','emoji','stars','custom')),
  description TEXT,
  questions JSONB NOT NULL DEFAULT '[]'::jsonb,
  branding JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_public BOOLEAN NOT NULL DEFAULT false,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cx_survey_templates TO authenticated;
GRANT ALL ON public.cx_survey_templates TO service_role;
ALTER TABLE public.cx_survey_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cx_survey_templates read own or public"
  ON public.cx_survey_templates FOR SELECT TO authenticated
  USING (is_public = true OR company_id = public.get_user_company_id(auth.uid()));
CREATE POLICY "cx_survey_templates write own"
  ON public.cx_survey_templates FOR ALL TO authenticated
  USING (company_id = public.get_user_company_id(auth.uid()))
  WITH CHECK (company_id = public.get_user_company_id(auth.uid()));

-- Onda 14 — Workflow Builder (nós/edges no-code)
CREATE TABLE IF NOT EXISTS public.cx_workflows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  trigger JSONB NOT NULL DEFAULT '{}'::jsonb,
  nodes JSONB NOT NULL DEFAULT '[]'::jsonb,
  edges JSONB NOT NULL DEFAULT '[]'::jsonb,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','active','paused')),
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cx_workflows TO authenticated;
GRANT ALL ON public.cx_workflows TO service_role;
ALTER TABLE public.cx_workflows ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cx_workflows tenant read"
  ON public.cx_workflows FOR SELECT TO authenticated
  USING (company_id = public.get_user_company_id(auth.uid()));
CREATE POLICY "cx_workflows tenant write"
  ON public.cx_workflows FOR ALL TO authenticated
  USING (company_id = public.get_user_company_id(auth.uid()))
  WITH CHECK (company_id = public.get_user_company_id(auth.uid()));

CREATE TABLE IF NOT EXISTS public.cx_workflow_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL,
  workflow_id UUID NOT NULL REFERENCES public.cx_workflows(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'running' CHECK (status IN ('running','success','failed','cancelled')),
  context JSONB NOT NULL DEFAULT '{}'::jsonb,
  steps JSONB NOT NULL DEFAULT '[]'::jsonb,
  error TEXT,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  finished_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cx_workflow_runs TO authenticated;
GRANT ALL ON public.cx_workflow_runs TO service_role;
ALTER TABLE public.cx_workflow_runs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cx_workflow_runs tenant read"
  ON public.cx_workflow_runs FOR SELECT TO authenticated
  USING (company_id = public.get_user_company_id(auth.uid()));
CREATE POLICY "cx_workflow_runs service write"
  ON public.cx_workflow_runs FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- Onda 16 — IA: clusters de comentários + resumo executivo
CREATE TABLE IF NOT EXISTS public.cx_comment_clusters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL,
  campaign_id UUID,
  period_start TIMESTAMPTZ NOT NULL,
  period_end   TIMESTAMPTZ NOT NULL,
  clusters JSONB NOT NULL DEFAULT '[]'::jsonb,
  total_comments INTEGER NOT NULL DEFAULT 0,
  model TEXT DEFAULT 'gemini-2.5-flash',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cx_comment_clusters TO authenticated;
GRANT ALL ON public.cx_comment_clusters TO service_role;
ALTER TABLE public.cx_comment_clusters ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cx_clusters tenant read"
  ON public.cx_comment_clusters FOR SELECT TO authenticated
  USING (company_id = public.get_user_company_id(auth.uid()));
CREATE POLICY "cx_clusters service write"
  ON public.cx_comment_clusters FOR ALL TO service_role
  USING (true) WITH CHECK (true);

CREATE TABLE IF NOT EXISTS public.cx_executive_summaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL,
  period_start TIMESTAMPTZ NOT NULL,
  period_end   TIMESTAMPTZ NOT NULL,
  summary TEXT NOT NULL,
  key_insights JSONB NOT NULL DEFAULT '[]'::jsonb,
  recommendations JSONB NOT NULL DEFAULT '[]'::jsonb,
  metrics JSONB NOT NULL DEFAULT '{}'::jsonb,
  model TEXT DEFAULT 'gemini-2.5-flash',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cx_executive_summaries TO authenticated;
GRANT ALL ON public.cx_executive_summaries TO service_role;
ALTER TABLE public.cx_executive_summaries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cx_summaries tenant read"
  ON public.cx_executive_summaries FOR SELECT TO authenticated
  USING (company_id = public.get_user_company_id(auth.uid()));
CREATE POLICY "cx_summaries service write"
  ON public.cx_executive_summaries FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- Triggers updated_at
CREATE TRIGGER trg_cx_health_scores_updated BEFORE UPDATE ON public.cx_health_scores
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_cx_health_weights_updated BEFORE UPDATE ON public.cx_health_weights
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_cx_churn_updated BEFORE UPDATE ON public.cx_churn_predictions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_cx_survey_templates_updated BEFORE UPDATE ON public.cx_survey_templates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_cx_workflows_updated BEFORE UPDATE ON public.cx_workflows
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed de templates globais (metrics prontas)
INSERT INTO public.cx_survey_templates (company_id, name, metric, description, questions, is_public)
VALUES
 (NULL, 'NPS Clássico', 'nps', 'Escala 0-10 + comentário livre',
  '[{"type":"nps","text":"De 0 a 10, o quanto recomendaria?","required":true},{"type":"text","text":"Comente sua nota","required":false}]'::jsonb, true),
 (NULL, 'CSAT Padrão', 'csat', 'Satisfação em 5 pontos',
  '[{"type":"scale","min":1,"max":5,"text":"Qual seu nível de satisfação?","required":true},{"type":"text","text":"Motivo","required":false}]'::jsonb, true),
 (NULL, 'CES 2.0', 'ces2', 'Esforço percebido',
  '[{"type":"scale","min":1,"max":7,"text":"Foi fácil resolver o que precisava?","required":true}]'::jsonb, true),
 (NULL, 'Likert Atendimento', 'likert', 'Concordância em 5 pontos',
  '[{"type":"likert","text":"O atendimento superou minhas expectativas","required":true}]'::jsonb, true),
 (NULL, 'Emoji Rápido', 'emoji', 'Feedback rápido com emojis',
  '[{"type":"emoji","text":"Como foi sua experiência?","options":["😡","😐","🙂","😀","🤩"],"required":true}]'::jsonb, true),
 (NULL, 'Estrelas 1-5', 'stars', 'Avaliação em estrelas',
  '[{"type":"stars","max":5,"text":"Como você avalia?","required":true}]'::jsonb, true)
ON CONFLICT DO NOTHING;

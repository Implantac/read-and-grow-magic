
-- Follow-up de detratores (tarefas de retenção geradas a partir de nps_answers com category='detractor')
CREATE TABLE public.nps_followups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL,
  answer_id UUID NOT NULL REFERENCES public.nps_answers(id) ON DELETE CASCADE,
  client_id UUID,
  campaign_id UUID,
  assigned_to UUID,
  priority TEXT NOT NULL DEFAULT 'high',
  status TEXT NOT NULL DEFAULT 'open',
  due_date DATE,
  root_cause TEXT,
  action_taken TEXT,
  resolution_notes TEXT,
  contacted_at TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ,
  score SMALLINT,
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (answer_id)
);

CREATE INDEX idx_nps_followups_company_status ON public.nps_followups(company_id, status);
CREATE INDEX idx_nps_followups_client ON public.nps_followups(client_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.nps_followups TO authenticated;
GRANT ALL ON public.nps_followups TO service_role;

ALTER TABLE public.nps_followups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "nps_followups_tenant_read" ON public.nps_followups FOR SELECT TO authenticated
  USING (company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()));
CREATE POLICY "nps_followups_tenant_write" ON public.nps_followups FOR ALL TO authenticated
  USING (company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()))
  WITH CHECK (company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

CREATE TRIGGER trg_nps_followups_updated
  BEFORE UPDATE ON public.nps_followups
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger: cria follow-up automaticamente ao receber resposta de detrator
CREATE OR REPLACE FUNCTION public.nps_auto_create_followup()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.category = 'detractor' THEN
    INSERT INTO public.nps_followups (company_id, answer_id, client_id, campaign_id, score, comment, priority, due_date)
    VALUES (
      NEW.company_id, NEW.id, NEW.client_id, NEW.campaign_id, NEW.score, NEW.comment,
      CASE WHEN NEW.score <= 3 THEN 'critical' ELSE 'high' END,
      (now() + interval '2 days')::date
    )
    ON CONFLICT (answer_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_nps_answers_followup ON public.nps_answers;
CREATE TRIGGER trg_nps_answers_followup
  AFTER INSERT ON public.nps_answers
  FOR EACH ROW EXECUTE FUNCTION public.nps_auto_create_followup();

-- Backfill: cria follow-ups para detratores existentes
INSERT INTO public.nps_followups (company_id, answer_id, client_id, campaign_id, score, comment, priority, due_date)
SELECT company_id, id, client_id, campaign_id, score, comment,
       CASE WHEN score <= 3 THEN 'critical' ELSE 'high' END,
       (created_at + interval '2 days')::date
FROM public.nps_answers
WHERE category = 'detractor'
ON CONFLICT (answer_id) DO NOTHING;

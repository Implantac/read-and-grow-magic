
-- ============ WORKFLOW ENGINE ============
CREATE TABLE public.workflow_definitions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  name text NOT NULL,
  description text,
  target_entity text NOT NULL,
  version int NOT NULL DEFAULT 1,
  steps jsonb NOT NULL DEFAULT '[]'::jsonb,
  initial_step text,
  is_active boolean NOT NULL DEFAULT true,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.workflow_definitions TO authenticated;
GRANT ALL ON public.workflow_definitions TO service_role;
ALTER TABLE public.workflow_definitions ENABLE ROW LEVEL SECURITY;
CREATE POLICY wd_select ON public.workflow_definitions FOR SELECT TO authenticated
  USING (company_id = get_user_company_id(auth.uid()));
CREATE POLICY wd_write ON public.workflow_definitions FOR ALL TO authenticated
  USING (company_id = get_user_company_id(auth.uid())
    AND (has_role(auth.uid(), 'admin', company_id) OR has_role(auth.uid(), 'manager', company_id)))
  WITH CHECK (company_id = get_user_company_id(auth.uid())
    AND (has_role(auth.uid(), 'admin', company_id) OR has_role(auth.uid(), 'manager', company_id)));

CREATE TABLE public.workflow_instances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  definition_id uuid NOT NULL REFERENCES public.workflow_definitions(id) ON DELETE CASCADE,
  target_entity text NOT NULL,
  target_record_id uuid,
  current_step text,
  status text NOT NULL DEFAULT 'running',
  context jsonb NOT NULL DEFAULT '{}'::jsonb,
  started_by uuid,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.workflow_instances TO authenticated;
GRANT ALL ON public.workflow_instances TO service_role;
ALTER TABLE public.workflow_instances ENABLE ROW LEVEL SECURITY;
CREATE POLICY wi_all ON public.workflow_instances FOR ALL TO authenticated
  USING (company_id = get_user_company_id(auth.uid()))
  WITH CHECK (company_id = get_user_company_id(auth.uid()));

CREATE TABLE public.workflow_transitions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  instance_id uuid NOT NULL REFERENCES public.workflow_instances(id) ON DELETE CASCADE,
  from_step text,
  to_step text NOT NULL,
  actor_id uuid,
  comment text,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.workflow_transitions TO authenticated;
GRANT ALL ON public.workflow_transitions TO service_role;
ALTER TABLE public.workflow_transitions ENABLE ROW LEVEL SECURITY;
CREATE POLICY wt_select ON public.workflow_transitions FOR SELECT TO authenticated
  USING (company_id = get_user_company_id(auth.uid()));
CREATE POLICY wt_insert ON public.workflow_transitions FOR INSERT TO authenticated
  WITH CHECK (company_id = get_user_company_id(auth.uid()));

-- ============ AUTOMATION ENGINE ============
CREATE TABLE public.automation_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  name text NOT NULL,
  description text,
  trigger_event text NOT NULL,
  conditions jsonb NOT NULL DEFAULT '[]'::jsonb,
  actions jsonb NOT NULL DEFAULT '[]'::jsonb,
  is_active boolean NOT NULL DEFAULT true,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.automation_rules TO authenticated;
GRANT ALL ON public.automation_rules TO service_role;
ALTER TABLE public.automation_rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY ar_select ON public.automation_rules FOR SELECT TO authenticated
  USING (company_id = get_user_company_id(auth.uid()));
CREATE POLICY ar_write ON public.automation_rules FOR ALL TO authenticated
  USING (company_id = get_user_company_id(auth.uid())
    AND (has_role(auth.uid(), 'admin', company_id) OR has_role(auth.uid(), 'manager', company_id)))
  WITH CHECK (company_id = get_user_company_id(auth.uid())
    AND (has_role(auth.uid(), 'admin', company_id) OR has_role(auth.uid(), 'manager', company_id)));

CREATE TABLE public.automation_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  rule_id uuid NOT NULL REFERENCES public.automation_rules(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'success',
  input jsonb NOT NULL DEFAULT '{}'::jsonb,
  output jsonb NOT NULL DEFAULT '{}'::jsonb,
  error text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.automation_runs TO authenticated;
GRANT ALL ON public.automation_runs TO service_role;
ALTER TABLE public.automation_runs ENABLE ROW LEVEL SECURITY;
CREATE POLICY aru_select ON public.automation_runs FOR SELECT TO authenticated
  USING (company_id = get_user_company_id(auth.uid()));
CREATE POLICY aru_insert ON public.automation_runs FOR INSERT TO authenticated
  WITH CHECK (company_id = get_user_company_id(auth.uid()));

-- ============ DASHBOARD ENGINE ============
CREATE TABLE public.dashboard_definitions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  name text NOT NULL,
  description text,
  layout jsonb NOT NULL DEFAULT '{}'::jsonb,
  role_scope text[],
  is_default boolean NOT NULL DEFAULT false,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.dashboard_definitions TO authenticated;
GRANT ALL ON public.dashboard_definitions TO service_role;
ALTER TABLE public.dashboard_definitions ENABLE ROW LEVEL SECURITY;
CREATE POLICY dd_select ON public.dashboard_definitions FOR SELECT TO authenticated
  USING (company_id = get_user_company_id(auth.uid()));
CREATE POLICY dd_write ON public.dashboard_definitions FOR ALL TO authenticated
  USING (company_id = get_user_company_id(auth.uid())
    AND (has_role(auth.uid(), 'admin', company_id) OR has_role(auth.uid(), 'manager', company_id)))
  WITH CHECK (company_id = get_user_company_id(auth.uid())
    AND (has_role(auth.uid(), 'admin', company_id) OR has_role(auth.uid(), 'manager', company_id)));

CREATE TABLE public.dashboard_widgets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  dashboard_id uuid NOT NULL REFERENCES public.dashboard_definitions(id) ON DELETE CASCADE,
  widget_type text NOT NULL,
  title text NOT NULL,
  data_source text NOT NULL,
  config jsonb NOT NULL DEFAULT '{}'::jsonb,
  position jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.dashboard_widgets TO authenticated;
GRANT ALL ON public.dashboard_widgets TO service_role;
ALTER TABLE public.dashboard_widgets ENABLE ROW LEVEL SECURITY;
CREATE POLICY dw_select ON public.dashboard_widgets FOR SELECT TO authenticated
  USING (company_id = get_user_company_id(auth.uid()));
CREATE POLICY dw_write ON public.dashboard_widgets FOR ALL TO authenticated
  USING (company_id = get_user_company_id(auth.uid())
    AND (has_role(auth.uid(), 'admin', company_id) OR has_role(auth.uid(), 'manager', company_id)))
  WITH CHECK (company_id = get_user_company_id(auth.uid())
    AND (has_role(auth.uid(), 'admin', company_id) OR has_role(auth.uid(), 'manager', company_id)));

-- ============ METADATA ENGINE EXPANSION ============
-- Relacionamentos entre entidades customizadas
CREATE TABLE public.custom_relationships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  from_entity_id uuid NOT NULL REFERENCES public.custom_entities(id) ON DELETE CASCADE,
  to_entity_id uuid NOT NULL REFERENCES public.custom_entities(id) ON DELETE CASCADE,
  relationship_type text NOT NULL DEFAULT 'one_to_many',
  from_field text NOT NULL,
  to_field text NOT NULL,
  cascade_delete boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.custom_relationships TO authenticated;
GRANT ALL ON public.custom_relationships TO service_role;
ALTER TABLE public.custom_relationships ENABLE ROW LEVEL SECURITY;
CREATE POLICY cr_select ON public.custom_relationships FOR SELECT TO authenticated
  USING (company_id = get_user_company_id(auth.uid()));
CREATE POLICY cr_write ON public.custom_relationships FOR ALL TO authenticated
  USING (company_id = get_user_company_id(auth.uid())
    AND (has_role(auth.uid(), 'admin', company_id) OR has_role(auth.uid(), 'manager', company_id)))
  WITH CHECK (company_id = get_user_company_id(auth.uid())
    AND (has_role(auth.uid(), 'admin', company_id) OR has_role(auth.uid(), 'manager', company_id)));

-- Índices essenciais
CREATE INDEX idx_wd_company ON public.workflow_definitions(company_id);
CREATE INDEX idx_wi_company ON public.workflow_instances(company_id);
CREATE INDEX idx_wi_def ON public.workflow_instances(definition_id);
CREATE INDEX idx_wt_instance ON public.workflow_transitions(instance_id);
CREATE INDEX idx_ar_company ON public.automation_rules(company_id);
CREATE INDEX idx_ar_event ON public.automation_rules(trigger_event) WHERE is_active = true;
CREATE INDEX idx_aru_rule ON public.automation_runs(rule_id);
CREATE INDEX idx_dd_company ON public.dashboard_definitions(company_id);
CREATE INDEX idx_dw_dash ON public.dashboard_widgets(dashboard_id);
CREATE INDEX idx_cr_from ON public.custom_relationships(from_entity_id);
CREATE INDEX idx_cr_to ON public.custom_relationships(to_entity_id);

-- Triggers updated_at
CREATE TRIGGER tg_wd_updated BEFORE UPDATE ON public.workflow_definitions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER tg_wi_updated BEFORE UPDATE ON public.workflow_instances
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER tg_ar_updated BEFORE UPDATE ON public.automation_rules
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER tg_dd_updated BEFORE UPDATE ON public.dashboard_definitions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER tg_dw_updated BEFORE UPDATE ON public.dashboard_widgets
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER tg_cr_updated BEFORE UPDATE ON public.custom_relationships
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

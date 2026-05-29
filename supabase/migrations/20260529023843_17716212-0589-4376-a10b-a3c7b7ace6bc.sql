
-- ============================================
-- CÉREBRO NATIVO DO ERP — Núcleo de IA próprio
-- ============================================

-- 1) Memória persistente de longo prazo
CREATE TABLE public.ai_brain_memory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  scope TEXT NOT NULL DEFAULT 'global', -- 'global' | 'user' | 'company'
  category TEXT NOT NULL, -- 'fact' | 'preference' | 'pattern' | 'rule' | 'context'
  key TEXT NOT NULL,
  value JSONB NOT NULL,
  importance INT NOT NULL DEFAULT 5, -- 1..10
  source TEXT, -- 'user' | 'observation' | 'decision' | 'agent:<name>'
  embedding_summary TEXT, -- texto curto resumido para retrieval
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (scope, user_id, key)
);

CREATE INDEX idx_brain_memory_user ON public.ai_brain_memory(user_id, importance DESC);
CREATE INDEX idx_brain_memory_category ON public.ai_brain_memory(category, importance DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_brain_memory TO authenticated;
GRANT ALL ON public.ai_brain_memory TO service_role;

ALTER TABLE public.ai_brain_memory ENABLE ROW LEVEL SECURITY;

CREATE POLICY "brain_memory_select_authenticated" ON public.ai_brain_memory
  FOR SELECT TO authenticated
  USING (scope = 'global' OR user_id = auth.uid() OR scope = 'company');

CREATE POLICY "brain_memory_insert_authenticated" ON public.ai_brain_memory
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() OR scope IN ('global','company'));

CREATE POLICY "brain_memory_update_authenticated" ON public.ai_brain_memory
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid() OR scope IN ('global','company'));

CREATE POLICY "brain_memory_delete_authenticated" ON public.ai_brain_memory
  FOR DELETE TO authenticated
  USING (user_id = auth.uid() OR scope IN ('global','company'));

-- 2) Decisões geradas pelo cérebro (pending/approved/rejected/executed)
CREATE TABLE public.ai_brain_decisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id UUID,
  user_id UUID,
  module TEXT NOT NULL, -- 'financeiro' | 'comercial' | 'producao' | 'fiscal' | 'estoque' | 'global'
  decision_type TEXT NOT NULL, -- 'alert' | 'recommendation' | 'action' | 'automation'
  title TEXT NOT NULL,
  rationale TEXT NOT NULL,
  impact_level TEXT NOT NULL DEFAULT 'medium', -- low | medium | high | critical
  risk_level TEXT NOT NULL DEFAULT 'low',      -- low | medium | high
  confidence NUMERIC NOT NULL DEFAULT 0.7,     -- 0..1
  evidence JSONB NOT NULL DEFAULT '{}'::jsonb,
  proposed_action JSONB NOT NULL DEFAULT '{}'::jsonb, -- { tool, params }
  status TEXT NOT NULL DEFAULT 'pending', -- pending|approved|rejected|executed|expired|auto_executed
  auto_executable BOOLEAN NOT NULL DEFAULT false,
  requires_approval BOOLEAN NOT NULL DEFAULT true,
  execution_result JSONB,
  executed_at TIMESTAMPTZ,
  approved_by UUID,
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_brain_decisions_status ON public.ai_brain_decisions(status, created_at DESC);
CREATE INDEX idx_brain_decisions_module ON public.ai_brain_decisions(module, status);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_brain_decisions TO authenticated;
GRANT ALL ON public.ai_brain_decisions TO service_role;

ALTER TABLE public.ai_brain_decisions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "brain_decisions_all_authenticated" ON public.ai_brain_decisions
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

-- 3) Runs (logs de cada execução do cérebro)
CREATE TABLE public.ai_brain_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  trigger TEXT NOT NULL, -- 'manual' | 'cron' | 'event' | 'chat'
  mode TEXT NOT NULL DEFAULT 'analyze', -- 'analyze' | 'autopilot' | 'chat'
  input JSONB,
  agents_used TEXT[] NOT NULL DEFAULT '{}',
  synthesis TEXT,
  structured JSONB,
  decisions_count INT NOT NULL DEFAULT 0,
  duration_ms INT,
  status TEXT NOT NULL DEFAULT 'running', -- running|completed|failed
  error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_brain_runs_user ON public.ai_brain_runs(user_id, created_at DESC);

GRANT SELECT, INSERT, UPDATE ON public.ai_brain_runs TO authenticated;
GRANT ALL ON public.ai_brain_runs TO service_role;

ALTER TABLE public.ai_brain_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "brain_runs_all_authenticated" ON public.ai_brain_runs
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

-- Trigger updated_at
CREATE TRIGGER tg_brain_memory_updated
  BEFORE UPDATE ON public.ai_brain_memory
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER tg_brain_decisions_updated
  BEFORE UPDATE ON public.ai_brain_decisions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

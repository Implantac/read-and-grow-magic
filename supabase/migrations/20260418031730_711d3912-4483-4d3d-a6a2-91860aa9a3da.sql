
-- ============================================
-- 1) PERFIS DE RISCO POR ENTIDADE
-- ============================================
CREATE TABLE IF NOT EXISTS public.financial_risk_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type text NOT NULL CHECK (entity_type IN ('client','supplier','bank_account','user','external')),
  entity_id uuid,
  entity_label text,
  risk_score int NOT NULL DEFAULT 0 CHECK (risk_score BETWEEN 0 AND 100),
  risk_level text NOT NULL DEFAULT 'low' CHECK (risk_level IN ('low','medium','high','critical')),
  total_transactions int NOT NULL DEFAULT 0,
  total_volume numeric NOT NULL DEFAULT 0,
  avg_ticket numeric NOT NULL DEFAULT 0,
  max_ticket numeric NOT NULL DEFAULT 0,
  anomalies_count int NOT NULL DEFAULT 0,
  blocked_count int NOT NULL DEFAULT 0,
  last_anomaly_at timestamptz,
  last_transaction_at timestamptz,
  behavior_signature jsonb DEFAULT '{}'::jsonb,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(entity_type, entity_id)
);
CREATE INDEX IF NOT EXISTS idx_risk_profiles_level ON public.financial_risk_profiles(risk_level);
CREATE INDEX IF NOT EXISTS idx_risk_profiles_entity ON public.financial_risk_profiles(entity_type, entity_id);

-- ============================================
-- 2) LOGS DE SEGURANÇA FINANCEIRA
-- ============================================
CREATE TABLE IF NOT EXISTS public.financial_security_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type text NOT NULL,
  severity text NOT NULL DEFAULT 'low' CHECK (severity IN ('low','medium','high','critical')),
  category text NOT NULL DEFAULT 'antifraud',
  title text NOT NULL,
  description text,
  entity_type text,
  entity_id uuid,
  source_ip text,
  user_agent text,
  user_id uuid,
  reference_table text,
  reference_id uuid,
  amount numeric,
  risk_score int,
  decision text CHECK (decision IN ('allow','review','block','log')),
  details jsonb DEFAULT '{}'::jsonb,
  resolved boolean NOT NULL DEFAULT false,
  resolved_at timestamptz,
  resolved_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_sec_logs_created ON public.financial_security_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sec_logs_severity ON public.financial_security_logs(severity);
CREATE INDEX IF NOT EXISTS idx_sec_logs_unresolved ON public.financial_security_logs(resolved) WHERE resolved = false;

-- ============================================
-- 3) REGRAS ANTIFRAUDE
-- ============================================
CREATE TABLE IF NOT EXISTS public.financial_fraud_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_key text UNIQUE NOT NULL,
  name text NOT NULL,
  description text,
  enabled boolean NOT NULL DEFAULT true,
  severity text NOT NULL DEFAULT 'medium',
  threshold numeric,
  window_minutes int,
  action text NOT NULL DEFAULT 'log' CHECK (action IN ('log','review','block')),
  config jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO public.financial_fraud_rules (rule_key, name, description, severity, threshold, window_minutes, action) VALUES
  ('max_single_transaction', 'Limite por transação', 'Bloqueia transações acima do limite configurado', 'high', 100000, NULL, 'review'),
  ('velocity_check', 'Velocidade de transações', 'Detecta múltiplas transações em curto período', 'medium', 10, 5, 'review'),
  ('off_hours_high_value', 'Alto valor fora de horário comercial', 'Sinaliza transações > R$ 50k entre 22h e 6h', 'medium', 50000, NULL, 'log'),
  ('duplicate_amount_window', 'Possível duplicidade', 'Mesmo valor + mesma entidade em janela curta', 'high', 0, 10, 'review'),
  ('anomalous_ticket', 'Ticket anômalo vs histórico', 'Valor 5x maior que ticket médio da entidade', 'medium', 5, NULL, 'log')
ON CONFLICT (rule_key) DO NOTHING;

-- ============================================
-- 4) FUNÇÃO: AVALIAR RISCO DE TRANSAÇÃO
-- ============================================
CREATE OR REPLACE FUNCTION public.evaluate_transaction_risk(
  _amount numeric,
  _entity_type text DEFAULT NULL,
  _entity_id uuid DEFAULT NULL,
  _source text DEFAULT NULL,
  _payment_method text DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_score int := 0;
  v_decision text := 'allow';
  v_reasons jsonb := '[]'::jsonb;
  v_profile record;
  v_rule record;
  v_velocity int;
  v_duplicates int;
  v_hour int;
BEGIN
  v_hour := EXTRACT(HOUR FROM now());

  -- Perfil histórico
  SELECT * INTO v_profile FROM financial_risk_profiles
   WHERE entity_type = _entity_type AND entity_id = _entity_id;

  -- Regra: limite por transação
  SELECT * INTO v_rule FROM financial_fraud_rules WHERE rule_key='max_single_transaction' AND enabled;
  IF FOUND AND _amount >= v_rule.threshold THEN
    v_score := v_score + 30;
    v_reasons := v_reasons || jsonb_build_object('rule','max_single_transaction','amount',_amount,'threshold',v_rule.threshold);
    IF v_rule.action = 'block' THEN v_decision := 'block';
    ELSIF v_rule.action = 'review' AND v_decision <> 'block' THEN v_decision := 'review'; END IF;
  END IF;

  -- Regra: velocidade
  SELECT * INTO v_rule FROM financial_fraud_rules WHERE rule_key='velocity_check' AND enabled;
  IF FOUND AND _entity_id IS NOT NULL THEN
    SELECT count(*) INTO v_velocity FROM financial_ledger
     WHERE created_at >= now() - (v_rule.window_minutes || ' minutes')::interval
       AND (source = _source OR _source IS NULL);
    IF v_velocity >= v_rule.threshold THEN
      v_score := v_score + 25;
      v_reasons := v_reasons || jsonb_build_object('rule','velocity_check','count',v_velocity);
      IF v_rule.action = 'review' AND v_decision = 'allow' THEN v_decision := 'review'; END IF;
    END IF;
  END IF;

  -- Regra: duplicidade
  SELECT * INTO v_rule FROM financial_fraud_rules WHERE rule_key='duplicate_amount_window' AND enabled;
  IF FOUND THEN
    SELECT count(*) INTO v_duplicates FROM financial_ledger
     WHERE abs(amount - _amount) < 0.01
       AND created_at >= now() - (v_rule.window_minutes || ' minutes')::interval;
    IF v_duplicates >= 1 THEN
      v_score := v_score + 35;
      v_reasons := v_reasons || jsonb_build_object('rule','duplicate_amount_window','count',v_duplicates);
      IF v_rule.action = 'block' THEN v_decision := 'block';
      ELSIF v_decision = 'allow' THEN v_decision := 'review'; END IF;
    END IF;
  END IF;

  -- Regra: horário atípico
  SELECT * INTO v_rule FROM financial_fraud_rules WHERE rule_key='off_hours_high_value' AND enabled;
  IF FOUND AND _amount >= v_rule.threshold AND (v_hour >= 22 OR v_hour < 6) THEN
    v_score := v_score + 15;
    v_reasons := v_reasons || jsonb_build_object('rule','off_hours_high_value','hour',v_hour);
  END IF;

  -- Regra: ticket anômalo
  SELECT * INTO v_rule FROM financial_fraud_rules WHERE rule_key='anomalous_ticket' AND enabled;
  IF FOUND AND v_profile.avg_ticket > 0 AND _amount >= v_profile.avg_ticket * v_rule.threshold THEN
    v_score := v_score + 20;
    v_reasons := v_reasons || jsonb_build_object('rule','anomalous_ticket','ticket',_amount,'avg',v_profile.avg_ticket);
  END IF;

  -- Histórico de risco da entidade
  IF v_profile.risk_score IS NOT NULL THEN
    v_score := v_score + (v_profile.risk_score / 4);
    IF v_profile.risk_level = 'critical' AND v_decision = 'allow' THEN v_decision := 'review'; END IF;
  END IF;

  v_score := LEAST(v_score, 100);

  RETURN jsonb_build_object(
    'score', v_score,
    'decision', v_decision,
    'level', CASE WHEN v_score >= 75 THEN 'critical' WHEN v_score >= 50 THEN 'high' WHEN v_score >= 25 THEN 'medium' ELSE 'low' END,
    'reasons', v_reasons,
    'evaluated_at', now()
  );
END; $$;

-- ============================================
-- 5) FUNÇÃO: ATUALIZAR PERFIL DE RISCO
-- ============================================
CREATE OR REPLACE FUNCTION public.update_entity_risk_profile(
  _entity_type text,
  _entity_id uuid,
  _entity_label text,
  _amount numeric,
  _is_anomaly boolean DEFAULT false
) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_total int;
  v_volume numeric;
  v_avg numeric;
  v_max numeric;
  v_anom int;
  v_score int;
  v_level text;
BEGIN
  IF _entity_id IS NULL THEN RETURN; END IF;

  INSERT INTO financial_risk_profiles (entity_type, entity_id, entity_label, total_transactions, total_volume, avg_ticket, max_ticket, anomalies_count, last_transaction_at)
  VALUES (_entity_type, _entity_id, _entity_label, 1, _amount, _amount, _amount, CASE WHEN _is_anomaly THEN 1 ELSE 0 END, now())
  ON CONFLICT (entity_type, entity_id) DO UPDATE SET
    total_transactions = financial_risk_profiles.total_transactions + 1,
    total_volume = financial_risk_profiles.total_volume + _amount,
    avg_ticket = (financial_risk_profiles.total_volume + _amount) / (financial_risk_profiles.total_transactions + 1),
    max_ticket = GREATEST(financial_risk_profiles.max_ticket, _amount),
    anomalies_count = financial_risk_profiles.anomalies_count + CASE WHEN _is_anomaly THEN 1 ELSE 0 END,
    last_anomaly_at = CASE WHEN _is_anomaly THEN now() ELSE financial_risk_profiles.last_anomaly_at END,
    last_transaction_at = now(),
    entity_label = COALESCE(_entity_label, financial_risk_profiles.entity_label),
    updated_at = now();

  -- Recalcular score
  SELECT total_transactions, anomalies_count INTO v_total, v_anom
    FROM financial_risk_profiles WHERE entity_type=_entity_type AND entity_id=_entity_id;

  v_score := LEAST(100, COALESCE((v_anom::numeric / NULLIF(v_total,0)) * 200, 0)::int);
  v_level := CASE WHEN v_score >= 75 THEN 'critical' WHEN v_score >= 50 THEN 'high' WHEN v_score >= 25 THEN 'medium' ELSE 'low' END;

  UPDATE financial_risk_profiles SET risk_score = v_score, risk_level = v_level, updated_at = now()
   WHERE entity_type=_entity_type AND entity_id=_entity_id;
END; $$;

-- ============================================
-- 6) TRIGGER: AVALIAR LEDGER ANTES DE INSERIR
-- ============================================
CREATE OR REPLACE FUNCTION public.fraud_check_ledger_insert()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_eval jsonb;
  v_entity_id uuid;
  v_entity_type text;
  v_label text;
  v_anomaly boolean := false;
BEGIN
  -- Identificar entidade pela origem
  IF NEW.source = 'receivable' THEN
    SELECT client_id, client_name INTO v_entity_id, v_label
      FROM accounts_receivable WHERE id = NEW.source_id;
    v_entity_type := 'client';
  ELSIF NEW.source = 'payable' THEN
    v_entity_type := 'supplier';
    SELECT supplier INTO v_label FROM accounts_payable WHERE id = NEW.source_id;
  ELSIF NEW.source = 'pix' THEN
    v_entity_type := 'external';
    v_label := 'PIX';
  END IF;

  v_eval := evaluate_transaction_risk(NEW.amount, v_entity_type, v_entity_id, NEW.source, NEW.payment_method);

  IF (v_eval->>'score')::int >= 50 THEN
    v_anomaly := true;
    INSERT INTO financial_security_logs (
      event_type, severity, category, title, description,
      entity_type, entity_id, reference_table, reference_id,
      amount, risk_score, decision, details
    ) VALUES (
      'transaction_evaluated', v_eval->>'level', 'antifraud',
      'Transação de risco detectada — R$ ' || NEW.amount,
      COALESCE(v_label,'') || ' · ' || COALESCE(NEW.description,''),
      v_entity_type, v_entity_id, 'financial_ledger', NEW.id,
      NEW.amount, (v_eval->>'score')::int, v_eval->>'decision', v_eval
    );
  END IF;

  -- Atualizar perfil (assíncrono lógico — após gravação)
  PERFORM update_entity_risk_profile(v_entity_type, v_entity_id, v_label, NEW.amount, v_anomaly);

  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS trg_fraud_check_ledger ON public.financial_ledger;
CREATE TRIGGER trg_fraud_check_ledger
AFTER INSERT ON public.financial_ledger
FOR EACH ROW EXECUTE FUNCTION public.fraud_check_ledger_insert();

-- ============================================
-- 7) RLS — somente admins
-- ============================================
ALTER TABLE public.financial_risk_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_security_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_fraud_rules    ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admins read risk profiles" ON public.financial_risk_profiles;
CREATE POLICY "admins read risk profiles" ON public.financial_risk_profiles
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "admins read security logs" ON public.financial_security_logs;
CREATE POLICY "admins read security logs" ON public.financial_security_logs
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
DROP POLICY IF EXISTS "admins update security logs" ON public.financial_security_logs;
CREATE POLICY "admins update security logs" ON public.financial_security_logs
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "admins manage fraud rules" ON public.financial_fraud_rules;
CREATE POLICY "admins manage fraud rules" ON public.financial_fraud_rules
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

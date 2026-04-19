-- ============================================================
-- FASE 2: Cobrança automática, Recorrência, Inadimplência
-- ============================================================

-- 1) RÉGUA DE COBRANÇA - REGRAS CONFIGURÁVEIS
CREATE TABLE IF NOT EXISTS public.financial_charges_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  trigger_type text NOT NULL CHECK (trigger_type IN ('before_due','on_due','after_due')),
  days_offset integer NOT NULL DEFAULT 0,
  severity text NOT NULL DEFAULT 'info' CHECK (severity IN ('info','warning','critical')),
  channel text NOT NULL DEFAULT 'in_app' CHECK (channel IN ('in_app','email','whatsapp','log_only')),
  message_template text NOT NULL DEFAULT 'Você tem um título com vencimento próximo.',
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.financial_charges_rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth read charges rules" ON public.financial_charges_rules FOR SELECT TO authenticated USING (true);
CREATE POLICY "admin manage charges rules" ON public.financial_charges_rules FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- 2) LOG DE COBRANÇAS DISPARADAS
CREATE TABLE IF NOT EXISTS public.financial_charges_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  receivable_id uuid REFERENCES public.accounts_receivable(id) ON DELETE CASCADE,
  client_id uuid,
  client_name text,
  rule_id uuid REFERENCES public.financial_charges_rules(id),
  trigger_type text NOT NULL,
  channel text NOT NULL,
  severity text NOT NULL DEFAULT 'info',
  amount numeric NOT NULL DEFAULT 0,
  due_date date,
  days_until_due integer,
  message text NOT NULL,
  status text NOT NULL DEFAULT 'queued' CHECK (status IN ('queued','sent','failed','skipped')),
  sent_at timestamptz,
  error text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_charges_log_receivable ON public.financial_charges_log(receivable_id);
CREATE INDEX IF NOT EXISTS idx_charges_log_client ON public.financial_charges_log(client_id);
CREATE INDEX IF NOT EXISTS idx_charges_log_created ON public.financial_charges_log(created_at DESC);

ALTER TABLE public.financial_charges_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth read charges log" ON public.financial_charges_log FOR SELECT TO authenticated USING (true);
CREATE POLICY "admin manage charges log" ON public.financial_charges_log FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- 3) RECORRÊNCIA FINANCEIRA
CREATE TABLE IF NOT EXISTS public.financial_recurring (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind text NOT NULL CHECK (kind IN ('receivable','payable')),
  description text NOT NULL,
  party_name text NOT NULL,
  client_id uuid,
  supplier_id uuid,
  category_id uuid,
  bank_account_id uuid,
  amount numeric NOT NULL DEFAULT 0,
  frequency text NOT NULL DEFAULT 'monthly' CHECK (frequency IN ('weekly','biweekly','monthly','bimonthly','quarterly','semiannual','annual')),
  day_of_month integer,
  start_date date NOT NULL DEFAULT CURRENT_DATE,
  end_date date,
  next_run_date date NOT NULL DEFAULT CURRENT_DATE,
  occurrences_generated integer NOT NULL DEFAULT 0,
  max_occurrences integer,
  adjustment_index text,
  adjustment_percent numeric DEFAULT 0,
  last_adjustment_at date,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','paused','cancelled','finished')),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid
);

CREATE INDEX IF NOT EXISTS idx_recurring_next_run ON public.financial_recurring(next_run_date) WHERE status='active';
CREATE INDEX IF NOT EXISTS idx_recurring_status ON public.financial_recurring(status);

ALTER TABLE public.financial_recurring ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth read recurring" ON public.financial_recurring FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth insert recurring" ON public.financial_recurring FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth update recurring" ON public.financial_recurring FOR UPDATE TO authenticated USING (true);
CREATE POLICY "admin delete recurring" ON public.financial_recurring FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(),'admin'));

CREATE TRIGGER trg_recurring_updated BEFORE UPDATE ON public.financial_recurring
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 4) SCORE DE INADIMPLÊNCIA POR CLIENTE
CREATE TABLE IF NOT EXISTS public.financial_default_score (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL UNIQUE,
  client_name text,
  overdue_count integer NOT NULL DEFAULT 0,
  overdue_amount numeric NOT NULL DEFAULT 0,
  avg_delay_days numeric NOT NULL DEFAULT 0,
  max_delay_days integer NOT NULL DEFAULT 0,
  total_billed numeric NOT NULL DEFAULT 0,
  total_paid_on_time numeric NOT NULL DEFAULT 0,
  score_numeric integer NOT NULL DEFAULT 0,
  risk_level text NOT NULL DEFAULT 'low' CHECK (risk_level IN ('low','medium','high','critical')),
  last_payment_date date,
  computed_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_default_score_risk ON public.financial_default_score(risk_level);

ALTER TABLE public.financial_default_score ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth read default score" ON public.financial_default_score FOR SELECT TO authenticated USING (true);
CREATE POLICY "admin manage default score" ON public.financial_default_score FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- ============================================================
-- 5) RPC: process_charges_ruler
-- Percorre regras ativas e cria entradas no charges_log para títulos elegíveis.
-- ============================================================
CREATE OR REPLACE FUNCTION public.process_charges_ruler()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  r_rule RECORD;
  r_recv RECORD;
  v_target_date date;
  v_inserted int := 0;
  v_msg text;
BEGIN
  FOR r_rule IN SELECT * FROM public.financial_charges_rules WHERE active = true LOOP
    -- target_date depende do tipo
    IF r_rule.trigger_type = 'before_due' THEN
      v_target_date := CURRENT_DATE + r_rule.days_offset;
    ELSIF r_rule.trigger_type = 'on_due' THEN
      v_target_date := CURRENT_DATE;
    ELSE -- after_due
      v_target_date := CURRENT_DATE - r_rule.days_offset;
    END IF;

    FOR r_recv IN
      SELECT ar.id, ar.client_id, ar.client_name, ar.amount, ar.open_amount, ar.due_date, ar.description
        FROM public.accounts_receivable ar
       WHERE ar.due_date = v_target_date
         AND ar.status IN ('pending','partial','overdue')
         AND COALESCE(ar.open_amount, ar.amount) > 0
         AND NOT EXISTS (
           SELECT 1 FROM public.financial_charges_log cl
            WHERE cl.receivable_id = ar.id
              AND cl.rule_id = r_rule.id
              AND cl.created_at::date = CURRENT_DATE
         )
    LOOP
      v_msg := replace(replace(replace(r_rule.message_template,
        '{cliente}', COALESCE(r_recv.client_name,'')),
        '{valor}', to_char(COALESCE(r_recv.open_amount,r_recv.amount), 'FM999G999G990D00')),
        '{vencimento}', to_char(r_recv.due_date,'DD/MM/YYYY'));

      INSERT INTO public.financial_charges_log
        (receivable_id, client_id, client_name, rule_id, trigger_type, channel, severity,
         amount, due_date, days_until_due, message, status)
      VALUES
        (r_recv.id, r_recv.client_id, r_recv.client_name, r_rule.id, r_rule.trigger_type,
         r_rule.channel, r_rule.severity,
         COALESCE(r_recv.open_amount, r_recv.amount), r_recv.due_date,
         (r_recv.due_date - CURRENT_DATE), v_msg,
         CASE WHEN r_rule.channel = 'log_only' THEN 'sent' ELSE 'queued' END);
      v_inserted := v_inserted + 1;
    END LOOP;
  END LOOP;

  RETURN jsonb_build_object('ok', true, 'inserted', v_inserted, 'executed_at', now());
END;
$$;

-- ============================================================
-- 6) RPC: recompute_default_scores
-- ============================================================
CREATE OR REPLACE FUNCTION public.recompute_default_scores()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  r RECORD;
  v_score int;
  v_level text;
  v_count int := 0;
BEGIN
  FOR r IN
    SELECT
      ar.client_id,
      MAX(ar.client_name) AS client_name,
      COUNT(*) FILTER (WHERE ar.status IN ('overdue') OR (ar.status IN ('pending','partial') AND ar.due_date < CURRENT_DATE)) AS overdue_count,
      COALESCE(SUM(ar.open_amount) FILTER (WHERE ar.status IN ('overdue') OR (ar.status IN ('pending','partial') AND ar.due_date < CURRENT_DATE)),0) AS overdue_amount,
      COALESCE(AVG(GREATEST(CURRENT_DATE - ar.due_date,0))
        FILTER (WHERE ar.status IN ('overdue') OR (ar.status IN ('pending','partial') AND ar.due_date < CURRENT_DATE)),0) AS avg_delay,
      COALESCE(MAX(GREATEST(CURRENT_DATE - ar.due_date,0))
        FILTER (WHERE ar.status IN ('overdue') OR (ar.status IN ('pending','partial') AND ar.due_date < CURRENT_DATE)),0) AS max_delay,
      COALESCE(SUM(ar.amount),0) AS total_billed,
      COALESCE(SUM(ar.paid_amount) FILTER (WHERE ar.status='paid' AND ar.payment_date <= ar.due_date),0) AS paid_on_time,
      MAX(ar.payment_date) AS last_payment_date
    FROM public.accounts_receivable ar
    WHERE ar.client_id IS NOT NULL
    GROUP BY ar.client_id
  LOOP
    v_score := LEAST(100, (r.overdue_count * 10 + LEAST(r.avg_delay,60)::int + (r.overdue_amount/NULLIF(r.total_billed,0)*50)::int));
    IF v_score IS NULL THEN v_score := 0; END IF;
    v_level := CASE
      WHEN v_score >= 75 THEN 'critical'
      WHEN v_score >= 50 THEN 'high'
      WHEN v_score >= 25 THEN 'medium'
      ELSE 'low'
    END;

    INSERT INTO public.financial_default_score
      (client_id, client_name, overdue_count, overdue_amount, avg_delay_days, max_delay_days,
       total_billed, total_paid_on_time, score_numeric, risk_level, last_payment_date, computed_at)
    VALUES
      (r.client_id, r.client_name, r.overdue_count, r.overdue_amount, r.avg_delay, r.max_delay::int,
       r.total_billed, r.paid_on_time, v_score, v_level, r.last_payment_date, now())
    ON CONFLICT (client_id) DO UPDATE SET
      client_name = EXCLUDED.client_name,
      overdue_count = EXCLUDED.overdue_count,
      overdue_amount = EXCLUDED.overdue_amount,
      avg_delay_days = EXCLUDED.avg_delay_days,
      max_delay_days = EXCLUDED.max_delay_days,
      total_billed = EXCLUDED.total_billed,
      total_paid_on_time = EXCLUDED.total_paid_on_time,
      score_numeric = EXCLUDED.score_numeric,
      risk_level = EXCLUDED.risk_level,
      last_payment_date = EXCLUDED.last_payment_date,
      computed_at = now(),
      updated_at = now();
    v_count := v_count + 1;
  END LOOP;

  RETURN jsonb_build_object('ok', true, 'clients_scored', v_count, 'executed_at', now());
END;
$$;

-- ============================================================
-- 7) RPC: generate_recurring_entries
-- Gera contas a partir de recorrências ativas vencidas.
-- ============================================================
CREATE OR REPLACE FUNCTION public.generate_recurring_entries()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  r RECORD;
  v_amount numeric;
  v_next date;
  v_created int := 0;
BEGIN
  FOR r IN
    SELECT * FROM public.financial_recurring
     WHERE status='active' AND next_run_date <= CURRENT_DATE
       AND (end_date IS NULL OR next_run_date <= end_date)
       AND (max_occurrences IS NULL OR occurrences_generated < max_occurrences)
  LOOP
    -- Aplicar reajuste se aniversário anual e adjustment_percent > 0
    v_amount := r.amount;
    IF COALESCE(r.adjustment_percent,0) <> 0
       AND (r.last_adjustment_at IS NULL OR r.last_adjustment_at <= CURRENT_DATE - INTERVAL '1 year') THEN
      v_amount := round(r.amount * (1 + r.adjustment_percent/100.0), 2);
      UPDATE public.financial_recurring
         SET amount = v_amount, last_adjustment_at = CURRENT_DATE
       WHERE id = r.id;
    END IF;

    IF r.kind = 'receivable' THEN
      INSERT INTO public.accounts_receivable
        (description, client_name, client_id, category, category_id, amount, due_date, status,
         source_type, source_id, bank_account_id, notes)
      VALUES
        (r.description, r.party_name, r.client_id, 'Recorrente', r.category_id, v_amount, r.next_run_date, 'pending',
         'recurring', r.id, r.bank_account_id, COALESCE(r.notes,'Gerado automaticamente'));
    ELSE
      INSERT INTO public.accounts_payable
        (description, supplier, category, category_id, amount, due_date, status,
         source_type, source_id, bank_account_id, notes)
      VALUES
        (r.description, r.party_name, 'Recorrente', r.category_id, v_amount, r.next_run_date, 'pending',
         'recurring', r.id, r.bank_account_id, COALESCE(r.notes,'Gerado automaticamente'));
    END IF;

    -- Calcular próxima data
    v_next := CASE r.frequency
      WHEN 'weekly' THEN r.next_run_date + INTERVAL '7 days'
      WHEN 'biweekly' THEN r.next_run_date + INTERVAL '14 days'
      WHEN 'monthly' THEN r.next_run_date + INTERVAL '1 month'
      WHEN 'bimonthly' THEN r.next_run_date + INTERVAL '2 months'
      WHEN 'quarterly' THEN r.next_run_date + INTERVAL '3 months'
      WHEN 'semiannual' THEN r.next_run_date + INTERVAL '6 months'
      WHEN 'annual' THEN r.next_run_date + INTERVAL '1 year'
    END::date;

    UPDATE public.financial_recurring
       SET next_run_date = v_next,
           occurrences_generated = occurrences_generated + 1,
           status = CASE
             WHEN max_occurrences IS NOT NULL AND occurrences_generated + 1 >= max_occurrences THEN 'finished'
             WHEN end_date IS NOT NULL AND v_next > end_date THEN 'finished'
             ELSE 'active'
           END,
           updated_at = now()
     WHERE id = r.id;

    v_created := v_created + 1;
  END LOOP;

  RETURN jsonb_build_object('ok', true, 'created', v_created, 'executed_at', now());
END;
$$;

-- ============================================================
-- 8) Seed regras padrão
-- ============================================================
INSERT INTO public.financial_charges_rules (name, trigger_type, days_offset, severity, channel, message_template)
VALUES
  ('Aviso 3 dias antes', 'before_due', 3, 'info', 'in_app',
   'Olá {cliente}, o título de R$ {valor} vence em {vencimento}.'),
  ('Cobrança no vencimento', 'on_due', 0, 'warning', 'in_app',
   '{cliente}, seu título de R$ {valor} vence hoje ({vencimento}).'),
  ('Alerta forte 7 dias após', 'after_due', 7, 'critical', 'in_app',
   'ATENÇÃO {cliente}: título de R$ {valor} vencido em {vencimento} há mais de 7 dias.')
ON CONFLICT DO NOTHING;
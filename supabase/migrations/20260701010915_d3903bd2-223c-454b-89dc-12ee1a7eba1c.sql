
-- 1. Regras por tenant
CREATE TABLE IF NOT EXISTS public.bank_match_rules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL,
  name TEXT NOT NULL,
  description_pattern TEXT,
  target_category TEXT,
  boost_score INT NOT NULL DEFAULT 10 CHECK (boost_score BETWEEN 0 AND 30),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_bmr_company ON public.bank_match_rules(company_id, is_active);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.bank_match_rules TO authenticated;
GRANT ALL ON public.bank_match_rules TO service_role;
ALTER TABLE public.bank_match_rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "bmr_tenant_all" ON public.bank_match_rules FOR ALL TO authenticated
  USING (company_id = public.get_user_company_id(auth.uid()))
  WITH CHECK (company_id = public.get_user_company_id(auth.uid()));
CREATE TRIGGER trg_bmr_updated BEFORE UPDATE ON public.bank_match_rules
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2. Sugestões de match
CREATE TABLE IF NOT EXISTS public.bank_match_suggestions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL,
  bank_transaction_id UUID NOT NULL REFERENCES public.bank_transactions(id) ON DELETE CASCADE,
  cash_flow_entry_id UUID NOT NULL REFERENCES public.cash_flow_entries(id) ON DELETE CASCADE,
  score NUMERIC(6,2) NOT NULL,
  score_breakdown JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','accepted','rejected','auto_applied')),
  reviewed_by UUID,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(bank_transaction_id, cash_flow_entry_id)
);
CREATE INDEX IF NOT EXISTS idx_bms_company_status ON public.bank_match_suggestions(company_id, status);
CREATE INDEX IF NOT EXISTS idx_bms_tx ON public.bank_match_suggestions(bank_transaction_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.bank_match_suggestions TO authenticated;
GRANT ALL ON public.bank_match_suggestions TO service_role;
ALTER TABLE public.bank_match_suggestions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "bms_tenant_all" ON public.bank_match_suggestions FOR ALL TO authenticated
  USING (company_id = public.get_user_company_id(auth.uid()))
  WITH CHECK (company_id = public.get_user_company_id(auth.uid()));
CREATE TRIGGER trg_bms_updated BEFORE UPDATE ON public.bank_match_suggestions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3. Similaridade de descrição (bigrams simples)
CREATE OR REPLACE FUNCTION public.desc_similarity(a TEXT, b TEXT) RETURNS NUMERIC
LANGUAGE plpgsql IMMUTABLE SET search_path = public AS $$
DECLARE
  na TEXT := lower(coalesce(a,''));
  nb TEXT := lower(coalesce(b,''));
  tokens_a TEXT[]; tokens_b TEXT[];
  inter INT := 0; uni INT := 0; t TEXT;
BEGIN
  IF na = '' OR nb = '' THEN RETURN 0; END IF;
  tokens_a := regexp_split_to_array(regexp_replace(na, '[^a-z0-9 ]', ' ', 'g'), '\s+');
  tokens_b := regexp_split_to_array(regexp_replace(nb, '[^a-z0-9 ]', ' ', 'g'), '\s+');
  FOREACH t IN ARRAY tokens_a LOOP
    IF length(t) >= 3 THEN
      uni := uni + 1;
      IF t = ANY (tokens_b) THEN inter := inter + 1; END IF;
    END IF;
  END LOOP;
  IF uni = 0 THEN RETURN 0; END IF;
  RETURN LEAST(1.0, inter::NUMERIC / uni);
END $$;

-- 4. Motor de auto-conciliação
CREATE OR REPLACE FUNCTION public.bank_reconcile_auto(
  p_bank_account_id UUID DEFAULT NULL,
  p_date_from DATE DEFAULT (CURRENT_DATE - INTERVAL '60 days')::DATE,
  p_date_to DATE DEFAULT CURRENT_DATE
) RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_company UUID := public.get_user_company_id(auth.uid());
  v_auto INT := 0; v_sugg INT := 0; v_scanned INT := 0;
  r_tx RECORD; r_c RECORD; v_best RECORD;
  v_score NUMERIC; v_sim NUMERIC; v_ddiff INT;
  v_val_pts NUMERIC; v_date_pts NUMERIC; v_desc_pts NUMERIC; v_rule_pts NUMERIC;
  v_breakdown JSONB;
BEGIN
  IF v_company IS NULL THEN RAISE EXCEPTION 'no_tenant_scope'; END IF;

  FOR r_tx IN
    SELECT bt.* FROM public.bank_transactions bt
    JOIN public.bank_accounts ba ON ba.id = bt.bank_account_id
    WHERE ba.company_id = v_company
      AND bt.status = 'pending'
      AND bt.date BETWEEN p_date_from AND p_date_to
      AND (p_bank_account_id IS NULL OR bt.bank_account_id = p_bank_account_id)
  LOOP
    v_scanned := v_scanned + 1;
    v_best := NULL;

    FOR r_c IN
      SELECT ce.* FROM public.cash_flow_entries ce
      WHERE ce.company_id = v_company
        AND ABS(ce.amount - r_tx.amount) <= 0.01
        AND ce.date BETWEEN (r_tx.date - INTERVAL '3 days')::DATE AND (r_tx.date + INTERVAL '3 days')::DATE
        AND NOT EXISTS (
          SELECT 1 FROM public.bank_transactions bt2
          WHERE bt2.matched_entry_id = ce.id AND bt2.id <> r_tx.id
        )
    LOOP
      v_val_pts := 50; -- valor bate (garantido pelo filtro)
      v_ddiff := ABS((r_c.date - r_tx.date));
      v_date_pts := CASE WHEN v_ddiff = 0 THEN 25 WHEN v_ddiff = 1 THEN 15 WHEN v_ddiff <= 3 THEN 5 ELSE 0 END;
      v_sim := public.desc_similarity(r_tx.description, r_c.description);
      v_desc_pts := v_sim * 20;
      v_rule_pts := COALESCE((
        SELECT SUM(boost_score)::NUMERIC FROM public.bank_match_rules
        WHERE company_id = v_company AND is_active
          AND (description_pattern IS NULL OR r_tx.description ILIKE '%' || description_pattern || '%')
      ), 0);
      v_score := v_val_pts + v_date_pts + v_desc_pts + LEAST(v_rule_pts, 15);
      v_breakdown := jsonb_build_object(
        'value', v_val_pts, 'date', v_date_pts, 'description', v_desc_pts,
        'description_similarity', v_sim, 'rules', LEAST(v_rule_pts, 15),
        'candidate_date', r_c.date, 'candidate_amount', r_c.amount
      );

      IF v_best IS NULL OR v_score > (v_best.score)::NUMERIC THEN
        v_best := ROW(r_c.id, v_score, v_breakdown);
      END IF;
    END LOOP;

    IF v_best IS NOT NULL THEN
      IF (v_best.score)::NUMERIC >= 70 THEN
        UPDATE public.bank_transactions
          SET status = 'reconciled', matched_entry_id = (v_best.id)::UUID, updated_at = now()
          WHERE id = r_tx.id;
        INSERT INTO public.bank_match_suggestions
          (company_id, bank_transaction_id, cash_flow_entry_id, score, score_breakdown, status, reviewed_at)
          VALUES (v_company, r_tx.id, (v_best.id)::UUID, (v_best.score)::NUMERIC, (v_best.breakdown)::JSONB, 'auto_applied', now())
          ON CONFLICT (bank_transaction_id, cash_flow_entry_id) DO NOTHING;
        v_auto := v_auto + 1;
      ELSIF (v_best.score)::NUMERIC >= 40 THEN
        INSERT INTO public.bank_match_suggestions
          (company_id, bank_transaction_id, cash_flow_entry_id, score, score_breakdown)
          VALUES (v_company, r_tx.id, (v_best.id)::UUID, (v_best.score)::NUMERIC, (v_best.breakdown)::JSONB)
          ON CONFLICT (bank_transaction_id, cash_flow_entry_id) DO UPDATE
            SET score = EXCLUDED.score, score_breakdown = EXCLUDED.score_breakdown, updated_at = now();
        v_sugg := v_sugg + 1;
      END IF;
    END IF;
  END LOOP;

  RETURN jsonb_build_object('scanned', v_scanned, 'auto_reconciled', v_auto, 'suggestions', v_sugg);
END $$;

REVOKE ALL ON FUNCTION public.bank_reconcile_auto(UUID, DATE, DATE) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.bank_reconcile_auto(UUID, DATE, DATE) TO authenticated;

-- 5. RPC apply/reject sugestão
CREATE OR REPLACE FUNCTION public.bank_apply_suggestion(p_suggestion_id UUID)
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_company UUID := public.get_user_company_id(auth.uid()); v_s RECORD;
BEGIN
  SELECT * INTO v_s FROM public.bank_match_suggestions WHERE id = p_suggestion_id AND company_id = v_company;
  IF NOT FOUND THEN RAISE EXCEPTION 'suggestion_not_found_or_forbidden'; END IF;
  UPDATE public.bank_transactions SET status='reconciled', matched_entry_id=v_s.cash_flow_entry_id, updated_at=now()
    WHERE id = v_s.bank_transaction_id;
  UPDATE public.bank_match_suggestions SET status='accepted', reviewed_by=auth.uid(), reviewed_at=now()
    WHERE id = p_suggestion_id;
  RETURN true;
END $$;
REVOKE ALL ON FUNCTION public.bank_apply_suggestion(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.bank_apply_suggestion(UUID) TO authenticated;

CREATE OR REPLACE FUNCTION public.bank_reject_suggestion(p_suggestion_id UUID)
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_company UUID := public.get_user_company_id(auth.uid());
BEGIN
  UPDATE public.bank_match_suggestions SET status='rejected', reviewed_by=auth.uid(), reviewed_at=now()
    WHERE id = p_suggestion_id AND company_id = v_company;
  IF NOT FOUND THEN RAISE EXCEPTION 'suggestion_not_found_or_forbidden'; END IF;
  RETURN true;
END $$;
REVOKE ALL ON FUNCTION public.bank_reject_suggestion(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.bank_reject_suggestion(UUID) TO authenticated;

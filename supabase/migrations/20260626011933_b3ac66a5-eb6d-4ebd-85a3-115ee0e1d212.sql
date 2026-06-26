
-- Cycle 28: Tenant-scope report RPCs

CREATE OR REPLACE FUNCTION public.get_dre(_from date, _to date)
RETURNS TABLE(section text, category_id uuid, category_name text, total numeric)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $function$
  SELECT
    COALESCE(fc.dre_section, CASE WHEN l.type='inflow' THEN 'revenue' ELSE 'operating_expense' END) AS section,
    fc.id, COALESCE(fc.name,'Sem categoria'),
    SUM(CASE WHEN l.type='inflow' THEN l.amount ELSE -l.amount END)
  FROM public.financial_ledger l
  LEFT JOIN public.financial_categories fc ON fc.id = l.category_id AND fc.company_id = l.company_id
  WHERE l.entry_date BETWEEN _from AND _to
    AND l.company_id = public.get_user_company_id(auth.uid())
  GROUP BY fc.id, fc.name, fc.dre_section, l.type
  ORDER BY 1, 3;
$function$;

CREATE OR REPLACE FUNCTION public.get_dre_dynamic(_from date, _to date, _cost_center_id uuid DEFAULT NULL, _channel text DEFAULT NULL)
RETURNS TABLE(section text, category_id uuid, category_name text, total numeric)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $function$
  SELECT
    COALESCE(fc.dre_section, CASE WHEN l.type='inflow' THEN 'revenue' ELSE 'operating_expense' END) AS section,
    fc.id, COALESCE(fc.name,'Sem categoria'),
    SUM(CASE WHEN l.type='inflow' THEN l.amount ELSE -l.amount END)
  FROM public.financial_ledger l
  LEFT JOIN public.financial_categories fc ON fc.id = l.category_id AND fc.company_id = l.company_id
  LEFT JOIN public.accounts_receivable ar ON ar.id = l.source_id AND l.source = 'receivable' AND ar.company_id = l.company_id
  LEFT JOIN public.accounts_payable ap ON ap.id = l.source_id AND l.source = 'payable' AND ap.company_id = l.company_id
  WHERE l.entry_date BETWEEN _from AND _to
    AND l.company_id = public.get_user_company_id(auth.uid())
    AND (_cost_center_id IS NULL OR ap.cost_center_id = _cost_center_id OR ar.category = _channel)
    AND (_channel IS NULL OR COALESCE(ar.category, ap.category, '') ILIKE '%' || _channel || '%')
  GROUP BY fc.id, fc.name, fc.dre_section, l.type
  ORDER BY 1, 3;
$function$;

CREATE OR REPLACE FUNCTION public.get_cashflow_scenarios(_days integer DEFAULT 30)
RETURNS TABLE(day date, inflow_real numeric, outflow_real numeric, inflow_optimistic numeric, outflow_pessimistic numeric, balance_real numeric, balance_optimistic numeric, balance_pessimistic numeric)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE
  v_company uuid := public.get_user_company_id(auth.uid());
  v_start_balance numeric;
  v_real numeric := 0; v_opt numeric := 0; v_pes numeric := 0;
  v_in_r numeric; v_out_r numeric; v_in_o numeric; v_out_p numeric;
  d date;
BEGIN
  IF v_company IS NULL THEN RAISE EXCEPTION 'Tenant context missing'; END IF;

  SELECT COALESCE(SUM(balance),0) INTO v_start_balance
    FROM public.bank_accounts WHERE active = true AND company_id = v_company;
  v_real := v_start_balance; v_opt := v_start_balance; v_pes := v_start_balance;

  FOR d IN SELECT generate_series(CURRENT_DATE, CURRENT_DATE + (_days - 1), '1 day'::interval)::date LOOP
    SELECT COALESCE(SUM(open_amount),0) INTO v_in_r
      FROM public.accounts_receivable
     WHERE due_date = d AND status IN ('pending','partial','overdue') AND company_id = v_company;
    SELECT COALESCE(SUM(open_amount),0) INTO v_out_r
      FROM public.accounts_payable
     WHERE due_date = d AND status IN ('pending','partial','overdue') AND company_id = v_company;

    v_in_o  := v_in_r * 1.0;
    v_out_p := v_out_r * 1.10;
    v_real := v_real + v_in_r - v_out_r;
    v_opt  := v_opt  + v_in_o - (v_out_r * 0.95);
    v_pes  := v_pes  + (v_in_r * 0.70) - v_out_p;

    day := d; inflow_real := v_in_r; outflow_real := v_out_r;
    inflow_optimistic := v_in_o; outflow_pessimistic := v_out_p;
    balance_real := v_real; balance_optimistic := v_opt; balance_pessimistic := v_pes;
    RETURN NEXT;
  END LOOP;
END;
$function$;

CREATE OR REPLACE FUNCTION public.generate_sped_fiscal(p_start date, p_end date)
RETURNS TABLE(content text, total_records integer, total_value numeric)
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE
  v_company uuid := public.get_user_company_id(auth.uid());
  v_lines TEXT := ''; v_count INT := 0; v_total NUMERIC := 0; r RECORD; ri RECORD;
BEGIN
  IF v_company IS NULL THEN RAISE EXCEPTION 'Tenant context missing'; END IF;

  v_lines := v_lines || '|0000|018|0|' || to_char(p_start,'DDMMYYYY') || '|' || to_char(p_end,'DDMMYYYY') || '|EMPRESA|00000000000000|SP||IE|MUN|1|0|' || E'\n';
  v_count := v_count + 1;
  v_lines := v_lines || '|0001|0|' || E'\n'; v_count := v_count + 1;
  v_lines := v_lines || '|C001|0|' || E'\n'; v_count := v_count + 1;

  FOR r IN
    SELECT * FROM public.nfe
    WHERE status = 'authorized' AND company_id = v_company
      AND issue_date::date BETWEEN p_start AND p_end
    ORDER BY issue_date
  LOOP
    v_lines := v_lines || '|C100|' ||
      CASE WHEN r.operation_type='saida' THEN '1' ELSE '0' END || '|1|' ||
      COALESCE(r.client_document,'') || '|55|00|' ||
      COALESCE(r.series,'1') || '|' || r.number || '|' ||
      COALESCE(r.access_key,'') || '|' ||
      to_char(r.issue_date,'DDMMYYYY') || '|' || to_char(r.issue_date,'DDMMYYYY') || '|' ||
      replace(r.total::text,'.',',') || '|0|||' ||
      replace(r.subtotal::text,'.',',') || '|||' ||
      replace(r.discount::text,'.',',') || '|||||||||||||' || E'\n';
    v_count := v_count + 1; v_total := v_total + r.total;

    FOR ri IN SELECT * FROM public.nfe_items WHERE nfe_id = r.id ORDER BY id LOOP
      v_lines := v_lines || '|C170|1|' ||
        COALESCE(ri.product_code,'') || '|' || COALESCE(ri.product_name,'') || '|' ||
        replace(ri.quantity::text,'.',',') || '|' || COALESCE(ri.unit,'UN') || '|' ||
        replace((ri.quantity*ri.unit_price)::text,'.',',') || '|' ||
        replace(ri.discount::text,'.',',') || '|0|' || COALESCE(ri.cfop,'5102') || '|||' ||
        replace(ri.icms_base::text,'.',',') || '|' || replace(ri.icms_rate::text,'.',',') || '|' ||
        replace(ri.icms_value::text,'.',',') || '||||||||||||||||' ||
        replace(ri.pis_rate::text,'.',',') || '|' || replace(ri.pis_value::text,'.',',') || '||||' ||
        replace(ri.cofins_rate::text,'.',',') || '|' || replace(ri.cofins_value::text,'.',',') || '|||' || E'\n';
      v_count := v_count + 1;
    END LOOP;
  END LOOP;

  v_lines := v_lines || '|C990|' || (v_count+1)::text || '|' || E'\n'; v_count := v_count + 1;
  v_lines := v_lines || '|9001|0|' || E'\n'; v_count := v_count + 1;
  v_lines := v_lines || '|9990|3|' || E'\n'; v_count := v_count + 1;
  v_lines := v_lines || '|9999|' || (v_count+1)::text || '|' || E'\n'; v_count := v_count + 1;

  RETURN QUERY SELECT v_lines, v_count, v_total;
END;
$function$;

CREATE OR REPLACE FUNCTION public.generate_sped_contribuicoes(p_start date, p_end date)
RETURNS TABLE(content text, total_records integer, total_value numeric)
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE
  v_company uuid := public.get_user_company_id(auth.uid());
  v_lines TEXT := ''; v_count INT := 0;
  v_total_pis NUMERIC := 0; v_total_cofins NUMERIC := 0; r RECORD;
BEGIN
  IF v_company IS NULL THEN RAISE EXCEPTION 'Tenant context missing'; END IF;

  v_lines := v_lines || '|0000|005|0|' || to_char(p_start,'DDMMYYYY') || '|' || to_char(p_end,'DDMMYYYY') || '|EMPRESA|00000000000000|SP|IE|MUN|2|0|' || E'\n';
  v_count := v_count + 1;
  v_lines := v_lines || '|0001|0|' || E'\n'; v_count := v_count + 1;
  v_lines := v_lines || '|A001|0|' || E'\n'; v_count := v_count + 1;

  FOR r IN
    SELECT * FROM public.nfe
    WHERE status = 'authorized' AND operation_type = 'saida'
      AND company_id = v_company
      AND issue_date::date BETWEEN p_start AND p_end
  LOOP
    v_lines := v_lines || '|A100|0|1|' ||
      COALESCE(r.client_document,'') || '|' ||
      to_char(r.issue_date,'DDMMYYYY') || '|' || to_char(r.issue_date,'DDMMYYYY') || '|' ||
      r.number || '||00|' || replace(r.subtotal::text,'.',',') || '||||0|||' ||
      replace(r.pis::text,'.',',') || '|' || replace(r.cofins::text,'.',',') || '|' || E'\n';
    v_count := v_count + 1;
    v_total_pis := v_total_pis + r.pis;
    v_total_cofins := v_total_cofins + r.cofins;
  END LOOP;

  v_lines := v_lines || '|9001|0|' || E'\n'; v_count := v_count + 1;
  v_lines := v_lines || '|9999|' || (v_count+2)::text || '|' || E'\n'; v_count := v_count + 1;

  RETURN QUERY SELECT v_lines, v_count, v_total_pis + v_total_cofins;
END;
$function$;

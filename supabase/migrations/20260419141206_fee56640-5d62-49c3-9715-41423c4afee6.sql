
-- 1. Tabela de arquivos SPED gerados
CREATE TABLE IF NOT EXISTS public.sped_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL CHECK (type IN ('sped_fiscal','sped_contribuicoes')),
  period TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  content TEXT NOT NULL,
  total_records INTEGER NOT NULL DEFAULT 0,
  total_value NUMERIC(15,2) NOT NULL DEFAULT 0,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  generated_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.sped_files ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view sped_files" ON public.sped_files
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert sped_files" ON public.sped_files
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can delete sped_files" ON public.sped_files
  FOR DELETE TO authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_sped_files_period ON public.sped_files(type, start_date, end_date);

-- 2. Função: SPED Fiscal (simplificado - blocos essenciais)
CREATE OR REPLACE FUNCTION public.generate_sped_fiscal(p_start DATE, p_end DATE)
RETURNS TABLE(content TEXT, total_records INT, total_value NUMERIC)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_lines TEXT := '';
  v_count INT := 0;
  v_total NUMERIC := 0;
  r RECORD;
  ri RECORD;
BEGIN
  -- Bloco 0: Abertura
  v_lines := v_lines || '|0000|018|0|' || to_char(p_start,'DDMMYYYY') || '|' || to_char(p_end,'DDMMYYYY') || '|EMPRESA|00000000000000|SP||IE|MUN|1|0|' || E'\n';
  v_count := v_count + 1;
  v_lines := v_lines || '|0001|0|' || E'\n';
  v_count := v_count + 1;

  -- Bloco C: Documentos Fiscais (NF-e autorizadas)
  v_lines := v_lines || '|C001|0|' || E'\n';
  v_count := v_count + 1;

  FOR r IN
    SELECT * FROM public.nfe
    WHERE status = 'authorized'
      AND issue_date::date BETWEEN p_start AND p_end
    ORDER BY issue_date
  LOOP
    -- C100: Cabeçalho NF-e
    v_lines := v_lines || '|C100|' ||
      CASE WHEN r.operation_type='saida' THEN '1' ELSE '0' END || '|1|' ||
      COALESCE(r.client_document,'') || '|55|00|' ||
      COALESCE(r.series,'1') || '|' || r.number || '|' ||
      COALESCE(r.access_key,'') || '|' ||
      to_char(r.issue_date,'DDMMYYYY') || '|' ||
      to_char(r.issue_date,'DDMMYYYY') || '|' ||
      replace(r.total::text,'.',',') || '|0|||' ||
      replace(r.subtotal::text,'.',',') || '|||' ||
      replace(r.discount::text,'.',',') || '|||||||||||||' || E'\n';
    v_count := v_count + 1;
    v_total := v_total + r.total;

    -- C170: Itens
    FOR ri IN SELECT * FROM public.nfe_items WHERE nfe_id = r.id ORDER BY id LOOP
      v_lines := v_lines || '|C170|1|' ||
        COALESCE(ri.product_code,'') || '|' ||
        COALESCE(ri.product_name,'') || '|' ||
        replace(ri.quantity::text,'.',',') || '|' ||
        COALESCE(ri.unit,'UN') || '|' ||
        replace((ri.quantity*ri.unit_price)::text,'.',',') || '|' ||
        replace(ri.discount::text,'.',',') || '|0|' ||
        COALESCE(ri.cfop,'5102') || '|||' ||
        replace(ri.icms_base::text,'.',',') || '|' ||
        replace(ri.icms_rate::text,'.',',') || '|' ||
        replace(ri.icms_value::text,'.',',') || '||||||||||||||||' ||
        replace(ri.pis_rate::text,'.',',') || '|' ||
        replace(ri.pis_value::text,'.',',') || '||||' ||
        replace(ri.cofins_rate::text,'.',',') || '|' ||
        replace(ri.cofins_value::text,'.',',') || '|||' || E'\n';
      v_count := v_count + 1;
    END LOOP;
  END LOOP;

  v_lines := v_lines || '|C990|' || (v_count+1)::text || '|' || E'\n';
  v_count := v_count + 1;

  -- Bloco 9: Encerramento
  v_lines := v_lines || '|9001|0|' || E'\n';
  v_count := v_count + 1;
  v_lines := v_lines || '|9990|3|' || E'\n';
  v_count := v_count + 1;
  v_lines := v_lines || '|9999|' || (v_count+1)::text || '|' || E'\n';
  v_count := v_count + 1;

  RETURN QUERY SELECT v_lines, v_count, v_total;
END;
$$;

-- 3. Função: SPED Contribuições (PIS/COFINS - simplificado)
CREATE OR REPLACE FUNCTION public.generate_sped_contribuicoes(p_start DATE, p_end DATE)
RETURNS TABLE(content TEXT, total_records INT, total_value NUMERIC)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_lines TEXT := '';
  v_count INT := 0;
  v_total_pis NUMERIC := 0;
  v_total_cofins NUMERIC := 0;
  r RECORD;
BEGIN
  v_lines := v_lines || '|0000|005|0|' || to_char(p_start,'DDMMYYYY') || '|' || to_char(p_end,'DDMMYYYY') || '|EMPRESA|00000000000000|SP|IE|MUN|2|0|' || E'\n';
  v_count := v_count + 1;
  v_lines := v_lines || '|0001|0|' || E'\n';
  v_count := v_count + 1;

  v_lines := v_lines || '|A001|0|' || E'\n';
  v_count := v_count + 1;

  FOR r IN
    SELECT * FROM public.nfe
    WHERE status = 'authorized'
      AND operation_type = 'saida'
      AND issue_date::date BETWEEN p_start AND p_end
  LOOP
    v_lines := v_lines || '|A100|0|1|' ||
      COALESCE(r.client_document,'') || '|' ||
      to_char(r.issue_date,'DDMMYYYY') || '|' ||
      to_char(r.issue_date,'DDMMYYYY') || '|' ||
      r.number || '||00|' ||
      replace(r.subtotal::text,'.',',') || '||||0|||' ||
      replace(r.pis::text,'.',',') || '|' ||
      replace(r.cofins::text,'.',',') || '|' || E'\n';
    v_count := v_count + 1;
    v_total_pis := v_total_pis + r.pis;
    v_total_cofins := v_total_cofins + r.cofins;
  END LOOP;

  v_lines := v_lines || '|9001|0|' || E'\n';
  v_count := v_count + 1;
  v_lines := v_lines || '|9999|' || (v_count+2)::text || '|' || E'\n';
  v_count := v_count + 1;

  RETURN QUERY SELECT v_lines, v_count, v_total_pis + v_total_cofins;
END;
$$;

-- 4. Trigger: NF-e autorizada → gera Conta a Receber
CREATE OR REPLACE FUNCTION public.nfe_authorized_to_ar()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Apenas NF-e de saída recém autorizadas
  IF NEW.status = 'authorized'
     AND (OLD.status IS DISTINCT FROM 'authorized')
     AND NEW.operation_type = 'saida'
     AND NEW.total > 0 THEN

    -- Verifica se já existe AR para essa NF-e (evita duplicidade)
    IF NOT EXISTS (SELECT 1 FROM public.accounts_receivable WHERE nfe_id = NEW.id) THEN
      INSERT INTO public.accounts_receivable (
        description,
        client_name,
        client_id,
        category,
        amount,
        original_amount,
        open_amount,
        due_date,
        issue_date,
        status,
        invoice_number,
        nfe_id,
        order_id,
        source_type,
        source_id
      ) VALUES (
        'NF-e ' || NEW.number || ' - ' || NEW.client_name,
        NEW.client_name,
        NEW.client_id,
        'Vendas',
        NEW.total,
        NEW.total,
        NEW.total,
        (NEW.issue_date::date + INTERVAL '30 days')::date,
        NEW.issue_date::date,
        'pending',
        NEW.number,
        NEW.id,
        NEW.order_id,
        'nfe',
        NEW.id::text
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_nfe_authorized_to_ar ON public.nfe;
CREATE TRIGGER trg_nfe_authorized_to_ar
AFTER UPDATE ON public.nfe
FOR EACH ROW
EXECUTE FUNCTION public.nfe_authorized_to_ar();

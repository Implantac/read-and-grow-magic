ALTER TABLE public.financial_categories
  ADD COLUMN IF NOT EXISTS dre_section text CHECK (dre_section IN ('revenue','cost','operating_expense','financial_expense','financial_revenue','other_revenue','other_expense','tax')),
  ADD COLUMN IF NOT EXISTS chart_account_id uuid REFERENCES public.chart_of_accounts(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS sort_order integer DEFAULT 0;

ALTER TABLE public.financial_ledger
  ADD COLUMN IF NOT EXISTS chart_account_id uuid REFERENCES public.chart_of_accounts(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_ledger_category ON public.financial_ledger(category_id);
CREATE INDEX IF NOT EXISTS idx_ledger_chart_account ON public.financial_ledger(chart_account_id);
CREATE INDEX IF NOT EXISTS idx_ledger_entry_date ON public.financial_ledger(entry_date);
CREATE INDEX IF NOT EXISTS idx_fin_categories_dre ON public.financial_categories(dre_section);

CREATE OR REPLACE FUNCTION public.get_dre(_from date, _to date)
RETURNS TABLE (section text, category_id uuid, category_name text, total numeric)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT
    COALESCE(fc.dre_section, CASE WHEN l.type='inflow' THEN 'revenue' ELSE 'operating_expense' END) AS section,
    fc.id, COALESCE(fc.name,'Sem categoria'),
    SUM(CASE WHEN l.type='inflow' THEN l.amount ELSE -l.amount END)
  FROM public.financial_ledger l
  LEFT JOIN public.financial_categories fc ON fc.id = l.category_id
  WHERE l.entry_date BETWEEN _from AND _to
  GROUP BY fc.id, fc.name, fc.dre_section, l.type
  ORDER BY 1, 3;
$$;

CREATE OR REPLACE FUNCTION public.get_dre_summary(_from date, _to date)
RETURNS TABLE (section text, total numeric)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  WITH c AS (
    SELECT
      COALESCE(fc.dre_section, CASE WHEN l.type='inflow' THEN 'revenue' ELSE 'operating_expense' END) AS section,
      CASE WHEN l.type='inflow' THEN l.amount ELSE -l.amount END AS amt
    FROM public.financial_ledger l
    LEFT JOIN public.financial_categories fc ON fc.id = l.category_id
    WHERE l.entry_date BETWEEN _from AND _to
  )
  SELECT section, SUM(amt) FROM c GROUP BY section ORDER BY section;
$$;

INSERT INTO public.financial_categories (code, name, type, color, dre_section, sort_order)
SELECT v.code, v.name, v.type, v.color, v.dre_section, v.sort_order
FROM (VALUES
  ('3.01.01','Vendas de Produtos',     'income',  '#22c55e', 'revenue',            10),
  ('3.01.02','Vendas de Serviços',     'income',  '#3b82f6', 'revenue',            20),
  ('3.02.01','Outras Receitas',        'income',  '#06b6d4', 'other_revenue',      30),
  ('4.01.01','CMV - Custo Mercadoria', 'expense', '#dc2626', 'cost',              100),
  ('4.01.02','Insumos de Produção',    'expense', '#ef4444', 'cost',              110),
  ('4.02.01','Folha de Pagamento',     'expense', '#f97316', 'operating_expense', 200),
  ('4.02.02','Aluguel',                'expense', '#ec4899', 'operating_expense', 210),
  ('4.02.03','Utilidades',             'expense', '#0891b2', 'operating_expense', 220),
  ('4.02.04','Marketing',              'expense', '#eab308', 'operating_expense', 230),
  ('4.03.01','Impostos sobre Vendas',  'expense', '#8b5cf6', 'tax',               300),
  ('4.04.01','Juros e Multas',         'expense', '#a855f7', 'financial_expense', 400),
  ('4.04.02','Tarifas Bancárias',      'expense', '#9333ea', 'financial_expense', 410)
) AS v(code, name, type, color, dre_section, sort_order)
WHERE NOT EXISTS (SELECT 1 FROM public.financial_categories fc WHERE fc.code = v.code OR fc.name = v.name);
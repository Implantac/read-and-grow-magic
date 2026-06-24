
-- ============================================================
-- Fase 1.1 — Hierarquia de Tenants: tabela branches + branch_id
-- ============================================================

-- 1. Criar tabela branches (filiais)
CREATE TABLE IF NOT EXISTS public.branches (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  cnpj TEXT,
  ie TEXT,
  im TEXT,
  tax_regime TEXT,
  is_headquarters BOOLEAN NOT NULL DEFAULT false,
  address_street TEXT,
  address_number TEXT,
  address_complement TEXT,
  address_neighborhood TEXT,
  address_city TEXT,
  address_state TEXT,
  address_zip TEXT,
  phone TEXT,
  email TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(company_id, code)
);

CREATE INDEX IF NOT EXISTS idx_branches_company ON public.branches(company_id);
CREATE INDEX IF NOT EXISTS idx_branches_active ON public.branches(is_active) WHERE is_active = true;

-- Apenas uma matriz por empresa
CREATE UNIQUE INDEX IF NOT EXISTS uq_branches_one_hq_per_company
  ON public.branches(company_id) WHERE is_headquarters = true;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.branches TO authenticated;
GRANT ALL ON public.branches TO service_role;

ALTER TABLE public.branches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view branches of their companies"
  ON public.branches FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.company_id = branches.company_id
    )
    OR public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Admins and managers can manage branches"
  ON public.branches FOR ALL TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin')
    OR (
      public.has_role(auth.uid(), 'manager')
      AND EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = auth.uid() AND p.company_id = branches.company_id
      )
    )
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'admin')
    OR (
      public.has_role(auth.uid(), 'manager')
      AND EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = auth.uid() AND p.company_id = branches.company_id
      )
    )
  );

-- 2. Trigger updated_at
CREATE TRIGGER trg_branches_updated_at
  BEFORE UPDATE ON public.branches
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3. Backfill: criar 1 filial Matriz por empresa existente
INSERT INTO public.branches (company_id, code, name, cnpj, is_headquarters, is_active)
SELECT
  c.id,
  '0001',
  COALESCE(c.name, 'Matriz') || ' - Matriz',
  c.cnpj,
  true,
  true
FROM public.companies c
WHERE NOT EXISTS (
  SELECT 1 FROM public.branches b WHERE b.company_id = c.id
);

-- 4. Função helper: filial matriz de uma empresa
CREATE OR REPLACE FUNCTION public.get_headquarters_branch(_company_id UUID)
RETURNS UUID
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT id FROM public.branches
  WHERE company_id = _company_id AND is_headquarters = true
  LIMIT 1
$$;

-- 5. Função: verifica acesso do usuário a uma filial
CREATE OR REPLACE FUNCTION public.has_branch_access(_branch_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.branches b
    JOIN public.profiles p ON p.company_id = b.company_id
    WHERE b.id = _branch_id AND p.id = auth.uid()
  ) OR public.has_role(auth.uid(), 'admin')
$$;

-- 6. Adicionar branch_id nas tabelas operacionais centrais
ALTER TABLE public.orders                ADD COLUMN IF NOT EXISTS branch_id UUID REFERENCES public.branches(id);
ALTER TABLE public.accounts_payable      ADD COLUMN IF NOT EXISTS branch_id UUID REFERENCES public.branches(id);
ALTER TABLE public.accounts_receivable   ADD COLUMN IF NOT EXISTS branch_id UUID REFERENCES public.branches(id);
ALTER TABLE public.financial_ledger      ADD COLUMN IF NOT EXISTS branch_id UUID REFERENCES public.branches(id);
ALTER TABLE public.fiscal_documents      ADD COLUMN IF NOT EXISTS branch_id UUID REFERENCES public.branches(id);
ALTER TABLE public.stock_movements       ADD COLUMN IF NOT EXISTS branch_id UUID REFERENCES public.branches(id);
ALTER TABLE public.production_orders     ADD COLUMN IF NOT EXISTS branch_id UUID REFERENCES public.branches(id);
ALTER TABLE public.nfe                   ADD COLUMN IF NOT EXISTS branch_id UUID REFERENCES public.branches(id);
ALTER TABLE public.nfce                  ADD COLUMN IF NOT EXISTS branch_id UUID REFERENCES public.branches(id);

-- 7. Backfill branch_id = filial matriz da company correspondente
UPDATE public.orders SET branch_id = public.get_headquarters_branch(company_id)
  WHERE branch_id IS NULL AND company_id IS NOT NULL;
UPDATE public.accounts_payable SET branch_id = public.get_headquarters_branch(company_id)
  WHERE branch_id IS NULL AND company_id IS NOT NULL;
UPDATE public.accounts_receivable SET branch_id = public.get_headquarters_branch(company_id)
  WHERE branch_id IS NULL AND company_id IS NOT NULL;
UPDATE public.financial_ledger SET branch_id = public.get_headquarters_branch(company_id)
  WHERE branch_id IS NULL AND company_id IS NOT NULL;
UPDATE public.fiscal_documents SET branch_id = public.get_headquarters_branch(company_id)
  WHERE branch_id IS NULL AND company_id IS NOT NULL;
UPDATE public.stock_movements SET branch_id = public.get_headquarters_branch(company_id)
  WHERE branch_id IS NULL AND company_id IS NOT NULL;
UPDATE public.production_orders SET branch_id = public.get_headquarters_branch(company_id)
  WHERE branch_id IS NULL AND company_id IS NOT NULL;
UPDATE public.nfe SET branch_id = public.get_headquarters_branch(company_id)
  WHERE branch_id IS NULL AND company_id IS NOT NULL;
UPDATE public.nfce SET branch_id = public.get_headquarters_branch(company_id)
  WHERE branch_id IS NULL AND company_id IS NOT NULL;

-- 8. Índices para filtragem por filial
CREATE INDEX IF NOT EXISTS idx_orders_branch              ON public.orders(branch_id);
CREATE INDEX IF NOT EXISTS idx_ap_branch                  ON public.accounts_payable(branch_id);
CREATE INDEX IF NOT EXISTS idx_ar_branch                  ON public.accounts_receivable(branch_id);
CREATE INDEX IF NOT EXISTS idx_ledger_branch              ON public.financial_ledger(branch_id);
CREATE INDEX IF NOT EXISTS idx_fiscal_docs_branch         ON public.fiscal_documents(branch_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_branch     ON public.stock_movements(branch_id);
CREATE INDEX IF NOT EXISTS idx_production_orders_branch   ON public.production_orders(branch_id);
CREATE INDEX IF NOT EXISTS idx_nfe_branch                 ON public.nfe(branch_id);
CREATE INDEX IF NOT EXISTS idx_nfce_branch                ON public.nfce(branch_id);

-- 9. Adicionar branch_id no profile (filial padrão de trabalho)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS default_branch_id UUID REFERENCES public.branches(id);

UPDATE public.profiles p
SET default_branch_id = public.get_headquarters_branch(p.company_id)
WHERE p.default_branch_id IS NULL AND p.company_id IS NOT NULL;

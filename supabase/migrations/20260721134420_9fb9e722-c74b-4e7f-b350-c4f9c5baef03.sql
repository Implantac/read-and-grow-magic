
DO $$ BEGIN
  CREATE TYPE public.canal_operacional AS ENUM ('VAREJO_PDV', 'ATACADO_INDUSTRIA');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.branch_tipo AS ENUM ('industria', 'filial', 'cd');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE public.branches
  ADD COLUMN IF NOT EXISTS tipo public.branch_tipo NOT NULL DEFAULT 'filial',
  ADD COLUMN IF NOT EXISTS canal_padrao public.canal_operacional NOT NULL DEFAULT 'VAREJO_PDV';

ALTER TABLE public.orders                ADD COLUMN IF NOT EXISTS canal_operacional public.canal_operacional;
ALTER TABLE public.stock_movements       ADD COLUMN IF NOT EXISTS canal_operacional public.canal_operacional;
ALTER TABLE public.stock_balances        ADD COLUMN IF NOT EXISTS canal_operacional public.canal_operacional NOT NULL DEFAULT 'ATACADO_INDUSTRIA';
ALTER TABLE public.stock_balances        ADD COLUMN IF NOT EXISTS branch_id uuid REFERENCES public.branches(id);
ALTER TABLE public.financial_ledger      ADD COLUMN IF NOT EXISTS canal_operacional public.canal_operacional;
ALTER TABLE public.accounts_receivable   ADD COLUMN IF NOT EXISTS canal_operacional public.canal_operacional;
ALTER TABLE public.accounts_payable      ADD COLUMN IF NOT EXISTS canal_operacional public.canal_operacional;
ALTER TABLE public.cash_flow_entries     ADD COLUMN IF NOT EXISTS canal_operacional public.canal_operacional;
ALTER TABLE public.cash_flow_entries     ADD COLUMN IF NOT EXISTS branch_id uuid REFERENCES public.branches(id);
ALTER TABLE public.nfce                  ADD COLUMN IF NOT EXISTS canal_operacional public.canal_operacional NOT NULL DEFAULT 'VAREJO_PDV';
ALTER TABLE public.nfe                   ADD COLUMN IF NOT EXISTS canal_operacional public.canal_operacional NOT NULL DEFAULT 'ATACADO_INDUSTRIA';

UPDATE public.orders              SET canal_operacional = 'ATACADO_INDUSTRIA' WHERE canal_operacional IS NULL;
UPDATE public.stock_movements     SET canal_operacional = 'ATACADO_INDUSTRIA' WHERE canal_operacional IS NULL;
UPDATE public.financial_ledger    SET canal_operacional = 'ATACADO_INDUSTRIA' WHERE canal_operacional IS NULL;
UPDATE public.accounts_receivable SET canal_operacional = 'ATACADO_INDUSTRIA' WHERE canal_operacional IS NULL;
UPDATE public.accounts_payable    SET canal_operacional = 'ATACADO_INDUSTRIA' WHERE canal_operacional IS NULL;
UPDATE public.cash_flow_entries   SET canal_operacional = 'ATACADO_INDUSTRIA' WHERE canal_operacional IS NULL;

CREATE INDEX IF NOT EXISTS idx_orders_canal              ON public.orders (company_id, canal_operacional, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_stock_mov_canal           ON public.stock_movements (company_id, canal_operacional, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_stock_bal_canal_branch    ON public.stock_balances (company_id, branch_id, canal_operacional, product_id);
CREATE INDEX IF NOT EXISTS idx_fin_ledger_canal          ON public.financial_ledger (company_id, canal_operacional, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ar_canal                  ON public.accounts_receivable (company_id, canal_operacional);
CREATE INDEX IF NOT EXISTS idx_ap_canal                  ON public.accounts_payable (company_id, canal_operacional);
CREATE INDEX IF NOT EXISTS idx_cash_flow_canal           ON public.cash_flow_entries (company_id, canal_operacional);

-- Helper: retorna todas as branches da empresa do usuário (branch-level RBAC pode ser refinado depois).
CREATE OR REPLACE FUNCTION public.get_user_branch_ids(_user_id uuid)
RETURNS SETOF uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT b.id
    FROM public.branches b
   WHERE b.company_id = public.get_user_company_id(_user_id);
$$;

REVOKE ALL ON FUNCTION public.get_user_branch_ids(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_user_branch_ids(uuid) TO authenticated, service_role;

CREATE TABLE IF NOT EXISTS public.transferencias_canal (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  numero text NOT NULL,
  origem_branch_id uuid NOT NULL REFERENCES public.branches(id),
  destino_branch_id uuid NOT NULL REFERENCES public.branches(id),
  canal_origem public.canal_operacional NOT NULL DEFAULT 'ATACADO_INDUSTRIA',
  canal_destino public.canal_operacional NOT NULL DEFAULT 'VAREJO_PDV',
  status text NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente','em_transito','recebido','cancelado')),
  observacoes text,
  created_by uuid,
  confirmed_by uuid,
  confirmed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT transferencias_canal_lojas_distintas CHECK (origem_branch_id <> destino_branch_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.transferencias_canal TO authenticated;
GRANT ALL ON public.transferencias_canal TO service_role;
ALTER TABLE public.transferencias_canal ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant read transferencias_canal"    ON public.transferencias_canal FOR SELECT TO authenticated USING  (company_id = public.get_user_company_id(auth.uid()));
CREATE POLICY "tenant insert transferencias_canal"  ON public.transferencias_canal FOR INSERT TO authenticated WITH CHECK (company_id = public.get_user_company_id(auth.uid()));
CREATE POLICY "tenant update transferencias_canal"  ON public.transferencias_canal FOR UPDATE TO authenticated USING  (company_id = public.get_user_company_id(auth.uid())) WITH CHECK (company_id = public.get_user_company_id(auth.uid()));
CREATE POLICY "tenant delete transferencias_canal"  ON public.transferencias_canal FOR DELETE TO authenticated USING  (company_id = public.get_user_company_id(auth.uid()));

CREATE TABLE IF NOT EXISTS public.transferencias_canal_itens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  transferencia_id uuid NOT NULL REFERENCES public.transferencias_canal(id) ON DELETE CASCADE,
  product_id uuid NOT NULL,
  quantidade numeric NOT NULL CHECK (quantidade > 0),
  quantidade_recebida numeric,
  observacoes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.transferencias_canal_itens TO authenticated;
GRANT ALL ON public.transferencias_canal_itens TO service_role;
ALTER TABLE public.transferencias_canal_itens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant all transferencias_canal_itens"
  ON public.transferencias_canal_itens FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.transferencias_canal t WHERE t.id = transferencia_id AND t.company_id = public.get_user_company_id(auth.uid())))
  WITH CHECK (EXISTS (SELECT 1 FROM public.transferencias_canal t WHERE t.id = transferencia_id AND t.company_id = public.get_user_company_id(auth.uid())));

CREATE INDEX IF NOT EXISTS idx_transferencias_canal_company     ON public.transferencias_canal (company_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_transferencias_canal_itens_transf ON public.transferencias_canal_itens (transferencia_id);

CREATE OR REPLACE FUNCTION public.fn_transferencia_canal_apply()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE it record;
BEGIN
  IF NEW.status = 'em_transito' AND (OLD.status IS DISTINCT FROM 'em_transito') THEN
    FOR it IN SELECT product_id, quantidade FROM public.transferencias_canal_itens WHERE transferencia_id = NEW.id LOOP
      INSERT INTO public.stock_balances (company_id, branch_id, product_id, canal_operacional, quantity)
      VALUES (NEW.company_id, NEW.origem_branch_id, it.product_id, NEW.canal_origem, 0)
      ON CONFLICT DO NOTHING;
      UPDATE public.stock_balances
         SET quantity = COALESCE(quantity,0) - it.quantidade, updated_at = now()
       WHERE company_id = NEW.company_id AND branch_id = NEW.origem_branch_id
         AND product_id = it.product_id AND canal_operacional = NEW.canal_origem;
      INSERT INTO public.stock_movements (company_id, branch_id, product_id, quantity, movement_type, canal_operacional, reference_id, notes)
      VALUES (NEW.company_id, NEW.origem_branch_id, it.product_id, -it.quantidade, 'transfer_out', NEW.canal_origem, NEW.id, 'Transferência canal ' || NEW.numero);
    END LOOP;
  END IF;

  IF NEW.status = 'recebido' AND (OLD.status IS DISTINCT FROM 'recebido') THEN
    NEW.confirmed_at := now();
    FOR it IN SELECT product_id, quantidade, quantidade_recebida FROM public.transferencias_canal_itens WHERE transferencia_id = NEW.id LOOP
      INSERT INTO public.stock_balances (company_id, branch_id, product_id, canal_operacional, quantity)
      VALUES (NEW.company_id, NEW.destino_branch_id, it.product_id, NEW.canal_destino, 0)
      ON CONFLICT DO NOTHING;
      UPDATE public.stock_balances
         SET quantity = COALESCE(quantity,0) + COALESCE(it.quantidade_recebida, it.quantidade), updated_at = now()
       WHERE company_id = NEW.company_id AND branch_id = NEW.destino_branch_id
         AND product_id = it.product_id AND canal_operacional = NEW.canal_destino;
      INSERT INTO public.stock_movements (company_id, branch_id, product_id, quantity, movement_type, canal_operacional, reference_id, notes)
      VALUES (NEW.company_id, NEW.destino_branch_id, it.product_id, COALESCE(it.quantidade_recebida, it.quantidade), 'transfer_in', NEW.canal_destino, NEW.id, 'Recebimento canal ' || NEW.numero);
    END LOOP;
  END IF;

  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.fn_transferencia_canal_apply() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_transferencia_canal_apply ON public.transferencias_canal;
CREATE TRIGGER trg_transferencia_canal_apply
BEFORE UPDATE ON public.transferencias_canal
FOR EACH ROW EXECUTE FUNCTION public.fn_transferencia_canal_apply();

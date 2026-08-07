-- BLUEPRINT OPERACIONAL FASE 2B: REGRAS E PROCESSOS CRÍTICOS
-- Este Blueprint estabelece as regras de ouro para o motor operacional do sistema.

-- 1. Tabela de Tarefas Operacionais (Fila Única)
CREATE TABLE IF NOT EXISTS public.operational_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
    branch_id UUID REFERENCES public.branches(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    priority TEXT NOT NULL DEFAULT 'medium', -- low, medium, high, critical
    status TEXT NOT NULL DEFAULT 'pending', -- pending, in_progress, completed, cancelled, overdue
    category TEXT NOT NULL, -- receiving, inventory, transfer, adjustment, cashier, nps
    origin_type TEXT, -- stock_transfer, inventory_count, pos_session
    origin_id UUID,
    assigned_role public.app_role,
    assigned_user_id UUID REFERENCES auth.users(id),
    due_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    completed_by UUID REFERENCES auth.users(id),
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 2. Tabela de Divergências Operacionais (Auditoria e Resolução)
CREATE TABLE IF NOT EXISTS public.operational_discrepancies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
    branch_id UUID REFERENCES public.branches(id) ON DELETE CASCADE NOT NULL,
    origin_task_id UUID REFERENCES public.operational_tasks(id),
    product_id UUID REFERENCES public.products(id),
    expected_qty NUMERIC(15,4) NOT NULL,
    actual_qty NUMERIC(15,4) NOT NULL,
    diff_qty NUMERIC(15,4) GENERATED ALWAYS AS (actual_qty - expected_qty) STORED,
    reason TEXT NOT NULL,
    evidence_url TEXT, -- Foto/PDF da evidência
    status TEXT DEFAULT 'pending' NOT NULL, -- pending, resolved, dismissed
    resolution_notes TEXT,
    resolved_by UUID REFERENCES auth.users(id),
    resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 3. RLS e Grants
GRANT SELECT, INSERT, UPDATE, DELETE ON public.operational_tasks TO authenticated;
GRANT ALL ON public.operational_tasks TO service_role;
ALTER TABLE public.operational_tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "operational_tasks_isolation" ON public.operational_tasks FOR ALL TO authenticated USING (company_id = (SELECT company_id FROM profiles WHERE id = auth.uid()));

GRANT SELECT, INSERT, UPDATE, DELETE ON public.operational_discrepancies TO authenticated;
GRANT ALL ON public.operational_discrepancies TO service_role;
ALTER TABLE public.operational_discrepancies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "operational_discrepancies_isolation" ON public.operational_discrepancies FOR ALL TO authenticated USING (company_id = (SELECT company_id FROM profiles WHERE id = auth.uid()));

-- 4. Trigger de Auditoria Silenciosa (Exemplo: Ajustes excessivos)
CREATE OR REPLACE FUNCTION public.check_operational_anomalies()
RETURNS TRIGGER AS $$
DECLARE
    v_recent_count INTEGER;
BEGIN
    -- Se for um ajuste manual, verificar volume recente na unidade
    IF NEW.type = 'adjustment' THEN
        SELECT count(*) INTO v_recent_count
        FROM public.stock_movements
        WHERE branch_id = NEW.branch_id
          AND type = 'adjustment'
          AND created_at > now() - interval '24 hours';

        IF v_recent_count > 10 THEN
            INSERT INTO public.operational_tasks (
                company_id, branch_id, title, description, priority, category, status
            ) VALUES (
                NEW.company_id, NEW.branch_id,
                'Alerta de Auditoria: Volume de Ajustes',
                'Detectado volume anormal de ajustes manuais nas últimas 24h (' || v_recent_count || ').',
                'high', 'inventory', 'pending'
            );
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_detect_stock_anomalies ON public.stock_movements;
CREATE TRIGGER trg_detect_stock_anomalies
AFTER INSERT ON public.stock_movements
FOR EACH ROW EXECUTE FUNCTION public.check_operational_anomalies();

-- 5. Comentários para documentação do Blueprint
COMMENT ON TABLE public.operational_tasks IS 'Centraliza todas as pendências que exigem ação humana na loja/unidade.';
COMMENT ON TABLE public.operational_discrepancies IS 'Registro formal de diferenças entre o físico e o sistêmico, exigindo evidência.';

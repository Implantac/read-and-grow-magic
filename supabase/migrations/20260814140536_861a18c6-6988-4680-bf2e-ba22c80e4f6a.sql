-- Unified Intelligence and Supply Chain Logic
-- This migration implements core concepts for "Read & Grow" Intelligence: 
-- ABC/Demand classification, Inventory Health, and decision support tables.

-- 1. ABC and Demand Curves
DO $$ BEGIN
    CREATE TYPE public.demand_curve AS ENUM ('HIGH', 'MEDIUM', 'LOW', 'NEW', 'SEASONAL');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

ALTER TABLE public.replenishment_policies 
ADD COLUMN IF NOT EXISTS abc_class text CHECK (abc_class IN ('A', 'B', 'C')),
ADD COLUMN IF NOT EXISTS demand_curve public.demand_curve DEFAULT 'MEDIUM',
ADD COLUMN IF NOT EXISTS target_coverage_days integer DEFAULT 7,
ADD COLUMN IF NOT EXISTS safety_stock_days integer DEFAULT 2;

-- 2. Store Health Tracking
CREATE TABLE IF NOT EXISTS public.store_health_metrics (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
    branch_id uuid REFERENCES public.branches(id) ON DELETE CASCADE NOT NULL,
    score integer DEFAULT 0,
    rupture_count integer DEFAULT 0,
    coverage_days numeric(12,2) DEFAULT 0,
    excess_value numeric(12,2) DEFAULT 0,
    accuracy_rate numeric(5,2) DEFAULT 0,
    efficiency_rank integer,
    calculated_at timestamptz DEFAULT now(),
    metadata jsonb DEFAULT '{}'::jsonb
);

GRANT SELECT, INSERT, UPDATE ON public.store_health_metrics TO authenticated;
GRANT ALL ON public.store_health_metrics TO service_role;
ALTER TABLE public.store_health_metrics ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    CREATE POLICY "Users can view their company's store health"
        ON public.store_health_metrics FOR SELECT
        TO authenticated
        USING (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()));
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 3. Stock Transfer Divergences
CREATE TABLE IF NOT EXISTS public.stock_transfer_divergences (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    transfer_id uuid REFERENCES public.stock_transfer_orders(id) ON DELETE CASCADE NOT NULL,
    product_id uuid REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
    expected_qty numeric(12,2) NOT NULL,
    actual_qty numeric(12,2) NOT NULL,
    divergence_qty numeric(12,2) NOT NULL,
    reason text CHECK (reason IN ('AVARIA', 'FALTA', 'ERRO_SEPARACAO', 'EXTRAVIO', 'CONFERENCIA', 'OUTRO')),
    notes text,
    created_at timestamptz DEFAULT now(),
    created_by uuid REFERENCES auth.users(id)
);

GRANT SELECT, INSERT ON public.stock_transfer_divergences TO authenticated;
GRANT ALL ON public.stock_transfer_divergences TO service_role;
ALTER TABLE public.stock_transfer_divergences ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    CREATE POLICY "Users can manage their company's divergences"
        ON public.stock_transfer_divergences FOR ALL
        TO authenticated
        USING (EXISTS (
            SELECT 1 FROM public.stock_transfer_orders 
            WHERE id = transfer_id 
            AND company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid())
        ));
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 4. Automatic Approval Rules
CREATE TABLE IF NOT EXISTS public.auto_approval_policies (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
    max_quantity numeric(12,2) DEFAULT 20,
    max_value numeric(12,2) DEFAULT 20000,
    required_abc_class text[] DEFAULT '{A}',
    allowed_origin_types text[] DEFAULT '{DISTRIBUTION_CENTER,FACTORY}',
    is_active boolean DEFAULT true,
    created_at timestamptz DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.auto_approval_policies TO authenticated;
GRANT ALL ON public.auto_approval_policies TO service_role;
ALTER TABLE public.auto_approval_policies ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    CREATE POLICY "Users can manage auto approval policies"
        ON public.auto_approval_policies FOR ALL
        TO authenticated
        USING (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()));
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

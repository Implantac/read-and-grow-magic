-- Phase 1: Create Supply Chain Schema
CREATE TABLE IF NOT EXISTS public.supply_chain_movements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    origin_id UUID NOT NULL REFERENCES public.branches(id),
    origin_type TEXT NOT NULL CHECK (origin_type IN ('factory', 'warehouse', 'store')),
    destination_id UUID NOT NULL REFERENCES public.branches(id),
    destination_type TEXT NOT NULL CHECK (destination_type IN ('factory', 'warehouse', 'store')),
    status TEXT NOT NULL DEFAULT 'requested' CHECK (status IN (
        'requested', 'approved', 'picking', 'picked', 'shipped', 'in_transit', 'received', 'checked', 'completed', 'divergent'
    )),
    priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'critical')),
    items_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    estimated_arrival TIMESTAMPTZ,
    external_ref TEXT
);

CREATE TABLE IF NOT EXISTS public.supply_chain_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    movement_id UUID NOT NULL REFERENCES public.supply_chain_movements(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id),
    requested_qty NUMERIC NOT NULL CHECK (requested_qty > 0),
    shipped_qty NUMERIC,
    received_qty NUMERIC,
    unit_price NUMERIC,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Grant Access
GRANT SELECT, INSERT, UPDATE ON public.supply_chain_movements TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.supply_chain_items TO authenticated;
GRANT ALL ON public.supply_chain_movements TO service_role;
GRANT ALL ON public.supply_chain_items TO service_role;

-- Enable RLS
ALTER TABLE public.supply_chain_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supply_chain_items ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can see movements from their company" ON public.supply_chain_movements
    FOR SELECT TO authenticated USING (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Users can insert movements for their company" ON public.supply_chain_movements
    FOR INSERT TO authenticated WITH CHECK (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Users can update movements from their company" ON public.supply_chain_movements
    FOR UPDATE TO authenticated USING (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Users can see items of their company's movements" ON public.supply_chain_items
    FOR SELECT TO authenticated USING (
        EXISTS (
            SELECT 1 FROM public.supply_chain_movements 
            WHERE id = supply_chain_items.movement_id 
            AND company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid())
        )
    );

CREATE POLICY "Users can insert items for their company's movements" ON public.supply_chain_items
    FOR INSERT TO authenticated WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.supply_chain_movements 
            WHERE id = supply_chain_items.movement_id 
            AND company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid())
        )
    );

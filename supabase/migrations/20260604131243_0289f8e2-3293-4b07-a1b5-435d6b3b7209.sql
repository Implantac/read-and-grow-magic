-- PCP Industrial
CREATE TABLE public.production_bom (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL,
    product_id UUID REFERENCES public.products(id),
    component_id UUID REFERENCES public.products(id),
    quantity DECIMAL(15,4) NOT NULL,
    waste_percentage DECIMAL(5,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE public.production_orders_enterprise (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL,
    product_id UUID REFERENCES public.products(id),
    quantity_planned DECIMAL(15,4) NOT NULL,
    quantity_produced DECIMAL(15,4) DEFAULT 0,
    status TEXT DEFAULT 'planned', -- planned, in_progress, paused, completed, cancelled
    start_date TIMESTAMP WITH TIME ZONE,
    end_date TIMESTAMP WITH TIME ZONE,
    priority INTEGER DEFAULT 1,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE public.production_quality_checks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    production_order_id UUID REFERENCES public.production_orders_enterprise(id),
    check_type TEXT NOT NULL,
    result TEXT NOT NULL, -- pass, fail
    notes TEXT,
    inspector_id UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- WMS Enterprise Avançado
CREATE TABLE public.wms_waves (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL,
    status TEXT DEFAULT 'pending', -- pending, picking, packing, shipped
    priority INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE public.wms_docks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    warehouse_id UUID REFERENCES public.warehouses(id),
    name TEXT NOT NULL,
    type TEXT NOT NULL, -- receiving, shipping, hybrid
    status TEXT DEFAULT 'available',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Grants
GRANT SELECT, INSERT, UPDATE, DELETE ON public.production_bom TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.production_orders_enterprise TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.production_quality_checks TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.wms_waves TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.wms_docks TO authenticated;

GRANT ALL ON public.production_bom TO service_role;
GRANT ALL ON public.production_orders_enterprise TO service_role;
GRANT ALL ON public.production_quality_checks TO service_role;
GRANT ALL ON public.wms_waves TO service_role;
GRANT ALL ON public.wms_docks TO service_role;

-- RLS
ALTER TABLE public.production_bom ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.production_orders_enterprise ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.production_quality_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wms_waves ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wms_docks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "PCP access by company" ON public.production_orders_enterprise FOR ALL USING (company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()));
CREATE POLICY "WMS waves access by company" ON public.wms_waves FOR ALL USING (company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

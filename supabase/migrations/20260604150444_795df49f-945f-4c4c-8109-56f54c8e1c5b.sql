-- Textile Vertical Expansion
CREATE TABLE public.textile_yarn_inventory (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    composition TEXT,
    yarn_count TEXT, -- Titulagem
    color_code TEXT,
    batch_number TEXT,
    current_stock NUMERIC(15,3) DEFAULT 0,
    unit TEXT DEFAULT 'kg',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE public.textile_weaving_orders (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    loom_id TEXT NOT NULL,
    fabric_type TEXT NOT NULL,
    meters_planned NUMERIC(15,2) NOT NULL,
    meters_produced NUMERIC(15,2) DEFAULT 0,
    status TEXT DEFAULT 'pending', -- pending, weaving, finished, paused
    start_date TIMESTAMP WITH TIME ZONE,
    end_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Pharma Vertical Expansion
CREATE TABLE public.pharma_lab_tests (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    batch_id TEXT NOT NULL,
    test_type TEXT NOT NULL, -- chemical, purity, stability, microbiological
    result_status TEXT DEFAULT 'pending', -- pass, fail, pending
    analyst_name TEXT,
    test_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
    raw_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Retail Chain & Franchise Expansion
CREATE TABLE public.retail_chain_stores (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    store_name TEXT NOT NULL,
    store_code TEXT UNIQUE,
    manager_name TEXT,
    location_lat NUMERIC(10,8),
    location_lng NUMERIC(11,8),
    is_franchise BOOLEAN DEFAULT false,
    status TEXT DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Animal Feed Vertical Expansion
CREATE TABLE public.feed_formulas (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    target_species TEXT, -- porcine, bovine, avian
    nutritional_values JSONB, -- protein, fat, fiber, etc.
    ingredients JSONB, -- list of raw materials and percentages
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Wholesaler & Distribution
CREATE TABLE public.wholesaler_routes (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    route_name TEXT NOT NULL,
    driver_id UUID,
    vehicle_id UUID,
    delivery_points JSONB, -- Array of customer locations
    frequency TEXT, -- daily, weekly
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Holding Structure
CREATE TABLE public.holding_entities (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    holding_company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    subsidiary_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    equity_percentage NUMERIC(5,2),
    relation_type TEXT DEFAULT 'subsidiary', -- subsidiary, affiliate, joint_venture
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.textile_yarn_inventory TO authenticated;
GRANT ALL ON public.textile_yarn_inventory TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.textile_weaving_orders TO authenticated;
GRANT ALL ON public.textile_weaving_orders TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.pharma_lab_tests TO authenticated;
GRANT ALL ON public.pharma_lab_tests TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.retail_chain_stores TO authenticated;
GRANT ALL ON public.retail_chain_stores TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.feed_formulas TO authenticated;
GRANT ALL ON public.feed_formulas TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.wholesaler_routes TO authenticated;
GRANT ALL ON public.wholesaler_routes TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.holding_entities TO authenticated;
GRANT ALL ON public.holding_entities TO service_role;

-- RLS
ALTER TABLE public.textile_yarn_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.textile_weaving_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pharma_lab_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.retail_chain_stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feed_formulas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wholesaler_routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.holding_entities ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can manage their own textile inventory" ON public.textile_yarn_inventory FOR ALL USING (company_id IN (SELECT id FROM public.companies));
CREATE POLICY "Users can manage their own weaving orders" ON public.textile_weaving_orders FOR ALL USING (company_id IN (SELECT id FROM public.companies));
CREATE POLICY "Users can manage their own lab tests" ON public.pharma_lab_tests FOR ALL USING (company_id IN (SELECT id FROM public.companies));
CREATE POLICY "Users can manage their own stores" ON public.retail_chain_stores FOR ALL USING (company_id IN (SELECT id FROM public.companies));
CREATE POLICY "Users can manage their own formulas" ON public.feed_formulas FOR ALL USING (company_id IN (SELECT id FROM public.companies));
CREATE POLICY "Users can manage their own routes" ON public.wholesaler_routes FOR ALL USING (company_id IN (SELECT id FROM public.companies));
CREATE POLICY "Users can manage their own holding entities" ON public.holding_entities FOR ALL USING (holding_company_id IN (SELECT id FROM public.companies));

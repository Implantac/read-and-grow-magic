DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'unit_type') THEN
        CREATE TYPE public.unit_type AS ENUM ('factory', 'distribution_center', 'store', 'office');
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.operational_units (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    name text NOT NULL,
    type public.unit_type NOT NULL,
    document_number text,
    is_active boolean DEFAULT true,
    settings jsonb DEFAULT '{}'::jsonb,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.stock_locations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    unit_id uuid NOT NULL REFERENCES public.operational_units(id) ON DELETE CASCADE,
    name text NOT NULL,
    is_picking_area boolean DEFAULT false,
    is_quarantine boolean DEFAULT false,
    created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.stock_balances (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    unit_id uuid NOT NULL REFERENCES public.operational_units(id) ON DELETE CASCADE,
    location_id uuid NOT NULL REFERENCES public.stock_locations(id) ON DELETE CASCADE,
    product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    quantity decimal(15,4) DEFAULT 0,
    reserved_quantity decimal(15,4) DEFAULT 0,
    updated_at timestamptz DEFAULT now(),
    UNIQUE(location_id, product_id)
);

CREATE TABLE IF NOT EXISTS public.stock_movements (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    unit_id uuid NOT NULL REFERENCES public.operational_units(id) ON DELETE CASCADE,
    location_id uuid NOT NULL REFERENCES public.stock_locations(id) ON DELETE CASCADE,
    product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    quantity_change decimal(15,4) NOT NULL,
    type text NOT NULL,
    reference_id uuid,
    user_id uuid,
    created_at timestamptz DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.operational_units TO authenticated;
GRANT ALL ON public.operational_units TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.stock_locations TO authenticated;
GRANT ALL ON public.stock_locations TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.stock_balances TO authenticated;
GRANT ALL ON public.stock_balances TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.stock_movements TO authenticated;
GRANT ALL ON public.stock_movements TO service_role;

ALTER TABLE public.operational_units ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can see their company units" ON public.operational_units FOR SELECT TO authenticated USING (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()));
CREATE POLICY "Users can see their company stock locations" ON public.stock_locations FOR SELECT TO authenticated USING (unit_id IN (SELECT id FROM public.operational_units WHERE company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid())));
CREATE POLICY "Users can see their company stock balances" ON public.stock_balances FOR SELECT TO authenticated USING (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()));
CREATE POLICY "Users can see their company movements" ON public.stock_movements FOR SELECT TO authenticated USING (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

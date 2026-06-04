-- Add supplier reference mapping to products
CREATE TABLE IF NOT EXISTS public.product_supplier_references (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id TEXT NOT NULL, -- Using TEXT to match existing ID patterns if needed, or UUID if typical. Assuming UUID for new table.
    supplier_id TEXT NOT NULL,
    supplier_ref_code TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(supplier_id, supplier_ref_code)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.product_supplier_references TO authenticated;
GRANT ALL ON public.product_supplier_references TO service_role;

-- Add purchase order link to fiscal documents (nfe)
DO $$ 
BEGIN 
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'nfe') THEN
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name='nfe' AND column_name='purchase_order_id') THEN
            ALTER TABLE public.nfe ADD COLUMN purchase_order_id UUID;
        END IF;
    END IF;
END $$;

-- Ensure purchase_orders has status
DO $$ 
BEGIN 
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'purchase_orders') THEN
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name='purchase_orders' AND column_name='status') THEN
            ALTER TABLE public.purchase_orders ADD COLUMN status TEXT DEFAULT 'pending';
        END IF;
    END IF;
END $$;

-- Trigger to update updated_at if not exists
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_product_supplier_references_updated_at ON public.product_supplier_references;
CREATE TRIGGER update_product_supplier_references_updated_at
    BEFORE UPDATE ON public.product_supplier_references
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

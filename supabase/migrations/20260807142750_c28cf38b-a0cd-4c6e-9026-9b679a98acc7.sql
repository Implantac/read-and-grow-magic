-- FASE 2A: TRIGGERS DE AUTOMAÇÃO DE ESTOQUE
-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at triggers to new tables
DO $$ BEGIN
    CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.pos_terminals FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.stock_transfer_orders FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.replenishment_policies FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- Basic stock automation trigger for transfers
CREATE OR REPLACE FUNCTION public.process_stock_transfer()
RETURNS TRIGGER AS $$
DECLARE
    item RECORD;
BEGIN
    -- When status changes to IN_TRANSIT, decrease origin available stock
    IF (TG_OP = 'UPDATE' AND OLD.status = 'APPROVED' AND NEW.status = 'IN_TRANSIT') THEN
        FOR item IN SELECT * FROM public.stock_transfer_items WHERE transfer_id = NEW.id LOOP
            UPDATE public.stock_balances 
            SET available_qty = available_qty - item.shipped_qty,
                reserved_qty = reserved_qty + item.shipped_qty
            WHERE product_id = item.product_id AND branch_id = NEW.origin_unit_id;
        END LOOP;
    END IF;

    -- When status changes to COMPLETED, decrease origin total stock and increase destination
    IF (TG_OP = 'UPDATE' AND OLD.status != 'COMPLETED' AND NEW.status = 'COMPLETED') THEN
        FOR item IN SELECT * FROM public.stock_transfer_items WHERE transfer_id = NEW.id LOOP
            -- Origin
            UPDATE public.stock_balances 
            SET quantity = quantity - item.shipped_qty,
                reserved_qty = reserved_qty - item.shipped_qty
            WHERE product_id = item.product_id AND branch_id = NEW.origin_unit_id;

            -- Destination
            INSERT INTO public.stock_balances (company_id, branch_id, product_id, quantity, available_qty)
            VALUES (NEW.company_id, NEW.destination_unit_id, item.product_id, item.received_qty, item.received_qty)
            ON CONFLICT (branch_id, product_id) DO UPDATE 
            SET quantity = stock_balances.quantity + EXCLUDED.quantity,
                available_qty = stock_balances.available_qty + EXCLUDED.available_qty;
        END LOOP;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$ BEGIN
    CREATE TRIGGER on_transfer_status_change AFTER UPDATE ON public.stock_transfer_orders 
    FOR EACH ROW WHEN (OLD.status IS DISTINCT FROM NEW.status)
    EXECUTE FUNCTION public.process_stock_transfer();
EXCEPTION WHEN duplicate_object THEN null; END $$;

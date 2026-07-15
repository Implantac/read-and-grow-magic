ALTER TABLE public.wms_inventory_items REPLICA IDENTITY FULL;
ALTER TABLE public.stock_balances REPLICA IDENTITY FULL;
ALTER TABLE public.stock_movements REPLICA IDENTITY FULL;
ALTER TABLE public.wms_movements REPLICA IDENTITY FULL;
ALTER TABLE public.wms_picking_orders REPLICA IDENTITY FULL;
ALTER TABLE public.wms_receiving_orders REPLICA IDENTITY FULL;
ALTER TABLE public.wms_inventory_counts REPLICA IDENTITY FULL;

DO $$
BEGIN
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.wms_inventory_items; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.stock_balances; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.stock_movements; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.wms_movements; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.wms_picking_orders; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.wms_receiving_orders; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.wms_inventory_counts; EXCEPTION WHEN duplicate_object THEN NULL; END;
END $$;
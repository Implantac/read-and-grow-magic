
ALTER TABLE public.production_orders
  ADD COLUMN work_center_id UUID REFERENCES public.work_centers(id) ON DELETE SET NULL;

CREATE INDEX idx_production_orders_work_center_id ON public.production_orders(work_center_id);

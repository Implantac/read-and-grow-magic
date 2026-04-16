
-- Create outsourcing_orders table for terceirização control
CREATE TABLE public.outsourcing_orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  production_order_id UUID REFERENCES public.production_orders(id) ON DELETE CASCADE NOT NULL,
  order_number TEXT NOT NULL,
  supplier_name TEXT NOT NULL,
  supplier_id UUID REFERENCES public.suppliers(id) ON DELETE SET NULL,
  service_description TEXT,
  sent_date DATE NOT NULL DEFAULT CURRENT_DATE,
  expected_return_date DATE,
  actual_return_date DATE,
  quantity_sent NUMERIC NOT NULL DEFAULT 0,
  quantity_returned NUMERIC DEFAULT 0,
  quantity_rejected NUMERIC DEFAULT 0,
  unit_cost NUMERIC DEFAULT 0,
  total_cost NUMERIC DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'sent',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.outsourcing_orders ENABLE ROW LEVEL SECURITY;

-- RLS policies (authenticated users can manage)
CREATE POLICY "Authenticated users can view outsourcing orders"
  ON public.outsourcing_orders FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert outsourcing orders"
  ON public.outsourcing_orders FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update outsourcing orders"
  ON public.outsourcing_orders FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can delete outsourcing orders"
  ON public.outsourcing_orders FOR DELETE TO authenticated USING (true);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.outsourcing_orders;

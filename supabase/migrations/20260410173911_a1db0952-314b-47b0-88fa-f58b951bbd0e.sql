
-- Create delivery tracking table for shipment event history
CREATE TABLE public.delivery_tracking (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  shipment_id UUID NOT NULL REFERENCES public.shipment_orders(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL DEFAULT 'update',
  description TEXT NOT NULL,
  location TEXT,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  registered_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.delivery_tracking ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Authenticated users can view delivery tracking"
ON public.delivery_tracking FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can create delivery tracking"
ON public.delivery_tracking FOR INSERT TO authenticated WITH CHECK (true);

-- Index for fast lookup by shipment
CREATE INDEX idx_delivery_tracking_shipment ON public.delivery_tracking(shipment_id);
CREATE INDEX idx_delivery_tracking_occurred ON public.delivery_tracking(occurred_at DESC);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.delivery_tracking;

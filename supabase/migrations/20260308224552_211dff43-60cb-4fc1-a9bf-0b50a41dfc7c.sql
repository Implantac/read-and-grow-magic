
-- RFID Readers: physical devices that read tags
CREATE TABLE public.rfid_readers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  location TEXT,
  zone TEXT,
  ip_address TEXT,
  port INTEGER,
  model TEXT,
  manufacturer TEXT,
  antenna_count INTEGER DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'active',
  last_heartbeat TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- RFID Tags: tags attached to products/pallets/locations
CREATE TABLE public.rfid_tags (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  epc TEXT NOT NULL UNIQUE,
  tag_type TEXT NOT NULL DEFAULT 'product',
  product_id UUID REFERENCES public.products(id),
  product_code TEXT,
  product_name TEXT,
  batch TEXT,
  pallet_id TEXT,
  location TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  registered_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- RFID Read Events: every time a reader scans a tag
CREATE TABLE public.rfid_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  reader_id UUID REFERENCES public.rfid_readers(id),
  reader_code TEXT NOT NULL,
  tag_epc TEXT NOT NULL,
  tag_id UUID REFERENCES public.rfid_tags(id),
  event_type TEXT NOT NULL DEFAULT 'read',
  rssi NUMERIC,
  antenna INTEGER DEFAULT 1,
  location TEXT,
  zone TEXT,
  processed BOOLEAN NOT NULL DEFAULT false,
  processed_at TIMESTAMP WITH TIME ZONE,
  action_taken TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Indexes for performance
CREATE INDEX idx_rfid_events_created_at ON public.rfid_events(created_at DESC);
CREATE INDEX idx_rfid_events_tag_epc ON public.rfid_events(tag_epc);
CREATE INDEX idx_rfid_events_reader_code ON public.rfid_events(reader_code);
CREATE INDEX idx_rfid_tags_epc ON public.rfid_tags(epc);
CREATE INDEX idx_rfid_tags_product_id ON public.rfid_tags(product_id);

-- Enable realtime for events
ALTER PUBLICATION supabase_realtime ADD TABLE public.rfid_events;

-- RLS policies
ALTER TABLE public.rfid_readers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rfid_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rfid_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Auth users can read rfid_readers" ON public.rfid_readers FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth users can insert rfid_readers" ON public.rfid_readers FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth users can update rfid_readers" ON public.rfid_readers FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Auth users can delete rfid_readers" ON public.rfid_readers FOR DELETE TO authenticated USING (true);

CREATE POLICY "Auth users can read rfid_tags" ON public.rfid_tags FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth users can insert rfid_tags" ON public.rfid_tags FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth users can update rfid_tags" ON public.rfid_tags FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Auth users can delete rfid_tags" ON public.rfid_tags FOR DELETE TO authenticated USING (true);

CREATE POLICY "Auth users can read rfid_events" ON public.rfid_events FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth users can insert rfid_events" ON public.rfid_events FOR INSERT TO authenticated WITH CHECK (true);

-- Allow anonymous inserts for RFID readers (devices send data without auth)
CREATE POLICY "Anon can insert rfid_events" ON public.rfid_events FOR INSERT TO anon WITH CHECK (true);

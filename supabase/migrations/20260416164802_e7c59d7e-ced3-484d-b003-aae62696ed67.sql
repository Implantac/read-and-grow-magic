
-- Remove permissive public policies
DROP POLICY IF EXISTS "wms_shipments_public_read" ON public.wms_shipments;
DROP POLICY IF EXISTS "wms_shipments_public_write" ON public.wms_shipments;

-- Create authenticated-only policies
CREATE POLICY "Authenticated users can read shipments"
ON public.wms_shipments FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert shipments"
ON public.wms_shipments FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update shipments"
ON public.wms_shipments FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Authenticated users can delete shipments"
ON public.wms_shipments FOR DELETE TO authenticated USING (true);

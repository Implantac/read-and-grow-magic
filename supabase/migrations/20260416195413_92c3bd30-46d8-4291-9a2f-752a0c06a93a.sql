DROP POLICY IF EXISTS "stock_lots_public_read" ON public.stock_lots;
DROP POLICY IF EXISTS "stock_lots_public_write" ON public.stock_lots;

CREATE POLICY "Authenticated users can read stock_lots"
ON public.stock_lots FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert stock_lots"
ON public.stock_lots FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update stock_lots"
ON public.stock_lots FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Authenticated users can delete stock_lots"
ON public.stock_lots FOR DELETE TO authenticated USING (true);
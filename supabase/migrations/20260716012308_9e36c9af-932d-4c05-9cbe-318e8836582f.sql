
GRANT SELECT ON public.storefronts TO anon;

CREATE POLICY "Public can view published storefronts"
ON public.storefronts FOR SELECT TO anon, authenticated
USING (status = 'published');

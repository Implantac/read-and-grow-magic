
ALTER TABLE public.nfce REPLICA IDENTITY FULL;
ALTER TABLE public.nfce_items REPLICA IDENTITY FULL;
ALTER TABLE public.nfce_returns REPLICA IDENTITY FULL;
ALTER TABLE public.nfce_return_items REPLICA IDENTITY FULL;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname='supabase_realtime' AND schemaname='public' AND tablename='nfce') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.nfce;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname='supabase_realtime' AND schemaname='public' AND tablename='nfce_items') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.nfce_items;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname='supabase_realtime' AND schemaname='public' AND tablename='nfce_returns') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.nfce_returns;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname='supabase_realtime' AND schemaname='public' AND tablename='nfce_return_items') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.nfce_return_items;
  END IF;
END $$;

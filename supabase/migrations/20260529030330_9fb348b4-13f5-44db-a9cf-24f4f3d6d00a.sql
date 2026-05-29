ALTER TABLE public.ai_brain_decisions REPLICA IDENTITY FULL;
ALTER TABLE public.ai_brain_memory REPLICA IDENTITY FULL;
ALTER TABLE public.ai_brain_runs REPLICA IDENTITY FULL;

DO $$
BEGIN
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.ai_brain_decisions; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.ai_brain_memory; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.ai_brain_runs; EXCEPTION WHEN duplicate_object THEN NULL; END;
END $$;
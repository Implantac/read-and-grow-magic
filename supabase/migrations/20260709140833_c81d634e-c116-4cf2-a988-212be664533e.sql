
CREATE OR REPLACE FUNCTION public.nps_answer_to_timeline()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_cat_label text;
BEGIN
  IF NEW.client_id IS NULL THEN
    RETURN NEW;
  END IF;

  v_cat_label := CASE NEW.category
    WHEN 'promoter' THEN 'Promotor'
    WHEN 'detractor' THEN 'Detrator'
    ELSE 'Neutro'
  END;

  INSERT INTO public.client_timeline (
    client_id, event_type, title, description, metadata, reference_id, reference_type, user_id, user_name
  ) VALUES (
    NEW.client_id,
    'nps',
    'NPS ' || NEW.score::text || ' — ' || v_cat_label,
    NULLIF(left(coalesce(NEW.comment, ''), 500), ''),
    jsonb_build_object(
      'score', NEW.score,
      'category', NEW.category,
      'campaign_id', NEW.campaign_id,
      'channel', NEW.channel,
      'origin', NEW.origin
    ),
    NEW.id,
    'nps_answer',
    NULL,
    NULL
  );

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Nunca bloquear a resposta NPS se a timeline falhar
  RAISE WARNING 'nps_answer_to_timeline failed: %', SQLERRM;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.nps_answer_to_timeline() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_nps_answer_to_timeline ON public.nps_answers;
CREATE TRIGGER trg_nps_answer_to_timeline
AFTER INSERT ON public.nps_answers
FOR EACH ROW EXECUTE FUNCTION public.nps_answer_to_timeline();


CREATE OR REPLACE FUNCTION public.increment_nps_bank_usage(p_ids uuid[])
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.nps_question_bank
     SET usage_count = usage_count + 1
   WHERE id = ANY(p_ids)
     AND (
       is_global = true
       OR company_id = public.get_user_company_id(auth.uid())
     );
$$;

REVOKE ALL ON FUNCTION public.increment_nps_bank_usage(uuid[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.increment_nps_bank_usage(uuid[]) TO authenticated;

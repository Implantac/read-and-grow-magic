
-- Revoke EXECUTE from authenticated on internal/admin-only SECURITY DEFINER functions
REVOKE EXECUTE ON FUNCTION public.auto_match_bank_transactions(uuid, integer) FROM authenticated, anon;
REVOKE EXECUTE ON FUNCTION public.match_bank_transaction(uuid) FROM authenticated, anon;
REVOKE EXECUTE ON FUNCTION public.import_bank_statement_batch(uuid, jsonb) FROM authenticated, anon;
REVOKE EXECUTE ON FUNCTION public.manual_match_transaction(uuid, uuid) FROM authenticated, anon;
REVOKE EXECUTE ON FUNCTION public.get_consolidated_revenue(uuid, uuid, uuid, date, date) FROM authenticated, anon;
REVOKE EXECUTE ON FUNCTION public.get_consolidated_company_ids(uuid) FROM authenticated, anon;

GRANT EXECUTE ON FUNCTION public.auto_match_bank_transactions(uuid, integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.match_bank_transaction(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.import_bank_statement_batch(uuid, jsonb) TO service_role;
GRANT EXECUTE ON FUNCTION public.manual_match_transaction(uuid, uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.get_consolidated_revenue(uuid, uuid, uuid, date, date) TO service_role;
GRANT EXECUTE ON FUNCTION public.get_consolidated_company_ids(uuid) TO service_role;

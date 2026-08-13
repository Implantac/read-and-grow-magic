-- SECURITY DEFINER HARDENING
-- Setting search_path to 'public' for critical functions found in security audit

ALTER FUNCTION public.get_dre_summary(date, date) SET search_path = public;
ALTER FUNCTION public.get_account_statement(text, uuid, date, date) SET search_path = public;
ALTER FUNCTION public.has_role(_user_id uuid, _role public.app_role) SET search_path = public;
ALTER FUNCTION public.get_user_company_id(_user_id uuid) SET search_path = public;
ALTER FUNCTION public.set_company_id_from_user() SET search_path = public;
ALTER FUNCTION public.generate_nfe_from_order() SET search_path = public;
ALTER FUNCTION public.generate_receivable_from_sale() SET search_path = public;
ALTER FUNCTION public.generate_payable_from_purchase() SET search_path = public;
ALTER FUNCTION public.sync_stock_balance_from_movement() SET search_path = public;
ALTER FUNCTION public.audit_logs_immutable_guard() SET search_path = public;

-- Revoke EXECUTE from PUBLIC/authenticated for high-privilege functions
REVOKE EXECUTE ON FUNCTION public.close_fiscal_day(date) FROM public, authenticated, anon;
REVOKE EXECUTE ON FUNCTION public.purge_old_audit_logs(integer) FROM public, authenticated, anon;
REVOKE EXECUTE ON FUNCTION public.reinf_close_period(date) FROM public, authenticated, anon;
REVOKE EXECUTE ON FUNCTION public.reinf_open_period(date) FROM public, authenticated, anon;
REVOKE EXECUTE ON FUNCTION public.reinf_reopen_period(uuid) FROM public, authenticated, anon;
REVOKE EXECUTE ON FUNCTION public.audit_logs_immutable_guard() FROM public, authenticated, anon;

-- Grant EXECUTE to service_role for system maintenance
GRANT EXECUTE ON FUNCTION public.close_fiscal_day(date) TO service_role;
GRANT EXECUTE ON FUNCTION public.purge_old_audit_logs(integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.reinf_close_period(date) TO service_role;
GRANT EXECUTE ON FUNCTION public.reinf_open_period(date) TO service_role;
GRANT EXECUTE ON FUNCTION public.reinf_reopen_period(uuid) TO service_role;

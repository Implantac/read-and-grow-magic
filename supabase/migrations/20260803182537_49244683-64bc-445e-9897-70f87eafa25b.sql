-- Wave 2: Revoke EXECUTE on internal-only SECURITY DEFINER functions
-- Target: Functions that should NOT be called directly by users or frontend

REVOKE EXECUTE ON FUNCTION public.calculate_icms_st FROM PUBLIC, authenticated, anon;
REVOKE EXECUTE ON FUNCTION public.calculate_difal FROM PUBLIC, authenticated, anon;
REVOKE EXECUTE ON FUNCTION public.recompute_stock_balance FROM PUBLIC, authenticated, anon;
REVOKE EXECUTE ON FUNCTION public.purge_old_audit_logs FROM PUBLIC, authenticated, anon;
REVOKE EXECUTE ON FUNCTION public.purge_old_logs_all FROM PUBLIC, authenticated, anon;
REVOKE EXECUTE ON FUNCTION public.severity_rank FROM PUBLIC, authenticated, anon;
REVOKE EXECUTE ON FUNCTION public.refresh_wms_kpi_cache FROM PUBLIC, authenticated, anon;
REVOKE EXECUTE ON FUNCTION public.run_daily_reconciliation_alerts FROM PUBLIC, authenticated, anon;
REVOKE EXECUTE ON FUNCTION public.auto_resolve_reconciliation_alerts FROM PUBLIC, authenticated, anon;
REVOKE EXECUTE ON FUNCTION public.escalate_overdue_alerts FROM PUBLIC, authenticated, anon;
REVOKE EXECUTE ON FUNCTION public.get_internal_fn_secret FROM PUBLIC, authenticated, anon;

-- Grant execute to service_role (for background tasks/edge functions)
GRANT EXECUTE ON FUNCTION public.calculate_icms_st TO service_role;
GRANT EXECUTE ON FUNCTION public.calculate_difal TO service_role;
GRANT EXECUTE ON FUNCTION public.recompute_stock_balance TO service_role;
GRANT EXECUTE ON FUNCTION public.purge_old_audit_logs TO service_role;
GRANT EXECUTE ON FUNCTION public.purge_old_logs_all TO service_role;
GRANT EXECUTE ON FUNCTION public.severity_rank TO service_role;
GRANT EXECUTE ON FUNCTION public.refresh_wms_kpi_cache TO service_role;
GRANT EXECUTE ON FUNCTION public.run_daily_reconciliation_alerts TO service_role;
GRANT EXECUTE ON FUNCTION public.auto_resolve_reconciliation_alerts TO service_role;
GRANT EXECUTE ON FUNCTION public.escalate_overdue_alerts TO service_role;
GRANT EXECUTE ON FUNCTION public.get_internal_fn_secret TO service_role;

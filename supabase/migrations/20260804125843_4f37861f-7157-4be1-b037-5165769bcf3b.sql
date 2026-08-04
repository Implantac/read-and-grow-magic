-- Massive Security Hardening: Revoke and Whitelist SECURITY DEFINER functions
-- This addresses the remaining linter warnings by restricting EXECUTE permissions.

-- 1. Whitelist: Functions that MUST be callable by 'authenticated' for RLS or UI
GRANT EXECUTE ON FUNCTION public.get_user_company_id(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_branch_id(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_branch_ids(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_role(uuid) TO authenticated;

-- 2. Revoke: Functions that should NOT be callable by 'authenticated' or 'anon'
-- We target sensitive internal processes and bulk actions.

-- Financial / Accounting
REVOKE EXECUTE ON FUNCTION public.dre_managerial_entries(uuid, date, date, uuid, uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.batch_pay_payables(uuid[], uuid, text, date, text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.manual_match_transaction(uuid, uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.reverse_settlement(uuid, text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.compensate_check(uuid, uuid, date) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.auto_match_bank_transactions(uuid, integer) FROM PUBLIC;

-- Production / PCP
REVOKE EXECUTE ON FUNCTION public.generate_production_order_from_order() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.audit_stock_adjustment() FROM PUBLIC;

-- Fiscal
REVOKE EXECUTE ON FUNCTION public.generate_nfe_from_order() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.reopen_fiscal_day(uuid, date, text) FROM PUBLIC;

-- WMS
REVOKE EXECUTE ON FUNCTION public.wms_update_shipment_stage(uuid, text, text, text, text, text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.process_rfid_event_for_wms() FROM PUBLIC;

-- System / Audit
REVOKE EXECUTE ON FUNCTION public.purge_old_audit_logs(integer) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_internal_fn_secret() FROM PUBLIC;

-- Ensure service_role can still call them for Edge Functions
GRANT EXECUTE ON FUNCTION public.dre_managerial_entries(uuid, date, date, uuid, uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.batch_pay_payables(uuid[], uuid, text, date, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.manual_match_transaction(uuid, uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.reopen_fiscal_day(uuid, date, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.get_internal_fn_secret() TO service_role;


-- Harden SECURITY DEFINER functions: revoke EXECUTE from authenticated/anon
-- for trigger-only and backend-only routines. Service role retains access.

-- Trigger functions (called by Postgres internally, never as RPC)
REVOKE EXECUTE ON FUNCTION public.aggregate_nfe_totals() FROM authenticated, anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.apply_lot_movement() FROM authenticated, anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.auto_create_settlement_from_payment() FROM authenticated, anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.check_production_delay_alert() FROM authenticated, anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.emit_production_order_event() FROM authenticated, anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.emit_time_entry_event() FROM authenticated, anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.enforce_period_lock() FROM authenticated, anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.evaluate_workflow_triggers() FROM authenticated, anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.fn_audit_sensitive_mutation() FROM authenticated, anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.fn_emit_wms_event() FROM authenticated, anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.fn_evaluate_alert_rules() FROM authenticated, anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.fn_notify_incident_email() FROM authenticated, anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.fn_pqc_set_company_id() FROM authenticated, anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.fn_route_stops_progress() FROM authenticated, anon, PUBLIC;

-- Backend / cron / admin-only routines
REVOKE EXECUTE ON FUNCTION public.auto_match_bank_transactions(uuid, integer) FROM authenticated, anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.backfill_default_lots() FROM authenticated, anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.calculate_financial_health_score() FROM authenticated, anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.close_all_billing_periods() FROM authenticated, anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.close_billing_period(uuid, text) FROM authenticated, anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.close_accounting_period(integer, integer) FROM authenticated, anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.detect_cashflow_risks() FROM authenticated, anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.detect_financial_alerts() FROM authenticated, anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.refresh_wms_kpi_cache(uuid) FROM authenticated, anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.evaluate_transaction_risk(numeric, text, uuid, text, text) FROM authenticated, anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.fn_emit_automation_event(uuid, text, jsonb) FROM authenticated, anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.fn_record_event(text, text, text, text, jsonb, uuid) FROM authenticated, anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.batch_pay_payables(uuid[], uuid, text, date, text) FROM authenticated, anon, PUBLIC;

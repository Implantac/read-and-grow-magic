DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT p.oid::regprocedure AS sig
    FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.prosecdef
      AND p.proname IN (
        'calculate_difal','calculate_icms_st','can_access_company','cx_ensure_default_weights',
        'get_usage_summary','get_user_branch_ids','has_branch_access','has_module_access',
        'purchase_approval_sla_status','recompute_stock_balance','sre_actions_due_scan',
        'sre_current_oncall','sre_postmortems_by_slo','sre_runbooks_for_slo'
      )
  LOOP
    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC, anon, authenticated', r.sig);
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO service_role', r.sig);
  END LOOP;
END $$;
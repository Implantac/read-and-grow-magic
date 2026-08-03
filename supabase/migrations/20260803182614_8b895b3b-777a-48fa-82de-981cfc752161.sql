-- Wave 3: Revoke EXECUTE on more internal-only SECURITY DEFINER functions (Fixed)
-- Target: Functions that should NOT be called directly by users or frontend

DO $$ 
DECLARE 
    func_name text;
    funcs text[] := ARRAY[
        'backfill_default_lots',
        'validate_lot_stock_consistency',
        'recalc_bank_balance',
        'run_financial_audit',
        'match_bank_transaction',
        'process_pix_payment',
        'calculate_financial_health_score',
        'detect_cashflow_risks',
        'evaluate_transaction_risk',
        'update_entity_risk_profile',
        'generate_sped_fiscal',
        'generate_sped_contribuicoes',
        'import_bank_statement_batch',
        'auto_match_bank_transactions',
        'manual_match_transaction',
        'resolve_accounting_pair',
        'get_consolidated_company_ids',
        'get_consolidated_revenue',
        'check_hierarchy_access',
        'get_headquarters_branch',
        'has_branch_access',
        'has_module_access',
        'current_billing_period',
        'increment_usage',
        'close_billing_period',
        'close_all_billing_periods',
        'fn_record_event',
        'fn_evaluate_alert_rules',
        'plugin_quota_remaining'
    ];
BEGIN
    FOREACH func_name IN ARRAY funcs LOOP
        -- We use a TRY-CATCH block to skip functions that might have been partially revoked or don't exist
        BEGIN
            EXECUTE format('REVOKE EXECUTE ON FUNCTION public.%I FROM PUBLIC, authenticated, anon', func_name);
            EXECUTE format('GRANT EXECUTE ON FUNCTION public.%I TO service_role', func_name);
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Skipping %: %', func_name, SQLERRM;
        END;
    END LOOP;
END $$;

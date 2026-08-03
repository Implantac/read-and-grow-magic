-- Hardening DB Security Wave 4: Massive Revoke with Type Safety
-- Objective: Revoke EXECUTE on non-whitelisted functions using pg_proc for unique identification.

DO $$ 
DECLARE 
    r record;
    whitelist_names text[] := ARRAY[
        'has_role', 'has_permission', 'has_module_access', 'has_branch_access', 
        'get_user_company_id', 'get_user_role', 'check_quota', 'compensate_check',
        'handle_new_user', 'get_current_usage_summary', 'get_plugin_reviews', 
        'get_plugin_rating_summary', 'is_system_admin', 'get_wms_kpis',
        'get_available_plans', 'get_tenant_plan_details', 'search_public_products',
        'get_user_branch_id', 'get_user_branch_ids', 'purchase_submit_for_approval',
        'purchase_approval_decide', 'dre_managerial'
    ];
BEGIN
    FOR r IN 
        SELECT p.oid, p.proname, n.nspname, pg_get_function_identity_arguments(p.oid) as args
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public'
    LOOP
        -- If not in whitelist, revoke execute
        IF NOT (r.proname = ANY(whitelist_names)) THEN
            BEGIN
                EXECUTE format('REVOKE EXECUTE ON FUNCTION public.%I(%s) FROM PUBLIC, authenticated, anon', r.proname, r.args);
                EXECUTE format('GRANT EXECUTE ON FUNCTION public.%I(%s) TO service_role', r.proname, r.args);
            EXCEPTION WHEN OTHERS THEN
                RAISE NOTICE 'Skipping revoke for %: %', r.proname, SQLERRM;
            END;
        ELSE
            -- Ensure authenticated can execute whitelisted functions
            BEGIN
                EXECUTE format('GRANT EXECUTE ON FUNCTION public.%I(%s) TO authenticated', r.proname, r.args);
            EXCEPTION WHEN OTHERS THEN
                RAISE NOTICE 'Skipping grant for %: %', r.proname, SQLERRM;
            END;
        END IF;
    END LOOP;
END $$;

-- 1. Forçar atualização do Plano Enterprise
DO $$ 
DECLARE 
    ent_plan_id UUID;
    target_user_id UUID;
    target_company_id UUID;
BEGIN
    -- Obter plano
    SELECT id INTO ent_plan_id FROM public.plans WHERE slug = 'enterprise' LIMIT 1;
    
    -- Garantir que o plano tenha TODOS os módulos no array allowed_modules
    UPDATE public.plans 
    SET allowed_modules = ARRAY['admin', 'comercial', 'financeiro', 'estoque', 'producao', 'fiscal', 'wms', 'nps', 'executivo', 'use_success', 'cerebro_nativo', 'contabilidade', 'governanca', 'marketplace', 'crm', 'saude', 'agro', 'construcao', 'educacao'],
        is_active = true,
        max_users = 9999,
        ai_calls_per_month = -1
    WHERE id = ent_plan_id;

    -- 2. Garantir que módulos individuais estejam habilitados na plan_modules
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'plan_modules') THEN
        INSERT INTO public.plan_modules (plan_id, module_key, enabled)
        SELECT ent_plan_id, m, true
        FROM unnest(ARRAY['admin', 'comercial', 'financeiro', 'estoque', 'producao', 'fiscal', 'wms', 'nps', 'executivo', 'use_success', 'cerebro_nativo', 'contabilidade']) AS m
        ON CONFLICT (plan_id, module_key) DO UPDATE SET enabled = true;
    END IF;

    -- 3. Sincronizar assinatura do usuário
    SELECT id INTO target_user_id FROM auth.users WHERE email = 'etcsuporte889@gmail.com';
    IF target_user_id IS NOT NULL THEN
        SELECT company_id INTO target_company_id FROM public.profiles WHERE id = target_user_id LIMIT 1;
        
        IF target_company_id IS NOT NULL THEN
            UPDATE public.subscriptions 
            SET plan_id = ent_plan_id, 
                status = 'active', 
                current_period_end = '2099-12-31 23:59:59'
            WHERE company_id = target_company_id;
        END IF;
    END IF;
END $$;

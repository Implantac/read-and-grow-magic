-- 1. Obter informações básicas
DO $$ 
DECLARE 
    target_user_id UUID;
    target_company_id UUID;
    enterprise_plan_id UUID;
BEGIN
    -- Localizar o usuário
    SELECT id INTO target_user_id FROM auth.users WHERE email = 'etcsuporte889@gmail.com';

    IF target_user_id IS NULL THEN
        RAISE NOTICE 'Usuário etcsuporte889@gmail.com não encontrado.';
    ELSE
        -- 2. Garantir que o perfil existe e obter a company_id
        SELECT company_id INTO target_company_id FROM public.profiles WHERE id = target_user_id LIMIT 1;

        -- Se o usuário não tiver empresa, criar uma empresa padrão para suporte
        IF target_company_id IS NULL THEN
            INSERT INTO public.companies (name, legal_name, status)
            VALUES ('Suporte Use ERP', 'Suporte Use ERP Ltda', 'active')
            RETURNING id INTO target_company_id;

            UPDATE public.profiles SET company_id = target_company_id, role = 'admin' WHERE id = target_user_id;
        END IF;

        -- 3. Inserir na user_roles respeitando a constraint de company_id
        INSERT INTO public.user_roles (user_id, role, company_id)
        VALUES (target_user_id, 'admin', target_company_id)
        ON CONFLICT (user_id, role) DO NOTHING;

        -- 4. Garantir Plano Enterprise GOD MODE (usando slug e allowed_modules ARRAY)
        SELECT id INTO enterprise_plan_id FROM public.plans WHERE slug = 'enterprise' LIMIT 1;
        
        IF enterprise_plan_id IS NULL THEN
            INSERT INTO public.plans (name, slug, price_monthly, price_annual, allowed_modules, is_active, max_users, max_companies, ai_calls_per_month)
            VALUES (
                'Enterprise God Mode', 
                'enterprise', 
                0, 
                0, 
                ARRAY['admin', 'comercial', 'financeiro', 'estoque', 'producao', 'fiscal', 'wms', 'nps', 'executivo', 'use_success', 'cerebro_nativo', 'quality_control', 'tms', 'agro', 'health', 'construction'],
                true,
                9999,
                999,
                -1
            ) RETURNING id INTO enterprise_plan_id;
        ELSE
            UPDATE public.plans 
            SET allowed_modules = ARRAY['admin', 'comercial', 'financeiro', 'estoque', 'producao', 'fiscal', 'wms', 'nps', 'executivo', 'use_success', 'cerebro_nativo', 'quality_control', 'tms', 'agro', 'health', 'construction'],
                is_active = true,
                max_users = 9999,
                ai_calls_per_month = -1
            WHERE id = enterprise_plan_id;
        END IF;

        -- 5. Ativar assinatura vitalícia (Modo Deus)
        INSERT INTO public.subscriptions (company_id, plan_id, status, current_period_end)
        VALUES (target_company_id, enterprise_plan_id, 'active', '2099-12-31 23:59:59')
        ON CONFLICT (company_id) DO UPDATE 
        SET plan_id = enterprise_plan_id, 
            status = 'active', 
            current_period_end = '2099-12-31 23:59:59',
            cancel_at_period_end = false;

        -- 6. Garantir módulos em plan_modules (usando module_key)
        IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'plan_modules') THEN
            INSERT INTO public.plan_modules (plan_id, module_key, enabled)
            SELECT enterprise_plan_id, m, true
            FROM unnest(ARRAY['admin', 'comercial', 'financeiro', 'estoque', 'producao', 'fiscal', 'wms', 'nps', 'executivo', 'use_success', 'cerebro_nativo']) AS m
            ON CONFLICT (plan_id, module_key) DO UPDATE SET enabled = true;
        END IF;
        
        RAISE NOTICE 'Operação concluída: etcsuporte889@gmail.com agora possui ACESSO TOTAL E IRRESTRITO.';
    END IF;
END $$;

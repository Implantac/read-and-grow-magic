import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useEnterpriseStore } from '@/core/stores/useEnterpriseStore';
import { usePermission } from '@/hooks/usePermission';

/**
 * AUD-3: hook unificado de acesso.
 *
 * Combina três eixos:
 *  - **role**: `has_role` (RBAC).
 *  - **permissão granular**: `has_permission` (resource/action).
 *  - **plano/módulo**: `plan_modules` + `subscription` ativa da empresa.
 *
 * Uso típico:
 *   const { allowed, loading, reason } = useAccess({
 *     module: 'wms',
 *     resource: 'inbound',
 *     action: 'create',
 *     role: 'operator',
 *   });
 *
 * Todos os parâmetros são opcionais: quando nenhum critério é fornecido,
 * o hook retorna `allowed = true` (apenas gate de autenticação).
 */
export interface UseAccessInput {
  module?: string;
  resource?: string;
  action?: string;
  role?: string;
}

export type AccessDenyReason =
  | null
  | 'loading'
  | 'no-company'
  | 'plan-missing-module'
  | 'no-permission'
  | 'no-role';

export interface UseAccessResult {
  allowed: boolean;
  loading: boolean;
  reason: AccessDenyReason;
}

export function useAccess(input: UseAccessInput = {}): UseAccessResult {
  const { module, resource, action, role } = input;
  const companyId = useEnterpriseStore((s) => s.activeCompanyId);

  // Eixo 1: permissão granular (resource/action) — reusa hook existente.
  const permission = usePermission(resource ?? '__noop__', action ?? '__noop__');
  const permissionActive = !!(resource && action);

  // Eixo 2: role
  const roleQuery = useQuery({
    queryKey: ['useAccess', 'role', role],
    enabled: !!role,
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;
      const { data, error } = await supabase.rpc('has_role', {
        _user_id: user.id,
        _role: role as never,
      });
      if (error) return false;
      return !!data;
    },
  });

  // Eixo 3: módulo habilitado pelo plano ativo da empresa.
  const moduleQuery = useQuery({
    queryKey: ['useAccess', 'module', companyId, module],
    enabled: !!module && !!companyId,
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const { data: sub } = await supabase
        .from('subscriptions')
        .select('plan_id, status')
        .eq('company_id', companyId!)
        .maybeSingle();
      if (!sub?.plan_id) return { hasSub: false, enabled: false };
      const activeStatus = ['active', 'trialing', 'past_due'].includes(sub.status);
      if (!activeStatus) return { hasSub: true, enabled: false };

      const { data: pm } = await supabase
        .from('plan_modules')
        .select('enabled')
        .eq('plan_id', sub.plan_id)
        .eq('module_key', module!)
        .maybeSingle();

      return { hasSub: true, enabled: !!pm?.enabled };
    },
  });

  const loading =
    (permissionActive && permission.loading) ||
    (!!role && roleQuery.isLoading) ||
    (!!module && (moduleQuery.isLoading || (!!module && !companyId)));

  if (loading) return { allowed: false, loading: true, reason: 'loading' };

  if (module) {
    if (!companyId) return { allowed: false, loading: false, reason: 'no-company' };
    if (!moduleQuery.data?.enabled)
      return { allowed: false, loading: false, reason: 'plan-missing-module' };
  }
  if (permissionActive && !permission.allowed)
    return { allowed: false, loading: false, reason: 'no-permission' };
  if (role && !roleQuery.data)
    return { allowed: false, loading: false, reason: 'no-role' };

  return { allowed: true, loading: false, reason: null };
}

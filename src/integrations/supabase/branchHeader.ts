/**
 * Injects the active branch id (x-branch-id) into every
 * supabase.functions.invoke() call so edge functions can scope
 * queries to the user's currently selected branch.
 *
 * Also intercepts 402 (plan_required) and 403 (module_locked) responses
 * and redirects the user to /upgrade with the relevant module hint.
 *
 * The Supabase client itself is auto-generated and must not be edited,
 * so we monkey-patch the `functions.invoke` method once at app boot.
 */
import { toast } from 'sonner';
import { supabase } from './client';
import { getActiveBranchId } from '@/core/stores/useEnterpriseStore';
import { moduleLabel } from '@/lib/moduleLabels';

let installed = false;
let lastRedirectAt = 0;

async function extractErrorBody(err: any): Promise<{ status?: number; body?: any }> {
  try {
    const resp: Response | undefined = err?.context?.response ?? err?.response;
    if (!resp) return { status: err?.context?.status ?? err?.status };
    const status = resp.status;
    try {
      const cloned = resp.clone();
      const text = await cloned.text();
      try {
        return { status, body: JSON.parse(text) };
      } catch {
        return { status, body: { error: text } };
      }
    } catch {
      return { status };
    }
  } catch {
    return {};
  }
}

function redirectToUpgrade(params: { module?: string; requiredPlan?: string; reason?: string }) {
  const now = Date.now();
  if (now - lastRedirectAt < 1500) return;
  lastRedirectAt = now;
  const qs = new URLSearchParams();
  if (params.module) qs.set('module', params.module);
  if (params.requiredPlan) qs.set('plan', params.requiredPlan);
  if (params.reason) qs.set('reason', params.reason);
  const target = qs.toString() ? `/upgrade?${qs.toString()}` : '/upgrade';
  if (typeof window !== 'undefined' && window.location.pathname !== '/upgrade') {
    window.location.assign(target);
  }
}

export async function handlePlanErrorResponse(err: any): Promise<boolean> {
  const { status, body } = await extractErrorBody(err);
  const moduleKey: string | undefined = body?.module;
  const requiredPlan: string | undefined = body?.required_plan ?? undefined;
  const currentPlan: string | undefined = body?.current_plan ?? undefined;
  const label = moduleLabel(moduleKey);

  if (status === 402 && (body?.error ?? 'plan_required') === 'plan_required') {
    toast.error('Assinatura necessária', {
      description: requiredPlan
        ? `Para usar ${label} ative o plano ${requiredPlan}.`
        : `Você precisa de uma assinatura ativa para usar ${label}.`,
    });
    redirectToUpgrade({ module: moduleKey, requiredPlan, reason: 'plan_required' });
    return true;
  }

  if (status === 403 && body?.error === 'module_locked') {
    toast.error(`${label} indisponível no seu plano`, {
      description: requiredPlan
        ? `Faça upgrade para o plano ${requiredPlan} para liberar este módulo${
            currentPlan ? ` (atual: ${currentPlan})` : ''
          }.`
        : `Este módulo não está incluso no seu plano${currentPlan ? ` ${currentPlan}` : ''}.`,
    });
    redirectToUpgrade({ module: moduleKey, requiredPlan, reason: 'module_locked' });
    return true;
  }

  if (status === 402 && body?.error === 'quota_exceeded') {
    const metric: string = body?.metric ?? '';
    const limit = body?.limit;
    const metricLabels: Record<string, string> = {
      orders: 'pedidos',
      nfe: 'NF-e',
      ai_calls: 'chamadas de IA',
      users: 'usuários',
      branches: 'filiais',
    };
    const ml = metricLabels[metric] ?? metric;
    toast.error('Limite do plano atingido', {
      description: limit
        ? `Você atingiu o limite de ${limit.toLocaleString('pt-BR')} ${ml} no mês. Faça upgrade para continuar.`
        : `Você atingiu o limite de ${ml} no mês. Faça upgrade para continuar.`,
    });
    redirectToUpgrade({ reason: 'quota_exceeded' });
    return true;
  }

  return false;
}

export function installBranchHeaderInterceptor() {
  if (installed) return;
  installed = true;

  const fns = supabase.functions as unknown as {
    invoke: (name: string, options?: any) => Promise<any>;
  };
  const originalInvoke = fns.invoke.bind(fns);

  fns.invoke = async (name: string, options: any = {}) => {
    const branchId = getActiveBranchId();
    const headers = { ...(options.headers ?? {}) };
    if (branchId && !('x-branch-id' in headers) && !('X-Branch-Id' in headers)) {
      headers['x-branch-id'] = branchId;
    }
    const result = await originalInvoke(name, { ...options, headers });
    if (result?.error) {
      await handlePlanErrorResponse(result.error);
    }
    return result;
  };
}

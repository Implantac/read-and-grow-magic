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

let installed = false;
let lastRedirectAt = 0;

async function extractErrorBody(err: any): Promise<{ status?: number; body?: any }> {
  try {
    const resp: Response | undefined = err?.context?.response ?? err?.response;
    if (!resp) return { status: err?.context?.status ?? err?.status };
    const status = resp.status;
    // Response may have been consumed; try clone first
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

function redirectToUpgrade(moduleKey?: string) {
  const now = Date.now();
  if (now - lastRedirectAt < 1500) return;
  lastRedirectAt = now;
  const target = moduleKey
    ? `/upgrade?module=${encodeURIComponent(moduleKey)}`
    : '/upgrade';
  if (typeof window !== 'undefined' && window.location.pathname !== '/upgrade') {
    window.location.assign(target);
  }
}

export async function handlePlanErrorResponse(err: any): Promise<boolean> {
  const { status, body } = await extractErrorBody(err);
  if (status === 402) {
    const code = body?.error ?? 'plan_required';
    if (code === 'plan_required') {
      toast.error('Plano necessário', {
        description: 'Você precisa de uma assinatura ativa para usar este recurso.',
      });
      redirectToUpgrade(body?.module);
      return true;
    }
  }
  if (status === 403) {
    const code = body?.error ?? '';
    if (code === 'module_locked') {
      const moduleKey: string | undefined = body?.module;
      toast.error('Módulo bloqueado no seu plano', {
        description: moduleKey
          ? `O módulo "${moduleKey}" não está incluso no seu plano atual.`
          : 'Este módulo não está incluso no seu plano atual.',
      });
      redirectToUpgrade(moduleKey);
      return true;
    }
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

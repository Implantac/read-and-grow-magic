/**
 * Injects the active branch id (x-branch-id) into every
 * supabase.functions.invoke() call so edge functions can scope
 * queries to the user's currently selected branch.
 *
 * The Supabase client itself is auto-generated and must not be edited,
 * so we monkey-patch the `functions.invoke` method once at app boot.
 */
import { supabase } from './client';
import { getActiveBranchId } from '@/core/stores/useEnterpriseStore';

let installed = false;

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
    return originalInvoke(name, { ...options, headers });
  };
}

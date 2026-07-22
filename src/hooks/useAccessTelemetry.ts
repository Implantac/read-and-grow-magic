import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useEnterpriseStore } from '@/core/stores/useEnterpriseStore';
import type { AccessDenyReason, UseAccessInput } from './useAccess';

/**
 * AUD-5: registra tentativas de acesso negado em `system_audit_logs`.
 *
 * - Só loga quando há `company_id` (RLS exige) e reason ≠ null/loading.
 * - Deduplica por sessão (user+company+criteria+reason) via sessionStorage
 *   para evitar spam em re-renders.
 */
const SESSION_KEY = 'aud5_denied_keys';

function alreadyLogged(key: string): boolean {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    const set = raw ? new Set<string>(JSON.parse(raw)) : new Set<string>();
    if (set.has(key)) return true;
    set.add(key);
    sessionStorage.setItem(SESSION_KEY, JSON.stringify([...set].slice(-200)));
    return false;
  } catch {
    return false;
  }
}

export function useAccessTelemetry(
  criteria: UseAccessInput,
  result: { allowed: boolean; loading: boolean; reason: AccessDenyReason },
) {
  const companyId = useEnterpriseStore((s) => s.activeCompanyId);
  const logged = useRef(false);

  useEffect(() => {
    if (result.loading || result.allowed) return;
    if (!result.reason || result.reason === 'loading') return;
    if (!companyId) return;
    if (logged.current) return;

    const key = [
      companyId,
      criteria.module ?? '',
      criteria.resource ?? '',
      criteria.action ?? '',
      (criteria.role ?? '') + (criteria.roles?.join(',') ?? ''),
      result.reason,
    ].join('|');

    if (alreadyLogged(key)) {
      logged.current = true;
      return;
    }
    logged.current = true;

    (async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        await supabase.from('system_audit_logs').insert({
          user_id: user?.id ?? null,
          company_id: companyId,
          action: 'access_denied',
          module: criteria.module ?? criteria.resource ?? 'unknown',
          entity_name: criteria.resource ?? null,
          new_data: {
            reason: result.reason,
            criteria: {
              module: criteria.module,
              resource: criteria.resource,
              action: criteria.action,
              role: criteria.role,
              roles: criteria.roles,
            },
            path: typeof window !== 'undefined' ? window.location.pathname : null,
          },
          user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : null,
        });
      } catch {
        /* telemetria nunca deve quebrar UX */
      }
    })();
  }, [result.allowed, result.loading, result.reason, companyId, criteria]);
}

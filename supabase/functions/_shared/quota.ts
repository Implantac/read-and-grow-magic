// Hard-cap enforcer for AI / metered actions.
// Returns 402 (Payment Required) when the company has exhausted the
// monthly quota for the given metric. Companies without a subscription
// are treated as unlimited (legacy / internal tenants).
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

let _admin: ReturnType<typeof createClient> | null = null;
function admin() {
  if (_admin) return _admin;
  _admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );
  return _admin;
}

export type QuotaMetric = "ai_calls" | "nfe" | "orders" | "users" | "branches";

export interface QuotaResult {
  allowed: boolean;
  current: number;
  limit: number | null;
  remaining: number | null;
}

export async function checkQuota(
  companyId: string | null | undefined,
  metric: QuotaMetric,
): Promise<QuotaResult> {
  if (!companyId) return { allowed: true, current: 0, limit: null, remaining: null };
  try {
    const { data, error } = await admin().rpc("check_quota", {
      _company_id: companyId,
      _metric: metric,
    });
    if (error) {
      console.error("[checkQuota]", metric, error.message);
      return { allowed: true, current: 0, limit: null, remaining: null };
    }
    const q = (data ?? {}) as Partial<QuotaResult>;
    return {
      allowed: q.allowed !== false,
      current: Number(q.current ?? 0),
      limit: q.limit ?? null,
      remaining: q.remaining ?? null,
    };
  } catch (e) {
    console.error("[checkQuota] threw", metric, (e as Error).message);
    return { allowed: true, current: 0, limit: null, remaining: null };
  }
}

/**
 * Convenience: returns a Response if the quota is exhausted; otherwise null.
 * Caller pattern:
 *   const blocked = await enforceQuota(companyId, "ai_calls", corsHeaders);
 *   if (blocked) return blocked;
 */
export async function enforceQuota(
  companyId: string | null | undefined,
  metric: QuotaMetric,
  corsHeaders: Record<string, string> = {},
): Promise<Response | null> {
  const q = await checkQuota(companyId, metric);
  if (q.allowed) return null;
  return new Response(
    JSON.stringify({
      error: "quota_exceeded",
      message: `Limite mensal do plano atingido para ${metric}. Faça upgrade para continuar.`,
      metric,
      current: q.current,
      limit: q.limit,
    }),
    {
      status: 402,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    },
  );
}

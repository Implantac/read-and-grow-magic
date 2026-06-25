// Shared helpers to enforce multi-tenant isolation and safe error responses
// across edge functions. Use with `requireAuth` from ./require-auth.ts.
//
// Pattern:
//   const auth = await requireAuth(req, { roles: [...] });
//   if (!auth.ok) return jsonError(auth.message, auth.status);
//   const companyId = requireCompany(auth);
//   if (!companyId) return jsonError('Forbidden', 403);
//   await supabase.from('table').select('*').eq('company_id', companyId);

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-cron-secret, x-branch-id',
};

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import type { AuthResult } from "./require-auth.ts";

export interface TenantContext {
  ok: true;
  userId: string | null;
  companyId: string | null;
  branchId: string | null;        // selected branch (header x-branch-id or default)
  branchIds: string[];            // all branches caller can access (for cross-branch reads)
  viaCron: boolean;
}

export interface TenantError {
  ok: false;
  status: number;
  message: string;
}

/**
 * Resolves the full tenant context (company + branch) for the caller.
 * - Picks branch from header `x-branch-id` if provided and authorized,
 *   otherwise falls back to profile.default_branch_id.
 * - Loads the full set of branches the user has access to in their company,
 *   useful for cross-branch listings.
 *
 * Always call AFTER `requireAuth`. Returns 403 if a forced branch is
 * unauthorized for the caller.
 */
export async function resolveContext(
  req: Request,
  auth: AuthResult,
): Promise<TenantContext | TenantError> {
  // Cron callers get unrestricted context (no branch scope)
  if (auth.viaCron) {
    return {
      ok: true,
      userId: null,
      companyId: null,
      branchId: null,
      branchIds: [],
      viaCron: true,
    };
  }

  const companyId = auth.companyId;
  if (!companyId) {
    return { ok: false, status: 403, message: "Forbidden" };
  }

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  // All branches in the caller's company (RLS scoped via service role, but we filter explicitly)
  const { data: branchRows } = await admin
    .from("branches")
    .select("id")
    .eq("company_id", companyId)
    .eq("is_active", true);
  const branchIds = (branchRows ?? []).map((b: any) => b.id as string);

  // Branch from header takes precedence, fallback to default
  const requested = req.headers.get("x-branch-id");
  let branchId: string | null = auth.defaultBranchId ?? null;

  if (requested) {
    if (!branchIds.includes(requested)) {
      return { ok: false, status: 403, message: "Forbidden branch" };
    }
    branchId = requested;
  }

  // If still null but there are branches, pick the first (headquarters fallback)
  if (!branchId && branchIds.length > 0) {
    branchId = branchIds[0];
  }

  return {
    ok: true,
    userId: auth.userId,
    companyId,
    branchId,
    branchIds,
    viaCron: false,
  };
}

/**
 * Same as resolveContext but accepts raw {userId, companyId, defaultBranchId}
 * for code paths that don't use requireAuth (e.g. functions that do their
 * own auth via getClaims).
 */
export async function resolveContextByIds(
  req: Request,
  ids: { userId: string | null; companyId: string | null; defaultBranchId?: string | null },
): Promise<TenantContext | TenantError> {
  const fakeAuth: AuthResult = {
    ok: true,
    userId: ids.userId,
    role: null,
    viaCron: false,
    companyId: ids.companyId,
    defaultBranchId: ids.defaultBranchId ?? null,
  };
  return resolveContext(req, fakeAuth);
}

export interface CallerWithCompany {
  ok: true;
  companyId: string | null;
  userId: string | null;
}

/** Returns the caller's company_id or null when running via cron */
export function requireCompany(
  auth: { ok: true; companyId: string | null },
): string | null {
  return auth.companyId ?? null;
}

/** 403 if the resolved row does not belong to the caller's tenant */
export function assertSameCompany(
  rowCompanyId: string | null | undefined,
  callerCompanyId: string | null,
): boolean {
  if (!callerCompanyId) return false;
  return rowCompanyId === callerCompanyId;
}

/** 403 if row branch is outside caller's accessible branches */
export function assertSameBranch(
  rowBranchId: string | null | undefined,
  ctx: TenantContext,
): boolean {
  if (ctx.viaCron) return true;
  if (!rowBranchId) return true; // null branch = company-wide row
  return ctx.branchIds.includes(rowBranchId);
}

/**
 * Returns the branch_id list to use as filter, or null when no scoping
 * should be applied (cron / no branches). When the caller explicitly sent
 * x-branch-id, only that branch is returned; otherwise spans every branch
 * the user has access to in the company.
 *
 * Usage:
 *   const scope = branchScope(ctx);
 *   let q = supabase.from('production_orders').select('*').eq('company_id', companyId);
 *   if (scope) q = q.in('branch_id', scope);
 */
export function branchScope(ctx: TenantContext): string[] | null {
  if (ctx.viaCron) return null;
  if (!ctx.branchId && ctx.branchIds.length === 0) return null;
  // If caller has only one branch OR forced a specific branch via header,
  // narrow to a single id; otherwise span all accessible branches.
  if (ctx.branchIds.length <= 1) return ctx.branchId ? [ctx.branchId] : null;
  return ctx.branchIds;
}

/** Generic client-facing error; logs the original server-side. */
export function safeError(
  err: unknown,
  context: string,
  status = 500,
): Response {
  // Never leak driver/schema details
  console.error(`[${context}]`, err);
  return new Response(
    JSON.stringify({ error: 'Erro interno. Tente novamente.' }),
    { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
  );
}

export function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

export function jsonError(message: string, status: number): Response {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

/**
 * Server-side module access guard. Returns null if allowed, otherwise a 403
 * Response that the caller must return immediately. Cron callers are allowed.
 *
 * Usage:
 *   const denied = await requireModule(ctx, 'producao');
 *   if (denied) return denied;
 */
async function findCheapestPlanWithModule(
  admin: ReturnType<typeof createClient>,
  moduleKey: string,
): Promise<{ id: string; name: string; price_monthly: number } | null> {
  const { data } = await admin
    .from('plan_modules')
    .select('plan_id, plans:plan_id(id,name,price_monthly)')
    .eq('module_key', moduleKey)
    .eq('enabled', true);
  const plans = (data ?? [])
    .map((r: any) => r.plans)
    .filter(Boolean) as Array<{ id: string; name: string; price_monthly: number }>;
  plans.sort((a, b) => Number(a.price_monthly) - Number(b.price_monthly));
  return plans[0] ?? null;
}

export async function requireModule(
  ctx: TenantContext,
  moduleKey: string,
): Promise<Response | null> {
  if (ctx.viaCron) return null;
  if (!ctx.companyId) {
    return jsonError('Forbidden', 403);
  }

  const admin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  const { data: sub, error } = await admin
    .from('subscriptions')
    .select('plan_id, plans:plan_id(name)')
    .eq('company_id', ctx.companyId)
    .in('status', ['active', 'trialing', 'trial'])
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error('[requireModule] subscription lookup failed', error);
    return jsonError('Erro ao validar plano.', 500);
  }

  const required = await findCheapestPlanWithModule(admin, moduleKey);

  if (!sub?.plan_id) {
    return new Response(
      JSON.stringify({
        error: 'plan_required',
        module: moduleKey,
        required_plan: required?.name ?? null,
        required_plan_id: required?.id ?? null,
      }),
      { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }

  const { data: mod } = await admin
    .from('plan_modules')
    .select('enabled')
    .eq('plan_id', sub.plan_id)
    .eq('module_key', moduleKey)
    .eq('enabled', true)
    .maybeSingle();

  if (!mod) {
    const currentPlanName = (sub as any)?.plans?.name ?? null;
    return new Response(
      JSON.stringify({
        error: 'module_locked',
        module: moduleKey,
        current_plan: currentPlanName,
        required_plan: required?.name ?? null,
        required_plan_id: required?.id ?? null,
      }),
      { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }

  return null;
}

/**
 * Quota enforcement. Checks `check_quota` RPC against the caller's plan
 * and returns 402 if the limit was reached. Otherwise increments the
 * counter atomically. Pass increment=0 to perform a check-only call.
 *
 * Metrics: 'orders' | 'nfe' | 'ai_calls' | 'users' | 'branches'
 */
export async function enforceQuota(
  ctx: TenantContext,
  metric: 'orders' | 'nfe' | 'ai_calls' | 'users' | 'branches',
  increment = 1,
): Promise<Response | null> {
  if (ctx.viaCron || !ctx.companyId) return null;

  const admin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  const { data: quota, error } = await admin.rpc('check_quota', {
    _company_id: ctx.companyId,
    _metric: metric,
  });

  if (error) {
    console.error('[enforceQuota] check_quota failed', error);
    return jsonError('Erro ao validar quota.', 500);
  }

  const allowed = (quota as any)?.allowed ?? true;
  if (!allowed) {
    return new Response(
      JSON.stringify({
        error: 'quota_exceeded',
        metric,
        current: (quota as any)?.current ?? 0,
        limit: (quota as any)?.limit ?? null,
        period: (quota as any)?.period ?? null,
      }),
      { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }

  if (increment > 0) {
    const { error: incErr } = await admin.rpc('increment_usage', {
      _company_id: ctx.companyId,
      _metric: metric,
      _delta: increment,
    });
    if (incErr) console.error('[enforceQuota] increment_usage failed', incErr);
  }

  return null;
}

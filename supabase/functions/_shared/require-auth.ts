// Shared auth helper for edge functions that should require a logged-in user
// (optionally with a role from user_roles) OR a valid cron secret.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

export type Role = "admin" | "manager" | "operator" | "viewer";

export interface AuthResult {
  ok: true;
  userId: string | null;          // null when authorized via cron secret
  role: Role | null;
  viaCron: boolean;
  companyId: string | null;       // resolved from profiles when user is authenticated
  defaultBranchId: string | null; // user's default branch from profiles
}


export interface AuthError {
  ok: false;
  status: number;
  message: string;
}

export async function requireAuth(
  req: Request,
  opts: { roles?: Role[]; allowCron?: boolean; allowInternal?: boolean } = {},
): Promise<AuthResult | AuthError> {
  const { roles, allowCron, allowInternal } = opts;

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  // 1. Internal System Callers (Service Role, Cron, or Internal Secret)
  if (allowCron || allowInternal) {
    const cronSecret = Deno.env.get("CRON_SECRET");
    const providedCron = req.headers.get("x-cron-secret");
    const isCron = !!cronSecret && !!providedCron && providedCron === cronSecret;

    const authHeader = req.headers.get("Authorization");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const isServiceRole = !!serviceKey && authHeader === `Bearer ${serviceKey}`;

    const providedInternal = req.headers.get("x-internal-secret");
    let isInternal = false;
    if (providedInternal) {
      const { data } = await supabase
        .from("internal_fn_secrets")
        .select("value")
        .eq("name", "edge_internal")
        .maybeSingle();
      isInternal = !!data?.value && data.value === providedInternal;
    }

    if (isCron || isServiceRole || isInternal) {
      return { ok: true, userId: null, role: null, viaCron: true, companyId: null, defaultBranchId: null };
    }
  }

  // 2. User Authentication
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return { ok: false, status: 401, message: "Unauthorized" };
  }

  const token = authHeader.replace("Bearer ", "");
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data?.user) {
    return { ok: false, status: 401, message: "Unauthorized" };
  }

  let role: Role | null = null;
  if (roles && roles.length > 0) {
    const { data: rows } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", data.user.id);
    const userRoles = (rows ?? []).map((r: any) => r.role as Role);
    const matched = roles.find((r) => userRoles.includes(r));
    if (!matched) {
      return { ok: false, status: 403, message: "Forbidden" };
    }
    role = matched;
  }

  // Resolve caller's company_id + default branch from profiles for tenant scoping
  let companyId: string | null = null;
  let defaultBranchId: string | null = null;
  const { data: profile } = await supabase
    .from("profiles")
    .select("company_id, default_branch_id")
    .eq("id", data.user.id)
    .maybeSingle();
  companyId = (profile as any)?.company_id ?? null;
  defaultBranchId = (profile as any)?.default_branch_id ?? null;

  return { ok: true, userId: data.user.id, role, viaCron: false, companyId, defaultBranchId };
}


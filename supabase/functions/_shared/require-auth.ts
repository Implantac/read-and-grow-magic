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
}


export interface AuthError {
  ok: false;
  status: number;
  message: string;
}

export async function requireAuth(
  req: Request,
  opts: { roles?: Role[]; allowCron?: boolean } = {},
): Promise<AuthResult | AuthError> {
  const { roles, allowCron } = opts;

  // Cron secret path (used by Supabase scheduled functions)
  if (allowCron) {
    const cronSecret = Deno.env.get("CRON_SECRET");
    const provided = req.headers.get("x-cron-secret");
    if (cronSecret && provided && provided === cronSecret) {
      return { ok: true, userId: null, role: null, viaCron: true };
    }
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return { ok: false, status: 401, message: "Unauthorized" };
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );
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

  return { ok: true, userId: data.user.id, role, viaCron: false };
}

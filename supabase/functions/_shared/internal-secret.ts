// Shared helpers to authenticate internal (database trigger / cron / edge-to-edge)
// calls to edge functions that run with the service-role key.
//
// Two accepted proofs:
//  1. `x-internal-secret` header matching the secret stored in public.internal_fn_secrets
//     (used by pg_net triggers and pg_cron jobs).
//  2. `Authorization: Bearer <SUPABASE_SERVICE_ROLE_KEY>` (used by edge-to-edge calls).
import { createClient, type SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

export function hasServiceRoleAuth(req: Request): boolean {
  const header = req.headers.get("Authorization") ?? "";
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  return serviceKey.length > 0 && header === `Bearer ${serviceKey}`;
}

export function hasCronSecret(req: Request): boolean {
  const cronSecret = Deno.env.get("CRON_SECRET");
  const provided = req.headers.get("x-cron-secret");
  return !!cronSecret && !!provided && provided === cronSecret;
}

export async function hasInternalSecret(
  req: Request,
  client?: SupabaseClient,
): Promise<boolean> {
  const provided = req.headers.get("x-internal-secret");
  if (!provided) return false;
  const admin = client ?? createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );
  const { data } = await admin
    .from("internal_fn_secrets")
    .select("value")
    .eq("name", "edge_internal")
    .maybeSingle();
  const expected = (data as { value?: string } | null)?.value;
  return !!expected && expected === provided;
}

/** True when the caller proved it is an internal system caller. */
export async function isInternalCaller(
  req: Request,
  client?: SupabaseClient,
): Promise<boolean> {
  if (hasServiceRoleAuth(req) || hasCronSecret(req)) return true;
  return await hasInternalSecret(req, client);
}

export function unauthorized(corsHeaders: Record<string, string>): Response {
  return new Response(JSON.stringify({ error: "Unauthorized" }), {
    status: 401,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

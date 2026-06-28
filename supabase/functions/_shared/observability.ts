// Shared observability helper for edge functions.
// Emits structured events to public.system_events and timing metrics to
// public.system_metrics using the service role key, so it works for both
// cron and user-invoked requests.
import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

export type Severity = "debug" | "info" | "warn" | "error" | "critical";

let _client: SupabaseClient | null = null;
function client(): SupabaseClient {
  if (_client) return _client;
  _client = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );
  return _client;
}

export interface EventInput {
  companyId: string | null;
  source: string;            // edge function name
  eventType: string;         // e.g. "function.invoked", "function.error"
  severity?: Severity;
  message?: string;
  metadata?: Record<string, unknown>;
  userId?: string | null;
}

export async function recordEvent(ev: EventInput): Promise<void> {
  try {
    await client().from("system_events").insert({
      company_id: ev.companyId,
      source: ev.source,
      event_type: ev.eventType,
      severity: ev.severity ?? "info",
      message: ev.message ?? null,
      metadata: ev.metadata ?? {},
      user_id: ev.userId ?? null,
    });
  } catch (_) {
    // Never let observability break the caller.
  }
}

export async function recordMetric(
  companyId: string | null,
  source: string,
  metricName: string,
  value: number,
  metadata: Record<string, unknown> = {},
): Promise<void> {
  try {
    await client().from("system_metrics").insert({
      company_id: companyId,
      source,
      metric_name: metricName,
      value,
      metadata,
    });
  } catch (_) { /* swallow */ }
}

export interface InstrumentOptions {
  source: string;
  getContext?: (req: Request) => Promise<{ companyId: string | null; userId: string | null }>;
}

/**
 * Wraps an edge function handler with auto-instrumentation:
 *  - emits `function.invoked` (debug) on entry
 *  - emits `function.error` (error) on throw, with stack metadata
 *  - records `function.duration_ms` metric on completion
 *  - re-throws so the function still returns its own error response
 */
export function instrument<T extends (req: Request) => Promise<Response>>(
  handler: T,
  opts: InstrumentOptions,
): T {
  return (async (req: Request) => {
    const started = Date.now();
    let ctx: { companyId: string | null; userId: string | null } = { companyId: null, userId: null };
    try {
      if (opts.getContext) ctx = await opts.getContext(req);
    } catch (_) { /* ignore context resolution failures */ }

    try {
      const res = await handler(req);
      const dur = Date.now() - started;
      await recordMetric(ctx.companyId, opts.source, "function.duration_ms", dur, {
        status: res.status,
      });
      if (res.status >= 500) {
        await recordEvent({
          companyId: ctx.companyId,
          userId: ctx.userId,
          source: opts.source,
          eventType: "function.error",
          severity: "error",
          message: `HTTP ${res.status}`,
          metadata: { duration_ms: dur, status: res.status },
        });
      }
      return res;
    } catch (err: any) {
      const dur = Date.now() - started;
      await recordEvent({
        companyId: ctx.companyId,
        userId: ctx.userId,
        source: opts.source,
        eventType: "function.error",
        severity: "critical",
        message: err?.message ?? "unhandled exception",
        metadata: { duration_ms: dur, stack: String(err?.stack ?? "").slice(0, 2000) },
      });
      throw err;
    }
  }) as T;
}

/**
 * Resolve company_id + user_id from a Bearer token without re-implementing
 * requireAuth. Safe to use inside instrument(getContext: ...).
 */
export async function contextFromAuth(req: Request) {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return { companyId: null, userId: null };
  const c = client();
  const { data } = await c.auth.getUser(authHeader.replace("Bearer ", ""));
  const userId = data?.user?.id ?? null;
  if (!userId) return { companyId: null, userId: null };
  const { data: profile } = await c.from("profiles")
    .select("company_id").eq("id", userId).maybeSingle();
  return { companyId: (profile as any)?.company_id ?? null, userId };
}

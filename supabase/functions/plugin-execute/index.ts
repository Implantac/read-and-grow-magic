// Integration Hub — server-side executor for installed plugins.
// Dispatches per plugin.key, logs every call to plugin_executions (tenant-scoped).
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { requireAuth } from "../_shared/require-auth.ts";
import { corsHeaders, jsonError, safeError } from "../_shared/tenant.ts";
import { instrument, contextFromAuth } from "../_shared/observability.ts";

interface ExecBody {
  pluginKey: string;
  action: string;
  payload?: Record<string, unknown>;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const auth = await requireAuth(req);
  if (!auth.ok) return jsonError(auth.message, auth.status);
  if (!auth.companyId || !auth.userId) return jsonError("Forbidden", 403);

  let body: ExecBody;
  try {
    body = await req.json();
  } catch {
    return jsonError("Invalid JSON body", 400);
  }
  if (!body?.pluginKey || !body?.action) {
    return jsonError("pluginKey and action are required", 400);
  }

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  // Look up plugin and confirm the tenant has an active installation
  const { data: plugin } = await admin
    .from("plugins")
    .select("id, key, is_published, sandbox_script, manifest")
    .eq("key", body.pluginKey)
    .maybeSingle();
  if (!plugin || !plugin.is_published) return jsonError("Plugin not found", 404);

  const { data: install } = await admin
    .from("plugin_installations")
    .select("id, status, config, quota_per_day")
    .eq("plugin_id", plugin.id)
    .eq("company_id", auth.companyId)
    .maybeSingle();
  if (!install || install.status !== "active") {
    return jsonError("Plugin not installed or disabled", 403);
  }

  // Per-tenant daily quota
  const { data: remaining } = await admin.rpc("plugin_quota_remaining", {
    _installation_id: install.id,
  });
  if (typeof remaining === "number" && remaining <= 0) {
    return jsonError("Daily quota exceeded for this plugin", 429);
  }

  const startedAt = Date.now();
  let status: "success" | "error" = "success";
  let result: Record<string, unknown> | null = null;
  let errorMessage: string | null = null;
  let sandboxLogs: string[] = [];

  try {
    if (plugin.sandbox_script && plugin.sandbox_script.trim().length > 0) {
      const sandboxResult = await runSandbox(
        plugin.sandbox_script,
        body.action,
        body.payload ?? {},
        (install.config as Record<string, string>) ?? {},
      );
      sandboxLogs = sandboxResult.logs;
      if (!sandboxResult.ok) throw new Error(sandboxResult.error);
      result = { value: sandboxResult.result } as Record<string, unknown>;
    } else {
      result = await dispatch(plugin.key, body.action, body.payload ?? {});
    }
  } catch (err) {
    status = "error";
    errorMessage = err instanceof Error ? err.message : "unknown error";
  }

  await admin.from("plugin_executions").insert({
    company_id: auth.companyId,
    plugin_id: plugin.id,
    installation_id: install.id,
    action: body.action,
    status,
    payload: body.payload ?? {},
    result,
    error_message: errorMessage,
    executed_by: auth.userId,
    duration_ms: Date.now() - startedAt,
  });

  // Bill successful executions (usage-based)
  if (status === "success") {
    await admin.rpc("record_usage", {
      _company_id: auth.companyId,
      _meter_key: "plugin_execution",
      _quantity: 1,
      _source: "plugin-execute",
      _source_id: plugin.id,
      _metadata: { action: body.action, plugin_key: plugin.key },
    });
  }


  if (status === "error") {
    return new Response(
      JSON.stringify({ ok: false, error: errorMessage, logs: sandboxLogs }),
      { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
  return new Response(JSON.stringify({ ok: true, result, logs: sandboxLogs }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
};

interface SandboxOutcome {
  ok: boolean;
  result?: unknown;
  error?: string;
  logs: string[];
}

// Spawn a Web Worker with NO Deno permissions and a 3s hard timeout.
// The worker only sees what `sandbox-worker.ts` exposes (register, console.log, ctx.fetch, ctx.secrets).
async function runSandbox(
  script: string,
  action: string,
  payload: unknown,
  secrets: Record<string, string>,
): Promise<SandboxOutcome> {
  const workerUrl = new URL("./sandbox-worker.ts", import.meta.url);
  const worker = new Worker(workerUrl.href, {
    type: "module",
    deno: { permissions: "none" },
    // @ts-expect-error: Deno-specific worker option
  });

  return await new Promise<SandboxOutcome>((resolve) => {
    const timer = setTimeout(() => {
      worker.terminate();
      resolve({ ok: false, error: "Sandbox timeout (3s)", logs: [] });
    }, 3000);

    worker.onmessage = (ev: MessageEvent) => {
      clearTimeout(timer);
      worker.terminate();
      resolve(ev.data as SandboxOutcome);
    };
    worker.onerror = (ev) => {
      clearTimeout(timer);
      worker.terminate();
      resolve({ ok: false, error: ev.message || "Sandbox worker error", logs: [] });
    };
    worker.postMessage({ script, action, payload, secrets });
  });
}

Deno.serve(instrument(handler, { source: "plugin-execute", getContext: contextFromAuth }));

// Stubbed dispatch table — each plugin returns a structured envelope.
// Real outbound calls (WhatsApp, Itaú, Serasa, Correios) plug in here behind
// per-tenant secrets stored in plugin_installations.config.
async function dispatch(
  key: string,
  action: string,
  payload: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  switch (key) {
    case "whatsapp-sender":
      if (action !== "send") throw new Error(`Unsupported action: ${action}`);
      return { sent: true, to: payload.to ?? null, queuedAt: new Date().toISOString() };
    case "itau-open-banking":
      if (action !== "balance") throw new Error(`Unsupported action: ${action}`);
      return { balance: null, currency: "BRL", note: "configure credentials" };
    case "serasa-score":
      if (action !== "score") throw new Error(`Unsupported action: ${action}`);
      return { document: payload.document ?? null, score: null };
    case "correios-tracking":
      if (action !== "track") throw new Error(`Unsupported action: ${action}`);
      return { code: payload.code ?? null, events: [] };
    default:
      throw new Error(`Plugin '${key}' has no executor`);
  }
}

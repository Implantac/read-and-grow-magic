import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-branch-id",
};

interface DispatchPayload {
  event: string;
  context?: Record<string, unknown>;
}

function matchConditions(conditions: any[], context: Record<string, unknown>): boolean {
  if (!Array.isArray(conditions) || conditions.length === 0) return true;
  return conditions.every((c) => {
    const value = (context as any)?.[c.field];
    switch (c.operator) {
      case "eq": return value === c.value;
      case "neq": return value !== c.value;
      case "gt": return Number(value) > Number(c.value);
      case "lt": return Number(value) < Number(c.value);
      case "contains": return String(value ?? "").includes(String(c.value));
      default: return false;
    }
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData } = await userClient.auth.getUser();
    if (!userData.user) {
      return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const admin = createClient(supabaseUrl, serviceKey);
    const { data: profile } = await admin.from("profiles").select("company_id").eq("id", userData.user.id).maybeSingle();
    if (!profile?.company_id) {
      return new Response(JSON.stringify({ error: "no_company" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const body = (await req.json()) as DispatchPayload;
    if (!body?.event) {
      return new Response(JSON.stringify({ error: "invalid_event" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { data: rules } = await admin
      .from("automation_rules")
      .select("id, name, conditions, actions")
      .eq("company_id", profile.company_id)
      .eq("trigger_event", body.event)
      .eq("is_active", true);

    const executed: any[] = [];
    for (const rule of rules ?? []) {
      const ctx = body.context ?? {};
      if (!matchConditions((rule.conditions as any) ?? [], ctx)) continue;

      const actions = Array.isArray(rule.actions) ? rule.actions : [];
      const results: any[] = [];
      let status: "success" | "error" | "partial" = "success";

      for (const action of actions as any[]) {
        try {
          switch (action?.type) {
            case "notification": {
              const { error } = await admin.from("notifications").insert({
                company_id: profile.company_id,
                user_id: action.user_id ?? userData.user.id,
                title: String(action.title ?? rule.name ?? "Automação"),
                message: String(action.message ?? `Evento ${body.event}`),
                type: action.level ?? "info",
              });
              if (error) throw error;
              results.push({ type: "notification", ok: true });
              break;
            }
            case "webhook": {
              if (!action.url || typeof action.url !== "string") throw new Error("missing_url");
              const resp = await fetch(action.url, {
                method: action.method ?? "POST",
                headers: { "Content-Type": "application/json", ...(action.headers ?? {}) },
                body: JSON.stringify({ event: body.event, context: ctx, rule: { id: rule.id, name: rule.name } }),
              });
              results.push({ type: "webhook", ok: resp.ok, status: resp.status });
              if (!resp.ok) status = "partial";
              break;
            }
            case "log": {
              results.push({ type: "log", ok: true, message: action.message ?? null });
              break;
            }
            case "start_workflow": {
              const key = action.workflow_key ?? action.definition_key;
              const defQuery = admin
                .from("workflow_definitions")
                .select("id, steps")
                .eq("company_id", profile.company_id)
                .eq("is_active", true)
                .limit(1);
              const { data: defRow, error: defErr } = action.definition_id
                ? await admin.from("workflow_definitions").select("id, steps").eq("id", action.definition_id).maybeSingle()
                : key
                  ? await defQuery.eq("key", key).maybeSingle()
                  : { data: null, error: new Error("missing_workflow") } as any;
              if (defErr || !defRow) throw new Error("workflow_not_found");
              const firstStep = Array.isArray(defRow.steps) && defRow.steps[0] ? (defRow.steps[0] as any).key : null;
              const { data: inst, error: instErr } = await admin.from("workflow_instances").insert({
                company_id: profile.company_id,
                definition_id: defRow.id,
                entity_id: (ctx as any).id ?? null,
                current_step: firstStep,
                status: "running",
                context: ctx,
                started_by: userData.user.id,
              }).select("id").single();
              if (instErr) throw instErr;
              results.push({ type: "start_workflow", ok: true, instance_id: inst.id });
              break;
            }
            default:
              results.push({ type: action?.type ?? "unknown", ok: false, error: "unsupported_action" });
              status = "partial";
          }
        } catch (e: any) {
          results.push({ type: action?.type, ok: false, error: e?.message ?? "action_error" });
          status = "partial";
        }
      }

      await admin.from("automation_runs").insert({
        company_id: profile.company_id,
        rule_id: rule.id,
        status,
        input: ctx,
        output: { actions: rule.actions, results },
      });
      executed.push({ rule_id: rule.id, name: rule.name, status, results });
    }

    return new Response(JSON.stringify({ event: body.event, executed }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("automation-dispatch error", err);
    return new Response(JSON.stringify({ error: "internal_error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

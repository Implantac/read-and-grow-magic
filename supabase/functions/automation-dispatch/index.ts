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
      // record run
      await admin.from("automation_runs").insert({
        company_id: profile.company_id,
        rule_id: rule.id,
        status: "success",
        input: ctx,
        output: { actions: rule.actions },
      });
      executed.push({ rule_id: rule.id, name: rule.name });
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

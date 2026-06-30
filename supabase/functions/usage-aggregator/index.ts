// Daily cron: aggregate per-company usage into public.usage_tracking
// Schedule: 02:00 UTC daily (configure via pg_cron + net.http_post)
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { requireAuth } from "../_shared/require-auth.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-cron-secret",
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const auth = await requireAuth(req, { allowCron: true, roles: ["admin"] });
  if (!("ok" in auth) || !auth.ok) return jsonResponse({ error: "Unauthorized" }, 401);
  // Allow either cron or admin-of-some-company invocation.

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  try {
    const period = new Date().toISOString().slice(0, 7); // YYYY-MM
    const periodStart = `${period}-01T00:00:00Z`;

    // Iterate companies
    const { data: companies, error: cErr } = await supabase
      .from("companies")
      .select("id");
    if (cErr) throw cErr;

    const results: Array<{ company_id: string; metrics: Record<string, number> }> = [];

    for (const c of companies ?? []) {
      const companyId = (c as { id: string }).id;

      // Resolve plan limits
      const { data: sub } = await supabase
        .from("subscriptions")
        .select("plan_id, plans(max_users, max_orders_month, nfe_per_month, ai_calls_per_month, storage_mb, max_branches)")
        .eq("company_id", companyId)
        .in("status", ["active", "trialing", "past_due"])
        .order("current_period_end", { ascending: false })
        .limit(1)
        .maybeSingle();

      const plan = (sub as { plans?: Record<string, number> } | null)?.plans ?? {};

      // Counts (best-effort; tables may be empty)
      const [users, orders, nfes, aiCalls, branches] = await Promise.all([
        supabase.from("profiles").select("id", { count: "exact", head: true }).eq("company_id", companyId),
        supabase.from("orders").select("id", { count: "exact", head: true }).eq("company_id", companyId).gte("created_at", periodStart),
        supabase.from("nfe").select("id", { count: "exact", head: true }).eq("company_id", companyId).gte("created_at", periodStart),
        supabase.from("ai_brain_decisions").select("id", { count: "exact", head: true }).eq("company_id", companyId).gte("created_at", periodStart),
        supabase.from("branches").select("id", { count: "exact", head: true }).eq("company_id", companyId),
      ]);

      const metrics: Array<[string, number, number]> = [
        ["users", users.count ?? 0, Number(plan.max_users ?? 0)],
        ["orders_month", orders.count ?? 0, Number(plan.max_orders_month ?? 0)],
        ["nfe_month", nfes.count ?? 0, Number(plan.nfe_per_month ?? 0)],
        ["ai_calls_month", aiCalls.count ?? 0, Number(plan.ai_calls_per_month ?? 0)],
        ["branches", branches.count ?? 0, Number(plan.max_branches ?? 0)],
      ];

      const rows = metrics.map(([metric, current_value, limit_value]) => ({
        company_id: companyId, metric, current_value, limit_value, period, updated_at: new Date().toISOString(),
      }));

      // Upsert by (company_id, metric, period)
      const { error: upErr } = await supabase
        .from("usage_tracking")
        .upsert(rows, { onConflict: "company_id,metric,period" });
      if (upErr) {
        console.error("upsert usage_tracking failed", companyId, upErr.message);
        continue;
      }

      results.push({ company_id: companyId, metrics: Object.fromEntries(metrics.map(([k, v]) => [k, v])) });
    }

    return jsonResponse({ ok: true, companies_processed: results.length, period });
  } catch (e) {
    console.error("usage-aggregator error", (e as Error).message);
    return jsonResponse({ error: "Erro interno ao agregar uso." }, 500);
  }
});

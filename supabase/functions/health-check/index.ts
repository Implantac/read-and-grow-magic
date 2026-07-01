// Onda D — Consolidated health-check endpoint for SRE dashboards & external monitors.
// Aggregates: DB reachability, critical tables row counts, recent errors, last cron runs.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CheckResult {
  name: string;
  status: "ok" | "warn" | "fail";
  latency_ms: number;
  detail?: string;
}

async function timed<T>(name: string, fn: () => Promise<T>): Promise<CheckResult & { data?: T }> {
  const t0 = performance.now();
  try {
    const data = await fn();
    return { name, status: "ok", latency_ms: Math.round(performance.now() - t0), data };
  } catch (e) {
    return {
      name,
      status: "fail",
      latency_ms: Math.round(performance.now() - t0),
      detail: (e as Error).message?.slice(0, 200),
    };
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const checks: CheckResult[] = [];

  // 1. DB reachability + core count
  checks.push(
    await timed("db_companies", async () => {
      const { count, error } = await supabase
        .from("companies")
        .select("id", { count: "exact", head: true });
      if (error) throw error;
      return { count };
    }),
  );

  // 2. Recent incidents (last 24h)
  checks.push(
    await timed("incidents_24h", async () => {
      const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const { count, error } = await supabase
        .from("system_incidents")
        .select("id", { count: "exact", head: true })
        .gte("created_at", since)
        .neq("status", "resolved");
      if (error) throw error;
      return { open_incidents: count ?? 0 };
    }),
  );

  // 3. Automation runs (last hour)
  checks.push(
    await timed("automation_1h", async () => {
      const since = new Date(Date.now() - 60 * 60 * 1000).toISOString();
      const { count, error } = await supabase
        .from("automation_runs")
        .select("id", { count: "exact", head: true })
        .gte("created_at", since);
      if (error) throw error;
      return { runs: count ?? 0 };
    }),
  );

  // 4. Cross-module events pending
  checks.push(
    await timed("events_pending", async () => {
      const { count, error } = await supabase
        .from("cross_module_events")
        .select("id", { count: "exact", head: true })
        .eq("processed", false);
      if (error) throw error;
      return { pending: count ?? 0 };
    }),
  );

  const failed = checks.filter((c) => c.status === "fail").length;
  const overall = failed > 0 ? "degraded" : "healthy";
  const status_code = failed > 0 ? 503 : 200;

  return new Response(
    JSON.stringify({
      status: overall,
      timestamp: new Date().toISOString(),
      checks,
      version: "1.0.0",
    }),
    {
      status: status_code,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    },
  );
});

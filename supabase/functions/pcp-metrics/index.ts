import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { getSystemPrompt } from "../_shared/ai-prompts.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Auth check
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const userClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, { global: { headers: { Authorization: authHeader } } });
    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await userClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const supabase = createClient(supabaseUrl, serviceKey);

    // Resolve caller's company_id for tenant scoping
    const { data: profile } = await supabase
      .from("profiles")
      .select("company_id")
      .eq("id", claimsData.claims.sub)
      .maybeSingle();
    const callerCompany = (profile as any)?.company_id as string | undefined;
    if (!callerCompany) {
      return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Fetch production orders (tenant-scoped)
    const { data: orders, error: ordErr } = await supabase
      .from("production_orders")
      .select("*")
      .eq("company_id", callerCompany)
      .order("created_at", { ascending: false })
      .limit(500);

    if (ordErr) throw ordErr;

    const now = new Date();
    const todayStr = now.toISOString().split("T")[0];

    const allOrders = orders || [];
    const activeOPs = allOrders.filter((o: any) =>
      ["planned", "in_progress", "paused"].includes(o.status)
    );
    const completedOPs = allOrders.filter((o: any) => o.status === "completed");
    const completedToday = completedOPs.filter(
      (o: any) => o.completed_date && o.completed_date.startsWith(todayStr)
    );

    // Delayed orders
    const delayed = activeOPs.filter(
      (o: any) => o.due_date && new Date(o.due_date) < now
    );

    // Lead time calculations
    const completedWithDates = completedOPs.filter(
      (o: any) => o.start_date && o.completed_date
    );
    let avgLeadTimePlanned = 0;
    let avgLeadTimeReal = 0;

    if (completedWithDates.length > 0) {
      const plannedSum = completedWithDates.reduce((s: number, o: any) => {
        if (o.start_date && o.due_date) {
          return s + Math.abs(new Date(o.due_date).getTime() - new Date(o.start_date).getTime()) / 3600000;
        }
        return s + (o.estimated_time_minutes || 0) / 60;
      }, 0);

      const realSum = completedWithDates.reduce((s: number, o: any) => {
        return s + Math.abs(new Date(o.completed_date).getTime() - new Date(o.start_date).getTime()) / 3600000;
      }, 0);

      avgLeadTimePlanned = Math.round((plannedSum / completedWithDates.length) * 10) / 10;
      avgLeadTimeReal = Math.round((realSum / completedWithDates.length) * 10) / 10;
    }

    // On-time rate
    const withDueDates = completedOPs.filter((o: any) => o.due_date && o.completed_date);
    const onTime = withDueDates.filter(
      (o: any) => new Date(o.completed_date) <= new Date(o.due_date)
    );
    const onTimeRate = withDueDates.length > 0
      ? Math.round((onTime.length / withDueDates.length) * 100)
      : 0;

    // Efficiency (produced vs target)
    const totalTarget = allOrders.reduce((s: number, o: any) => s + (o.quantity || 0), 0);
    const totalProduced = allOrders.reduce((s: number, o: any) => s + (o.produced_quantity || 0), 0);
    const efficiency = totalTarget > 0 ? Math.round((totalProduced / totalTarget) * 100) : 0;

    // OEE
    const totalRejected = allOrders.reduce((s: number, o: any) => s + (o.rejected_quantity || 0), 0);
    const totalEst = allOrders.reduce((s: number, o: any) => s + (o.estimated_time_minutes || 0), 0);
    const totalReal = allOrders.reduce((s: number, o: any) => s + (o.realized_time_minutes || 0), 0);
    const avail = totalEst > 0 ? Math.min(totalReal / totalEst, 1) : 0;
    const perf = totalTarget > 0 ? Math.min(totalProduced / totalTarget, 1) : 0;
    const qual = totalProduced > 0 ? (totalProduced - totalRejected) / totalProduced : 1;
    const oee = Math.round(avail * perf * qual * 100);

    // Throughput (last 30 days)
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 86400000).toISOString();
    const recentCompleted = completedOPs.filter(
      (o: any) => o.completed_date && o.completed_date >= thirtyDaysAgo
    );

    const metrics = {
      totalOPs: allOrders.length,
      activeOPs: activeOPs.length,
      completedToday: completedToday.length,
      delayed: delayed.length,
      delayRate: activeOPs.length > 0
        ? Math.round((delayed.length / activeOPs.length) * 100)
        : 0,
      onTimeRate,
      avgLeadTimePlanned,
      avgLeadTimeReal,
      leadTimeVariance: avgLeadTimePlanned > 0
        ? Math.round(((avgLeadTimeReal - avgLeadTimePlanned) / avgLeadTimePlanned) * 100)
        : 0,
      efficiency,
      oee,
      throughput30d: recentCompleted.length,
      totalProduced,
      totalRejected,
      qualityRate: totalProduced > 0
        ? Math.round(((totalProduced - totalRejected) / totalProduced) * 100)
        : 100,
    };

    return new Response(JSON.stringify(metrics), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("pcp-metrics error:", error);
    return new Response(JSON.stringify({ error: "An internal error occurred. Please try again." }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});

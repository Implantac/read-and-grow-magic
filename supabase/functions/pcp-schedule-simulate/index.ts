import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { getSystemPrompt } from "../_shared/ai-prompts.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SimulateRequest {
  sortCriteria?: "priority_due" | "due_date" | "shortest_first" | "longest_first" | "critical_ratio";
  priorityOverrides?: Record<string, string>; // opId -> new priority
  delayedOPs?: { opId: string; delayDays: number }[];
  capacityChangePct?: number; // e.g. -20 for 20% less capacity
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 405,
    });
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

    const body: SimulateRequest = await req.json();
    const sortCriteria = body.sortCriteria || "priority_due";
    const supabase = createClient(supabaseUrl, serviceKey);

    // Fetch active orders
    const { data: orders, error: ordErr } = await supabase
      .from("production_orders")
      .select("*")
      .in("status", ["planned", "in_progress", "paused"])
      .order("created_at", { ascending: false });

    if (ordErr) throw ordErr;

    // Fetch capacities
    const { data: capacities, error: capErr } = await supabase
      .from("production_capacity")
      .select("*");

    if (capErr) throw capErr;

    const now = new Date();
    const allOrders = orders || [];
    const allCapacities = capacities || [];

    // Apply capacity change
    const capacityFactor = 1 + (body.capacityChangePct || 0) / 100;
    const totalCapPerDay = allCapacities.reduce(
      (s: number, c: any) => s + (c.capacity_per_hour || 0) * 8,
      0
    ) * Math.max(capacityFactor, 0.1);

    const priorityMap: Record<string, number> = {
      urgent: 0,
      high: 1,
      medium: 2,
      low: 3,
    };

    // Apply overrides and delays
    const processedOPs = allOrders.map((o: any) => {
      const priority = body.priorityOverrides?.[o.id] || o.priority;
      const dueDate = o.due_date ? new Date(o.due_date) : null;

      // Apply delay simulation
      const delay = body.delayedOPs?.find((d) => d.opId === o.id);
      if (delay && dueDate) {
        // Delay doesn't change due_date, it changes start, so we track impact
      }

      const remaining = Math.max(0, o.quantity - o.produced_quantity);
      const avgTime =
        o.produced_quantity > 0 && o.realized_time_minutes > 0
          ? o.realized_time_minutes / o.produced_quantity
          : o.estimated_time_minutes / Math.max(o.quantity, 1);
      const estMinutes = remaining * avgTime;
      const estDays = totalCapPerDay > 0 ? remaining / totalCapPerDay : 999;

      const delayDays = delay?.delayDays || 0;
      const effectiveEstDays = estDays + delayDays;

      const dueIn = dueDate
        ? Math.ceil(
            (dueDate.getTime() - now.getTime()) / 86400000
          )
        : 999;

      const criticalRatio = dueIn > 0 ? effectiveEstDays / dueIn : 999;
      const isLate = dueDate ? now > dueDate : false;
      const willBeLate = dueIn < effectiveEstDays;

      return {
        id: o.id,
        orderNumber: o.order_number,
        productName: o.product_name,
        quantity: o.quantity,
        producedQuantity: o.produced_quantity,
        remaining,
        priority,
        priorityNum: priorityMap[priority] ?? 9,
        status: o.status,
        sector: o.sector || o.work_center || "Geral",
        dueDate: o.due_date,
        estMinutes: Math.round(estMinutes),
        estDays: Math.round(effectiveEstDays * 10) / 10,
        dueIn,
        criticalRatio: Math.round(criticalRatio * 100) / 100,
        isLate,
        willBeLate,
        delayApplied: delayDays,
        risk: isLate ? "critical" : willBeLate ? "high" : criticalRatio > 0.8 ? "medium" : "low",
      };
    });

    // Sort
    processedOPs.sort((a: any, b: any) => {
      switch (sortCriteria) {
        case "due_date":
          return a.dueIn - b.dueIn;
        case "shortest_first":
          return a.estMinutes - b.estMinutes;
        case "longest_first":
          return b.estMinutes - a.estMinutes;
        case "critical_ratio":
          return b.criticalRatio - a.criticalRatio;
        case "priority_due":
        default:
          if (a.isLate !== b.isLate) return a.isLate ? -1 : 1;
          if (a.willBeLate !== b.willBeLate) return a.willBeLate ? -1 : 1;
          const pDiff = a.priorityNum - b.priorityNum;
          if (pDiff !== 0) return pDiff;
          return a.dueIn - b.dueIn;
      }
    });

    // Resource load by sector
    const sectorLoad: Record<string, { total: number; count: number }> = {};
    processedOPs.forEach((op: any) => {
      if (!sectorLoad[op.sector]) sectorLoad[op.sector] = { total: 0, count: 0 };
      sectorLoad[op.sector].total += op.estMinutes;
      sectorLoad[op.sector].count += 1;
    });

    const resourceLoad = Object.entries(sectorLoad).map(([sector, data]) => {
      const cap = allCapacities.find((c: any) => c.sector === sector);
      const capacityMinutes = (cap?.capacity_per_hour || 10) * 8 * 5 * capacityFactor;
      const utilizationPct = capacityMinutes > 0
        ? Math.round((data.total / capacityMinutes) * 100)
        : 0;
      return {
        sector,
        totalMinutes: data.total,
        opsCount: data.count,
        capacityMinutes: Math.round(capacityMinutes),
        utilizationPct,
        isOverloaded: utilizationPct > 100,
      };
    });

    // Suggestions
    const suggestions: any[] = [];
    const lateOPs = processedOPs.filter((op: any) => op.isLate);
    const atRiskOPs = processedOPs.filter((op: any) => op.willBeLate && !op.isLate);
    const overloadedSectors = resourceLoad.filter((r) => r.isOverloaded);

    lateOPs.forEach((op: any) => {
      suggestions.push({
        type: "alert",
        severity: "critical",
        title: `OP ${op.orderNumber} está atrasada`,
        description: `${op.productName} — ${Math.abs(op.dueIn)} dias de atraso. ${op.remaining} un. restantes.`,
        relatedOP: op.orderNumber,
        estimatedImpact: `Priorizar para reduzir atraso em ~${op.estDays.toFixed(1)} dias`,
      });
    });

    atRiskOPs.slice(0, 5).forEach((op: any) => {
      suggestions.push({
        type: "anticipate",
        severity: "warning",
        title: `OP ${op.orderNumber} em risco de atraso`,
        description: `Prazo: ${op.dueIn}d, estimativa: ${op.estDays.toFixed(1)}d. Ratio crítico: ${op.criticalRatio}`,
        relatedOP: op.orderNumber,
        estimatedImpact: "Antecipar início ou redistribuir carga",
      });
    });

    overloadedSectors.forEach((s) => {
      suggestions.push({
        type: "redistribute",
        severity: "warning",
        title: `Setor ${s.sector} sobrecarregado (${s.utilizationPct}%)`,
        description: `${s.opsCount} OPs totalizando ${Math.round(s.totalMinutes / 60)}h vs capacidade ${Math.round(s.capacityMinutes / 60)}h`,
        estimatedImpact: "Redistribuir OPs ou autorizar hora extra",
      });
    });

    const result = {
      sortCriteria,
      capacityFactor,
      totalCapPerDay: Math.round(totalCapPerDay),
      scheduledOPs: processedOPs,
      resourceLoad,
      suggestions,
      summary: {
        totalOPs: processedOPs.length,
        lateOPs: lateOPs.length,
        atRiskOPs: atRiskOPs.length,
        overloadedSectors: overloadedSectors.length,
        criticalAlerts: suggestions.filter((s: any) => s.severity === "critical").length,
      },
    };

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("pcp-schedule-simulate error:", error);
    return new Response(JSON.stringify({ error: "An internal error occurred. Please try again." }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
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

    const body = await req.json().catch(() => ({}));
    const action = body.action || "recalculate";

    // Fetch active production orders
    const { data: orders, error: ordErr } = await supabase
      .from("production_orders")
      .select("*")
      .in("status", ["planned", "in_progress", "paused", "waiting_material", "outsourced"])
      .order("created_at", { ascending: false })
      .limit(500);

    if (ordErr) throw ordErr;
    const allOrders = orders || [];
    const now = new Date();

    // Calculate priority scores
    const scores = allOrders.map((o: any) => {
      let score = 0;
      const factors: string[] = [];

      // Priority base
      const pw: Record<string, number> = { urgent: 40, high: 25, medium: 10, low: 0 };
      score += pw[o.priority] ?? 5;

      // Deadline
      if (o.due_date) {
        const hoursUntil = (new Date(o.due_date).getTime() - now.getTime()) / 3600000;
        if (hoursUntil < 0) {
          const late = Math.min(50, 20 + (Math.abs(hoursUntil) / 24) * 5);
          score += late;
          factors.push(`Atrasada ${Math.ceil(Math.abs(hoursUntil) / 24)}d`);
        } else if (hoursUntil < 48) {
          score += 15;
          factors.push("Prazo < 48h");
        } else if (hoursUntil < 120) {
          score += 8;
          factors.push("Prazo < 5d");
        }
      }

      // Progress
      const pct = o.quantity > 0 ? o.produced_quantity / o.quantity : 0;
      if (pct < 0.1 && o.status === "in_progress") {
        score += 10;
        factors.push("< 10% concluído");
      }

      // Client order
      if (o.sales_order_id) {
        score += 5;
        factors.push("Pedido de cliente");
      }

      return { id: o.id, order_number: o.order_number, score: Math.round(score * 100) / 100, factors, currentPriority: o.priority };
    });

    if (action === "recalculate") {
      // Update priority_score on all active OPs
      let updated = 0;
      for (const s of scores) {
        const { error } = await supabase
          .from("production_orders")
          .update({ priority_score: s.score, updated_at: new Date().toISOString() })
          .eq("id", s.id);
        if (!error) updated++;
      }

      return new Response(
        JSON.stringify({
          action: "recalculate",
          ordersProcessed: scores.length,
          ordersUpdated: updated,
          scores: scores.sort((a: any, b: any) => b.score - a.score).slice(0, 20),
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    if (action === "war_mode") {
      // War mode: recalculate + suggest priority changes + persist scores
      const changes: any[] = [];
      for (const s of scores) {
        let newPriority = "low";
        if (s.score >= 50) newPriority = "urgent";
        else if (s.score >= 30) newPriority = "high";
        else if (s.score >= 15) newPriority = "medium";

        if (newPriority !== s.currentPriority) {
          changes.push({
            id: s.id,
            order_number: s.order_number,
            oldPriority: s.currentPriority,
            newPriority,
            score: s.score,
            factors: s.factors,
          });
        }

        // Always update score
        await supabase
          .from("production_orders")
          .update({
            priority_score: s.score,
            updated_at: new Date().toISOString(),
          })
          .eq("id", s.id);
      }

      // Apply priority changes if confirm flag
      if (body.confirm === true) {
        for (const c of changes) {
          await supabase
            .from("production_orders")
            .update({ priority: c.newPriority, updated_at: new Date().toISOString() })
            .eq("id", c.id);
        }
      }

      return new Response(
        JSON.stringify({
          action: "war_mode",
          confirmed: body.confirm === true,
          ordersAnalyzed: scores.length,
          priorityChanges: changes,
          summary: `Modo Guerra: ${scores.length} OPs, ${changes.length} repriorização(ões)${body.confirm ? ' — APLICADO' : ' — simulação'}`,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    return new Response(
      JSON.stringify({ error: "Unknown action. Use 'recalculate' or 'war_mode'" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
    );
  } catch (error) {
    console.error("pcp-priority error:", error);
    return new Response(
      JSON.stringify({ error: "An internal error occurred. Please try again." }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});

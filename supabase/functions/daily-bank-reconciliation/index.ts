import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import { requireAuth } from "../_shared/require-auth.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-cron-secret",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const auth = await requireAuth(req, { roles: ["admin", "manager"], allowCron: true });
  if (!auth.ok) {
    return new Response(JSON.stringify({ error: auth.message }), {
      status: auth.status, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }


  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    console.log("[daily-bank-reconciliation] Starting daily run");

    // 1) Auto-match across all bank accounts (RPC handles tolerance ±0.01 / ±3 days)
    const { data: matched, error: matchErr } = await supabase.rpc("auto_match_bank_transactions", {
      p_bank_account_id: null,
    });
    if (matchErr) console.error("auto_match error:", matchErr);

    const matchedCount = Array.isArray(matched) ? matched.length : (matched ?? 0);

    // 2) Detect pending divergences > 7 days old
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString();
    const { data: pending } = await supabase
      .from("bank_transactions")
      .select("id, amount, date, description, bank_account_id")
      .eq("status", "pending")
      .lt("date", sevenDaysAgo)
      .limit(500);

    const divergencesCount = pending?.length || 0;
    const divergenceTotal = (pending || []).reduce((s: number, t: any) => s + Math.abs(t.amount || 0), 0);

    // 3) Emit alert if there are stale divergences
    if (divergencesCount > 0) {
      await supabase.from("ai_executive_alerts").insert({
        alert_type: "fiscal_financial",
        title: `${divergencesCount} divergências bancárias > 7 dias`,
        description: `Total não conciliado: R$ ${divergenceTotal.toFixed(2)}. Revisar conciliação manual no módulo financeiro.`,
        severity: divergencesCount > 20 ? "high" : "medium",
        module: "financeiro",
        metric_name: "divergencias_bancarias",
        metric_value: divergencesCount,
        threshold_value: 0,
      });
    }

    // 4) Log run
    await supabase.from("ai_action_logs").insert({
      action_type: "system",
      action_name: "daily_bank_reconciliation",
      module: "financeiro",
      result: `matched=${matchedCount}, divergences=${divergencesCount}, total=${divergenceTotal.toFixed(2)}`,
    });

    console.log(`[daily-bank-reconciliation] matched=${matchedCount} divergences=${divergencesCount}`);

    return new Response(
      JSON.stringify({ ok: true, matched: matchedCount, divergences: divergencesCount, divergence_total: divergenceTotal }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("daily-bank-reconciliation error:", e);
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

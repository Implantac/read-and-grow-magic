import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import { requireAuth } from "../_shared/require-auth.ts";
import { corsHeaders, jsonResponse, safeError } from "../_shared/tenant.ts";
import { instrument, contextFromAuth, recordEvent } from "../_shared/observability.ts";

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const auth = await requireAuth(req, { roles: ["admin", "manager"], allowCron: true });
  if (!auth.ok) {
    return new Response(JSON.stringify({ error: auth.message }), {
      status: auth.status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Resolve scope: per-company when invoked by a user; all companies when via cron.
    let companyIds: string[] = [];
    if (auth.viaCron) {
      const { data: companies } = await supabase.from("companies").select("id");
      companyIds = (companies ?? []).map((c: any) => c.id);
    } else {
      if (!auth.companyId) {
        return new Response(JSON.stringify({ error: "Forbidden" }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      companyIds = [auth.companyId];
    }

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString();
    let totalMatched = 0;
    let totalDivergences = 0;
    let totalDivergenceAmount = 0;

    for (const companyId of companyIds) {
      // 1) Auto-match per bank account belonging to this company
      const { data: accounts } = await supabase
        .from("bank_accounts")
        .select("id")
        .eq("company_id", companyId);

      for (const acc of accounts ?? []) {
        const { data: matched, error: matchErr } = await supabase.rpc(
          "auto_match_bank_transactions",
          { p_bank_account_id: (acc as any).id },
        );
        if (matchErr) console.error("auto_match error:", matchErr);
        totalMatched += Array.isArray(matched) ? matched.length : (matched ?? 0);
      }

      // 2) Pending divergences > 7 days, scoped to company
      const { data: pending } = await supabase
        .from("bank_transactions")
        .select("id, amount, date, description, bank_account_id")
        .eq("company_id", companyId)
        .eq("status", "pending")
        .lt("date", sevenDaysAgo)
        .limit(500);

      const divergencesCount = pending?.length || 0;
      const divergenceTotal = (pending || []).reduce(
        (s: number, t: any) => s + Math.abs(t.amount || 0),
        0,
      );
      totalDivergences += divergencesCount;
      totalDivergenceAmount += divergenceTotal;

      if (divergencesCount > 0) {
        await supabase.from("ai_executive_alerts").insert({
          company_id: companyId,
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

      await supabase.from("ai_action_logs").insert({
        company_id: companyId,
        action_type: "system",
        action_name: "daily_bank_reconciliation",
        module: "financeiro",
        result: `matched per-company run`,
      });
    }

    return jsonResponse({
      ok: true,
      companies: companyIds.length,
      matched: totalMatched,
      divergences: totalDivergences,
      divergence_total: totalDivergenceAmount,
    });
  } catch (e) {
    return safeError(e, "daily-bank-reconciliation");
  }
});

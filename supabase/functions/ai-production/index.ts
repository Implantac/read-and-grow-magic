import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getSystemPrompt } from "../_shared/ai-prompts.ts";
import { resolveContextByIds, branchScope } from "../_shared/tenant.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-branch-id",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const lovableKey = Deno.env.get("LOVABLE_API_KEY")!;

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

    const { action } = await req.json();
    const supabase = createClient(supabaseUrl, supabaseKey);

    const userId = (claimsData.claims as any).sub;
    const { data: profile } = await supabase.from('profiles').select('company_id, default_branch_id').eq('id', userId).maybeSingle();
    const callerCompany = (profile as any)?.company_id;
    if (!callerCompany) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const ctx = await resolveContextByIds(req, {
      userId,
      companyId: callerCompany,
      defaultBranchId: (profile as any)?.default_branch_id ?? null,
    });
    if (!ctx.ok) {
      return new Response(JSON.stringify({ error: ctx.message }), { status: ctx.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    const scope = branchScope(ctx);
    const scopeOrders = <T extends { in: any }>(q: T) => (scope ? (q as any).in('branch_id', scope) : q);


    // Helper to call AI
    const callAI = async (systemPrompt: string, userPrompt: string) => {
      const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${lovableKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.0-flash-exp",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
        }),
      });

      if (!aiResponse.ok) {
        const status = aiResponse.status;
        if (status === 429) return { error: "Rate limit exceeded", status: 429 };
        if (status === 402) return { error: "Payment required", status: 402 };
        throw new Error(`AI gateway error: ${status}`);
      }

      const aiData = await aiResponse.json();
      let content = aiData.choices?.[0]?.message?.content || "[]";
      content = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      return { content };
    };

    // === ACTION: generate_insights ===
    if (action === "generate_insights") {
      const { data: orders } = await scopeOrders(supabase
        .from("production_orders")
        .select("*")
        .eq("company_id", callerCompany)
        .in("status", ["planned", "in_progress", "paused"])
        .order("due_date"));

      const { data: capacity } = await supabase
        .from("production_capacity")
        .select("*")
        .eq("company_id", callerCompany)
        .eq("is_active", true);

      const { data: timeEntries } = await supabase
        .from("time_entries")
        .select("*")
        .eq("company_id", callerCompany)
        .order("start_time", { ascending: false })
        .limit(50);


      const prompt = await getSystemPrompt('PCP_CONSULTANT', `Analise os dados de produção e gere insights acionáveis.
ORDENS DE PRODUÇÃO ATIVAS:
${JSON.stringify(orders?.slice(0, 20) || [], null, 2)}

CAPACIDADE PRODUTIVA:
${JSON.stringify(capacity || [], null, 2)}

ÚLTIMOS APONTAMENTOS:
${JSON.stringify(timeEntries?.slice(0, 15) || [], null, 2)}

# 📝 ESQUEMA DOS INSIGHTS (JSON)
Cada objeto deve conter: insight_type, severity, title, description, affected_sector, recommended_action, impact_estimate.`, supabase, 'ai-production-insights');

      const result = await callAI(
        "Você é um especialista em PCP industrial. Responda apenas com JSON válido.",
        prompt
      );

      if ("error" in result) {
        return new Response(JSON.stringify({ error: result.error }), {
          status: result.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      let insights: any[] = [];
      try {
        insights = JSON.parse(result.content);
        if (!Array.isArray(insights)) insights = [insights];
      } catch {
        console.error("Failed to parse AI response:", result.content);
        insights = [{
          insight_type: "capacity_optimization",
          severity: "medium",
          title: "Análise gerada",
          description: result.content.slice(0, 500),
          recommended_action: "Revisar dados de produção",
        }];
      }

      for (const insight of insights) {
        await supabase.from("ai_production_insights").insert({
          company_id: callerCompany,
          insight_type: insight.insight_type || "bottleneck",
          severity: insight.severity || "medium",
          title: insight.title || "Insight",
          description: insight.description,
          affected_sector: insight.affected_sector,
          recommended_action: insight.recommended_action,
          impact_estimate: insight.impact_estimate,
          status: "active",
        });
      }

      return new Response(JSON.stringify({ success: true, count: insights.length }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // === ACTION: decision_engine ===
    if (action === "decision_engine") {
      const { data: orders } = await scopeOrders(supabase
        .from("production_orders")
        .select("*")
        .eq("company_id", callerCompany)
        .in("status", ["planned", "in_progress", "paused"])
        .order("due_date"));

      const { data: capacity } = await supabase
        .from("production_capacity")
        .select("*")
        .eq("company_id", callerCompany)
        .eq("is_active", true);

      const { data: supplies } = await supabase
        .from("supply_stock")
        .select("*")
        .eq("company_id", callerCompany)
        .order("current_quantity");


      const prompt = await getSystemPrompt('PCP_CONSULTANT', `Analise a situação atual e forneça DECISÕES ESTRATÉGICAS em JSON.
ORDENS ATIVAS (${orders?.length || 0}):
${JSON.stringify(orders?.slice(0, 25) || [], null, 2)}

CAPACIDADE:
${JSON.stringify(capacity?.slice(0, 10) || [], null, 2)}

ESTOQUE DE INSUMOS (menores quantidades):
${JSON.stringify(supplies?.slice(0, 15) || [], null, 2)}

Gere um objeto JSON com:
{
  "priority_sequence": [{"order_number": "...", "reason": "...", "suggested_action": "..."}],
  "rebalancing": [{"from_sector": "...", "to_sector": "...", "reason": "..."}],
  "material_alerts": [{"material": "...", "action": "...", "urgency": "high|medium|low"}],
  "summary": "resumo executivo em 2-3 frases"
}`, supabase, 'ai-production-decision-engine');

      const result = await callAI(
        "Você é um diretor industrial. Responda apenas com JSON válido.",
        prompt
      );

      if ("error" in result) {
        return new Response(JSON.stringify({ error: result.error }), {
          status: result.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      let decisions: any = {};
      try {
        decisions = JSON.parse(result.content);
      } catch {
        decisions = { summary: result.content.slice(0, 500), priority_sequence: [], rebalancing: [], material_alerts: [] };
      }

      return new Response(JSON.stringify({ success: true, decisions }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // === ACTION: operator_suggestions ===
    if (action === "operator_suggestions") {
      const { data: activeOPs } = await supabase
        .from("production_orders")
        .select("*")
        .eq("company_id", callerCompany)
        .in("status", ["in_progress", "planned"])
        .order("priority")
        .limit(10);

      const { data: activeEntries } = await supabase
        .from("time_entries")
        .select("*")
        .eq("company_id", callerCompany)
        .eq("status", "started");


      const prompt = await getSystemPrompt('PCP_CONSULTANT', `Analise as OPs ativas e sugira a melhor sequência de trabalho para os operadores.
OPS ATIVAS:
${JSON.stringify(activeOPs || [], null, 2)}

APONTAMENTOS EM ANDAMENTO:
${JSON.stringify(activeEntries || [], null, 2)}

Gere um JSON array com sugestões:
[{"order_number": "...", "suggestion": "...", "priority": "urgent|high|normal", "reason": "..."}]
Foque em: urgência de prazo, balanceamento de carga, OPs paradas.`, supabase, 'ai-production-operator-suggestions');

      const result = await callAI(
        "Supervisor industrial. JSON válido apenas.",
        prompt
      );

      if ("error" in result) {
        return new Response(JSON.stringify({ error: result.error }), {
          status: result.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      let suggestions: any[] = [];
      try {
        suggestions = JSON.parse(result.content);
        if (!Array.isArray(suggestions)) suggestions = [suggestions];
      } catch {
        suggestions = [];
      }

      return new Response(JSON.stringify({ success: true, suggestions }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Unknown action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("ai-production error:", e);
    return new Response(JSON.stringify({ error: "An internal error occurred. Please try again." }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

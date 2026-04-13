import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { action } = await req.json();
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const lovableKey = Deno.env.get("LOVABLE_API_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Helper to call AI
    const callAI = async (systemPrompt: string, userPrompt: string) => {
      const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${lovableKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
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
      const { data: orders } = await supabase
        .from("production_orders")
        .select("*")
        .in("status", ["planned", "in_progress", "paused"])
        .order("due_date");

      const { data: capacity } = await supabase
        .from("production_capacity")
        .select("*")
        .eq("is_active", true);

      const { data: timeEntries } = await supabase
        .from("time_entries")
        .select("*")
        .order("start_time", { ascending: false })
        .limit(50);

      const prompt = `Você é um consultor de PCP industrial especializado em confecção.

Analise os dados de produção e gere insights acionáveis em formato JSON.

ORDENS DE PRODUÇÃO ATIVAS:
${JSON.stringify(orders?.slice(0, 20) || [], null, 2)}

CAPACIDADE PRODUTIVA:
${JSON.stringify(capacity || [], null, 2)}

ÚLTIMOS APONTAMENTOS:
${JSON.stringify(timeEntries?.slice(0, 15) || [], null, 2)}

Gere de 3 a 5 insights. Cada insight deve ter:
- insight_type: "bottleneck" | "delay_risk" | "low_productivity" | "capacity_optimization" | "material_shortage" | "rebalance"
- severity: "low" | "medium" | "high" | "critical"
- title: título curto em português
- description: descrição detalhada em português
- affected_sector: setor afetado (se aplicável)
- recommended_action: ação recomendada em português
- impact_estimate: estimativa de impacto

Responda APENAS com JSON array, sem markdown.`;

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
      const { data: orders } = await supabase
        .from("production_orders")
        .select("*")
        .in("status", ["planned", "in_progress", "paused"])
        .order("due_date");

      const { data: capacity } = await supabase
        .from("production_capacity")
        .select("*")
        .eq("is_active", true);

      const { data: supplies } = await supabase
        .from("supply_stock")
        .select("*")
        .order("current_quantity");

      const prompt = `Você é um gerente de PCP com 20 anos de experiência.

Analise a situação atual e forneça DECISÕES ESTRATÉGICAS em JSON.

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
}

Responda APENAS com JSON, sem markdown.`;

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
        .in("status", ["in_progress", "planned"])
        .order("priority")
        .limit(10);

      const { data: activeEntries } = await supabase
        .from("time_entries")
        .select("*")
        .eq("status", "started");

      const prompt = `Você é um supervisor de produção.

Analise as OPs ativas e sugira a melhor sequência de trabalho para os operadores.

OPS ATIVAS:
${JSON.stringify(activeOPs || [], null, 2)}

APONTAMENTOS EM ANDAMENTO:
${JSON.stringify(activeEntries || [], null, 2)}

Gere um JSON array com sugestões:
[{"order_number": "...", "suggestion": "...", "priority": "urgent|high|normal", "reason": "..."}]

Foque em: urgência de prazo, balanceamento de carga, OPs paradas.
Responda APENAS com JSON, sem markdown.`;

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
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

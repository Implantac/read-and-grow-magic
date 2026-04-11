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

    if (action === "generate_insights") {
      // Fetch production data
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

      const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${lovableKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: "Você é um especialista em PCP industrial. Responda apenas com JSON válido." },
            { role: "user", content: prompt },
          ],
        }),
      });

      if (!aiResponse.ok) {
        const status = aiResponse.status;
        if (status === 429) return new Response(JSON.stringify({ error: "Rate limit exceeded" }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        if (status === 402) return new Response(JSON.stringify({ error: "Payment required" }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        throw new Error(`AI gateway error: ${status}`);
      }

      const aiData = await aiResponse.json();
      let content = aiData.choices?.[0]?.message?.content || "[]";
      
      // Clean markdown code blocks if present
      content = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();

      let insights: any[] = [];
      try {
        insights = JSON.parse(content);
        if (!Array.isArray(insights)) insights = [insights];
      } catch {
        console.error("Failed to parse AI response:", content);
        insights = [{
          insight_type: "capacity_optimization",
          severity: "medium",
          title: "Análise gerada",
          description: content.slice(0, 500),
          recommended_action: "Revisar dados de produção",
        }];
      }

      // Insert insights
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

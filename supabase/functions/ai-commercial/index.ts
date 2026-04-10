import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function callAI(systemPrompt: string, userPrompt: string, tools?: any[]): Promise<any> {
  const body: any = {
    model: "google/gemini-3-flash-preview",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
  };
  if (tools) {
    body.tools = tools;
    body.tool_choice = { type: "function", function: { name: tools[0].function.name } };
  }

  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const t = await res.text();
    throw new Error(`AI gateway error ${res.status}: ${t}`);
  }

  const data = await res.json();
  if (tools) {
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (toolCall) return JSON.parse(toolCall.function.arguments);
  }
  return data.choices?.[0]?.message?.content || "";
}

// ─── Engine: Score Clients ─────────────────────────────────────────────
async function scoreClients() {
  const { data: clients } = await supabase.from("clients").select("*").eq("status", "active").limit(200);
  if (!clients?.length) return { scored: 0 };

  const { data: orders } = await supabase.from("orders").select("id, client_id, total, date, status").neq("status", "cancelled").order("date", { ascending: false }).limit(1000);
  const { data: receivables } = await supabase.from("accounts_receivable").select("client_id, amount, status, due_date").limit(500);

  const now = new Date();
  const scores: any[] = [];

  for (const client of clients) {
    const cOrders = (orders || []).filter((o: any) => o.client_id === client.id);
    const cReceivables = (receivables || []).filter((r: any) => r.client_id === client.id);

    const totalValue = cOrders.reduce((s: number, o: any) => s + (o.total || 0), 0);
    const orderCount = cOrders.length;
    const lastOrderDate = cOrders[0]?.date ? new Date(cOrders[0].date) : null;
    const daysSince = lastOrderDate ? Math.floor((now.getTime() - lastOrderDate.getTime()) / 86400000) : 999;

    const overdueCount = cReceivables.filter((r: any) => r.status === "overdue" || (r.status === "pending" && new Date(r.due_date) < now)).length;

    // RFM scoring (0-100 each)
    const recencyScore = Math.max(0, 100 - daysSince * 1.5);
    const frequencyScore = Math.min(100, orderCount * 15);
    const monetaryScore = Math.min(100, totalValue / 500);

    const riskScore = Math.min(100, overdueCount * 25 + (daysSince > 60 ? 30 : 0));
    const growthScore = orderCount >= 3 ? 60 : orderCount >= 1 ? 30 : 0;
    const engagementScore = daysSince < 15 ? 90 : daysSince < 30 ? 60 : daysSince < 60 ? 30 : 10;

    const totalScore = (recencyScore * 0.25 + frequencyScore * 0.2 + monetaryScore * 0.25 + engagementScore * 0.15 + growthScore * 0.1 - riskScore * 0.05);
    const clampedScore = Math.max(0, Math.min(100, totalScore));

    const grade = clampedScore >= 80 ? "A" : clampedScore >= 60 ? "B" : clampedScore >= 40 ? "C" : "D";
    const priority = clampedScore >= 80 ? "maximum" : clampedScore >= 60 ? "high" : clampedScore >= 40 ? "medium" : "low";
    const trend = daysSince < 30 && orderCount > 2 ? "growing" : daysSince > 90 ? "declining" : "stable";
    const churnProb = Math.min(1, daysSince / 120);
    const recompraProb = Math.max(0, 1 - churnProb);

    scores.push({
      client_id: client.id,
      score_numeric: Math.round(clampedScore),
      score_grade: grade,
      priority_level: priority,
      recency_score: Math.round(recencyScore),
      frequency_score: Math.round(frequencyScore),
      monetary_score: Math.round(monetaryScore),
      risk_score: Math.round(riskScore),
      growth_score: Math.round(growthScore),
      engagement_score: Math.round(engagementScore),
      days_since_purchase: daysSince,
      purchase_trend: trend,
      churn_probability: Math.round(churnProb * 100) / 100,
      recompra_probability: Math.round(recompraProb * 100) / 100,
      explanation: `Score ${grade} (${Math.round(clampedScore)}/100). Recência: ${daysSince} dias. ${orderCount} pedidos, R$ ${totalValue.toFixed(0)} total. ${overdueCount > 0 ? `${overdueCount} títulos em atraso.` : "Sem inadimplência."}`,
      computed_at: now.toISOString(),
    });
  }

  // Upsert scores
  for (const score of scores) {
    await supabase.from("ai_sales_scores").upsert(score, { onConflict: "client_id" }).select();
  }

  // Also update client table scores
  for (const score of scores) {
    await supabase.from("clients").update({
      client_score: score.score_grade,
      abc_classification: score.score_grade,
    }).eq("id", score.client_id);
  }

  return { scored: scores.length };
}

// ─── Engine: Generate AI Recommendations ───────────────────────────────
async function generateRecommendations() {
  const { data: topClients } = await supabase
    .from("ai_sales_scores")
    .select("*, clients(id, name, code, segment, last_purchase_date, avg_ticket, total_purchases)")
    .order("score_numeric", { ascending: false })
    .limit(30);

  if (!topClients?.length) return { recommendations: 0 };

  const { data: products } = await supabase.from("products").select("id, name, code, sale_price, cost_price, category_id, status").eq("status", "active").limit(100);

  const systemPrompt = `Você é uma IA comercial de um ERP B2B. Analise os dados dos clientes e gere recomendações comerciais em português brasileiro. Seja específico e acionável. Foco em cross-sell, upsell, recuperação e aumento de ticket médio.`;

  const clientSummary = topClients.map((s: any) => {
    const c = s.clients;
    return `- ${c?.name} (${c?.code}): Score ${s.score_grade}(${s.score_numeric}), ${s.days_since_purchase} dias sem compra, trend: ${s.purchase_trend}, churn: ${Math.round(s.churn_probability * 100)}%, ticket médio: R$ ${c?.avg_ticket || 0}, segment: ${c?.segment || "N/A"}`;
  }).join("\n");

  const productList = (products || []).slice(0, 30).map((p: any) => `${p.name} (${p.code}): R$ ${p.sale_price}`).join(", ");

  const tools = [{
    type: "function",
    function: {
      name: "generate_recommendations",
      description: "Generate sales recommendations for clients",
      parameters: {
        type: "object",
        properties: {
          recommendations: {
            type: "array",
            items: {
              type: "object",
              properties: {
                client_code: { type: "string" },
                type: { type: "string", enum: ["cross_sell", "upsell", "recovery", "ticket_increase", "reorder"] },
                title: { type: "string" },
                description: { type: "string" },
                explanation: { type: "string" },
                estimated_value: { type: "number" },
                confidence: { type: "number" },
                priority: { type: "string", enum: ["maximum", "high", "medium", "low"] },
              },
              required: ["client_code", "type", "title", "description", "explanation", "priority"],
            },
          },
        },
        required: ["recommendations"],
      },
    },
  }];

  const result = await callAI(systemPrompt, `Clientes:\n${clientSummary}\n\nProdutos disponíveis: ${productList}\n\nGere de 5 a 15 recomendações comerciais práticas.`, tools);

  // Map client codes to IDs and insert
  let inserted = 0;
  for (const rec of result.recommendations || []) {
    const clientData = topClients.find((s: any) => s.clients?.code === rec.client_code);
    if (!clientData?.clients?.id) continue;

    await supabase.from("ai_recommendations").insert({
      client_id: clientData.clients.id,
      recommendation_type: rec.type,
      title: rec.title,
      description: rec.description,
      explanation: rec.explanation,
      estimated_value: rec.estimated_value || 0,
      confidence: rec.confidence || 0.7,
      priority: rec.priority,
      expires_at: new Date(Date.now() + 7 * 86400000).toISOString(),
    });
    inserted++;
  }

  return { recommendations: inserted };
}

// ─── Engine: Generate Insights for Managers ────────────────────────────
async function generateInsights() {
  const { data: scores } = await supabase.from("ai_sales_scores").select("*").limit(200);
  const { data: orders } = await supabase.from("orders").select("id, total, status, sales_rep_id, client_name, date").order("date", { ascending: false }).limit(200);
  const { data: reps } = await supabase.from("sales_reps").select("id, name, monthly_target, region").limit(50);
  const { data: funnel } = await supabase.from("sales_funnel").select("id, value, status, stage, sales_rep_id, updated_at").limit(200);

  const systemPrompt = `Você é um analista de inteligência comercial. Gere insights acionáveis para gestores em português. Cada insight deve ter: título curto, descrição detalhada, severidade e ações sugeridas.`;

  const now = new Date();
  const thisMonth = orders?.filter((o: any) => new Date(o.date).getMonth() === now.getMonth()) || [];
  const totalThisMonth = thisMonth.reduce((s: number, o: any) => s + (o.total || 0), 0);
  const cancelledPct = thisMonth.length > 0 ? (thisMonth.filter((o: any) => o.status === "cancelled").length / thisMonth.length * 100) : 0;

  const atRiskClients = (scores || []).filter((s: any) => s.churn_probability > 0.6).length;
  const highScoreClients = (scores || []).filter((s: any) => s.score_numeric >= 80).length;
  const stagnantDeals = (funnel || []).filter((f: any) => {
    const days = Math.floor((now.getTime() - new Date(f.updated_at).getTime()) / 86400000);
    return f.status === "open" && days > 14;
  }).length;

  const repSummary = (reps || []).map((r: any) => {
    const repOrders = thisMonth.filter((o: any) => o.sales_rep_id === r.id);
    const total = repOrders.reduce((s: number, o: any) => s + (o.total || 0), 0);
    return `${r.name}: R$ ${total.toFixed(0)} / meta R$ ${r.monthly_target || 0} (${r.monthly_target ? Math.round(total / r.monthly_target * 100) : 0}%)`;
  }).join("; ");

  const tools = [{
    type: "function",
    function: {
      name: "generate_insights",
      description: "Generate commercial insights",
      parameters: {
        type: "object",
        properties: {
          insights: {
            type: "array",
            items: {
              type: "object",
              properties: {
                type: { type: "string", enum: ["performance", "risk", "opportunity", "trend", "action"] },
                target_role: { type: "string", enum: ["seller", "supervisor", "manager", "director"] },
                title: { type: "string" },
                description: { type: "string" },
                severity: { type: "string", enum: ["critical", "warning", "info", "success"] },
                suggested_actions: { type: "array", items: { type: "string" } },
              },
              required: ["type", "target_role", "title", "description", "severity"],
            },
          },
        },
        required: ["insights"],
      },
    },
  }];

  const prompt = `Dados comerciais do mês:
- Faturamento: R$ ${totalThisMonth.toFixed(0)}
- Pedidos: ${thisMonth.length}
- Cancelamentos: ${cancelledPct.toFixed(1)}%
- Clientes em risco (churn >60%): ${atRiskClients}
- Clientes A (score >=80): ${highScoreClients}
- Negociações paradas (>14 dias): ${stagnantDeals}
- Performance por vendedor: ${repSummary}

Gere de 3 a 8 insights comerciais acionáveis para diferentes níveis hierárquicos.`;

  const result = await callAI(systemPrompt, prompt, tools);

  let inserted = 0;
  for (const insight of result.insights || []) {
    await supabase.from("ai_sales_insights").insert({
      insight_type: insight.type,
      target_role: insight.target_role,
      title: insight.title,
      description: insight.description,
      severity: insight.severity,
      suggested_actions: insight.suggested_actions || [],
      expires_at: new Date(Date.now() + 3 * 86400000).toISOString(),
    });
    inserted++;
  }

  return { insights: inserted };
}

// ─── Engine: Daily Action Queue ────────────────────────────────────────
async function generateDailyActions() {
  const today = new Date().toISOString().split("T")[0];
  
  // Check if already generated today
  const { data: existing } = await supabase.from("ai_daily_actions").select("id").eq("action_date", today).limit(1);
  if (existing?.length) return { actions: 0, message: "Already generated today" };

  const { data: scores } = await supabase.from("ai_sales_scores")
    .select("*, clients(id, name, code, phone, cellphone, segment, sales_rep_id)")
    .order("score_numeric", { ascending: false })
    .limit(50);

  if (!scores?.length) return { actions: 0 };

  const actions: any[] = [];

  for (const score of scores) {
    const c = score.clients;
    if (!c) continue;

    let actionType = "call";
    let priority = 5;
    let title = "";
    let description = "";

    if (score.churn_probability > 0.7) {
      actionType = "urgent_call";
      priority = 1;
      title = `🚨 Recuperar ${c.name}`;
      description = `Cliente em risco crítico de churn (${Math.round(score.churn_probability * 100)}%). Último pedido há ${score.days_since_purchase} dias.`;
    } else if (score.churn_probability > 0.4) {
      actionType = "follow_up";
      priority = 2;
      title = `📞 Follow-up ${c.name}`;
      description = `Risco moderado. ${score.days_since_purchase} dias sem compra. Score ${score.score_grade}.`;
    } else if (score.priority_level === "maximum") {
      actionType = "upsell";
      priority = 3;
      title = `📈 Upsell ${c.name}`;
      description = `Cliente A com alto potencial. Score ${score.score_numeric}/100. Sugerir aumento de mix.`;
    } else if (score.recompra_probability > 0.7) {
      actionType = "reorder";
      priority = 4;
      title = `🛒 Reposição ${c.name}`;
      description = `Alta probabilidade de recompra (${Math.round(score.recompra_probability * 100)}%). Sugerir pedido.`;
    }

    if (title) {
      actions.push({
        sales_rep_id: c.sales_rep_id,
        client_id: c.id,
        action_date: today,
        action_type: actionType,
        priority,
        title,
        description,
        explanation: score.explanation,
        estimated_value: (score.clients as any)?.avg_ticket || 0,
      });
    }
  }

  if (actions.length > 0) {
    await supabase.from("ai_daily_actions").insert(actions);
  }

  return { actions: actions.length };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const { action } = await req.json();

    let result: any;

    switch (action) {
      case "score_clients":
        result = await scoreClients();
        break;
      case "generate_recommendations":
        result = await generateRecommendations();
        break;
      case "generate_insights":
        result = await generateInsights();
        break;
      case "generate_daily_actions":
        result = await generateDailyActions();
        break;
      case "full_analysis":
        const scoreResult = await scoreClients();
        const actionsResult = await generateDailyActions();
        const recsResult = await generateRecommendations();
        const insightsResult = await generateInsights();
        result = { ...scoreResult, ...actionsResult, ...recsResult, ...insightsResult };
        break;
      default:
        throw new Error(`Unknown action: ${action}`);
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("ai-commercial error:", e);
    const status = (e as any)?.message?.includes("429") ? 429 : (e as any)?.message?.includes("402") ? 402 : 500;
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

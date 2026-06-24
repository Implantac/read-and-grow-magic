import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getSystemPrompt } from "../_shared/ai-prompts.ts";
import { resolveContextByIds, branchScope } from "../_shared/tenant.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-branch-id",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
};

// Helper: append branch filter to a query if scope is set
const inBranch = <T extends { in: any }>(q: T, scope: string[] | null) =>
  scope ? (q as any).in("branch_id", scope) : q;

const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// --- Auth helper ---
async function requireAuth(req: Request): Promise<Response | { userId: string; companyId: string; scope: string[] | null }> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  const userClient = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_ANON_KEY")!, {
    global: { headers: { Authorization: authHeader } },
  });
  const token = authHeader.replace("Bearer ", "");
  const { data, error } = await userClient.auth.getClaims(token);
  if (error || !data?.claims) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  const userId = (data.claims as any).sub as string;
  const { data: profile } = await supabase.from("profiles").select("company_id, default_branch_id").eq("id", userId).maybeSingle();
  const companyId = (profile as any)?.company_id as string | undefined;
  if (!companyId) {
    return new Response(JSON.stringify({ error: "Forbidden" }), {
      status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  const ctx = await resolveContextByIds(req, {
    userId,
    companyId,
    defaultBranchId: (profile as any)?.default_branch_id ?? null,
  });
  if (!ctx.ok) {
    return new Response(JSON.stringify({ error: ctx.message }), {
      status: ctx.status, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  return { userId, companyId, scope: branchScope(ctx) };
}


async function callAI(systemPrompt: string, userPrompt: string, tools?: any[]): Promise<any> {
  const body: any = {
    model: "google/gemini-2.0-flash-exp",
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

// ─── Engine 1: Score Clients (Fase 1) ──────────────────────────────────
async function scoreClients(companyId: string, scope: string[] | null) {
  const { data: clients } = await supabase.from("clients").select("*").eq("company_id", companyId).eq("status", "active").limit(200);
  if (!clients?.length) return { scored: 0 };

  const { data: orders } = await inBranch(supabase.from("orders").select("id, client_id, total, date, status, sales_rep_id, branch_id").eq("company_id", companyId).neq("status", "cancelled").order("date", { ascending: false }).limit(2000), scope);
  const { data: receivables } = await inBranch(supabase.from("accounts_receivable").select("client_id, amount, status, due_date, branch_id").eq("company_id", companyId).limit(1000), scope);
  const { data: sales } = await supabase.from("sales").select("id, client_id, total, date, status").eq("company_id", companyId).neq("status", "cancelled").order("date", { ascending: false }).limit(1000);


  const now = new Date();
  const scores: any[] = [];

  for (const client of clients) {
    const cOrders = (orders || []).filter((o: any) => o.client_id === client.id);
    const cSales = (sales || []).filter((s: any) => s.client_id === client.id);
    const cReceivables = (receivables || []).filter((r: any) => r.client_id === client.id);

    const allTransactions = [...cOrders, ...cSales];
    const totalValue = allTransactions.reduce((s: number, o: any) => s + (o.total || 0), 0);
    const txCount = allTransactions.length;
    
    const sortedDates = allTransactions.map(t => new Date(t.date).getTime()).sort((a, b) => b - a);
    const lastDate = sortedDates[0] ? new Date(sortedDates[0]) : null;
    const daysSince = lastDate ? Math.floor((now.getTime() - lastDate.getTime()) / 86400000) : 999;

    // Calculate purchase intervals for frequency
    let avgInterval = 0;
    if (sortedDates.length >= 2) {
      const intervals = [];
      for (let i = 0; i < sortedDates.length - 1; i++) {
        intervals.push((sortedDates[i] - sortedDates[i + 1]) / 86400000);
      }
      avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    }

    // Trend: compare last 3 months vs prior 3 months
    const threeMonthsAgo = new Date(now.getTime() - 90 * 86400000);
    const sixMonthsAgo = new Date(now.getTime() - 180 * 86400000);
    const recentValue = allTransactions.filter(t => new Date(t.date) >= threeMonthsAgo).reduce((s: number, t: any) => s + (t.total || 0), 0);
    const priorValue = allTransactions.filter(t => { const d = new Date(t.date); return d >= sixMonthsAgo && d < threeMonthsAgo; }).reduce((s: number, t: any) => s + (t.total || 0), 0);

    const overdueCount = cReceivables.filter((r: any) => r.status === "overdue" || (r.status === "pending" && new Date(r.due_date) < now)).length;
    const overdueAmount = cReceivables.filter((r: any) => r.status === "overdue" || (r.status === "pending" && new Date(r.due_date) < now)).reduce((s: number, r: any) => s + (r.amount || 0), 0);

    // RFM scoring (0-100 each)
    const recencyScore = Math.max(0, 100 - daysSince * 1.2);
    const frequencyScore = Math.min(100, txCount * 12);
    const monetaryScore = Math.min(100, totalValue / 500);

    const riskScore = Math.min(100, overdueCount * 20 + (daysSince > 60 ? 25 : 0) + (overdueAmount > 5000 ? 15 : 0));
    const growthScore = priorValue > 0 ? Math.min(100, (recentValue / priorValue - 1) * 100 + 50) : (recentValue > 0 ? 60 : 0);
    const engagementScore = daysSince < 15 ? 95 : daysSince < 30 ? 70 : daysSince < 60 ? 40 : daysSince < 90 ? 20 : 5;

    const totalScore = (recencyScore * 0.25 + frequencyScore * 0.2 + monetaryScore * 0.25 + engagementScore * 0.15 + growthScore * 0.1 - riskScore * 0.05);
    const clampedScore = Math.max(0, Math.min(100, totalScore));

    const grade = clampedScore >= 80 ? "A" : clampedScore >= 60 ? "B" : clampedScore >= 40 ? "C" : "D";
    const priority = clampedScore >= 80 ? "maximum" : clampedScore >= 60 ? "high" : clampedScore >= 40 ? "medium" : "low";
    
    let trend = "stable";
    if (priorValue > 0) {
      const change = (recentValue - priorValue) / priorValue;
      trend = change > 0.15 ? "growing" : change < -0.15 ? "declining" : "stable";
    } else if (recentValue > 0) {
      trend = "growing";
    } else if (daysSince > 90) {
      trend = "declining";
    }

    const churnProb = Math.min(1, Math.max(0, (daysSince - 20) / 100));
    const recompraProb = Math.max(0, 1 - churnProb);

    scores.push({
      client_id: client.id,
      company_id: companyId,
      score_numeric: Math.round(clampedScore),
      score_grade: grade,
      priority_level: priority,
      recency_score: Math.round(recencyScore),
      frequency_score: Math.round(frequencyScore),
      monetary_score: Math.round(monetaryScore),
      risk_score: Math.round(riskScore),
      growth_score: Math.round(Math.max(0, Math.min(100, growthScore))),
      engagement_score: Math.round(engagementScore),
      days_since_purchase: daysSince,
      purchase_trend: trend,
      churn_probability: Math.round(churnProb * 100) / 100,
      recompra_probability: Math.round(recompraProb * 100) / 100,
      explanation: `Score ${grade} (${Math.round(clampedScore)}/100). Recência: ${daysSince} dias. ${txCount} transações, R$ ${totalValue.toFixed(0)} total. Tendência: ${trend}. ${overdueCount > 0 ? `${overdueCount} títulos em atraso (R$ ${overdueAmount.toFixed(0)}).` : "Sem inadimplência."} ${avgInterval > 0 ? `Frequência média: ${Math.round(avgInterval)} dias.` : ""}`,
      computed_at: now.toISOString(),
    });
  }

  // Upsert scores
  for (const score of scores) {
    await supabase.from("ai_sales_scores").upsert(score, { onConflict: "client_id" }).select();
  }

  // Update client table
  for (const score of scores) {
    await supabase.from("clients").update({
      client_score: score.score_grade,
      abc_classification: score.score_grade,
    }).eq("id", score.client_id).eq("company_id", companyId);
  }

  return { scored: scores.length };
}

// ─── Engine 2: AI Recommendations (Fase 2 - cross-sell, upsell, ticket) ──
async function generateRecommendations(companyId: string, scope: string[] | null) {
  const { data: topClients } = await supabase
    .from("ai_sales_scores")
    .select("*, clients(id, name, code, segment, last_purchase_date, avg_ticket, total_purchases, default_payment_condition)")
    .eq("company_id", companyId)
    .order("score_numeric", { ascending: false })
    .limit(30);

  if (!topClients?.length) return { recommendations: 0 };

  const { data: products } = await supabase.from("products").select("id, name, code, sale_price, cost_price, category_id, status").eq("company_id", companyId).eq("status", "active").limit(100);

  // Get recent order items for each client to know what they buy
  const clientIds = topClients.map((s: any) => s.client_id);
  const { data: recentOrders } = await inBranch(supabase.from("orders")
    .select("client_id, total, date, branch_id, order_items(product_name, product_code, quantity, unit_price, total)")
    .eq("company_id", companyId)
    .in("client_id", clientIds)
    .neq("status", "cancelled")
    .order("date", { ascending: false })
    .limit(200), scope);


  const clientProducts: Record<string, string[]> = {};
  (recentOrders || []).forEach((o: any) => {
    if (!clientProducts[o.client_id]) clientProducts[o.client_id] = [];
    (o.order_items || []).forEach((item: any) => {
      if (!clientProducts[o.client_id].includes(item.product_name)) {
        clientProducts[o.client_id].push(item.product_name);
      }
    });
  });

  const systemPrompt = await getSystemPrompt('SALES_CONSULTANT', `Analise os dados dos clientes e gere recomendações comerciais específicas e acionáveis.
# 🎯 TIPOS DE RECOMENDAÇÃO
- cross_sell, upsell, recovery, ticket_increase, reorder.
# 🛠️ FORMATO
Utilize a função 'generate_recommendations' com o JSON estruturado.`, supabase, 'ai-commercial-recommendations');

  const clientSummary = topClients.map((s: any) => {
    const c = s.clients;
    const prods = clientProducts[s.client_id]?.slice(0, 5).join(", ") || "sem histórico detalhado";
    return `- ${c?.name} (${c?.code}): Score ${s.score_grade}(${s.score_numeric}), ${s.days_since_purchase}d sem compra, trend: ${s.purchase_trend}, churn: ${Math.round(s.churn_probability * 100)}%, ticket: R$${c?.avg_ticket || 0}, segmento: ${c?.segment || "N/A"}, compra: ${prods}`;
  }).join("\n");

  const productList = (products || []).slice(0, 40).map((p: any) => {
    const margin = p.cost_price > 0 ? Math.round(((p.sale_price - p.cost_price) / p.sale_price) * 100) : 0;
    return `${p.name} (${p.code}): R$${p.sale_price} [margem ${margin}%]`;
  }).join(", ");

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
                title: { type: "string", description: "Título curto e acionável" },
                description: { type: "string", description: "O que fazer: produto, quantidade, valor sugerido" },
                explanation: { type: "string", description: "Por que esta recomendação — dados que sustentam" },
                estimated_value: { type: "number" },
                confidence: { type: "number", description: "0 a 1" },
                priority: { type: "string", enum: ["maximum", "high", "medium", "low"] },
                suggested_products: { type: "array", items: { type: "string" }, description: "Códigos dos produtos sugeridos" },
              },
              required: ["client_code", "type", "title", "description", "explanation", "priority"],
            },
          },
        },
        required: ["recommendations"],
      },
    },
  }];

  const result = await callAI(systemPrompt, `Clientes:\n${clientSummary}\n\nProdutos disponíveis: ${productList}\n\nGere de 8 a 20 recomendações comerciais práticas e específicas.`, tools);

  let inserted = 0;
  for (const rec of result.recommendations || []) {
    const clientData = topClients.find((s: any) => s.clients?.code === rec.client_code);
    if (!clientData?.clients?.id) continue;

    await supabase.from("ai_recommendations").insert({
      client_id: clientData.clients.id,
      company_id: companyId,
      recommendation_type: rec.type,
      title: rec.title,
      description: rec.description,
      explanation: rec.explanation,
      suggested_products: rec.suggested_products || [],
      estimated_value: rec.estimated_value || 0,
      confidence: rec.confidence || 0.7,
      priority: rec.priority,
      expires_at: new Date(Date.now() + 7 * 86400000).toISOString(),
    });
    inserted++;
  }

  return { recommendations: inserted };
}

// ─── Engine 3: Insights for Managers (Fase 3) ─────────────────────────
async function generateInsights(companyId: string, scope: string[] | null) {
  const { data: scores } = await supabase.from("ai_sales_scores").select("*").eq("company_id", companyId).limit(200);
  const { data: orders } = await inBranch(supabase.from("orders").select("id, total, status, sales_rep_id, sales_rep_name, client_name, client_id, date, branch_id").eq("company_id", companyId).order("date", { ascending: false }).limit(500), scope);
  const { data: reps } = await supabase.from("sales_reps").select("id, name, monthly_target, region").eq("company_id", companyId).limit(50);
  const { data: funnel } = await supabase.from("sales_funnel").select("id, value, status, stage, sales_rep_id, updated_at, title").eq("company_id", companyId).limit(200);
  const { data: targets } = await supabase.from("sales_targets").select("*").eq("company_id", companyId).limit(50);


  const now = new Date();
  const thisMonth = orders?.filter((o: any) => new Date(o.date).getMonth() === now.getMonth() && new Date(o.date).getFullYear() === now.getFullYear()) || [];
  const lastMonth = orders?.filter((o: any) => {
    const d = new Date(o.date);
    const lm = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    return d.getMonth() === lm.getMonth() && d.getFullYear() === lm.getFullYear();
  }) || [];

  const totalThisMonth = thisMonth.reduce((s: number, o: any) => s + (o.total || 0), 0);
  const totalLastMonth = lastMonth.reduce((s: number, o: any) => s + (o.total || 0), 0);
  const monthChange = totalLastMonth > 0 ? ((totalThisMonth - totalLastMonth) / totalLastMonth * 100) : 0;
  const cancelledPct = thisMonth.length > 0 ? (thisMonth.filter((o: any) => o.status === "cancelled").length / thisMonth.length * 100) : 0;

  const atRiskClients = (scores || []).filter((s: any) => s.churn_probability > 0.6).length;
  const decliningClients = (scores || []).filter((s: any) => s.purchase_trend === "declining").length;
  const highScoreClients = (scores || []).filter((s: any) => s.score_numeric >= 80).length;
  const stagnantDeals = (funnel || []).filter((f: any) => {
    const days = Math.floor((now.getTime() - new Date(f.updated_at).getTime()) / 86400000);
    return f.status === "open" && days > 14;
  });

  // Concentration analysis
  const clientTotals: Record<string, number> = {};
  thisMonth.forEach((o: any) => { clientTotals[o.client_id] = (clientTotals[o.client_id] || 0) + (o.total || 0); });
  const sortedClients = Object.entries(clientTotals).sort((a, b) => b[1] - a[1]);
  const top3Value = sortedClients.slice(0, 3).reduce((s, [, v]) => s + v, 0);
  const concentrationPct = totalThisMonth > 0 ? (top3Value / totalThisMonth * 100) : 0;

  // Region analysis
  const regionTotals: Record<string, number> = {};
  thisMonth.forEach((o: any) => {
    const rep = reps?.find((r: any) => r.id === o.sales_rep_id);
    const region = rep?.region || "sem_região";
    regionTotals[region] = (regionTotals[region] || 0) + (o.total || 0);
  });

  const repSummary = (reps || []).map((r: any) => {
    const repOrders = thisMonth.filter((o: any) => o.sales_rep_id === r.id);
    const total = repOrders.reduce((s: number, o: any) => s + (o.total || 0), 0);
    const convCount = repOrders.filter((o: any) => !["cancelled", "pending"].includes(o.status)).length;
    return `${r.name} (${r.region || "N/A"}): R$${total.toFixed(0)} / meta R$${r.monthly_target || 0} (${r.monthly_target ? Math.round(total / r.monthly_target * 100) : 0}%), ${repOrders.length} pedidos, ${convCount} convertidos`;
  }).join("; ");

  const regionSummary = Object.entries(regionTotals).map(([r, v]) => `${r}: R$${v.toFixed(0)}`).join("; ");

  const systemPrompt = await getSystemPrompt('SALES_CONSULTANT', `Gere insights acionáveis para diferentes níveis hierárquicos (vendedor, supervisor, gerente, diretoria).
- Severidade: critical, warning, info, success.
- Foque em ações imediatas para aumentar vendas ou reduzir riscos comerciais.
- Utilize a função 'generate_insights'.`, supabase, 'ai-commercial-insights');

  const tools = [{
    type: "function",
    function: {
      name: "generate_insights",
      description: "Generate commercial insights for management levels",
      parameters: {
        type: "object",
        properties: {
          insights: {
            type: "array",
            items: {
              type: "object",
              properties: {
                type: { type: "string", enum: ["performance", "risk", "opportunity", "trend", "action", "concentration", "forecast"] },
                target_role: { type: "string", enum: ["seller", "supervisor", "manager", "director"] },
                title: { type: "string" },
                description: { type: "string" },
                explanation: { type: "string", description: "Raciocínio por trás do insight" },
                severity: { type: "string", enum: ["critical", "warning", "info", "success"] },
                suggested_actions: { type: "array", items: { type: "string" } },
              },
              required: ["type", "target_role", "title", "description", "severity", "suggested_actions"],
            },
          },
        },
        required: ["insights"],
      },
    },
  }];

  const prompt = `Dados comerciais do mês atual:
- Faturamento mês: R$ ${totalThisMonth.toFixed(0)}
- Faturamento mês anterior: R$ ${totalLastMonth.toFixed(0)} (variação: ${monthChange.toFixed(1)}%)
- Pedidos mês: ${thisMonth.length}
- Cancelamentos: ${cancelledPct.toFixed(1)}%
- Clientes em risco (churn >60%): ${atRiskClients}
- Clientes em queda: ${decliningClients}
- Clientes A (score >=80): ${highScoreClients}
- Negociações paradas (>14 dias): ${stagnantDeals.length}
- Concentração top 3 clientes: ${concentrationPct.toFixed(0)}%
- Regiões: ${regionSummary}
- Performance por vendedor: ${repSummary}
- Dia do mês: ${now.getDate()}/30 (${Math.round(now.getDate() / 30 * 100)}% do mês)

Gere de 5 a 12 insights comerciais acionáveis para vendedores, supervisores, gerentes e diretoria.`;

  const result = await callAI(systemPrompt, prompt, tools);

  let inserted = 0;
  for (const insight of result.insights || []) {
    await supabase.from("ai_sales_insights").insert({
      company_id: companyId,
      insight_type: insight.type,
      target_role: insight.target_role,
      title: insight.title,
      description: insight.description,
      explanation: insight.explanation || null,
      severity: insight.severity,
      suggested_actions: insight.suggested_actions || [],
      expires_at: new Date(Date.now() + 3 * 86400000).toISOString(),
    });
    inserted++;
  }

  return { insights: inserted };
}

// ─── Engine 4: Daily Action Queue (Fase 1+4) ─────────────────────────
async function generateDailyActions(companyId: string, _scope: string[] | null) {
  const today = new Date().toISOString().split("T")[0];

  // Delete old actions (not today) to avoid clutter
  await supabase.from("ai_daily_actions").delete().eq("company_id", companyId).neq("action_date", today).eq("status", "pending");

  // Check if already generated today
  const { data: existing } = await supabase.from("ai_daily_actions").select("id").eq("company_id", companyId).eq("action_date", today).limit(1);
  if (existing?.length) return { actions: 0, message: "Already generated today" };

  const { data: scores } = await supabase.from("ai_sales_scores")
    .select("*, clients(id, name, code, phone, cellphone, segment, sales_rep_id, avg_ticket, total_purchases, last_purchase_date)")
    .eq("company_id", companyId)
    .order("score_numeric", { ascending: false })
    .limit(100);

  const { data: pendingFollowUps } = await supabase.from("follow_ups")
    .select("client_id, subject, scheduled_date")
    .eq("company_id", companyId)
    .eq("status", "pending")
    .lte("scheduled_date", new Date().toISOString())
    .limit(50);

  const { data: stagnantFunnel } = await supabase.from("sales_funnel")
    .select("id, title, value, client_id, sales_rep_id, stage, updated_at")
    .eq("company_id", companyId)
    .eq("status", "open")

    .limit(50);

  if (!scores?.length) return { actions: 0 };

  const actions: any[] = [];
  const now = new Date();

  // Stagnant funnel deals
  (stagnantFunnel || []).forEach((f: any) => {
    const days = Math.floor((now.getTime() - new Date(f.updated_at).getTime()) / 86400000);
    if (days > 7) {
      actions.push({
        sales_rep_id: f.sales_rep_id,
        client_id: f.client_id,
        action_date: today,
        action_type: "follow_up",
        priority: days > 21 ? 1 : days > 14 ? 2 : 3,
        title: `⏳ Negociação parada: ${f.title}`,
        description: `Oportunidade de R$ ${(f.value || 0).toFixed(0)} parada há ${days} dias na etapa "${f.stage}". Alto risco de perda se não houver ação.`,
        explanation: `Negociações que ficam mais de 14 dias sem movimentação têm 60% de chance de serem perdidas.`,
        estimated_value: f.value || 0,
      });
    }
  });

  // Overdue follow-ups
  (pendingFollowUps || []).forEach((fu: any) => {
    const score = scores.find((s: any) => s.client_id === fu.client_id);
    if (!score) return;
    actions.push({
      sales_rep_id: score.clients?.sales_rep_id,
      client_id: fu.client_id,
      action_date: today,
      action_type: "follow_up",
      priority: 2,
      title: `📞 Follow-up atrasado: ${score.clients?.name}`,
      description: `${fu.subject}. Agendado para ${new Date(fu.scheduled_date).toLocaleDateString("pt-BR")}.`,
      explanation: `Follow-ups atrasados reduzem a taxa de conversão em até 30%.`,
      estimated_value: score.clients?.avg_ticket || 0,
    });
  });

  // Score-based actions
  for (const score of scores) {
    const c = score.clients;
    if (!c) continue;

    // Skip if already has an action
    if (actions.find(a => a.client_id === c.id)) continue;

    let actionType = "";
    let priority = 5;
    let title = "";
    let description = "";
    let explanation = "";

    if (score.churn_probability > 0.7) {
      actionType = "urgent_call";
      priority = 1;
      title = `🚨 URGENTE: Recuperar ${c.name}`;
      description = `Cliente em risco crítico de churn (${Math.round(score.churn_probability * 100)}%). Último pedido há ${score.days_since_purchase} dias. Total histórico: R$ ${(c.total_purchases || 0).toFixed(0)}.`;
      explanation = `Este cliente tem ${Math.round(score.churn_probability * 100)}% de probabilidade de não comprar mais. Cada dia sem contato aumenta o risco. Clientes com este perfil que recebem contato proativo têm 45% de chance de reativação.`;
    } else if (score.churn_probability > 0.4 && score.purchase_trend === "declining") {
      actionType = "recovery";
      priority = 2;
      title = `📉 Cliente em queda: ${c.name}`;
      description = `Volume de compras caindo. ${score.days_since_purchase} dias sem compra. Score ${score.score_grade}(${score.score_numeric}).`;
      explanation = `A tendência de queda combinada com risco moderado de churn indica que o cliente pode estar migrando para um concorrente. Contato imediato é essencial.`;
    } else if (score.priority_level === "maximum" && score.recompra_probability > 0.6) {
      actionType = "upsell";
      priority = 3;
      title = `📈 Expandir ${c.name}`;
      description = `Cliente A com alto potencial. Score ${score.score_numeric}/100, probabilidade de recompra ${Math.round(score.recompra_probability * 100)}%. Sugerir aumento de mix.`;
      explanation = `Clientes com score A e alta probabilidade de recompra são os melhores candidatos para upsell. Ticket médio pode crescer até 30%.`;
    } else if (score.recompra_probability > 0.75) {
      actionType = "reorder";
      priority = 4;
      title = `🛒 Reposição: ${c.name}`;
      description = `Alta probabilidade de recompra (${Math.round(score.recompra_probability * 100)}%). Ticket médio: R$ ${(c.avg_ticket || 0).toFixed(0)}.`;
      explanation = `Baseado no padrão de compra, este cliente está no ponto ideal de reposição. Contato proativo aumenta a chance de pedido em 60%.`;
    } else if (score.purchase_trend === "growing") {
      actionType = "expand";
      priority = 5;
      title = `🌟 Oportunidade: ${c.name}`;
      description = `Cliente em crescimento (${score.purchase_trend}). Score ${score.score_grade}. Potencial para expandir mix.`;
      explanation = `Clientes com tendência de crescimento são os melhores para ofertas de cross-sell e novos produtos.`;
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
        explanation,
        estimated_value: c.avg_ticket || 0,
      });
    }
  }

  // Sort by priority and limit to top 30
  actions.sort((a, b) => a.priority - b.priority);
  const topActions = actions.slice(0, 30);

  if (topActions.length > 0) {
    await supabase.from("ai_daily_actions").insert(topActions.map((a) => ({ ...a, company_id: companyId })));
  }

  return { actions: topActions.length };
}

// ─── Engine 5: Opportunity Predictions (Fase 3) ──────────────────────
async function generatePredictions(companyId: string, scope: string[] | null) {
  const { data: funnelItems } = await supabase.from("sales_funnel")
    .select("*, clients:client_id(id, name, code)")
    .eq("company_id", companyId)
    .eq("status", "open")
    .order("value", { ascending: false })
    .limit(50);

  if (!funnelItems?.length) return { predictions: 0 };

  const { data: orders } = await inBranch(supabase.from("orders")
    .select("id, client_id, total, status, date, branch_id")
    .eq("company_id", companyId)
    .order("date", { ascending: false })
    .limit(500), scope);


  const now = new Date();

  // Stage weights for probability
  const stageWeights: Record<string, number> = {
    lead: 0.10, opportunity: 0.25, proposal_sent: 0.45,
    negotiation: 0.65, awaiting_approval: 0.80, approved: 0.95,
    released: 0.98, separating: 0.99, production: 0.99,
    invoiced: 1.0, delivered: 1.0, post_sale: 1.0,
  };

  const predictions: any[] = [];

  for (const item of funnelItems) {
    const daysInStage = Math.floor((now.getTime() - new Date(item.updated_at).getTime()) / 86400000);
    const baseProb = stageWeights[item.stage] || 0.3;

    // Decay: longer in stage = lower probability
    const decayFactor = Math.max(0.3, 1 - (daysInStage / 60));
    const closeProbability = Math.round(baseProb * decayFactor * 100) / 100;

    // Loss risk increases with time
    const lossRisk = Math.min(0.95, Math.round((1 - closeProbability) * (1 + daysInStage / 30)) / 1);

    // Predicted close date
    const avgDaysToClose = Math.max(7, 30 - (baseProb * 25));
    const predictedClose = new Date(now.getTime() + avgDaysToClose * 86400000);

    // Recommended action
    let recommendedAction = "";
    if (daysInStage > 21) {
      recommendedAction = "Negociação parada há muito tempo. Escalar para gestor ou oferecer condição especial.";
    } else if (daysInStage > 14) {
      recommendedAction = "Follow-up urgente. Risco de perda se não agir esta semana.";
    } else if (baseProb > 0.7) {
      recommendedAction = "Alta chance de fechamento. Confirmar detalhes e fechar.";
    } else if (baseProb > 0.4) {
      recommendedAction = "Reforçar proposta de valor e agendar reunião de fechamento.";
    } else {
      recommendedAction = "Qualificar melhor a oportunidade e entender necessidades.";
    }

    // Key factors
    const keyFactors = {
      stage: item.stage,
      days_in_stage: daysInStage,
      base_probability: baseProb,
      decay_factor: decayFactor,
      client_history: (orders || []).filter((o: any) => o.client_id === item.client_id && !["cancelled"].includes(o.status)).length,
    };

    predictions.push({
      funnel_id: item.id,
      client_id: item.client_id,
      company_id: companyId,
      close_probability: closeProbability,
      loss_risk: Math.round(Math.min(1, lossRisk) * 100) / 100,
      predicted_close_date: predictedClose.toISOString().split("T")[0],
      predicted_value: item.value || 0,
      recommended_action: recommendedAction,
      key_factors: keyFactors,
      explanation: `Probabilidade de ${Math.round(closeProbability * 100)}% baseada no estágio "${item.stage}" (peso ${Math.round(baseProb * 100)}%) com decaimento por ${daysInStage} dias parado (fator ${decayFactor.toFixed(2)}). ${(keyFactors.client_history || 0) > 0 ? `Cliente tem ${keyFactors.client_history} pedidos anteriores.` : "Cliente sem histórico de pedidos."}`,
      computed_at: now.toISOString(),
    });
  }

  // Clear old predictions for this company and insert new ones
  await supabase.from("ai_opportunity_predictions").delete().eq("company_id", companyId);

  if (predictions.length > 0) {
    for (const pred of predictions) {
      await supabase.from("ai_opportunity_predictions").insert(pred);
    }
  }

  return { predictions: predictions.length };
}

// ─── Engine 6: Forecast Snapshot (Fase 3) ─────────────────────────────
async function generateForecast(companyId: string, scope: string[] | null) {
  const now = new Date();
  const period = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  const { data: orders } = await inBranch(supabase.from("orders")
    .select("id, total, status, sales_rep_id, sales_rep_name, client_id, date, branch_id")
    .eq("company_id", companyId)
    .gte("date", `${period}-01`)
    .order("date", { ascending: false }), scope);

  const { data: funnel } = await supabase.from("sales_funnel")
    .select("id, value, stage, status, sales_rep_id, client_id")
    .eq("company_id", companyId)
    .in("status", ["open", "active"]);

  const { data: reps } = await supabase.from("sales_reps").select("id, name, region, monthly_target").eq("company_id", companyId).limit(50);
  const { data: clients } = await supabase.from("clients").select("id, segment, region").eq("company_id", companyId).limit(500);


  const stageWeights: Record<string, number> = {
    lead: 0.10, opportunity: 0.25, proposal_sent: 0.45,
    negotiation: 0.65, awaiting_approval: 0.80, approved: 0.95,
  };

  const confirmedValue = (orders || [])
    .filter((o: any) => ["confirmed", "approved", "invoiced", "delivered", "shipped"].includes(o.status))
    .reduce((s: number, o: any) => s + (o.total || 0), 0);

  let weightedPipeline = 0;
  let totalPipeline = 0;
  (funnel || []).forEach((f: any) => {
    const val = f.value || 0;
    totalPipeline += val;
    weightedPipeline += val * (stageWeights[f.stage] || 0.3);
  });

  const predictedRevenue = confirmedValue + weightedPipeline;
  const bestCase = confirmedValue + totalPipeline;
  const worstCase = confirmedValue + weightedPipeline * 0.5;

  // Confidence based on how much is confirmed vs predicted
  const confidence = predictedRevenue > 0 ? Math.round((confirmedValue / predictedRevenue) * 100) / 100 : 0;

  // By rep
  const byRep: Record<string, any> = {};
  (orders || []).forEach((o: any) => {
    if (!o.sales_rep_id) return;
    if (!byRep[o.sales_rep_id]) byRep[o.sales_rep_id] = { name: o.sales_rep_name || "", confirmed: 0, pipeline: 0 };
    if (!["cancelled", "pending"].includes(o.status)) byRep[o.sales_rep_id].confirmed += o.total || 0;
  });
  (funnel || []).forEach((f: any) => {
    if (!f.sales_rep_id) return;
    if (!byRep[f.sales_rep_id]) byRep[f.sales_rep_id] = { name: "", confirmed: 0, pipeline: 0 };
    byRep[f.sales_rep_id].pipeline += (f.value || 0) * (stageWeights[f.stage] || 0.3);
  });

  // By segment
  const bySegment: Record<string, number> = {};
  (orders || []).filter((o: any) => !["cancelled"].includes(o.status)).forEach((o: any) => {
    const client = clients?.find((c: any) => c.id === o.client_id);
    const seg = client?.segment || "Outros";
    bySegment[seg] = (bySegment[seg] || 0) + (o.total || 0);
  });

  // By region
  const byRegion: Record<string, number> = {};
  (orders || []).filter((o: any) => !["cancelled"].includes(o.status)).forEach((o: any) => {
    const rep = reps?.find((r: any) => r.id === o.sales_rep_id);
    const region = rep?.region || "Sem Região";
    byRegion[region] = (byRegion[region] || 0) + (o.total || 0);
  });

  const totalTarget = (reps || []).reduce((s: number, r: any) => s + (r.monthly_target || 0), 0);
  const dayOfMonth = now.getDate();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const projectedFromConfirmed = confirmedValue * (daysInMonth / dayOfMonth);

  const factors = {
    confirmed_value: confirmedValue,
    total_pipeline: totalPipeline,
    weighted_pipeline: weightedPipeline,
    projected_from_pace: projectedFromConfirmed,
    total_target: totalTarget,
    target_achievement_pct: totalTarget > 0 ? Math.round((predictedRevenue / totalTarget) * 100) : 0,
    days_remaining: daysInMonth - dayOfMonth,
    daily_needed: totalTarget > 0 ? Math.round((totalTarget - confirmedValue) / Math.max(1, daysInMonth - dayOfMonth)) : 0,
  };

  await supabase.from("ai_forecast_snapshots").insert({
    company_id: companyId,
    period,
    forecast_date: now.toISOString().split("T")[0],
    predicted_revenue: Math.round(predictedRevenue),
    best_case: Math.round(bestCase),
    worst_case: Math.round(worstCase),
    confidence,
    by_rep: byRep,
    by_segment: bySegment,
    by_region: byRegion,
    factors,
  });


  return {
    period,
    predicted_revenue: Math.round(predictedRevenue),
    best_case: Math.round(bestCase),
    worst_case: Math.round(worstCase),
    confidence,
    target_achievement_pct: factors.target_achievement_pct,
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    // Auth check
    const authRes = await requireAuth(req);
    if (authRes instanceof Response) return authRes;
    const { companyId } = authRes;

    const body = await req.json().catch(() => ({}));
    const ALLOWED = new Set(["score_clients","generate_recommendations","generate_insights","generate_daily_actions","generate_predictions","generate_forecast","full_analysis"]);
    const action = body?.action;
    if (typeof action !== "string" || !ALLOWED.has(action)) {
      return new Response(JSON.stringify({ error: "Ação inválida" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    let result: any;

    switch (action) {
      case "score_clients":
        result = await scoreClients(companyId);
        break;
      case "generate_recommendations":
        result = await generateRecommendations(companyId);
        break;
      case "generate_insights":
        result = await generateInsights(companyId);
        break;
      case "generate_daily_actions":
        result = await generateDailyActions(companyId);
        break;
      case "generate_predictions":
        result = await generatePredictions(companyId);
        break;
      case "generate_forecast":
        result = await generateForecast(companyId);
        break;
      case "full_analysis": {
        const r1 = await scoreClients(companyId);
        const r2 = await generateDailyActions(companyId);
        const r3 = await generatePredictions(companyId);
        const r4 = await generateRecommendations(companyId);
        const r5 = await generateInsights(companyId);
        const r6 = await generateForecast(companyId);
        result = { ...r1, ...r2, ...r3, ...r4, ...r5, ...r6 };
        break;
      }
      default:
        throw new Error(`Unknown action: ${action}`);
    }


    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("ai-commercial error:", e);
    const msg = (e as Error).message || "Unknown error";
    const status = msg.includes("429") ? 429 : msg.includes("402") ? 402 : 500;
    const safe = status === 429 ? "Rate limit exceeded. Please try again shortly." : status === 402 ? "AI usage quota exceeded. Please check your plan." : "An internal error occurred. Please try again.";
    return new Response(JSON.stringify({ error: safe }), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

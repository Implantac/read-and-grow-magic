import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const lovableKey = Deno.env.get("LOVABLE_API_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { action, messages } = await req.json();

    if (action === "chat") {
      return await handleChat(messages, supabase, lovableKey, corsHeaders);
    }
    if (action === "generate_insights") {
      return await handleGenerateInsights(supabase, lovableKey, corsHeaders);
    }
    if (action === "generate_scenarios") {
      return await handleGenerateScenarios(supabase, lovableKey, corsHeaders);
    }
    return await handleDashboardData(supabase, corsHeaders);
  } catch (e) {
    console.error("ai-executive error:", e);
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

// ─── Dashboard Data Aggregation ──────────────────────────────────

async function fetchAllData(supabase: any) {
  const [
    ordersRes, receivableRes, payableRes, productsRes,
    clientsRes, productionRes, insightsRes, alertsRes, scenariosRes,
    salesRes, cashFlowRes, salesRepsRes, funnelRes, salesTargetsRes,
  ] = await Promise.all([
    supabase.from("orders").select("id, total, status, created_at, client_name, client_id, discount, subtotal, sales_rep_id, sales_rep_name, priority").order("created_at", { ascending: false }).limit(500),
    supabase.from("accounts_receivable").select("id, amount, status, due_date, paid_amount, open_amount, client_name, client_id").limit(500),
    supabase.from("accounts_payable").select("id, amount, status, due_date, paid_amount, open_amount, supplier, category").limit(500),
    supabase.from("products").select("id, name, price, cost, stock_current, stock_min, status").limit(500),
    supabase.from("clients").select("id, name, total_purchases, last_purchase_date, status, credit_limit, current_balance, segment, region, abc_classification, avg_ticket").limit(500),
    supabase.from("production_orders").select("id, status, planned_quantity, produced_quantity, created_at").limit(200),
    supabase.from("ai_executive_insights").select("*").eq("status", "active").order("created_at", { ascending: false }).limit(20),
    supabase.from("ai_executive_alerts").select("*").eq("status", "active").order("created_at", { ascending: false }).limit(10),
    supabase.from("ai_executive_scenarios").select("*").order("created_at", { ascending: false }).limit(3),
    supabase.from("sales").select("id, total, status, created_at, client_name").limit(500),
    supabase.from("cash_flow_entries").select("id, amount, type, date, category").order("date", { ascending: false }).limit(200),
    supabase.from("sales_reps").select("id, name, email, region, status").limit(100),
    supabase.from("sales_funnel").select("id, client_name, stage, value, probability, sales_rep_id, created_at, status").limit(300),
    supabase.from("sales_targets").select("id, sales_rep_id, target_value, achieved_value, period, target_type").limit(100),
  ]);

  return {
    orders: ordersRes.data || [],
    receivables: receivableRes.data || [],
    payables: payableRes.data || [],
    products: productsRes.data || [],
    clients: clientsRes.data || [],
    production: productionRes.data || [],
    insights: insightsRes.data || [],
    alerts: alertsRes.data || [],
    scenarios: scenariosRes.data || [],
    sales: salesRes.data || [],
    cashFlow: cashFlowRes.data || [],
    salesReps: salesRepsRes.data || [],
    funnel: funnelRes.data || [],
    salesTargets: salesTargetsRes.data || [],
  };
}

function computeKPIs(d: any) {
  const completedStatuses = ['completed', 'invoiced', 'shipped', 'delivered'];
  const totalRevenue = d.orders.filter((o: any) => completedStatuses.includes(o.status)).reduce((s: number, o: any) => s + (o.total || 0), 0);
  const totalCosts = d.payables.filter((p: any) => p.status === 'paid').reduce((s: number, p: any) => s + (p.amount || 0), 0);
  const grossProfit = totalRevenue - totalCosts;
  const grossMargin = totalRevenue > 0 ? (grossProfit / totalRevenue * 100) : 0;

  const now = new Date();
  const overdueReceivable = d.receivables.filter((r: any) => r.status === 'overdue' || (r.status === 'pending' && new Date(r.due_date) < now)).reduce((s: number, r: any) => s + (r.open_amount || r.amount || 0), 0);
  const overduePayable = d.payables.filter((p: any) => p.status === 'overdue' || (p.status === 'pending' && new Date(p.due_date) < now)).reduce((s: number, p: any) => s + (p.open_amount || p.amount || 0), 0);
  const totalReceivable = d.receivables.filter((r: any) => r.status === 'pending').reduce((s: number, r: any) => s + (r.open_amount || r.amount || 0), 0);
  const totalPayable = d.payables.filter((p: any) => p.status === 'pending').reduce((s: number, p: any) => s + (p.open_amount || p.amount || 0), 0);

  const activeClients = d.clients.filter((c: any) => c.status === 'active').length;
  const lowStockProducts = d.products.filter((p: any) => p.stock_current <= p.stock_min && p.status === 'active').length;
  const defaultRate = totalReceivable > 0 ? (overdueReceivable / (totalReceivable + overdueReceivable) * 100) : 0;

  // Revenue by month (last 6 months)
  const revenueByMonth: any[] = [];
  for (let i = 5; i >= 0; i--) {
    const dt = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthOrders = d.orders.filter((o: any) => {
      const od = new Date(o.created_at);
      return od.getMonth() === dt.getMonth() && od.getFullYear() === dt.getFullYear() && completedStatuses.includes(o.status);
    });
    revenueByMonth.push({
      month: dt.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }),
      revenue: monthOrders.reduce((s: number, o: any) => s + (o.total || 0), 0),
    });
  }

  // Top clients by revenue
  const clientRevenue: Record<string, number> = {};
  d.orders.forEach((o: any) => {
    if (completedStatuses.includes(o.status)) {
      clientRevenue[o.client_name] = (clientRevenue[o.client_name] || 0) + (o.total || 0);
    }
  });
  const topClients = Object.entries(clientRevenue)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, revenue]) => ({ name, revenue }));

  const totalClientRevenue = Object.values(clientRevenue).reduce((a, b) => a + b, 0);
  const top3Revenue = topClients.slice(0, 3).reduce((s, c) => s + c.revenue, 0);
  const concentrationPct = totalClientRevenue > 0 ? (top3Revenue / totalClientRevenue * 100) : 0;

  // Expense breakdown
  const expenseByCategory: Record<string, number> = {};
  d.payables.forEach((p: any) => {
    expenseByCategory[p.category || 'Outros'] = (expenseByCategory[p.category || 'Outros'] || 0) + (p.amount || 0);
  });

  // Sales rep performance
  const repPerformance: Record<string, { orders: number; revenue: number; name: string }> = {};
  d.orders.forEach((o: any) => {
    if (o.sales_rep_id && completedStatuses.includes(o.status)) {
      if (!repPerformance[o.sales_rep_id]) repPerformance[o.sales_rep_id] = { orders: 0, revenue: 0, name: o.sales_rep_name || 'N/A' };
      repPerformance[o.sales_rep_id].orders++;
      repPerformance[o.sales_rep_id].revenue += o.total || 0;
    }
  });
  const salesRepStats = Object.entries(repPerformance)
    .map(([id, v]) => ({ id, ...v }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 10);

  // Funnel summary
  const funnelByStage: Record<string, { count: number; value: number }> = {};
  d.funnel.filter((f: any) => f.status === 'active' || !f.status).forEach((f: any) => {
    const stage = f.stage || 'unknown';
    if (!funnelByStage[stage]) funnelByStage[stage] = { count: 0, value: 0 };
    funnelByStage[stage].count++;
    funnelByStage[stage].value += f.value || 0;
  });

  // Production efficiency
  const prodCompleted = d.production.filter((p: any) => p.status === 'completed');
  const prodInProgress = d.production.filter((p: any) => p.status === 'in_progress');
  const prodPlanned = d.production.filter((p: any) => p.status === 'planned' || p.status === 'pending');
  const prodEfficiency = prodCompleted.length > 0
    ? prodCompleted.reduce((s: number, p: any) => s + (p.produced_quantity || 0), 0) / prodCompleted.reduce((s: number, p: any) => s + (p.planned_quantity || 1), 0) * 100
    : 0;

  // Cash flow projection (next 30 days)
  const futureReceivables = d.receivables.filter((r: any) => {
    const dd = new Date(r.due_date);
    return r.status === 'pending' && dd >= now && dd <= new Date(now.getTime() + 30 * 86400000);
  }).reduce((s: number, r: any) => s + (r.open_amount || r.amount || 0), 0);
  const futurePayables = d.payables.filter((p: any) => {
    const dd = new Date(p.due_date);
    return p.status === 'pending' && dd >= now && dd <= new Date(now.getTime() + 30 * 86400000);
  }).reduce((s: number, p: any) => s + (p.open_amount || p.amount || 0), 0);

  // Revenue trend (growth rate)
  const lastTwoMonths = revenueByMonth.slice(-2);
  const revenueGrowth = lastTwoMonths.length === 2 && lastTwoMonths[0].revenue > 0
    ? ((lastTwoMonths[1].revenue - lastTwoMonths[0].revenue) / lastTwoMonths[0].revenue * 100)
    : 0;

  // Avg ticket
  const completedOrders = d.orders.filter((o: any) => completedStatuses.includes(o.status));
  const avgTicket = completedOrders.length > 0 ? totalRevenue / completedOrders.length : 0;

  // Clients at risk (inactive > 60 days)
  const clientsAtRisk = d.clients.filter((c: any) => {
    if (c.status !== 'active') return false;
    if (!c.last_purchase_date) return true;
    const diff = (now.getTime() - new Date(c.last_purchase_date).getTime()) / 86400000;
    return diff > 60;
  }).length;

  return {
    kpis: {
      totalRevenue, totalCosts, grossProfit,
      grossMargin: +grossMargin.toFixed(1),
      overdueReceivable, overduePayable,
      totalReceivable, totalPayable,
      netPosition: totalReceivable - totalPayable,
      activeClients, lowStockProducts,
      defaultRate: +defaultRate.toFixed(1),
      concentrationPct: +concentrationPct.toFixed(1),
      avgTicket: +avgTicket.toFixed(0),
      revenueGrowth: +revenueGrowth.toFixed(1),
      clientsAtRisk,
      cashFlowProjection30d: futureReceivables - futurePayables,
      futureReceivables, futurePayables,
      prodEfficiency: +prodEfficiency.toFixed(1),
      prodInProgress: prodInProgress.length,
      prodPlanned: prodPlanned.length,
      prodCompleted: prodCompleted.length,
    },
    revenueByMonth,
    topClients,
    expenseByCategory,
    salesRepStats,
    funnelByStage,
    summary: {
      totalOrders: d.orders.length,
      totalProducts: d.products.length,
      totalClients: d.clients.length,
      productionOrders: d.production.length,
      funnelOpportunities: d.funnel.length,
    },
  };
}

async function handleDashboardData(supabase: any, corsHeaders: any) {
  const d = await fetchAllData(supabase);
  const computed = computeKPIs(d);

  return new Response(JSON.stringify({
    ...computed,
    insights: d.insights,
    alerts: d.alerts,
    scenarios: d.scenarios,
  }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// ─── Generate Insights ──────────────────────────────────────────

async function handleGenerateInsights(supabase: any, lovableKey: string, corsHeaders: any) {
  const d = await fetchAllData(supabase);
  const computed = computeKPIs(d);

  const systemPrompt = `Você é um Diretor Executivo Digital (CEO AI) de uma empresa brasileira. Analise os dados e gere insights estratégicos acionáveis.

REGRAS:
- Responda APENAS com JSON válido
- Gere entre 4-8 insights cobrindo: receita, lucro, custos, risco, operacional, comercial
- Cada insight: { type (revenue|profit|cost|risk|operational|commercial), severity (critical|high|medium|low), title, description, explanation, impact_estimate, recommended_actions (array de strings), module }
- Priorize problemas reais e ações concretas
- Use dados reais. Seja direto e objetivo.
- Inclua análise de tendência, concentração, eficiência e risco.`;

  const userPrompt = `DADOS DA EMPRESA:
${JSON.stringify(computed.kpis, null, 2)}

RECEITA MENSAL: ${JSON.stringify(computed.revenueByMonth)}
TOP CLIENTES: ${JSON.stringify(computed.topClients)}
DESPESAS: ${JSON.stringify(computed.expenseByCategory)}
PERFORMANCE VENDEDORES: ${JSON.stringify(computed.salesRepStats)}
FUNIL: ${JSON.stringify(computed.funnelByStage)}
RESUMO: ${JSON.stringify(computed.summary)}

Gere insights estratégicos: { "insights": [...] }`;

  const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${lovableKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "google/gemini-3-flash-preview",
      messages: [{ role: "system", content: systemPrompt }, { role: "user", content: userPrompt }],
      response_format: { type: "json_object" },
    }),
  });

  if (!aiResp.ok) {
    const status = aiResp.status;
    return new Response(JSON.stringify({ error: "AI analysis failed" }), {
      status: status === 429 ? 429 : status === 402 ? 402 : 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const aiData = await aiResp.json();
  const content = aiData.choices?.[0]?.message?.content || "{}";
  let parsed: any;
  try { parsed = JSON.parse(content); } catch { parsed = { insights: [] }; }
  const insights = parsed.insights || [];

  for (const ins of insights) {
    await supabase.from("ai_executive_insights").insert({
      insight_type: ins.type || "general",
      category: "strategic",
      severity: ins.severity || "medium",
      title: ins.title,
      description: ins.description,
      explanation: ins.explanation,
      impact_estimate: ins.impact_estimate,
      recommended_actions: ins.recommended_actions,
      module: ins.module || ins.type,
    });
  }

  return new Response(JSON.stringify({ insights, generated: insights.length }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// ─── Generate Scenarios ──────────────────────────────────────────

async function handleGenerateScenarios(supabase: any, lovableKey: string, corsHeaders: any) {
  const d = await fetchAllData(supabase);
  const computed = computeKPIs(d);

  const systemPrompt = `Você é um analista estratégico. Com base nos dados, gere 3 cenários (otimista, realista, pessimista) para os próximos 3 meses.

REGRAS:
- Responda APENAS com JSON válido
- Formato: { "scenarios": { "optimistic": { "revenue", "profit", "margin", "description", "key_actions": [...] }, "realistic": {...}, "pessimistic": {...} }, "assumptions": [...], "recommendations": [...] }
- Use dados reais para projetar
- Valores em reais (números)`;

  const userPrompt = `KPIs: ${JSON.stringify(computed.kpis)}
RECEITA MENSAL: ${JSON.stringify(computed.revenueByMonth)}
FUNIL: ${JSON.stringify(computed.funnelByStage)}
VENDEDORES: ${JSON.stringify(computed.salesRepStats)}`;

  const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${lovableKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "google/gemini-3-flash-preview",
      messages: [{ role: "system", content: systemPrompt }, { role: "user", content: userPrompt }],
      response_format: { type: "json_object" },
    }),
  });

  if (!aiResp.ok) {
    const status = aiResp.status;
    return new Response(JSON.stringify({ error: "Scenario generation failed" }), {
      status: status === 429 ? 429 : status === 402 ? 402 : 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const aiData = await aiResp.json();
  const content = aiData.choices?.[0]?.message?.content || "{}";
  let parsed: any;
  try { parsed = JSON.parse(content); } catch { parsed = {}; }

  const scenarios = parsed.scenarios || {};
  await supabase.from("ai_executive_scenarios").insert({
    scenario_type: "quarterly",
    period: "next_3_months",
    optimistic: scenarios.optimistic || null,
    realistic: scenarios.realistic || null,
    pessimistic: scenarios.pessimistic || null,
    assumptions: parsed.assumptions || [],
    recommendations: parsed.recommendations || [],
  });

  return new Response(JSON.stringify(parsed), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// ─── Chat ────────────────────────────────────────────────────────

async function handleChat(messages: any[], supabase: any, lovableKey: string, corsHeaders: any) {
  const d = await fetchAllData(supabase);
  const computed = computeKPIs(d);
  const k = computed.kpis;

  const systemPrompt = `Você é o CEO AI, diretor executivo digital de uma empresa brasileira. Responda com dados reais do sistema.

DADOS ATUAIS:
- Receita: R$ ${k.totalRevenue.toLocaleString('pt-BR')} | Lucro Bruto: R$ ${k.grossProfit.toLocaleString('pt-BR')} | Margem: ${k.grossMargin}%
- Crescimento: ${k.revenueGrowth}% | Ticket Médio: R$ ${k.avgTicket}
- Inadimplência: R$ ${k.overdueReceivable.toLocaleString('pt-BR')} (${k.defaultRate}%)
- A Receber: R$ ${k.totalReceivable.toLocaleString('pt-BR')} | A Pagar: R$ ${k.totalPayable.toLocaleString('pt-BR')}
- Posição Líquida: R$ ${k.netPosition.toLocaleString('pt-BR')}
- Projeção Caixa 30d: R$ ${k.cashFlowProjection30d.toLocaleString('pt-BR')}
- Clientes Ativos: ${k.activeClients} | Em Risco: ${k.clientsAtRisk}
- Concentração Top3: ${k.concentrationPct}%
- Estoque Baixo: ${k.lowStockProducts}
- Eficiência Produção: ${k.prodEfficiency}% | Em Andamento: ${k.prodInProgress} | Planejadas: ${k.prodPlanned}

TOP CLIENTES: ${JSON.stringify(computed.topClients)}
RECEITA MENSAL: ${JSON.stringify(computed.revenueByMonth)}
VENDEDORES: ${JSON.stringify(computed.salesRepStats)}
FUNIL: ${JSON.stringify(computed.funnelByStage)}
DESPESAS: ${JSON.stringify(computed.expenseByCategory)}

REGRAS:
- Português, direto, estratégico
- Use dados reais acima
- Sugira ações concretas
- Use markdown
- Analise tendências e riscos`;

  const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${lovableKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "google/gemini-3-flash-preview",
      messages: [{ role: "system", content: systemPrompt }, ...messages],
      stream: true,
    }),
  });

  if (!resp.ok) {
    const status = resp.status;
    if (status === 429) return new Response(JSON.stringify({ error: "Rate limit exceeded" }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    if (status === 402) return new Response(JSON.stringify({ error: "Payment required" }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    return new Response(JSON.stringify({ error: "AI error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  return new Response(resp.body, {
    headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
  });
}

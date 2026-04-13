import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const lovableKey = Deno.env.get("LOVABLE_API_KEY");
    if (!lovableKey) throw new Error("LOVABLE_API_KEY is not configured");
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { action, messages } = await req.json();

    if (action === "chat") return await handleChat(messages, supabase, lovableKey, corsHeaders);
    if (action === "assistant_chat") return await handleAssistantChat(messages, supabase, lovableKey, corsHeaders);
    if (action === "daily_summary") return await handleDailySummary(supabase, lovableKey, corsHeaders);
    if (action === "generate_insights") return await handleGenerateInsights(supabase, lovableKey, corsHeaders);
    if (action === "generate_scenarios") return await handleGenerateScenarios(supabase, lovableKey, corsHeaders);
    return await handleDashboardData(supabase, corsHeaders);
  } catch (e) {
    console.error("ai-executive error:", e);
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

// ─── Data Fetching ──────────────────────────────────────────────

async function fetchAllData(supabase: any) {
  const [
    ordersRes, receivableRes, payableRes, productsRes,
    clientsRes, productionRes, insightsRes, alertsRes, scenariosRes,
    salesRes, cashFlowRes, salesRepsRes, funnelRes, salesTargetsRes,
    orderItemsRes, commissionRes,
  ] = await Promise.all([
    supabase.from("orders").select("id, total, status, created_at, client_name, client_id, discount, subtotal, sales_rep_id, sales_rep_name, priority").order("created_at", { ascending: false }).limit(500),
    supabase.from("accounts_receivable").select("id, amount, status, due_date, paid_amount, open_amount, client_name, client_id").limit(500),
    supabase.from("accounts_payable").select("id, amount, status, due_date, paid_amount, open_amount, supplier, category").limit(500),
    supabase.from("products").select("id, name, price, cost, stock_current, stock_min, status, category_id").limit(500),
    supabase.from("clients").select("id, name, total_purchases, last_purchase_date, status, credit_limit, current_balance, segment, region, abc_classification, avg_ticket").limit(500),
    supabase.from("production_orders").select("id, status, planned_quantity, produced_quantity, created_at, start_date, end_date").limit(200),
    supabase.from("ai_executive_insights").select("*").eq("status", "active").order("created_at", { ascending: false }).limit(20),
    supabase.from("ai_executive_alerts").select("*").eq("status", "active").order("created_at", { ascending: false }).limit(10),
    supabase.from("ai_executive_scenarios").select("*").order("created_at", { ascending: false }).limit(3),
    supabase.from("sales").select("id, total, status, created_at, client_name").limit(500),
    supabase.from("cash_flow_entries").select("id, amount, type, date, category").order("date", { ascending: false }).limit(200),
    supabase.from("sales_reps").select("id, name, email, region, status").limit(100),
    supabase.from("sales_funnel").select("id, client_name, stage, value, probability, sales_rep_id, created_at, status").limit(300),
    supabase.from("sales_targets").select("id, sales_rep_id, target_value, achieved_value, period, target_type").limit(100),
    supabase.from("order_items").select("id, order_id, product_id, product_name, product_code, quantity, unit_price, total, discount").limit(1000),
    supabase.from("commissions").select("id, sales_rep_id, sales_rep_name, calculated_value, status, period").limit(200),
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
    orderItems: orderItemsRes.data || [],
    commissions: commissionRes.data || [],
  };
}

// ─── KPI Computation ──────────────────────────────────────────────

function computeKPIs(d: any) {
  const completedStatuses = ['completed', 'invoiced', 'shipped', 'delivered'];
  const now = new Date();

  // Revenue
  const totalRevenue = d.orders.filter((o: any) => completedStatuses.includes(o.status)).reduce((s: number, o: any) => s + (o.total || 0), 0);
  const totalCosts = d.payables.filter((p: any) => p.status === 'paid').reduce((s: number, p: any) => s + (p.amount || 0), 0);
  const grossProfit = totalRevenue - totalCosts;
  const grossMargin = totalRevenue > 0 ? (grossProfit / totalRevenue * 100) : 0;

  // Receivables & Payables
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

  // Top clients
  const clientRevenue: Record<string, number> = {};
  d.orders.forEach((o: any) => {
    if (completedStatuses.includes(o.status)) {
      clientRevenue[o.client_name] = (clientRevenue[o.client_name] || 0) + (o.total || 0);
    }
  });
  const topClients = Object.entries(clientRevenue).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([name, revenue]) => ({ name, revenue }));

  const totalClientRevenue = Object.values(clientRevenue).reduce((a, b) => a + b, 0);
  const top3Revenue = topClients.slice(0, 3).reduce((s, c) => s + c.revenue, 0);
  const concentrationPct = totalClientRevenue > 0 ? (top3Revenue / totalClientRevenue * 100) : 0;

  // Expense breakdown
  const expenseByCategory: Record<string, number> = {};
  d.payables.forEach((p: any) => {
    expenseByCategory[p.category || 'Outros'] = (expenseByCategory[p.category || 'Outros'] || 0) + (p.amount || 0);
  });

  // Sales rep performance
  const repPerformance: Record<string, { orders: number; revenue: number; name: string; discount: number }> = {};
  d.orders.forEach((o: any) => {
    if (o.sales_rep_id && completedStatuses.includes(o.status)) {
      if (!repPerformance[o.sales_rep_id]) repPerformance[o.sales_rep_id] = { orders: 0, revenue: 0, name: o.sales_rep_name || 'N/A', discount: 0 };
      repPerformance[o.sales_rep_id].orders++;
      repPerformance[o.sales_rep_id].revenue += o.total || 0;
      repPerformance[o.sales_rep_id].discount += o.discount || 0;
    }
  });
  const salesRepStats = Object.entries(repPerformance)
    .map(([id, v]) => ({ id, ...v, avgTicket: v.orders > 0 ? +(v.revenue / v.orders).toFixed(0) : 0, discountPct: v.revenue > 0 ? +((v.discount / (v.revenue + v.discount)) * 100).toFixed(1) : 0 }))
    .sort((a, b) => b.revenue - a.revenue).slice(0, 10);

  // Funnel summary
  const funnelByStage: Record<string, { count: number; value: number }> = {};
  d.funnel.filter((f: any) => f.status === 'active' || !f.status).forEach((f: any) => {
    const stage = f.stage || 'unknown';
    if (!funnelByStage[stage]) funnelByStage[stage] = { count: 0, value: 0 };
    funnelByStage[stage].count++;
    funnelByStage[stage].value += f.value || 0;
  });

  // Production
  const prodCompleted = d.production.filter((p: any) => p.status === 'completed');
  const prodInProgress = d.production.filter((p: any) => p.status === 'in_progress');
  const prodPlanned = d.production.filter((p: any) => p.status === 'planned' || p.status === 'pending');
  const prodEfficiency = prodCompleted.length > 0
    ? prodCompleted.reduce((s: number, p: any) => s + (p.produced_quantity || 0), 0) / prodCompleted.reduce((s: number, p: any) => s + (p.planned_quantity || 1), 0) * 100
    : 0;

  // Cash flow projection
  const futureReceivables = d.receivables.filter((r: any) => {
    const dd = new Date(r.due_date);
    return r.status === 'pending' && dd >= now && dd <= new Date(now.getTime() + 30 * 86400000);
  }).reduce((s: number, r: any) => s + (r.open_amount || r.amount || 0), 0);
  const futurePayables = d.payables.filter((p: any) => {
    const dd = new Date(p.due_date);
    return p.status === 'pending' && dd >= now && dd <= new Date(now.getTime() + 30 * 86400000);
  }).reduce((s: number, p: any) => s + (p.open_amount || p.amount || 0), 0);

  // Revenue growth
  const lastTwoMonths = revenueByMonth.slice(-2);
  const revenueGrowth = lastTwoMonths.length === 2 && lastTwoMonths[0].revenue > 0
    ? ((lastTwoMonths[1].revenue - lastTwoMonths[0].revenue) / lastTwoMonths[0].revenue * 100) : 0;

  // Avg ticket
  const completedOrders = d.orders.filter((o: any) => completedStatuses.includes(o.status));
  const avgTicket = completedOrders.length > 0 ? totalRevenue / completedOrders.length : 0;

  // Clients at risk
  const clientsAtRisk = d.clients.filter((c: any) => {
    if (c.status !== 'active') return false;
    if (!c.last_purchase_date) return true;
    return (now.getTime() - new Date(c.last_purchase_date).getTime()) / 86400000 > 60;
  }).length;

  // ── Product Margin Analysis ──
  const productMap: Record<string, { name: string; price: number; cost: number; stock: number }> = {};
  d.products.forEach((p: any) => { productMap[p.id] = { name: p.name, price: p.price || 0, cost: p.cost || 0, stock: p.stock_current || 0 }; });

  const productMargins: { name: string; revenue: number; cost: number; margin: number; marginPct: number; qty: number }[] = [];
  const productSales: Record<string, { revenue: number; cost: number; qty: number; name: string }> = {};
  d.orderItems.forEach((item: any) => {
    if (!item.product_id) return;
    const prod = productMap[item.product_id];
    if (!prod) return;
    if (!productSales[item.product_id]) productSales[item.product_id] = { revenue: 0, cost: 0, qty: 0, name: prod.name };
    productSales[item.product_id].revenue += item.total || 0;
    productSales[item.product_id].cost += (prod.cost || 0) * (item.quantity || 0);
    productSales[item.product_id].qty += item.quantity || 0;
  });
  Object.entries(productSales).forEach(([, v]) => {
    const margin = v.revenue - v.cost;
    productMargins.push({ name: v.name, revenue: v.revenue, cost: v.cost, margin, marginPct: v.revenue > 0 ? +(margin / v.revenue * 100).toFixed(1) : 0, qty: v.qty });
  });
  productMargins.sort((a, b) => b.revenue - a.revenue);

  // Top profitable & unprofitable
  const topProfitable = [...productMargins].sort((a, b) => b.margin - a.margin).slice(0, 5);
  const lowMarginProducts = productMargins.filter(p => p.marginPct < 15 && p.revenue > 0).slice(0, 5);

  // ── Client margin analysis ──
  const clientMargins: Record<string, { revenue: number; orders: number }> = {};
  d.orders.forEach((o: any) => {
    if (completedStatuses.includes(o.status) && o.client_name) {
      if (!clientMargins[o.client_name]) clientMargins[o.client_name] = { revenue: 0, orders: 0 };
      clientMargins[o.client_name].revenue += o.total || 0;
      clientMargins[o.client_name].orders++;
    }
  });

  // ── Revenue by region ──
  const revenueByRegion: Record<string, number> = {};
  const clientRegionMap: Record<string, string> = {};
  d.clients.forEach((c: any) => { if (c.region) clientRegionMap[c.name] = c.region; });
  d.orders.forEach((o: any) => {
    if (completedStatuses.includes(o.status)) {
      const region = clientRegionMap[o.client_name] || 'Não definida';
      revenueByRegion[region] = (revenueByRegion[region] || 0) + (o.total || 0);
    }
  });

  // ── Sales targets vs achieved ──
  const targetsSummary = d.salesTargets.reduce((acc: any, t: any) => {
    acc.target += t.target_value || 0;
    acc.achieved += t.achieved_value || 0;
    return acc;
  }, { target: 0, achieved: 0 });
  const targetAttainment = targetsSummary.target > 0 ? +(targetsSummary.achieved / targetsSummary.target * 100).toFixed(1) : 0;

  // ── Auto-generate alerts ──
  const autoAlerts: any[] = [];
  if (defaultRate > 10) autoAlerts.push({ type: 'financial_risk', severity: 'critical', title: 'Inadimplência acima de 10%', description: `Taxa atual: ${defaultRate.toFixed(1)}%. Ação imediata necessária.`, metric: 'default_rate', value: defaultRate });
  if (concentrationPct > 60) autoAlerts.push({ type: 'revenue_concentration', severity: 'high', title: 'Concentração excessiva de receita', description: `Top 3 clientes representam ${concentrationPct.toFixed(0)}% da receita.`, metric: 'concentration', value: concentrationPct });
  if (revenueGrowth < -10) autoAlerts.push({ type: 'revenue_decline', severity: 'critical', title: 'Queda acentuada de receita', description: `Receita caiu ${Math.abs(revenueGrowth).toFixed(1)}% vs mês anterior.`, metric: 'revenue_growth', value: revenueGrowth });
  if ((kpis => kpis < 0)(futureReceivables - futurePayables)) autoAlerts.push({ type: 'cash_flow_risk', severity: 'high', title: 'Fluxo de caixa negativo projetado', description: `Projeção 30d: déficit de R$ ${Math.abs(futureReceivables - futurePayables).toLocaleString('pt-BR')}.`, metric: 'cash_flow_30d', value: futureReceivables - futurePayables });
  if (lowStockProducts > 3) autoAlerts.push({ type: 'stock_critical', severity: 'medium', title: `${lowStockProducts} produtos abaixo do estoque mínimo`, description: 'Risco de ruptura e perda de vendas.', metric: 'low_stock', value: lowStockProducts });
  if (clientsAtRisk > 5) autoAlerts.push({ type: 'client_churn', severity: 'high', title: `${clientsAtRisk} clientes em risco de perda`, description: 'Clientes ativos sem compra há mais de 60 dias.', metric: 'clients_at_risk', value: clientsAtRisk });
  if (targetAttainment > 0 && targetAttainment < 70) autoAlerts.push({ type: 'target_risk', severity: 'high', title: 'Meta de vendas em risco', description: `Atingimento atual: ${targetAttainment}% da meta.`, metric: 'target_attainment', value: targetAttainment });

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
      targetAttainment,
      totalTarget: targetsSummary.target,
      totalAchieved: targetsSummary.achieved,
    },
    revenueByMonth,
    topClients,
    expenseByCategory,
    salesRepStats,
    funnelByStage,
    productMargins: productMargins.slice(0, 10),
    topProfitable,
    lowMarginProducts,
    revenueByRegion,
    autoAlerts,
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
- Gere entre 6-10 insights cobrindo TODAS as áreas: receita, lucro, custos, risco financeiro, eficiência operacional, performance comercial
- Cada insight: { type (revenue|profit|cost|risk|operational|commercial), severity (critical|high|medium|low), title, description, explanation, impact_estimate, recommended_actions (array de strings, máx 3), module }
- FOCO EM AÇÃO: cada insight deve ter recomendações concretas e mensuráveis
- Inclua análise de: tendência de receita, concentração de clientes, margem por produto, risco de inadimplência, eficiência produtiva, performance de vendedores
- Priorize problemas que impactam caixa e lucro
- Toda recomendação deve explicar POR QUE e QUAL o impacto esperado (Explainable AI)`;

  const userPrompt = `DADOS DA EMPRESA:
KPIs: ${JSON.stringify(computed.kpis)}
RECEITA MENSAL: ${JSON.stringify(computed.revenueByMonth)}
TOP CLIENTES: ${JSON.stringify(computed.topClients)}
DESPESAS: ${JSON.stringify(computed.expenseByCategory)}
VENDEDORES: ${JSON.stringify(computed.salesRepStats)}
FUNIL: ${JSON.stringify(computed.funnelByStage)}
MARGEM POR PRODUTO (top 10): ${JSON.stringify(computed.productMargins)}
PRODUTOS BAIXA MARGEM: ${JSON.stringify(computed.lowMarginProducts)}
RECEITA POR REGIÃO: ${JSON.stringify(computed.revenueByRegion)}
ALERTAS AUTO: ${JSON.stringify(computed.autoAlerts)}
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

  // Expire old active insights before inserting new ones
  await supabase.from("ai_executive_insights").update({ status: "expired" }).eq("status", "active");

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

  const systemPrompt = `Você é um analista estratégico sênior. Com base nos dados, gere 3 cenários (otimista, realista, pessimista) para os próximos 3 meses.

REGRAS:
- Responda APENAS com JSON válido
- Formato: { "scenarios": { "optimistic": { "revenue", "profit", "margin", "growth", "description", "key_actions": [...] }, "realistic": {...}, "pessimistic": {...} }, "assumptions": [...], "recommendations": [...], "risks": [...] }
- Use dados reais para projetar - considere tendência de receita, pipeline, inadimplência e capacidade produtiva
- Cada cenário deve ter ações específicas e mensuráveis
- Valores em reais (números)
- Inclua riscos e recomendações prioritárias`;

  const userPrompt = `KPIs: ${JSON.stringify(computed.kpis)}
RECEITA MENSAL: ${JSON.stringify(computed.revenueByMonth)}
FUNIL: ${JSON.stringify(computed.funnelByStage)}
VENDEDORES: ${JSON.stringify(computed.salesRepStats)}
MARGEM PRODUTOS: ${JSON.stringify(computed.productMargins?.slice(0, 5))}
RECEITA REGIÃO: ${JSON.stringify(computed.revenueByRegion)}`;

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

  const systemPrompt = `Você é o CEO AI, diretor executivo digital de uma empresa brasileira. Responda com dados reais do sistema. Seja estratégico, direto e acionável.

DADOS ATUAIS DA EMPRESA:
📊 RECEITA E LUCRO:
- Receita Total: R$ ${k.totalRevenue.toLocaleString('pt-BR')} | Lucro Bruto: R$ ${k.grossProfit.toLocaleString('pt-BR')} | Margem: ${k.grossMargin}%
- Crescimento: ${k.revenueGrowth}% vs mês anterior | Ticket Médio: R$ ${k.avgTicket}
- Meta: ${k.targetAttainment}% atingida (R$ ${k.totalAchieved?.toLocaleString('pt-BR')} de R$ ${k.totalTarget?.toLocaleString('pt-BR')})

💰 FINANCEIRO:
- A Receber: R$ ${k.totalReceivable.toLocaleString('pt-BR')} | A Pagar: R$ ${k.totalPayable.toLocaleString('pt-BR')}
- Inadimplência: R$ ${k.overdueReceivable.toLocaleString('pt-BR')} (${k.defaultRate}%)
- Posição Líquida: R$ ${k.netPosition.toLocaleString('pt-BR')}
- Projeção Caixa 30d: R$ ${k.cashFlowProjection30d.toLocaleString('pt-BR')}

👥 COMERCIAL:
- Clientes Ativos: ${k.activeClients} | Em Risco: ${k.clientsAtRisk}
- Concentração Top3: ${k.concentrationPct}%

🏭 OPERACIONAL:
- Eficiência Produção: ${k.prodEfficiency}% | Em Andamento: ${k.prodInProgress} | Planejadas: ${k.prodPlanned}
- Estoque Baixo: ${k.lowStockProducts} produtos

📦 PRODUTOS (MARGEM):
${computed.productMargins?.slice(0, 5).map((p: any) => `- ${p.name}: Margem ${p.marginPct}% (Receita R$ ${p.revenue.toLocaleString('pt-BR')})`).join('\n') || 'Sem dados'}

${computed.lowMarginProducts?.length ? `⚠️ PRODUTOS BAIXA MARGEM:\n${computed.lowMarginProducts.map((p: any) => `- ${p.name}: Margem ${p.marginPct}%`).join('\n')}` : ''}

TOP CLIENTES: ${JSON.stringify(computed.topClients)}
RECEITA MENSAL: ${JSON.stringify(computed.revenueByMonth)}
VENDEDORES: ${JSON.stringify(computed.salesRepStats)}
FUNIL: ${JSON.stringify(computed.funnelByStage)}
DESPESAS: ${JSON.stringify(computed.expenseByCategory)}
RECEITA POR REGIÃO: ${JSON.stringify(computed.revenueByRegion)}

REGRAS:
- Português brasileiro, direto, estratégico
- Use SEMPRE dados reais acima
- Sugira ações concretas com impacto estimado
- Use markdown para formatação
- Explique o "porquê" de cada recomendação (IA explicável)
- Analise tendências, riscos e oportunidades
- Quando perguntado sobre um vendedor, compare com a média
- Quando perguntado sobre custos, detalhe por categoria`;

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

// ─── ERP Tools for Assistant Chat ────────────────────────────────

const GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";

const ERP_TOOLS = [
  {
    type: "function",
    function: {
      name: "consultar_financeiro",
      description: "Consulta resumo financeiro: contas a pagar, receber, vencimentos, saldos, inadimplência",
      parameters: {
        type: "object",
        properties: {
          tipo: { type: "string", enum: ["resumo", "a_pagar", "a_receber", "vencimentos_hoje", "atrasados", "fluxo_caixa"], description: "Tipo de consulta financeira" },
          periodo_dias: { type: "number", description: "Período em dias para projeção (padrão 30)" },
        },
        required: ["tipo"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "consultar_comercial",
      description: "Consulta dados comerciais: clientes, pedidos, vendas, funil, metas, representantes",
      parameters: {
        type: "object",
        properties: {
          tipo: { type: "string", enum: ["resumo", "clientes_ativos", "pedidos_recentes", "funil", "metas", "top_clientes", "clientes_risco"], description: "Tipo de consulta comercial" },
          limite: { type: "number", description: "Limite de registros (padrão 10)" },
        },
        required: ["tipo"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "consultar_producao",
      description: "Consulta produção: ordens, status, eficiência, atrasos, filas",
      parameters: {
        type: "object",
        properties: {
          tipo: { type: "string", enum: ["resumo", "ordens_ativas", "atrasadas", "concluidas_recentes", "eficiencia"], description: "Tipo de consulta de produção" },
        },
        required: ["tipo"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "consultar_estoque",
      description: "Consulta estoque: saldos, produtos abaixo do mínimo, movimentações recentes",
      parameters: {
        type: "object",
        properties: {
          tipo: { type: "string", enum: ["resumo", "baixo_estoque", "movimentacoes_recentes", "produto_especifico"], description: "Tipo de consulta de estoque" },
          produto_nome: { type: "string", description: "Nome do produto para busca específica" },
        },
        required: ["tipo"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "executar_acao",
      description: "Executa ações no ERP como registrar pagamento, alterar status. SEMPRE confirmar com usuário antes.",
      parameters: {
        type: "object",
        properties: {
          modulo: { type: "string", enum: ["financeiro", "comercial", "producao", "estoque"] },
          acao: { type: "string", enum: ["registrar_pagamento", "criar_conta_pagar", "criar_conta_receber", "alterar_status_pedido", "alterar_status_op"] },
          parametros: { type: "object", description: "Parâmetros da ação" },
          confirmado: { type: "boolean", description: "Se o usuário já confirmou a ação" },
        },
        required: ["modulo", "acao", "parametros"],
      },
    },
  },
];

async function executeConsultaFinanceiro(supabase: any, args: any) {
  const now = new Date();
  const today = now.toISOString().split("T")[0];
  switch (args.tipo) {
    case "resumo": {
      const [recRes, pagRes, bankRes] = await Promise.all([
        supabase.from("accounts_receivable").select("id, amount, status, due_date, open_amount, client_name").limit(500),
        supabase.from("accounts_payable").select("id, amount, status, due_date, open_amount, supplier").limit(500),
        supabase.from("bank_accounts").select("id, name, balance, active").eq("active", true),
      ]);
      const rec = recRes.data || []; const pag = pagRes.data || []; const banks = bankRes.data || [];
      const saldoBancario = banks.reduce((s: number, b: any) => s + (b.balance || 0), 0);
      const totalReceber = rec.filter((r: any) => r.status === "pending").reduce((s: number, r: any) => s + (r.open_amount || r.amount || 0), 0);
      const totalPagar = pag.filter((p: any) => p.status === "pending").reduce((s: number, p: any) => s + (p.open_amount || p.amount || 0), 0);
      const atrasadosRec = rec.filter((r: any) => (r.status === "overdue" || (r.status === "pending" && r.due_date < today)));
      const atrasadosPag = pag.filter((p: any) => (p.status === "overdue" || (p.status === "pending" && p.due_date < today)));
      return { saldo_bancario: saldoBancario, contas_bancarias: banks.map((b: any) => ({ nome: b.name, saldo: b.balance })), total_a_receber: totalReceber, total_a_pagar: totalPagar, posicao_liquida: totalReceber - totalPagar, inadimplencia: { total: atrasadosRec.reduce((s: number, r: any) => s + (r.open_amount || r.amount || 0), 0), quantidade: atrasadosRec.length }, contas_atrasadas_pagar: { total: atrasadosPag.reduce((s: number, p: any) => s + (p.open_amount || p.amount || 0), 0), quantidade: atrasadosPag.length } };
    }
    case "vencimentos_hoje": {
      const [recHoje, pagHoje] = await Promise.all([
        supabase.from("accounts_receivable").select("id, client_name, amount, open_amount, status").eq("due_date", today).eq("status", "pending"),
        supabase.from("accounts_payable").select("id, supplier, amount, open_amount, status, description").eq("due_date", today).eq("status", "pending"),
      ]);
      return { data: today, receber_hoje: { total: (recHoje.data || []).reduce((s: number, r: any) => s + (r.open_amount || r.amount || 0), 0), itens: recHoje.data || [] }, pagar_hoje: { total: (pagHoje.data || []).reduce((s: number, p: any) => s + (p.open_amount || p.amount || 0), 0), itens: pagHoje.data || [] } };
    }
    case "atrasados": {
      const [recAtr, pagAtr] = await Promise.all([
        supabase.from("accounts_receivable").select("id, client_name, amount, open_amount, due_date").or(`status.eq.overdue,and(status.eq.pending,due_date.lt.${today})`).order("due_date").limit(20),
        supabase.from("accounts_payable").select("id, supplier, amount, open_amount, due_date, description").or(`status.eq.overdue,and(status.eq.pending,due_date.lt.${today})`).order("due_date").limit(20),
      ]);
      return { receber_atrasados: recAtr.data || [], pagar_atrasados: pagAtr.data || [] };
    }
    case "a_pagar": {
      const { data } = await supabase.from("accounts_payable").select("id, supplier, amount, open_amount, due_date, status, description").eq("status", "pending").order("due_date").limit(20);
      return { contas_a_pagar: data || [] };
    }
    case "a_receber": {
      const { data } = await supabase.from("accounts_receivable").select("id, client_name, amount, open_amount, due_date, status").eq("status", "pending").order("due_date").limit(20);
      return { contas_a_receber: data || [] };
    }
    case "fluxo_caixa": {
      const dias = args.periodo_dias || 30;
      const futuro = new Date(now.getTime() + dias * 86400000).toISOString().split("T")[0];
      const [recFut, pagFut, bankRes] = await Promise.all([
        supabase.from("accounts_receivable").select("amount, open_amount, due_date").eq("status", "pending").gte("due_date", today).lte("due_date", futuro),
        supabase.from("accounts_payable").select("amount, open_amount, due_date").eq("status", "pending").gte("due_date", today).lte("due_date", futuro),
        supabase.from("bank_accounts").select("balance").eq("active", true),
      ]);
      const entradas = (recFut.data || []).reduce((s: number, r: any) => s + (r.open_amount || r.amount || 0), 0);
      const saidas = (pagFut.data || []).reduce((s: number, p: any) => s + (p.open_amount || p.amount || 0), 0);
      const saldoAtual = (bankRes.data || []).reduce((s: number, b: any) => s + (b.balance || 0), 0);
      return { periodo_dias: dias, saldo_atual: saldoAtual, entradas_previstas: entradas, saidas_previstas: saidas, saldo_projetado: saldoAtual + entradas - saidas };
    }
    default: return { erro: "Tipo não reconhecido" };
  }
}

async function executeConsultaComercial(supabase: any, args: any) {
  const limite = args.limite || 10;
  switch (args.tipo) {
    case "resumo": {
      const [clRes, ordRes, funRes] = await Promise.all([
        supabase.from("clients").select("id, status").limit(1000),
        supabase.from("orders").select("id, total, status, created_at").order("created_at", { ascending: false }).limit(100),
        supabase.from("sales_funnel").select("id, value, stage, status").limit(300),
      ]);
      const clients = clRes.data || []; const orders = ordRes.data || []; const funnel = funRes.data || [];
      return { clientes_ativos: clients.filter((c: any) => c.status === "active").length, total_clientes: clients.length, pedidos_recentes_30d: orders.filter((o: any) => new Date(o.created_at) > new Date(Date.now() - 30 * 86400000)).length, valor_pipeline: funnel.filter((f: any) => f.status === "active" || !f.status).reduce((s: number, f: any) => s + (f.value || 0), 0), oportunidades_ativas: funnel.filter((f: any) => f.status === "active" || !f.status).length };
    }
    case "pedidos_recentes": {
      const { data } = await supabase.from("orders").select("id, number, client_name, total, status, created_at, priority").order("created_at", { ascending: false }).limit(limite);
      return { pedidos: data || [] };
    }
    case "top_clientes": {
      const { data } = await supabase.from("clients").select("id, name, total_purchases, avg_ticket, abc_classification, last_purchase_date").order("total_purchases", { ascending: false }).limit(limite);
      return { top_clientes: data || [] };
    }
    case "clientes_risco": {
      const cutoff = new Date(Date.now() - 60 * 86400000).toISOString();
      const { data } = await supabase.from("clients").select("id, name, last_purchase_date, total_purchases, avg_ticket").eq("status", "active").or(`last_purchase_date.lt.${cutoff},last_purchase_date.is.null`).limit(limite);
      return { clientes_em_risco: data || [] };
    }
    case "metas": {
      const { data } = await supabase.from("sales_targets").select("id, sales_rep_id, target_value, achieved_value, period, target_type").limit(50);
      const targets = data || [];
      const totalMeta = targets.reduce((s: number, t: any) => s + (t.target_value || 0), 0);
      const totalAtingido = targets.reduce((s: number, t: any) => s + (t.achieved_value || 0), 0);
      return { total_meta: totalMeta, total_atingido: totalAtingido, percentual: totalMeta > 0 ? +((totalAtingido / totalMeta) * 100).toFixed(1) : 0 };
    }
    case "funil": {
      const { data } = await supabase.from("sales_funnel").select("id, client_name, stage, value, probability, status").eq("status", "active").order("value", { ascending: false }).limit(limite);
      return { oportunidades: data || [] };
    }
    default: return { clientes_ativos: 0 };
  }
}

async function executeConsultaProducao(supabase: any, args: any) {
  const today = new Date().toISOString().split("T")[0];
  switch (args.tipo) {
    case "resumo": {
      const { data } = await supabase.from("production_orders").select("id, status, planned_quantity, produced_quantity, due_date").limit(500);
      const ops = data || [];
      return { total_ordens: ops.length, em_producao: ops.filter((o: any) => o.status === "in_progress").length, planejadas: ops.filter((o: any) => o.status === "planned" || o.status === "pending").length, concluidas: ops.filter((o: any) => o.status === "completed").length, atrasadas: ops.filter((o: any) => o.due_date && o.due_date < today && !["completed", "cancelled"].includes(o.status)).length };
    }
    case "ordens_ativas": {
      const { data } = await supabase.from("production_orders").select("id, order_number, product_name, status, quantity, produced_quantity, due_date, priority").in("status", ["in_progress", "planned", "pending"]).order("priority").limit(20);
      return { ordens_ativas: data || [] };
    }
    case "atrasadas": {
      const { data } = await supabase.from("production_orders").select("id, order_number, product_name, status, due_date, quantity, produced_quantity").lt("due_date", today).not("status", "in", '("completed","cancelled")').order("due_date").limit(20);
      return { ordens_atrasadas: data || [] };
    }
    case "eficiencia": {
      const { data } = await supabase.from("production_orders").select("planned_quantity, produced_quantity").eq("status", "completed").limit(200);
      const ops = data || [];
      const planned = ops.reduce((s: number, o: any) => s + (o.planned_quantity || 0), 0);
      const produced = ops.reduce((s: number, o: any) => s + (o.produced_quantity || 0), 0);
      return { eficiencia_geral: planned > 0 ? +((produced / planned) * 100).toFixed(1) : 0, ordens_analisadas: ops.length };
    }
    default: return { resumo: "Dados não encontrados" };
  }
}

async function executeConsultaEstoque(supabase: any, args: any) {
  switch (args.tipo) {
    case "resumo": {
      const { data } = await supabase.from("products").select("id, stock_current, stock_min, price, cost, status").eq("status", "active").limit(500);
      const prods = data || [];
      return { total_produtos: prods.length, abaixo_minimo: prods.filter((p: any) => p.stock_current <= p.stock_min).length, valor_estoque_total: +prods.reduce((s: number, p: any) => s + ((p.stock_current || 0) * (p.cost || p.price || 0)), 0).toFixed(2) };
    }
    case "baixo_estoque": {
      const { data } = await supabase.from("products").select("id, name, code, stock_current, stock_min, price").eq("status", "active").limit(500);
      const baixo = (data || []).filter((p: any) => p.stock_current <= p.stock_min).sort((a: any, b: any) => (a.stock_current - a.stock_min) - (b.stock_current - b.stock_min));
      return { produtos_baixo_estoque: baixo.slice(0, 20) };
    }
    case "movimentacoes_recentes": {
      const { data } = await supabase.from("stock_movements").select("id, product_name, direction, quantity, type, created_at, document_number").order("created_at", { ascending: false }).limit(15);
      return { movimentacoes: data || [] };
    }
    case "produto_especifico": {
      if (!args.produto_nome) return { erro: "Nome do produto não informado" };
      const { data } = await supabase.from("products").select("id, name, code, stock_current, stock_min, price, cost, status").ilike("name", `%${args.produto_nome}%`).limit(5);
      return { produtos_encontrados: data || [] };
    }
    default: return { resumo: "Dados não encontrados" };
  }
}

async function executeAcao(supabase: any, args: any) {
  if (!args.confirmado) {
    return { status: "aguardando_confirmacao", mensagem: `⚠️ Ação pendente: ${args.acao} no módulo ${args.modulo}`, detalhes: args.parametros, instrucao: "Confirme dizendo 'sim, confirmo' para executar." };
  }
  const params = args.parametros || {};
  switch (args.acao) {
    case "registrar_pagamento": {
      if (!params.id) return { erro: "ID da conta não informado" };
      const table = args.modulo === "financeiro" && params.tipo === "receber" ? "accounts_receivable" : "accounts_payable";
      const { error } = await supabase.from(table).update({ status: "paid", payment_date: new Date().toISOString().split("T")[0], paid_amount: params.valor }).eq("id", params.id);
      if (error) return { erro: error.message };
      return { status: "sucesso", mensagem: "✅ Pagamento registrado." };
    }
    case "alterar_status_pedido": {
      if (!params.id || !params.novo_status) return { erro: "ID e novo status obrigatórios" };
      const { error } = await supabase.from("orders").update({ status: params.novo_status }).eq("id", params.id);
      if (error) return { erro: error.message };
      return { status: "sucesso", mensagem: `✅ Pedido atualizado para ${params.novo_status}.` };
    }
    case "alterar_status_op": {
      if (!params.id || !params.novo_status) return { erro: "ID e novo status obrigatórios" };
      const { error } = await supabase.from("production_orders").update({ status: params.novo_status }).eq("id", params.id);
      if (error) return { erro: error.message };
      return { status: "sucesso", mensagem: `✅ OP atualizada para ${params.novo_status}.` };
    }
    default: return { erro: "Ação não implementada" };
  }
}

const TOOL_EXECUTORS: Record<string, (supabase: any, args: any) => Promise<any>> = {
  consultar_financeiro: executeConsultaFinanceiro,
  consultar_comercial: executeConsultaComercial,
  consultar_producao: executeConsultaProducao,
  consultar_estoque: executeConsultaEstoque,
  executar_acao: executeAcao,
};

// ─── Assistant Chat with Tool Calling ────────────────────────────

async function handleAssistantChat(messages: any[], supabase: any, lovableKey: string, corsHeaders: any) {
  const systemPrompt = `Você é o **Assistente ERP Inteligente** — um sistema autônomo de nível executivo integrado ao Diretor Digital.

PERSONALIDADE:
- Profissional, direto e eficiente
- Usa emojis estratégicos para clareza visual (📊💰🏭📦⚠️✅)
- Formata valores em R$ com separador de milhar brasileiro
- Responde em português brasileiro

CAPACIDADES:
1. **Consultas em tempo real** — Financeiro, Comercial, Produção, Estoque
2. **Execução de ações** — Registrar pagamentos, alterar status, atualizar dados
3. **Análise inteligente** — Identifica riscos, oportunidades e tendências

REGRAS DE SEGURANÇA:
- Para QUALQUER ação que modifique dados, SEMPRE use a tool executar_acao com confirmado=false primeiro
- Só execute com confirmado=true APÓS o usuário confirmar explicitamente
- Nunca invente dados — sempre consulte o sistema

FORMATO:
- Use markdown para organizar
- Tabelas quando houver múltiplos registros
- Destaque valores críticos em negrito
- Inclua recomendações proativas quando relevante`;

  const aiMessages = [{ role: "system", content: systemPrompt }, ...messages];

  const firstResp = await fetch(GATEWAY_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${lovableKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model: "google/gemini-3-flash-preview", messages: aiMessages, tools: ERP_TOOLS, stream: false }),
  });

  if (!firstResp.ok) {
    const status = firstResp.status;
    const body = await firstResp.text();
    console.error("AI gateway error:", status, body);
    if (status === 429) return new Response(JSON.stringify({ error: "Rate limit excedido." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    if (status === 402) return new Response(JSON.stringify({ error: "Créditos insuficientes." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    return new Response(JSON.stringify({ error: "Erro no processamento de IA" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  let result = await firstResp.json();
  let choice = result.choices?.[0];
  let rounds = 0;

  while (choice?.finish_reason === "tool_calls" && choice?.message?.tool_calls && rounds < 5) {
    rounds++;
    const assistantMsg = choice.message;
    aiMessages.push(assistantMsg);

    for (const toolCall of assistantMsg.tool_calls) {
      const fn = toolCall.function;
      const executor = TOOL_EXECUTORS[fn.name];
      let toolResult: any;
      try {
        const args = typeof fn.arguments === "string" ? JSON.parse(fn.arguments) : fn.arguments;
        toolResult = executor ? await executor(supabase, args) : { erro: `Função ${fn.name} não encontrada` };
      } catch (e) {
        toolResult = { erro: `Erro: ${e.message}` };
      }
      aiMessages.push({ role: "tool", tool_call_id: toolCall.id, content: JSON.stringify(toolResult) });
    }

    const nextResp = await fetch(GATEWAY_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${lovableKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: "google/gemini-3-flash-preview", messages: aiMessages, tools: ERP_TOOLS, stream: false }),
    });
    if (!nextResp.ok) break;
    result = await nextResp.json();
    choice = result.choices?.[0];
  }

  const content = choice?.message?.content || "Não foi possível processar sua solicitação.";
  return new Response(JSON.stringify({ content }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
}

// ─── Daily Summary ──────────────────────────────────────────────

async function handleDailySummary(supabase: any, lovableKey: string, corsHeaders: any) {
  const today = new Date().toISOString().split("T")[0];

  const [recRes, pagRes, bankRes, recHoje, pagHoje, opsRes] = await Promise.all([
    supabase.from("accounts_receivable").select("id, amount, open_amount, status, due_date, client_name").limit(500),
    supabase.from("accounts_payable").select("id, amount, open_amount, status, due_date, supplier").limit(500),
    supabase.from("bank_accounts").select("name, balance").eq("active", true),
    supabase.from("accounts_receivable").select("id, client_name, amount, open_amount").eq("due_date", today).eq("status", "pending"),
    supabase.from("accounts_payable").select("id, supplier, amount, open_amount, description").eq("due_date", today).eq("status", "pending"),
    supabase.from("production_orders").select("id, order_number, product_name, due_date, status").in("status", ["in_progress", "planned", "pending"]).limit(100),
  ]);

  const banks = bankRes.data || [];
  const recebHoje = recHoje.data || [];
  const pagarHoje = pagHoje.data || [];
  const rec = recRes.data || [];
  const ops = opsRes.data || [];

  const saldoBancario = banks.reduce((s: number, b: any) => s + (b.balance || 0), 0);
  const totalReceberHoje = recebHoje.reduce((s: number, r: any) => s + (r.open_amount || r.amount || 0), 0);
  const totalPagarHoje = pagarHoje.reduce((s: number, p: any) => s + (p.open_amount || p.amount || 0), 0);
  const atrasadosRec = rec.filter((r: any) => (r.status === "overdue" || (r.status === "pending" && r.due_date < today)));
  const totalInadimplencia = atrasadosRec.reduce((s: number, r: any) => s + (r.open_amount || r.amount || 0), 0);
  const opsAtrasadas = ops.filter((o: any) => o.due_date && o.due_date < today);

  const summary = { data: today, saldo_bancario: saldoBancario, contas_bancarias: banks, receber_hoje: { total: totalReceberHoje, quantidade: recebHoje.length, detalhes: recebHoje.slice(0, 5) }, pagar_hoje: { total: totalPagarHoje, quantidade: pagarHoje.length, detalhes: pagarHoje.slice(0, 5) }, saldo_previsto: saldoBancario + totalReceberHoje - totalPagarHoje, inadimplencia: { total: totalInadimplencia, quantidade: atrasadosRec.length }, producao_atrasada: opsAtrasadas.length };

  const aiResp = await fetch(GATEWAY_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${lovableKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "google/gemini-3-flash-preview",
      messages: [
        { role: "system", content: `Você é o CFO Digital. Gere um RESUMO EXECUTIVO DIÁRIO em markdown, direto e objetivo.\nUse emojis. Formato:\n1. 💰 Saldo e Posição\n2. 📥 Recebimentos\n3. 📤 Pagamentos\n4. ⚠️ Alertas\n5. 🎯 Recomendações\nValores em R$ formatados.` },
        { role: "user", content: `Dados de hoje (${today}):\n${JSON.stringify(summary, null, 2)}` },
      ],
      stream: false,
    }),
  });

  let resumoTexto = "";
  if (aiResp.ok) {
    const aiResult = await aiResp.json();
    resumoTexto = aiResult.choices?.[0]?.message?.content || "";
  }

  return new Response(JSON.stringify({ summary, resumo_executivo: resumoTexto }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

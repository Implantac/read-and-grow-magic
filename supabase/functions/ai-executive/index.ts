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

    const supabase = createClient(supabaseUrl, supabaseKey);
    // SECURITY: Always use the authenticated user's ID from the verified JWT claims.
    // Never trust a user_id supplied in the request body — that would allow IDOR
    // (reading/writing/deleting another user's chat history).
    const authenticatedUserId = claimsData.claims.sub as string;
    const { action, messages } = await req.json();

    if (action === "clear_history") {
      await supabase.from("ai_executive_chat").delete().eq("user_id", authenticatedUserId);
      return new Response(JSON.stringify({ ok: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    if (action === "chat" || action === "assistant_chat") return await handleUnifiedChat(messages, supabase, lovableKey, corsHeaders, authenticatedUserId);
    if (action === "daily_summary") return await handleDailySummary(supabase, lovableKey, corsHeaders);
    if (action === "generate_insights") return await handleGenerateInsights(supabase, lovableKey, corsHeaders);
    if (action === "generate_scenarios") return await handleGenerateScenarios(supabase, lovableKey, corsHeaders);
    if (action === "ceo_brief") return await handleCEOBrief(supabase, lovableKey, corsHeaders);
    if (action === "execute_decisions") return await handleExecuteDecisions(supabase, body, corsHeaders, authenticatedUserId);
    if (action === "autopilot_run") return await handleAutoPilotRun(supabase, lovableKey, corsHeaders);
    return await handleDashboardData(supabase, corsHeaders);
  } catch (e) {
    console.error("ai-executive error:", e);
    return new Response(JSON.stringify({ error: "An internal error occurred. Please try again." }), {
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

  const totalRevenue = d.orders.filter((o: any) => completedStatuses.includes(o.status)).reduce((s: number, o: any) => s + (o.total || 0), 0);
  const totalCosts = d.payables.filter((p: any) => p.status === 'paid').reduce((s: number, p: any) => s + (p.amount || 0), 0);
  const grossProfit = totalRevenue - totalCosts;
  const grossMargin = totalRevenue > 0 ? (grossProfit / totalRevenue * 100) : 0;

  const overdueReceivable = d.receivables.filter((r: any) => r.status === 'overdue' || (r.status === 'pending' && new Date(r.due_date) < now)).reduce((s: number, r: any) => s + (r.open_amount || r.amount || 0), 0);
  const overduePayable = d.payables.filter((p: any) => p.status === 'overdue' || (p.status === 'pending' && new Date(p.due_date) < now)).reduce((s: number, p: any) => s + (p.open_amount || p.amount || 0), 0);
  const totalReceivable = d.receivables.filter((r: any) => r.status === 'pending').reduce((s: number, r: any) => s + (r.open_amount || r.amount || 0), 0);
  const totalPayable = d.payables.filter((p: any) => p.status === 'pending').reduce((s: number, p: any) => s + (p.open_amount || p.amount || 0), 0);

  const activeClients = d.clients.filter((c: any) => c.status === 'active').length;
  const lowStockProducts = d.products.filter((p: any) => p.stock_current <= p.stock_min && p.status === 'active').length;
  const defaultRate = totalReceivable > 0 ? (overdueReceivable / (totalReceivable + overdueReceivable) * 100) : 0;

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

  const expenseByCategory: Record<string, number> = {};
  d.payables.forEach((p: any) => {
    expenseByCategory[p.category || 'Outros'] = (expenseByCategory[p.category || 'Outros'] || 0) + (p.amount || 0);
  });

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

  const funnelByStage: Record<string, { count: number; value: number }> = {};
  d.funnel.filter((f: any) => f.status === 'active' || !f.status).forEach((f: any) => {
    const stage = f.stage || 'unknown';
    if (!funnelByStage[stage]) funnelByStage[stage] = { count: 0, value: 0 };
    funnelByStage[stage].count++;
    funnelByStage[stage].value += f.value || 0;
  });

  const prodCompleted = d.production.filter((p: any) => p.status === 'completed');
  const prodInProgress = d.production.filter((p: any) => p.status === 'in_progress');
  const prodPlanned = d.production.filter((p: any) => p.status === 'planned' || p.status === 'pending');
  const prodEfficiency = prodCompleted.length > 0
    ? prodCompleted.reduce((s: number, p: any) => s + (p.produced_quantity || 0), 0) / prodCompleted.reduce((s: number, p: any) => s + (p.planned_quantity || 1), 0) * 100
    : 0;

  const futureReceivables = d.receivables.filter((r: any) => {
    const dd = new Date(r.due_date);
    return r.status === 'pending' && dd >= now && dd <= new Date(now.getTime() + 30 * 86400000);
  }).reduce((s: number, r: any) => s + (r.open_amount || r.amount || 0), 0);
  const futurePayables = d.payables.filter((p: any) => {
    const dd = new Date(p.due_date);
    return p.status === 'pending' && dd >= now && dd <= new Date(now.getTime() + 30 * 86400000);
  }).reduce((s: number, p: any) => s + (p.open_amount || p.amount || 0), 0);

  const lastTwoMonths = revenueByMonth.slice(-2);
  const revenueGrowth = lastTwoMonths.length === 2 && lastTwoMonths[0].revenue > 0
    ? ((lastTwoMonths[1].revenue - lastTwoMonths[0].revenue) / lastTwoMonths[0].revenue * 100) : 0;

  const completedOrders = d.orders.filter((o: any) => completedStatuses.includes(o.status));
  const avgTicket = completedOrders.length > 0 ? totalRevenue / completedOrders.length : 0;

  const clientsAtRisk = d.clients.filter((c: any) => {
    if (c.status !== 'active') return false;
    if (!c.last_purchase_date) return true;
    return (now.getTime() - new Date(c.last_purchase_date).getTime()) / 86400000 > 60;
  }).length;

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

  const topProfitable = [...productMargins].sort((a, b) => b.margin - a.margin).slice(0, 5);
  const lowMarginProducts = productMargins.filter(p => p.marginPct < 15 && p.revenue > 0).slice(0, 5);

  const revenueByRegion: Record<string, number> = {};
  const clientRegionMap: Record<string, string> = {};
  d.clients.forEach((c: any) => { if (c.region) clientRegionMap[c.name] = c.region; });
  d.orders.forEach((o: any) => {
    if (completedStatuses.includes(o.status)) {
      const region = clientRegionMap[o.client_name] || 'Não definida';
      revenueByRegion[region] = (revenueByRegion[region] || 0) + (o.total || 0);
    }
  });

  const targetsSummary = d.salesTargets.reduce((acc: any, t: any) => {
    acc.target += t.target_value || 0;
    acc.achieved += t.achieved_value || 0;
    return acc;
  }, { target: 0, achieved: 0 });
  const targetAttainment = targetsSummary.target > 0 ? +(targetsSummary.achieved / targetsSummary.target * 100).toFixed(1) : 0;

  const autoAlerts: any[] = [];
  if (defaultRate > 10) autoAlerts.push({ type: 'financial_risk', severity: 'critical', title: 'Inadimplência acima de 10%', description: `Taxa atual: ${defaultRate.toFixed(1)}%. Ação imediata necessária.`, metric: 'default_rate', value: defaultRate });
  if (concentrationPct > 60) autoAlerts.push({ type: 'revenue_concentration', severity: 'high', title: 'Concentração excessiva de receita', description: `Top 3 clientes representam ${concentrationPct.toFixed(0)}% da receita.`, metric: 'concentration', value: concentrationPct });
  if (revenueGrowth < -10) autoAlerts.push({ type: 'revenue_decline', severity: 'critical', title: 'Queda acentuada de receita', description: `Receita caiu ${Math.abs(revenueGrowth).toFixed(1)}% vs mês anterior.`, metric: 'revenue_growth', value: revenueGrowth });
  if ((futureReceivables - futurePayables) < 0) autoAlerts.push({ type: 'cash_flow_risk', severity: 'high', title: 'Fluxo de caixa negativo projetado', description: `Projeção 30d: déficit de R$ ${Math.abs(futureReceivables - futurePayables).toLocaleString('pt-BR')}.`, metric: 'cash_flow_30d', value: futureReceivables - futurePayables });
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

// ─── ERP Tools (Unified) ────────────────────────────────────────

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
          tipo: { type: "string", enum: ["resumo", "clientes_ativos", "pedidos_recentes", "funil", "metas", "top_clientes", "clientes_risco", "vendedores"], description: "Tipo de consulta comercial" },
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
      description: "Executa ações no ERP: registrar pagamento, adiar conta, alterar status de pedido/OP, criar conta a pagar/receber, priorizar OP, ajustar estoque. SEMPRE peça confirmação ao usuário antes de executar com confirmado=true.",
      parameters: {
        type: "object",
        properties: {
          modulo: { type: "string", enum: ["financeiro", "comercial", "producao", "estoque"] },
          acao: { type: "string", enum: ["registrar_pagamento", "adiar_vencimento", "criar_conta_pagar", "criar_conta_receber", "alterar_status_pedido", "alterar_status_op", "priorizar_op", "ajustar_estoque"] },
          parametros: { type: "object", description: "Parâmetros da ação" },
          confirmado: { type: "boolean", description: "Se o usuário já confirmou a ação. Use false na primeira chamada para pedir confirmação." },
        },
        required: ["modulo", "acao", "parametros"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "analise_estrategica",
      description: "Gera análise estratégica detalhada com KPIs, tendências e recomendações da empresa toda",
      parameters: {
        type: "object",
        properties: {
          foco: { type: "string", enum: ["geral", "financeiro", "comercial", "producao", "margem", "risco"], description: "Foco da análise" },
        },
        required: ["foco"],
      },
    },
  },
];

// ─── Tool Executors ─────────────────────────────────────────────

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
    case "vendedores": {
      const [repsRes, ordersRes] = await Promise.all([
        supabase.from("sales_reps").select("id, name, region, status").eq("status", "active").limit(50),
        supabase.from("orders").select("sales_rep_id, sales_rep_name, total, status").in("status", ["completed", "invoiced", "shipped", "delivered"]).limit(500),
      ]);
      const reps = repsRes.data || [];
      const orders = ordersRes.data || [];
      const repMap: Record<string, { name: string; revenue: number; orders: number }> = {};
      orders.forEach((o: any) => {
        if (o.sales_rep_id) {
          if (!repMap[o.sales_rep_id]) repMap[o.sales_rep_id] = { name: o.sales_rep_name || '', revenue: 0, orders: 0 };
          repMap[o.sales_rep_id].revenue += o.total || 0;
          repMap[o.sales_rep_id].orders++;
        }
      });
      return { vendedores: reps.map((r: any) => ({ ...r, ...(repMap[r.id] || { revenue: 0, orders: 0 }) })) };
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

async function executeAcao(supabase: any, args: any, user_id?: string) {
  if (!args.confirmado) {
    return {
      status: "aguardando_confirmacao",
      mensagem: `⚠️ **Ação pendente de confirmação**`,
      acao: args.acao,
      modulo: args.modulo,
      detalhes: args.parametros,
      instrucao: "Responda **'sim, confirmo'** para executar ou **'cancelar'** para desistir.",
    };
  }
  const params = args.parametros || {};
  const logAction = async (actionName: string, result: string) => {
    if (user_id) {
      try {
        await supabase.from("ai_action_logs").insert({
          user_id,
          action_type: "execution",
          module: args.modulo,
          action_name: actionName,
          parameters: params,
          context: JSON.stringify({ modulo: args.modulo }),
          result,
        });
      } catch { /* ignore */ }
    }
  };

  switch (args.acao) {
    case "registrar_pagamento": {
      if (!params.id) return { erro: "ID da conta não informado" };
      const table = params.tipo === "receber" ? "accounts_receivable" : "accounts_payable";
      const { error } = await supabase.from(table).update({ status: "paid", payment_date: new Date().toISOString().split("T")[0], paid_amount: params.valor }).eq("id", params.id);
      if (error) return { erro: error.message };
      await logAction("registrar_pagamento", "sucesso");
      return { status: "sucesso", mensagem: "✅ Pagamento registrado com sucesso." };
    }
    case "adiar_vencimento": {
      if (!params.id || !params.nova_data) return { erro: "ID e nova data são obrigatórios" };
      const table = params.tipo === "receber" ? "accounts_receivable" : "accounts_payable";
      const { error } = await supabase.from(table).update({ due_date: params.nova_data }).eq("id", params.id);
      if (error) return { erro: error.message };
      await logAction("adiar_vencimento", "sucesso");
      return { status: "sucesso", mensagem: `✅ Vencimento adiado para ${params.nova_data}.` };
    }
    case "criar_conta_pagar": {
      const { error } = await supabase.from("accounts_payable").insert({
        description: params.descricao || "Conta via IA",
        supplier: params.fornecedor || "N/A",
        amount: params.valor || 0,
        due_date: params.vencimento || new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0],
        category: params.categoria || "Geral",
        status: "pending",
      });
      if (error) return { erro: error.message };
      await logAction("criar_conta_pagar", "sucesso");
      return { status: "sucesso", mensagem: `✅ Conta a pagar criada: R$ ${(params.valor || 0).toLocaleString("pt-BR")} para ${params.fornecedor || "N/A"}.` };
    }
    case "criar_conta_receber": {
      const { error } = await supabase.from("accounts_receivable").insert({
        description: params.descricao || "Conta via IA",
        client_name: params.cliente || "N/A",
        amount: params.valor || 0,
        due_date: params.vencimento || new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0],
        category: params.categoria || "Vendas",
        status: "pending",
      });
      if (error) return { erro: error.message };
      await logAction("criar_conta_receber", "sucesso");
      return { status: "sucesso", mensagem: `✅ Conta a receber criada: R$ ${(params.valor || 0).toLocaleString("pt-BR")} de ${params.cliente || "N/A"}.` };
    }
    case "alterar_status_pedido": {
      if (!params.id || !params.novo_status) return { erro: "ID e novo status obrigatórios" };
      const { error } = await supabase.from("orders").update({ status: params.novo_status }).eq("id", params.id);
      if (error) return { erro: error.message };
      await logAction("alterar_status_pedido", "sucesso");
      return { status: "sucesso", mensagem: `✅ Pedido atualizado para "${params.novo_status}".` };
    }
    case "alterar_status_op": {
      if (!params.id || !params.novo_status) return { erro: "ID e novo status obrigatórios" };
      const { error } = await supabase.from("production_orders").update({ status: params.novo_status }).eq("id", params.id);
      if (error) return { erro: error.message };
      await logAction("alterar_status_op", "sucesso");
      return { status: "sucesso", mensagem: `✅ OP atualizada para "${params.novo_status}".` };
    }
    case "priorizar_op": {
      if (!params.id) return { erro: "ID da OP não informado" };
      const { error } = await supabase.from("production_orders").update({ priority: params.prioridade || "urgent" }).eq("id", params.id);
      if (error) return { erro: error.message };
      await logAction("priorizar_op", "sucesso");
      return { status: "sucesso", mensagem: `✅ OP priorizada como "${params.prioridade || "urgent"}".` };
    }
    case "ajustar_estoque": {
      if (!params.product_id || params.quantidade == null) return { erro: "ID do produto e quantidade obrigatórios" };
      const { data: prod } = await supabase.from("products").select("id, name, code, stock_current").eq("id", params.product_id).single();
      if (!prod) return { erro: "Produto não encontrado" };
      const newStock = (prod.stock_current || 0) + (params.quantidade || 0);
      const { error } = await supabase.from("products").update({ stock_current: newStock }).eq("id", params.product_id);
      if (error) return { erro: error.message };
      await supabase.from("stock_movements").insert({
        document_number: `IA-ADJ-${Date.now()}`,
        product_id: prod.id,
        product_code: prod.code,
        product_name: prod.name,
        type: "adjustment",
        direction: params.quantidade > 0 ? "in" : "out",
        quantity: Math.abs(params.quantidade),
        operator: "IA Executiva",
        source: "erp",
        notes: params.motivo || "Ajuste via IA Executiva",
      });
      await logAction("ajustar_estoque", "sucesso");
      return { status: "sucesso", mensagem: `✅ Estoque de "${prod.name}" ajustado: ${prod.stock_current} → ${newStock} unidades.` };
    }
    default: return { erro: "Ação não implementada" };
  }
}

async function executeAnaliseEstrategica(supabase: any, args: any) {
  const d = await fetchAllData(supabase);
  const computed = computeKPIs(d);
  const k = computed.kpis;

  const focusData: Record<string, any> = {
    geral: { kpis: k, topClients: computed.topClients, revenueByMonth: computed.revenueByMonth, salesRepStats: computed.salesRepStats, funnelByStage: computed.funnelByStage, autoAlerts: computed.autoAlerts },
    financeiro: { receita: k.totalRevenue, custos: k.totalCosts, lucro: k.grossProfit, margem: k.grossMargin, inadimplencia: k.overdueReceivable, taxa_inadimplencia: k.defaultRate, posicao_liquida: k.netPosition, fluxo_caixa_30d: k.cashFlowProjection30d, receber: k.totalReceivable, pagar: k.totalPayable, despesas: computed.expenseByCategory },
    comercial: { clientes_ativos: k.activeClients, clientes_risco: k.clientsAtRisk, concentracao: k.concentrationPct, ticket_medio: k.avgTicket, meta_atingimento: k.targetAttainment, topClients: computed.topClients, vendedores: computed.salesRepStats, funil: computed.funnelByStage, crescimento: k.revenueGrowth },
    producao: { eficiencia: k.prodEfficiency, em_andamento: k.prodInProgress, planejadas: k.prodPlanned, concluidas: k.prodCompleted, estoque_critico: k.lowStockProducts },
    margem: { margens: computed.productMargins, top_rentaveis: computed.topProfitable, baixa_margem: computed.lowMarginProducts, margem_bruta: k.grossMargin },
    risco: { inadimplencia: k.defaultRate, concentracao: k.concentrationPct, estoque_critico: k.lowStockProducts, clientes_risco: k.clientsAtRisk, fluxo_caixa: k.cashFlowProjection30d, alertas: computed.autoAlerts },
  };

  return focusData[args.foco] || focusData.geral;
}

// TOOL_EXECUTORS are called with (supabase, args, user_id) — see tool call loop below
const TOOL_EXECUTORS: Record<string, (supabase: any, args: any, user_id?: string) => Promise<any>> = {
  consultar_financeiro: executeConsultaFinanceiro,
  consultar_comercial: executeConsultaComercial,
  consultar_producao: executeConsultaProducao,
  consultar_estoque: executeConsultaEstoque,
  executar_acao: executeAcao,
  analise_estrategica: executeAnaliseEstrategica,
};

// ─── Pattern Analysis ───────────────────────────────────────────

async function analyzeUserPatterns(supabase: any, user_id: string): Promise<string> {
  const { data: logs } = await supabase
    .from("ai_action_logs")
    .select("module, action_name, created_at")
    .eq("user_id", user_id)
    .order("created_at", { ascending: false })
    .limit(100);

  if (!logs || logs.length < 3) return "";

  // Count action frequencies
  const freq: Record<string, number> = {};
  for (const log of logs) {
    const key = `${log.module}/${log.action_name}`;
    freq[key] = (freq[key] || 0) + 1;
  }

  const sorted = Object.entries(freq).sort((a, b) => b[1] - a[1]);
  const patterns: string[] = [];

  for (const [action, count] of sorted.slice(0, 5)) {
    if (count >= 3) {
      patterns.push(`- "${action}" executada ${count}x`);
    }
  }

  // Detect time-based patterns (actions done at similar times)
  const hourFreq: Record<number, number> = {};
  for (const log of logs) {
    const h = new Date(log.created_at).getHours();
    hourFreq[h] = (hourFreq[h] || 0) + 1;
  }
  const peakHour = Object.entries(hourFreq).sort((a, b) => b[1] - a[1])[0];
  if (peakHour && Number(peakHour[1]) >= 5) {
    patterns.push(`- Horário de pico de uso: ${peakHour[0]}h (${peakHour[1]} ações)`);
  }

  // Detect daily routine patterns
  const recentDays = new Set(logs.slice(0, 20).map((l: any) => new Date(l.created_at).toISOString().split("T")[0]));
  const dailyActions = sorted.filter(([, c]) => c >= recentDays.size * 0.7);
  for (const [action] of dailyActions.slice(0, 2)) {
    patterns.push(`- "${action}" parece ser uma rotina diária`);
  }

  if (patterns.length === 0) return "";

  return `\n\n## 🤖 APRENDIZADO ADAPTATIVO
Padrões detectados no comportamento deste usuário:
${patterns.join("\n")}

Com base nesses padrões:
- Sugira proativamente ações que o usuário costuma fazer
- Se detectar rotina, pergunte: "Percebi que você faz [ação] com frequência. Deseja que eu automatize?"
- Antecipe necessidades baseadas no histórico
- Priorize módulos que o usuário mais utiliza`;
}

// ─── Unified Chat with Tool Calling ─────────────────────────────

async function handleUnifiedChat(messages: any[], supabase: any, lovableKey: string, corsHeaders: any, user_id?: string) {
  // ─── Server-side Memory: Load recent history for context ───
  let serverHistory: any[] = [];
  if (user_id) {
    const { data: recentMsgs } = await supabase
      .from("ai_executive_chat")
      .select("role, content, created_at")
      .eq("user_id", user_id)
      .order("created_at", { ascending: true })
      .limit(40);
    if (recentMsgs && recentMsgs.length > 0) {
      serverHistory = recentMsgs.map((m: any) => ({ role: m.role, content: m.content }));
    }
  }

  // ─── Persist incoming user message ───
  const lastUserMsg = messages?.filter((m: any) => m.role === "user").pop();
  if (user_id && lastUserMsg) {
    await supabase.from("ai_executive_chat").insert({
      user_id,
      role: "user",
      content: lastUserMsg.content,
    });
  }

  // ─── Build context: server history + current session messages ───
  // Deduplicate: if client sent full history, use it; otherwise merge with server history
  const clientMsgCount = (messages || []).filter((m: any) => m.role !== "system").length;
  const contextMessages = clientMsgCount > 2 ? messages : [...serverHistory, ...(messages || [])];

  // ─── Extract operational context summary for the system prompt ───
  const recentContext = contextMessages.slice(-10);
  const mentionedEntities: string[] = [];
  for (const m of recentContext) {
    if (m.role === "user" || m.role === "assistant") {
      const text = m.content || "";
      // Track mentioned clients, OPs, accounts
      const clientMatch = text.match(/cliente\s+(\w+)/gi);
      const opMatch = text.match(/OP[-\s]?\d+/gi);
      if (clientMatch) mentionedEntities.push(...clientMatch);
      if (opMatch) mentionedEntities.push(...opMatch);
    }
  }
  const contextSummary = mentionedEntities.length > 0
    ? `\n\n## CONTEXTO ATIVO DA CONVERSA\nEntidades mencionadas recentemente: ${[...new Set(mentionedEntities)].join(", ")}\nUse essas referências quando o usuário falar "esse", "aquele", "o mesmo", etc.`
    : "";

  // ─── Adaptive Learning: Analyze user patterns ───
  const patternInsights = user_id ? await analyzeUserPatterns(supabase, user_id) : "";

  // ─── Log consultation queries for learning ───
  if (user_id && lastUserMsg) {
    const queryText = lastUserMsg.content.toLowerCase();
    const consultModules = ["financeiro", "comercial", "produção", "producao", "estoque"];
    const detectedModule = consultModules.find(m => queryText.includes(m)) || "geral";
    try {
      await supabase.from("ai_action_logs").insert({
        user_id,
        action_type: "query",
        module: detectedModule,
        action_name: "consulta_chat",
        parameters: { query_preview: queryText.slice(0, 200) },
        context: "chat",
      });
    } catch { /* ignore */ }
  }

  const systemPrompt = `Você é o **Diretor Digital** — IA Executiva de um sistema ERP completo, o **cérebro da empresa**. Você acumula simultaneamente os papéis de:

- 👔 **Administrador** — visão 360º do negócio, decisões estratégicas
- 📒 **Contador** — DRE, margem, custos, impostos básicos (ICMS, ISS, PIS/COFINS, Simples)
- 💰 **Gestor Financeiro (CFO)** — caixa, contas a pagar/receber, inadimplência, fluxo
- 📦 **Especialista em Estoque (WMS)** — giro, ruptura, produtos parados, endereçamento, consignações
- 🏭 **Especialista em Produção e Logística (COO)** — OPs, eficiência, gargalos, expedição, rotas

# DADOS REAIS DA EMPRESA
Você tem acesso via ferramentas (tools) aos dados REAIS: estoque, produtos, movimentações, financeiro, consignações, vendas, produção, clientes. **SEMPRE consulte as ferramentas antes de responder** — NUNCA invente números.

# CAPACIDADES OPERACIONAIS
- Analisar estoque (giro, cobertura, ABC, ruptura)
- Identificar produtos parados (sem giro, slow movers)
- Calcular lucro, margem bruta/líquida, markup, ponto de equilíbrio
- Sugerir compras e reposição (com base em consumo médio, lead time, estoque mínimo)
- Orientar fluxo financeiro (DRE projetado, gap de caixa, antecipação de recebíveis)
- Orientar sobre impostos básicos (ICMS, MVA, custo tributário, regime fiscal)
- Orientar produção (priorização de OPs, capacidade, sequenciamento)
- Gerenciar consignações (envio fábrica → loja, vendas, devoluções, baixa automática)

# COMPORTAMENTO OBRIGATÓRIO
- **Direto e estratégico** — toda resposta deve levar a uma DECISÃO
- **Nunca genérico** — sempre com números reais e nome de cliente/produto/OP
- **Sempre sugira ação** — o que fazer agora, esta semana, este mês
- **Especialista, não assistente** — fale como dono do negócio falando com dono
- **Nunca invente dados** — se a tool não retornou, diga "sem dados" e proponha como obter
- **Priorize clareza e decisão** acima de completude

# EXEMPLOS DE COMPORTAMENTO ESPERADO

Pergunta: "Como está meu estoque?"
→ Resposta: (1) Resumo com nº SKUs, valor total, % ruptura  (2) Alertas: produtos abaixo do mínimo + parados >90d  (3) Sugestões: comprar X, liquidar Y, transferir Z

Pergunta: "O que devo produzir?"
→ Resposta: Ranking de OPs por giro × estoque atual × pedidos firmes, com sequenciamento sugerido

Pergunta: "Como está meu caixa?"
→ Resposta: Saldo + projeção 30d + gap + ação (antecipar recebível / renegociar pagável)



# REGRAS CRÍTICAS DE FORMATAÇÃO MARKDOWN (OBRIGATÓRIO)

1. TABELAS: Cada linha da tabela DEVE estar em uma LINHA SEPARADA. NUNCA coloque header, separador e rows na mesma linha.

CORRETO:
| Indicador | Valor |
|-----------|-------|
| Saldo | R$ 100 |

ERRADO (NUNCA FAÇA ISSO):
| Indicador | Valor | |-----------|-------| | Saldo | R$ 100 |

2. SEMPRE deixe uma LINHA EM BRANCO antes e depois de cada tabela.
3. SEMPRE deixe uma LINHA EM BRANCO antes de cada título (## ou ###).
4. Estruture em seções com títulos (## ou ###). NUNCA texto corrido sem estrutura.
5. Máximo 3 linhas por parágrafo.
6. NUNCA misture tabela com texto na mesma linha.

# ORDEM DE APRESENTAÇÃO PADRÃO

Para análises gerais e de clientes, siga esta ordem:

## 📊 Resumo Executivo
- Síntese clara em até 3 bullets
- Destaque principais riscos e oportunidades

## 👥 Clientes em Risco (quando aplicável)
- Tabela limpa com colunas: Cliente | Status | Nível de Risco
- Use emojis apenas para status: 🟢 Ativo | 🟡 Atenção | 🔴 Crítico
- Padronize os níveis: Baixo | Médio | Alto | Crítico

## 🔍 Análise
- Explique o cenário em parágrafos curtos
- Traga critérios objetivos (ex: dias sem compra, volume histórico, frequência)

## ⚠️ Impacto no Negócio
- Descreva consequências práticas (receita, cancelamento, relacionamento)

## 💡 Recomendações
- Liste ações claras e priorizadas
- NUNCA recomendações genéricas — sempre específicas e mensuráveis

## 👉 Próximos Passos
- Sugira ações diretas e possíveis automações ou aprofundamentos

---

# ESTRUTURA POR MÓDULO (quando o foco for específico)

## Financeiro (caixa, pagar, receber, vencimento, saldo, inadimplência)

### 🏦 Posição Atual
| Indicador | Valor |
|-----------|-------|
| Saldo Bancário | **R$ X** |
| A Receber | **R$ X** |
| A Pagar | **R$ X** |

### ⚠️ Alertas
Tabela de títulos vencidos, vencendo hoje.

### 💡 Recomendações
Ações priorizadas com impacto estimado.

## Comercial (vendas, cliente, pedido, meta, funil, vendedor)
Formato: KPIs gerais → Top clientes/vendedores em tabela → Pipeline → Recomendação

## Produção (OP, fábrica, eficiência, gargalo)
Formato: OPs ativas/atrasadas em tabela → Eficiência → Gargalos → Recomendação

## Estoque (produto, mínimo, ruptura)
Formato: Visão geral → Produtos críticos em tabela → Recomendação

## Executivo (resumo, como está, visão geral)
Formato: 📊 Resumo Executivo → Financeiro resumido → Comercial resumido → Produção resumida → Top 3 alertas → Top 3 ações

# TOM E ESTILO

- Escreva como uma **consultora estratégica**: clara, objetiva, orientada a decisão
- Direto, seguro — NUNCA use "talvez", "acho que", "pode ser", "possivelmente"
- Valores monetários SEMPRE em negrito: **R$ 12.500,00** (formato brasileiro)
- Porcentagens em negrito: **85,3%**
- Status com emoji: ✅ OK | ⚠️ Atenção | 🔴 Crítico
- Emojis moderados para leitura rápida
- Português brasileiro

# PROIBIDO

- Texto "quebrado" ou desalinhado
- Misturar listas com tabelas na mesma seção
- Falta de espaçamento entre seções
- Linguagem vaga ou evasiva
- Repetir informações já fornecidas
- Parágrafos longos (>3 linhas)

# MEMÓRIA E CONTEXTO

- Respostas curtas como "sim", "ok", "confirma" → execute ação pendente SEM repetir perguntas
- "não", "cancela" → cancele ação pendente
- "esse", "aquele", "o mesmo" → use contexto anterior
- NUNCA repita informações já fornecidas
- Mantenha estado: entidade ativa + ação pendente + último resultado
${contextSummary}

# AÇÕES DISPONÍVEIS
Financeiro: registrar pagamento, adiar vencimento, criar conta a pagar/receber
Comercial: alterar status pedido | Produção: alterar/priorizar OP | Estoque: ajustar estoque
SEMPRE peça confirmação antes de executar (confirmado=false primeiro)

# SEGURANÇA
NUNCA execute sem confirmação. Mostre prévia. Registre no log.
${patternInsights}`;

  const aiMessages = [{ role: "system", content: systemPrompt }, ...contextMessages];

  const firstResp = await fetch(GATEWAY_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${lovableKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model: "google/gemini-3-flash-preview", messages: aiMessages, tools: ERP_TOOLS, stream: false }),
  });

  if (!firstResp.ok) {
    const status = firstResp.status;
    const body = await firstResp.text();
    console.error("AI gateway error:", status, body);
    if (status === 429) return new Response(JSON.stringify({ error: "Rate limit excedido. Tente novamente em alguns minutos." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    if (status === 402) return new Response(JSON.stringify({ error: "Créditos insuficientes. Adicione créditos em Configurações > Workspace." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    return new Response(JSON.stringify({ error: "Erro no processamento de IA" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  let result = await firstResp.json();
  let choice = result.choices?.[0];
  let rounds = 0;

  while (choice?.finish_reason === "tool_calls" && choice?.message?.tool_calls && rounds < 8) {
    rounds++;
    const assistantMsg = choice.message;
    aiMessages.push(assistantMsg);

    for (const toolCall of assistantMsg.tool_calls) {
      const fn = toolCall.function;
      const executor = TOOL_EXECUTORS[fn.name];
      let toolResult: any;
      try {
        const args = typeof fn.arguments === "string" ? JSON.parse(fn.arguments) : fn.arguments;
        toolResult = executor ? await executor(supabase, args, user_id) : { erro: `Função ${fn.name} não encontrada` };
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

  // ─── Persist assistant response ───
  if (user_id) {
    await supabase.from("ai_executive_chat").insert({
      user_id,
      role: "assistant",
      content,
    });

    // ─── Trim old messages (keep last 60 per user) ───
    const { data: allMsgs } = await supabase
      .from("ai_executive_chat")
      .select("id")
      .eq("user_id", user_id)
      .order("created_at", { ascending: true });
    if (allMsgs && allMsgs.length > 60) {
      const toDelete = allMsgs.slice(0, allMsgs.length - 60).map((m: any) => m.id);
      await supabase.from("ai_executive_chat").delete().in("id", toDelete);
    }
  }

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

// ─── CEO Intelligence Layer ─────────────────────────────────────

function buildContext(d: any, kpis: any) {
  const lowStock = d.products
    .filter((p: any) => (p.stock_current ?? 0) <= (p.stock_min ?? 0) && p.status === "active")
    .slice(0, 20)
    .map((p: any) => ({ id: p.id, name: p.name, current: p.stock_current, min: p.stock_min }));
  const stockTotal = d.products.reduce(
    (s: number, p: any) => s + (Number(p.stock_current) || 0) * (Number(p.cost) || 0), 0
  );
  const cashIn30d = d.receivables.filter((r: any) => r.status === "pending")
    .reduce((s: number, r: any) => s + (Number(r.open_amount) || Number(r.amount) || 0), 0);
  const cashOut30d = d.payables.filter((p: any) => p.status === "pending")
    .reduce((s: number, p: any) => s + (Number(p.open_amount) || Number(p.amount) || 0), 0);
  return {
    estoque_valor_total: stockTotal,
    produtos_baixo_estoque: lowStock,
    produtos_total: d.products.length,
    vendas_recentes_count: d.orders.length,
    financeiro: {
      receita_total: kpis.totalRevenue,
      custo_total: kpis.totalCosts,
      lucro_bruto: kpis.grossProfit,
      margem_bruta_pct: kpis.grossMargin,
      saldo_projetado_30d: cashIn30d - cashOut30d,
      receber_30d: cashIn30d,
      pagar_30d: cashOut30d,
      inadimplencia_pct: kpis.defaultRate,
    },
    clientes_ativos: kpis.activeClients,
    concentracao_top3_pct: kpis.concentrationPct,
  };
}

function predictRevenue(revenueByMonth: { month: string; revenue: number }[]) {
  const series = (revenueByMonth || []).map((r) => Number(r.revenue) || 0);
  const valid = series.filter((v) => v > 0);
  const avg = valid.length > 0 ? valid.reduce((a, b) => a + b, 0) / valid.length : 0;
  const last = series[series.length - 1] || 0;
  const trend = last > avg * 1.05 ? "up" : last < avg * 0.95 ? "down" : "stable";
  return { previsao_proximo_mes: Math.round(avg), media_movel_6m: Math.round(avg), ultimo_mes: Math.round(last), trend };
}

function analyzeRisks(ctx: any, kpis: any) {
  const risks: any[] = [];
  if (ctx.financeiro.saldo_projetado_30d < 0) {
    risks.push({ tipo: "financeiro", impacto: "alto", titulo: "Caixa projetado negativo em 30 dias",
      detalhe: `Receber R$ ${ctx.financeiro.receber_30d.toFixed(2)} vs Pagar R$ ${ctx.financeiro.pagar_30d.toFixed(2)}` });
  }
  if (kpis.defaultRate > 10) {
    risks.push({ tipo: "credito", impacto: kpis.defaultRate > 20 ? "alto" : "medio",
      titulo: "Inadimplência elevada", detalhe: `${kpis.defaultRate.toFixed(1)}% da carteira em atraso` });
  }
  if (ctx.produtos_baixo_estoque.length > 0) {
    risks.push({ tipo: "estoque", impacto: ctx.produtos_baixo_estoque.length > 10 ? "alto" : "medio",
      titulo: `${ctx.produtos_baixo_estoque.length} produto(s) abaixo do mínimo`,
      detalhe: ctx.produtos_baixo_estoque.slice(0, 3).map((p: any) => p.name).join(", ") });
  }
  if (kpis.concentrationPct > 50) {
    risks.push({ tipo: "concentracao", impacto: "medio", titulo: "Concentração de receita nos top 3",
      detalhe: `${kpis.concentrationPct.toFixed(1)}% da receita vem de poucos clientes` });
  }
  if (kpis.grossMargin < 15 && kpis.totalRevenue > 0) {
    risks.push({ tipo: "rentabilidade", impacto: "alto", titulo: "Margem bruta baixa",
      detalhe: `Margem atual ${kpis.grossMargin.toFixed(1)}% — revisar pricing/custos` });
  }
  return risks;
}

function generateGrowthPlan(ctx: any, forecast: any, kpis: any) {
  const plan: any[] = [];
  plan.push({ tipo: "meta",
    titulo: `Meta: faturar R$ ${Math.round(forecast.previsao_proximo_mes * 1.2).toLocaleString("pt-BR")} no próximo mês`,
    detalhe: `+20% sobre média histórica de R$ ${forecast.previsao_proximo_mes.toLocaleString("pt-BR")}` });
  if (ctx.produtos_baixo_estoque.length > 0)
    plan.push({ tipo: "acao", titulo: "Repor estoque crítico", detalhe: `${ctx.produtos_baixo_estoque.length} SKU(s) em ruptura iminente` });
  if (kpis.defaultRate > 5)
    plan.push({ tipo: "acao", titulo: "Acionar régua de cobrança", detalhe: `Reduzir inadimplência de ${kpis.defaultRate.toFixed(1)}%` });
  if (kpis.concentrationPct > 40)
    plan.push({ tipo: "acao", titulo: "Diversificar carteira", detalhe: "Prospectar para reduzir dependência dos top 3" });
  if (forecast.trend === "down")
    plan.push({ tipo: "acao", titulo: "Lançar campanha comercial", detalhe: "Tendência de queda nos últimos meses" });
  return plan;
}

async function recordLearning(supabase: any, d: any) {
  try {
    const productSales: Record<string, number> = {};
    (d.orderItems || []).forEach((it: any) => {
      if (!it.product_id) return;
      productSales[it.product_id] = (productSales[it.product_id] || 0) + (Number(it.quantity) || 0);
    });
    const top = Object.entries(productSales).sort((a, b) => b[1] - a[1]).slice(0, 30);
    for (const [productId, qty] of top) {
      await supabase.from("ai_learning").upsert({
        pattern_type: "product_sales",
        pattern_key: `produto_${productId}`,
        value: qty,
        frequency: 1,
        metadata: { observed_at: new Date().toISOString() },
        last_updated: new Date().toISOString(),
      }, { onConflict: "pattern_type,pattern_key" });
    }
  } catch (e) { console.error("recordLearning warn:", e); }
}

async function persistKPIs(supabase: any, kpis: any, forecast: any) {
  const today = new Date().toISOString().slice(0, 10);
  const rows = [
    { snapshot_date: today, kpi_name: "receita_mes", category: "financial",
      current_value: kpis.totalRevenue, target_value: forecast.previsao_proximo_mes * 1.2,
      status: kpis.totalRevenue >= forecast.previsao_proximo_mes ? "ok" : "alerta",
      trend: forecast.trend, explanation: "Receita acumulada vs meta (+20% sobre média 6m)" },
    { snapshot_date: today, kpi_name: "margem_bruta", category: "financial",
      current_value: kpis.grossMargin, target_value: 25,
      status: kpis.grossMargin >= 25 ? "ok" : kpis.grossMargin >= 15 ? "alerta" : "critico",
      trend: null, explanation: "Margem bruta % — meta mínima 25%" },
    { snapshot_date: today, kpi_name: "inadimplencia", category: "financial",
      current_value: kpis.defaultRate, target_value: 5,
      status: kpis.defaultRate <= 5 ? "ok" : kpis.defaultRate <= 10 ? "alerta" : "critico",
      trend: null, explanation: "% da carteira em atraso — meta máx 5%" },
    { snapshot_date: today, kpi_name: "ruptura_estoque", category: "inventory",
      current_value: kpis.lowStockProducts, target_value: 0,
      status: kpis.lowStockProducts === 0 ? "ok" : kpis.lowStockProducts < 5 ? "alerta" : "critico",
      trend: null, explanation: "Nº de SKUs abaixo do mínimo" },
  ];
  try {
    await supabase.from("ai_kpis").delete()
      .eq("snapshot_date", today).in("kpi_name", rows.map((r) => r.kpi_name));
    await supabase.from("ai_kpis").insert(rows);
  } catch (e) { console.error("persistKPIs warn:", e); }
  return rows;
}

function suggestDecisions(ctx: any, forecast: any, risks: any[]) {
  const decisions: any[] = [];
  if (ctx.produtos_baixo_estoque.length > 0)
    decisions.push({ type: "repor_estoque", priority: "alta",
      action: `Criar pedido de compra para ${ctx.produtos_baixo_estoque.length} SKU(s)`, requires_approval: true });
  for (const r of risks) {
    if (r.tipo === "financeiro")
      decisions.push({ type: "ajuste_financeiro", priority: "alta",
        action: "Antecipar recebíveis ou renegociar pagáveis para zerar gap de caixa", requires_approval: true });
    if (r.tipo === "credito")
      decisions.push({ type: "cobranca", priority: "media",
        action: "Acionar régua de cobrança nos clientes inadimplentes", requires_approval: true });
  }
  if (forecast.previsao_proximo_mes > 0 && forecast.trend === "down")
    decisions.push({ type: "promocao", priority: "media",
      action: "Criar campanha em produtos de maior margem", requires_approval: true });
  return decisions;
}

async function handleCEOBrief(supabase: any, lovableKey: string, corsHeaders: any) {
  const data = await fetchAllData(supabase);
  const kpis = computeKPIs(data);
  const ctx = buildContext(data, kpis);
  const forecast = predictRevenue(kpis.revenueByMonth || []);
  const risks = analyzeRisks(ctx, kpis);
  const plan = generateGrowthPlan(ctx, forecast, kpis);
  const decisions = suggestDecisions(ctx, forecast, risks);
  const kpiRows = await persistKPIs(supabase, kpis, forecast);
  await recordLearning(supabase, data);

  const ceoPrompt = `Você é a IA CEO desta empresa. Pense e fale como o dono do negócio.

PRIORIDADES (nesta ordem):
1. Proteger o caixa — nunca permita prejuízo silencioso
2. Maximizar lucro — margem importa mais que volume
3. Antecipar problemas — prevenção custa menos que correção
4. Decidir, não descrever — toda análise termina em ação concreta

REGRAS DE CONTEÚDO:
- Use APENAS os dados fornecidos. Nunca invente.
- Valores em **R$ X.XXX,XX** (formato BR), porcentagens em **negrito**.
- Tom direto de dono — sem "talvez", sem "pode ser", sem rodeios.

REGRAS DE FORMATAÇÃO (OBRIGATÓRIO):
- NÃO use blocos longos de texto — máximo 2 linhas por parágrafo
- SEMPRE use listas com bullets (-) ou numeração
- SEMPRE separe seções com títulos (##) e linha em branco
- NÃO use tabelas markdown — use listas formatadas
- Linguagem clara, direta, sem jargão técnico
- Cada seção deve ser visualmente "respirável"

ESTRUTURA OBRIGATÓRIA DA RESPOSTA (siga exatamente nesta ordem):

## 👑 Veredicto Executivo
Resumo direto da situação em 2-3 linhas. Foco no que importa AGORA.

## 📊 Diagnóstico Atual
- **Receita:** R$ X (✅ OK / ⚠️ Atenção / 🔴 Crítico — tendência ↑↓→)
- **Margem:** **X%** (status)
- **Caixa Projetado:** **R$ X**
- **Inadimplência:** **X%**

## 🚨 Riscos Críticos
Para cada risco use este formato exato:

- ⚠️ **Risco:** descrição curta
  → **Impacto:** consequência mensurável
  → **Ação:** o que fazer

## 💰 Análise de Lucro
**Onde ganha dinheiro:**
- item 1
- item 2

**Onde perde dinheiro:**
- item 1
- item 2

## 📈 Plano de Crescimento (30 dias)

### 🎯 Metas
- Meta 1 com número claro
- Meta 2 com número claro

### ⚙️ Ações
- Ação prática e curta
- Ação prática e curta

## 🧠 Decisões Recomendadas
1. Ação objetiva
2. Ação objetiva
3. Ação objetiva

## ⚡ Prioridade do Dia (Top 3)
- 🔴 **Alta:** decisão imediata
- 🟡 **Média:** decisão da semana
- 🟢 **Baixa:** decisão do mês

PROIBIDO:
- Respostas longas sem quebra
- Texto confuso ou misturado
- Excesso de jargão técnico
- Misturar tudo em um bloco só
- Usar tabelas markdown complexas`;

  const userPayload = {
    contexto: ctx,
    kpis_calculados: { totalRevenue: kpis.totalRevenue, grossMargin: kpis.grossMargin, defaultRate: kpis.defaultRate, concentrationPct: kpis.concentrationPct, lowStockProducts: kpis.lowStockProducts, activeClients: kpis.activeClients },
    kpis_historicos_hoje: kpiRows,
    previsao_receita: forecast,
    riscos_detectados: risks,
    plano_crescimento: plan,
    decisoes_sugeridas: decisions,
  };

  let ceoAnalysis = "";
  try {
    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${lovableKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: ceoPrompt },
          { role: "user", content: `Dados executivos para análise:\n${JSON.stringify(userPayload, null, 2)}` },
        ],
      }),
    });
    if (aiResp.status === 429) {
      return new Response(JSON.stringify({ error: "Limite de requisições excedido. Aguarde alguns minutos." }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    if (aiResp.status === 402) {
      return new Response(JSON.stringify({ error: "Créditos insuficientes. Adicione créditos em Configurações > Workspace." }),
        { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    if (aiResp.ok) {
      const j = await aiResp.json();
      ceoAnalysis = j.choices?.[0]?.message?.content || "";
    }
  } catch (e) { console.error("CEO AI call failed:", e); }

  return new Response(JSON.stringify({
    ceo_analysis: ceoAnalysis,
    context: ctx,
    kpis: kpiRows,
    forecast, risks, plan, decisions,
    generated_at: new Date().toISOString(),
  }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
}

// ─── AdvancedActionEngine ───────────────────────────────────────
// Executa decisões aprovadas — registra em ai_action_logs (suggestion-first, não muta dados de negócio sem flag)
async function executeAdvancedActions(supabase: any, decisions: any[], userId?: string, autoExecute = false) {
  const results: any[] = [];
  for (const d of decisions || []) {
    let result = "";
    try {
      switch (d.type) {
        case "repor_estoque":
          result = autoExecute
            ? "Sugestão de reposição registrada para o módulo de Compras"
            : "Reposição sugerida — aguardando aprovação";
          break;
        case "promocao":
          result = autoExecute
            ? "Campanha sugerida registrada para o módulo Comercial"
            : "Promoção recomendada — aguardando aprovação";
          break;
        case "ajuste_financeiro":
          result = autoExecute
            ? "Plano de ajuste de caixa registrado para o Financeiro"
            : "Ajuste financeiro recomendado — aguardando aprovação";
          break;
        case "cobranca":
          result = autoExecute
            ? "Régua de cobrança acionada para inadimplentes"
            : "Cobrança recomendada — aguardando aprovação";
          break;
        default:
          result = `Decisão registrada: ${d.action || d.type}`;
      }
      await supabase.from("ai_action_logs").insert({
        action_type: "decision_execution",
        action_name: d.type,
        module: "executive_ai",
        context: autoExecute ? "autopilot" : "manual_approval",
        parameters: d,
        result,
        user_id: userId || null,
      });
      results.push({ ...d, result, executed_at: new Date().toISOString() });
    } catch (e) {
      console.error("executeAdvancedActions warn:", e);
      results.push({ ...d, result: "Falha ao registrar ação", error: String(e) });
    }
  }
  return results;
}

async function handleExecuteDecisions(supabase: any, body: any, corsHeaders: any, userId?: string) {
  const decisions = body?.decisions || [];
  const autoExecute = !!body?.auto_execute;
  if (!Array.isArray(decisions) || decisions.length === 0) {
    return new Response(JSON.stringify({ error: "Nenhuma decisão fornecida" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
  const results = await executeAdvancedActions(supabase, decisions, userId, autoExecute);
  return new Response(JSON.stringify({ executed: results.length, results }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } });
}

// ─── AutoPilotService ───────────────────────────────────────────
// Orquestração CRON: contexto → forecast → riscos → decisões → registro
async function handleAutoPilotRun(supabase: any, _lovableKey: string, corsHeaders: any) {
  try {
    const data = await fetchAllData(supabase);
    const kpis = computeKPIs(data);
    const ctx = buildContext(data, kpis);
    const forecast = predictRevenue(kpis.revenueByMonth || []);
    const risks = analyzeRisks(ctx, kpis);
    const decisions = suggestDecisions(ctx, forecast, risks);
    await persistKPIs(supabase, kpis, forecast);
    await recordLearning(supabase, data);

    // Auto-registra apenas decisões de prioridade média (não muta dados críticos sozinha)
    const safeDecisions = decisions.filter((d: any) => d.priority !== "alta");
    const executed = await executeAdvancedActions(supabase, safeDecisions, undefined, true);

    // Riscos críticos viram alertas executivos
    for (const r of risks.filter((x: any) => x.impacto === "alto")) {
      await supabase.from("ai_executive_alerts").insert({
        alert_type: "autopilot_risk",
        severity: "critical",
        title: r.titulo,
        description: r.detalhe,
        module: r.tipo,
        status: "active",
      });
    }

    await supabase.from("ai_action_logs").insert({
      action_type: "autopilot_cycle",
      action_name: "autopilot_run",
      module: "executive_ai",
      context: "scheduled",
      parameters: { risks_count: risks.length, decisions_count: decisions.length },
      result: `Ciclo completo: ${executed.length} ações registradas, ${risks.filter((r:any)=>r.impacto==="alto").length} alertas críticos`,
    });

    return new Response(JSON.stringify({
      ran_at: new Date().toISOString(),
      forecast, risks, decisions, executed,
      summary: `AutoPilot: ${executed.length} ações + ${risks.length} riscos analisados`,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("AutoPilot error:", e);
    return new Response(JSON.stringify({ error: "AutoPilot falhou", detail: String(e) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
}

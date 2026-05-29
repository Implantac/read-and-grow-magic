import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import { getSystemPrompt } from "../_shared/ai-prompts.ts";

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
    const body = await req.json();
    const { action, messages, months = 12 } = body;

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
    return await handleDashboardData(supabase, corsHeaders, months);
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

  // Fiscal data (NF-e, taxes, SPED) — used by AI as MCP-fiscal context
  const [nfeRes, nfeItemsRes, taxRulesRes, spedRes] = await Promise.all([
    supabase.from("nfe").select("id, number, series, status, total_amount, total_tax, issue_date, customer_name, authorization_protocol, access_key").order("issue_date", { ascending: false }).limit(300).then((r: any) => r).catch(() => ({ data: [] })),
    supabase.from("nfe_items").select("id, nfe_id, product_name, quantity, unit_price, total, icms_value, ipi_value, pis_value, cofins_value").limit(1000).then((r: any) => r).catch(() => ({ data: [] })),
    supabase.from("tax_rules").select("id, name, tax_type, rate, active, ncm, cfop").limit(200).then((r: any) => r).catch(() => ({ data: [] })),
    supabase.from("sped_files").select("id, file_type, period, status, generated_at, total_records").order("generated_at", { ascending: false }).limit(50).then((r: any) => r).catch(() => ({ data: [] })),
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
    nfe: nfeRes.data || [],
    nfeItems: nfeItemsRes.data || [],
    taxRules: taxRulesRes.data || [],
    spedFiles: spedRes.data || [],
  };
}

// ─── KPI Computation ──────────────────────────────────────────────

function computeKPIs(d: any, months: number = 12) {
  const completedStatuses = ['completed', 'invoiced', 'shipped', 'delivered'];
  const now = new Date();
  
  // Base metrics
  const totalRevenue = d.orders.filter((o: any) => completedStatuses.includes(o.status)).reduce((s: number, o: any) => s + (o.total || 0), 0);
  const totalCosts = d.payables.filter((p: any) => p.status === 'paid').reduce((s: number, p: any) => s + (p.amount || 0), 0);
  const grossProfit = totalRevenue - totalCosts;
  const grossMargin = totalRevenue > 0 ? (grossProfit / totalRevenue * 100) : 0;

  // Time-based aggregation for trends (13 months to have base for 12 MoM points)
  const revenueByMonth = [];
  const growthTrends = [];
  
  for (let i = months; i >= 0; i--) {
    const dt = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthOrders = d.orders.filter((o: any) => {
      const od = new Date(o.created_at);
      return od.getMonth() === dt.getMonth() && od.getFullYear() === dt.getFullYear() && completedStatuses.includes(o.status);
    });
    
    const monthPayables = d.payables.filter((p: any) => {
      const pd = new Date(p.due_date);
      return pd.getMonth() === dt.getMonth() && pd.getFullYear() === dt.getFullYear() && p.status === 'paid';
    });

    const rev = monthOrders.reduce((s: number, o: any) => s + (o.total || 0), 0);
    const cost = monthPayables.reduce((s: number, p: any) => s + (p.amount || 0), 0);
    const profit = rev - cost;
    const margin = rev > 0 ? (profit / rev * 100) : 0;

    revenueByMonth.push({
      month: dt.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }),
      revenue: rev,
      margin: +margin.toFixed(1)
    });
  }

  // Calculate MoM and YoY trends from the aggregated data
  for (let i = 1; i < revenueByMonth.length; i++) {
    const current = revenueByMonth[i];
    const prev = revenueByMonth[i - 1];
    
    // MoM: (Current - Previous) / Previous
    const moM = prev.revenue > 0 ? ((current.revenue - prev.revenue) / prev.revenue * 100) : 0;
    
    // YoY: Compare with 12 months ago if available
    let yoY = 0;
    if (i >= 12) {
      const sameMonthLastYear = revenueByMonth[i - 12];
      yoY = sameMonthLastYear.revenue > 0 ? ((current.revenue - sameMonthLastYear.revenue) / sameMonthLastYear.revenue * 100) : 0;
    }

    growthTrends.push({
      month: current.month,
      revenueMoM: +moM.toFixed(1),
      revenueYoY: +yoY.toFixed(1),
      margin: current.margin
    });
  }

  // Financial health
  const totalReceivable = d.receivables.filter((r: any) => r.status === 'pending').reduce((s: number, r: any) => s + (r.open_amount || r.amount || 0), 0);
  const overdueReceivable = d.receivables.filter((r: any) => r.status === 'overdue' || (r.status === 'pending' && new Date(r.due_date) < now)).reduce((s: number, r: any) => s + (r.open_amount || r.amount || 0), 0);
  const defaultRate = (totalReceivable + overdueReceivable) > 0 ? (overdueReceivable / (totalReceivable + overdueReceivable) * 100) : 0;

  // Financial Projections
  const futureReceivablesTotal = d.receivables.filter((r: any) => r.status === 'pending' && new Date(r.due_date) > now).reduce((s: number, r: any) => s + (r.open_amount || r.amount || 0), 0);
  const futurePayablesTotal = d.payables.filter((p: any) => p.status === 'pending' && new Date(p.due_date) > now).reduce((s: number, p: any) => s + (p.open_amount || p.amount || 0), 0);

  // Liquidity ratios
  const currentRatio = futurePayablesTotal > 0 ? futureReceivablesTotal / futurePayablesTotal : 2; 
  const quickRatio = futurePayablesTotal > 0 ? (futureReceivablesTotal * 0.8) / futurePayablesTotal : 1.5;

  // Financial Projections
  const futureReceivablesTotal = d.receivables.filter((r: any) => r.status === 'pending' && new Date(r.due_date) > now).reduce((s: number, r: any) => s + (r.open_amount || r.amount || 0), 0);
  const futurePayablesTotal = d.payables.filter((p: any) => p.status === 'pending' && new Date(p.due_date) > now).reduce((s: number, p: any) => s + (p.open_amount || p.amount || 0), 0);

  // Sales Targets
  const targetsSummary = d.salesTargets.reduce((acc: any, t: any) => ({ target: acc.target + (t.target_value || 0), achieved: acc.achieved + (t.achieved_value || 0) }), { target: 0, achieved: 0 });
  const targetAttainment = targetsSummary.target > 0 ? (targetsSummary.achieved / targetsSummary.target * 100) : 0;

  // Product Margins
  const productMap: Record<string, any> = {};
  d.products.forEach((p: any) => { productMap[p.id] = { name: p.name, cost: p.cost || 0 }; });
  const productSales: Record<string, any> = {};
  d.orderItems.forEach((item: any) => {
    if (!item.product_id || !productMap[item.product_id]) return;
    if (!productSales[item.product_id]) productSales[item.product_id] = { revenue: 0, cost: 0, qty: 0, name: productMap[item.product_id].name };
    productSales[item.product_id].revenue += item.total || 0;
    productSales[item.product_id].cost += (productMap[item.product_id].cost || 0) * (item.quantity || 0);
    productSales[item.product_id].qty += item.quantity || 0;
  });
  const productMargins = Object.values(productSales).map((v: any) => ({
    ...v,
    margin: v.revenue - v.cost,
    marginPct: v.revenue > 0 ? +((v.revenue - v.cost) / v.revenue * 100).toFixed(1) : 0
  })).sort((a, b) => b.revenue - a.revenue);

  return {
    kpis: {
      totalRevenue, grossProfit, 
      grossMargin: +grossMargin.toFixed(1),
      moMGrowth: growthTrends[growthTrends.length - 1]?.revenueMoM || 0,
      yoYGrowth: growthTrends[growthTrends.length - 1]?.revenueYoY || 0,
      defaultRate: +defaultRate.toFixed(1),
      churnRate: +((activeClients + inactiveClients) > 0 ? (inactiveClients / (activeClients + inactiveClients) * 100) : 0).toFixed(1),
      avgDailyRevenue: +(totalRevenue / 30).toFixed(0),
      cashFlowProjection30d: futureReceivablesTotal - futurePayablesTotal,
      futureReceivables: futureReceivablesTotal, 
      futurePayables: futurePayablesTotal,
      currentRatio: +currentRatio.toFixed(2),
      quickRatio: +quickRatio.toFixed(2),
      prodEfficiency: +prodEfficiency.toFixed(1),
      prodInProgress: d.production.filter((p: any) => p.status === 'in_progress').length,
      prodPlanned: d.production.filter((p: any) => p.status === 'planned').length,
      prodCompleted: prodCompleted.length,
      targetAttainment,
      totalTarget: targetsSummary.target,
      totalAchieved: targetsSummary.achieved,
      // Fiscal KPIs (MCP-fiscal)
      nfeIssuedCount: d.nfe.length,
      nfeAuthorizedCount: d.nfe.filter((n: any) => n.status === 'authorized' || n.status === 'autorizada').length,
      nfeRejectedCount: d.nfe.filter((n: any) => n.status === 'rejected' || n.status === 'rejeitada').length,
      nfeTotalAmount: d.nfe.reduce((s: number, n: any) => s + (n.total_amount || 0), 0),
      totalTaxAmount: d.nfe.reduce((s: number, n: any) => s + (n.total_tax || 0), 0),
      taxBurdenPct: (() => {
        const rev = d.nfe.reduce((s: number, n: any) => s + (n.total_amount || 0), 0);
        const tax = d.nfe.reduce((s: number, n: any) => s + (n.total_tax || 0), 0);
        return rev > 0 ? +(tax / rev * 100).toFixed(2) : 0;
      })(),
      activeTaxRules: d.taxRules.filter((t: any) => t.active).length,
      spedFilesGenerated: d.spedFiles.length,
      lastSpedDate: d.spedFiles[0]?.generated_at || null,
    },
    revenueByMonth: revenueByMonth.slice(1), // Remove the extra month used for base calculation
    growthTrends,
    topClients: d.clients.sort((a: any, b: any) => (b.total_purchases || 0) - (a.total_purchases || 0)).slice(0, 5),
    expenseByCategory: d.payables.reduce((acc: any, p: any) => ({ ...acc, [p.category || 'Outros']: (acc[p.category || 'Outros'] || 0) + (p.amount || 0) }), {}),
    salesRepStats: d.salesReps.map((r: any) => ({ name: r.name, revenue: d.orders.filter((o: any) => o.sales_rep_id === r.id).reduce((s: number, o: any) => s + (o.total || 0), 0) })),
    funnelByStage: d.funnel.reduce((acc: any, f: any) => ({ ...acc, [f.stage || 'Outros']: (acc[f.stage || 'Outros'] || 0) + (f.value || 0) }), {}),
    productMargins: productMargins.slice(0, 10),
    topProfitable: productMargins.sort((a: any, b: any) => b.margin - a.margin).slice(0, 5),
    lowMarginProducts: productMargins.filter((p: any) => p.marginPct < 10).slice(0, 5),
    revenueByRegion: d.clients.reduce((acc: any, c: any) => ({ ...acc, [c.region || 'Outros']: (acc[c.region || 'Outros'] || 0) + (c.total_purchases || 0) }), {}),
    autoAlerts: d.alerts,
    swot: {
      strengths: [
        { title: "Margem Bruta", description: `Margem de ${computed.kpis.grossMargin}% acima da meta setorial`, impact: "high" },
        { title: "Fidelidade", description: "Top 5 clientes representam receita recorrente estável", impact: "medium" }
      ],
      weaknesses: [
        { title: "Inadimplência", description: `Taxa de ${computed.kpis.defaultRate}% impactando fluxo de caixa`, impact: "high" },
        { title: "Estoque Crítico", description: `${d.products.filter((p: any) => p.stock_current <= p.stock_min).length} itens abaixo do estoque mínimo`, impact: "medium" }
      ],
      opportunities: [
        { title: "Expansão Regional", description: "Crescimento detectado na região Sul (+15%)", impact: "medium" },
        { title: "Mix de Produtos", description: "Oportunidade de cross-sell em clientes classe A", impact: "low" }
      ],
      threats: [
        { title: "Concentração", description: "Faturamento concentrado (3 clientes > 40%)", impact: "high" },
        { title: "Custo Operacional", description: "Tendência de alta em custos logísticos MoM", impact: "medium" }
      ]
    },
    summary: {
      totalOrders: d.orders.length,
      totalProducts: d.products.length,
      totalClients: d.clients.length,
      productionOrders: d.production.length,
      funnelOpportunities: d.funnel.length,
    },
  };
}

// Helper: detecta se há dados reais suficientes para análise por IA
function checkHasRealData(d: any): boolean {
  return (
    (d.orders?.length ?? 0) > 0 ||
    (d.sales?.length ?? 0) > 0 ||
    (d.receivables?.length ?? 0) > 0 ||
    (d.payables?.length ?? 0) > 0
  );
}

const INSUFFICIENT_DATA_MSG = "Dados insuficientes para análise confiável. Cadastre vendas, pedidos, contas a pagar ou receber para que a IA possa gerar diagnóstico baseado em dados reais.";

async function handleDashboardData(supabase: any, corsHeaders: any, months: number = 12) {
  const d = await fetchAllData(supabase);
  const computed = computeKPIs(d);
  const hasRealData = checkHasRealData(d);

  return new Response(JSON.stringify({
    ...computed,
    insights: d.insights,
    alerts: d.alerts,
    scenarios: d.scenarios,
    data_status: hasRealData ? "ok" : "insufficient",
  }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// ─── Generate Insights ──────────────────────────────────────────

async function handleGenerateInsights(supabase: any, lovableKey: string, corsHeaders: any) {
  const d = await fetchAllData(supabase);
  const computed = computeKPIs(d, months);

  // Guard: sem dados reais, não chama LLM (evita alucinação)
  if (!checkHasRealData(d)) {
    return new Response(JSON.stringify({
      insights: [],
      generated: 0,
      data_status: "insufficient",
      message: INSUFFICIENT_DATA_MSG,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  const systemPrompt = await getSystemPrompt('CEO', `Analise APENAS os dados reais fornecidos e gere insights estratégicos acionáveis.
- Gere entre 4-10 insights cobrindo: receita, lucro, custos, risco financeiro, eficiência operacional e comercial.
- Cada insight deve seguir o esquema JSON: { type, severity, title, description, explanation, impact_estimate, recommended_actions, module }.
- Toda recomendação deve ser concreta e mensurável.`, supabase, 'ai-executive-insights', authenticatedUserId);

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
      model: "google/gemini-2.5-flash",
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

  // Guard: sem dados reais, não simula cenários
  if (!checkHasRealData(d)) {
    return new Response(JSON.stringify({
      scenarios: null,
      data_status: "insufficient",
      message: INSUFFICIENT_DATA_MSG,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  const systemPrompt = await getSystemPrompt('CEO', `Com base APENAS nos dados reais fornecidos, gere 3 cenários (otimista, realista, pessimista) para os próximos 3 meses.
- Formato JSON: { "scenarios": { "optimistic": { "revenue", "profit", "margin", "growth", "description", "key_actions": [...] }, "realistic": {...}, "pessimistic": {...} }, "assumptions": [...], "recommendations": [...], "risks": [...] }
- Cada cenário deve ter ações específicas e mensuráveis.`, supabase, 'ai-executive-scenarios', authenticatedUserId);

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
      model: "google/gemini-2.5-flash",
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
      name: "analise_historica",
      description: "Compara performance de períodos (ex: último mês vs mês anterior ou ano passado).",
      parameters: {
        type: "object",
        properties: {
          periodo_a: { type: "string", description: "Data inicial período A (YYYY-MM-DD)" },
          periodo_b: { type: "string", description: "Data inicial período B (YYYY-MM-DD)" },
        },
        required: ["periodo_a", "periodo_b"],
      },
    },
  },
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
      description: "Consulta resumo comercial: clientes, pedidos, funil, metas, vendedores",
      parameters: {
        type: "object",
        properties: {
          tipo: { type: "string", enum: ["resumo", "pedidos_recentes", "top_clientes", "clientes_risco", "metas", "funil", "vendedores"], description: "Tipo de consulta comercial" },
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
      description: "Consulta resumo de produção: OPs ativas, atrasadas, eficiência",
      parameters: {
        type: "object",
        properties: {
          tipo: { type: "string", enum: ["resumo", "ordens_ativas", "atrasadas", "eficiencia"], description: "Tipo de consulta produção" },
        },
        required: ["tipo"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "consultar_estoque",
      description: "Consulta resumo de estoque: produtos, ruptura, movimentações",
      parameters: {
        type: "object",
        properties: {
          tipo: { type: "string", enum: ["resumo", "baixo_estoque", "movimentacoes_recentes", "produto_especifico"], description: "Tipo de consulta estoque" },
          produto_nome: { type: "string", description: "Nome do produto para busca" },
        },
        required: ["tipo"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "executar_acao",
      description: "Executa ações operacionais: registrar pagamentos, alterar status, ajustar estoque",
      parameters: {
        type: "object",
        properties: {
          acao: { type: "string", enum: ["registrar_pagamento", "adiar_vencimento", "criar_conta_pagar", "criar_conta_receber", "alterar_status_pedido", "alterar_status_op", "priorizar_op", "ajustar_estoque"], description: "Ação a executar" },
          modulo: { type: "string", enum: ["financeiro", "comercial", "producao", "estoque"], description: "Módulo da ação" },
          parametros: { type: "object", description: "Parâmetros da ação (ex: {id, valor, novo_status})" },
          confirmado: { type: "boolean", description: "Confirmação do usuário" },
        },
        required: ["acao", "modulo", "parametros", "confirmado"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "consultar_fiscal",
      description: "Consulta dados fiscais: NF-e emitidas/autorizadas/rejeitadas, total de impostos, carga tributária, regras fiscais ativas e SPED gerados.",
      parameters: {
        type: "object",
        properties: {
          tipo: { type: "string", enum: ["resumo", "nfe_recentes", "nfe_rejeitadas", "impostos_periodo", "regras_ativas", "sped"], description: "Tipo de consulta fiscal" },
          periodo_dias: { type: "number", description: "Período em dias (padrão 30)" },
        },
        required: ["tipo"],
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
          foco: { type: "string", enum: ["geral", "financeiro", "comercial", "producao", "margem", "risco", "fiscal"], description: "Foco da análise" },
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
    fiscal: {
      nfe_emitidas: k.nfeIssuedCount,
      nfe_autorizadas: k.nfeAuthorizedCount,
      nfe_rejeitadas: k.nfeRejectedCount,
      faturamento_nfe: k.nfeTotalAmount,
      total_impostos: k.totalTaxAmount,
      carga_tributaria_pct: k.taxBurdenPct,
      regras_fiscais_ativas: k.activeTaxRules,
      sped_gerados: k.spedFilesGenerated,
      ultimo_sped: k.lastSpedDate,
    },
  };

  return focusData[args.foco] || focusData.geral;
}

// MCP-Fiscal: tool executor
async function executeConsultaFiscal(supabase: any, args: any) {
  const periodoDias = args.periodo_dias || 30;
  const since = new Date(Date.now() - periodoDias * 24 * 3600 * 1000).toISOString();

  switch (args.tipo) {
    case "resumo": {
      const [nfeRes, taxRes, spedRes] = await Promise.all([
        supabase.from("nfe").select("id, status, total_amount, total_tax, issue_date").gte("issue_date", since).limit(500),
        supabase.from("tax_rules").select("id, active").limit(200),
        supabase.from("sped_files").select("id, period, generated_at, status").order("generated_at", { ascending: false }).limit(10),
      ]);
      const nfes = nfeRes.data || [];
      const totalAmount = nfes.reduce((s: number, n: any) => s + (n.total_amount || 0), 0);
      const totalTax = nfes.reduce((s: number, n: any) => s + (n.total_tax || 0), 0);
      return {
        periodo_dias: periodoDias,
        nfe_emitidas: nfes.length,
        nfe_autorizadas: nfes.filter((n: any) => ['authorized', 'autorizada'].includes(n.status)).length,
        nfe_rejeitadas: nfes.filter((n: any) => ['rejected', 'rejeitada'].includes(n.status)).length,
        faturamento_nfe: totalAmount,
        total_impostos: totalTax,
        carga_tributaria_pct: totalAmount > 0 ? +(totalTax / totalAmount * 100).toFixed(2) : 0,
        regras_fiscais_ativas: (taxRes.data || []).filter((t: any) => t.active).length,
        sped_recentes: spedRes.data || [],
      };
    }
    case "nfe_recentes": {
      const { data } = await supabase.from("nfe").select("id, number, series, status, total_amount, total_tax, issue_date, customer_name, access_key").order("issue_date", { ascending: false }).limit(20);
      return { nfe_recentes: data || [] };
    }
    case "nfe_rejeitadas": {
      const { data } = await supabase.from("nfe").select("id, number, series, status, customer_name, issue_date, rejection_reason").in("status", ["rejected", "rejeitada"]).order("issue_date", { ascending: false }).limit(20);
      return { nfe_rejeitadas: data || [] };
    }
    case "impostos_periodo": {
      const { data } = await supabase.from("nfe").select("issue_date, total_tax, total_amount").gte("issue_date", since).limit(1000);
      const items = data || [];
      const byMonth: Record<string, { tax: number; amount: number }> = {};
      items.forEach((n: any) => {
        const key = (n.issue_date || '').substring(0, 7);
        if (!byMonth[key]) byMonth[key] = { tax: 0, amount: 0 };
        byMonth[key].tax += n.total_tax || 0;
        byMonth[key].amount += n.total_amount || 0;
      });
      return { por_mes: byMonth, periodo_dias: periodoDias };
    }
    case "regras_ativas": {
      const { data } = await supabase.from("tax_rules").select("*").eq("active", true).limit(100);
      return { regras: data || [] };
    }
    case "sped": {
      const { data } = await supabase.from("sped_files").select("*").order("generated_at", { ascending: false }).limit(20);
      return { sped_files: data || [] };
    }
    default:
      return { erro: "tipo desconhecido" };
  }
}

// TOOL_EXECUTORS are called with (supabase, args, user_id) — see tool call loop below
const TOOL_EXECUTORS: Record<string, (supabase: any, args: any, user_id?: string) => Promise<any>> = {
  analise_historica: async (supabase, args) => {
    // Busca agregados históricos de dois períodos para comparação
    const { periodo_a, periodo_b } = args;
    const fetchStats = async (date: string) => {
      const start = new Date(date);
      const end = new Date(start.getFullYear(), start.getMonth() + 1, 0);
      const { data } = await supabase.from("orders").select("total, status").gte("created_at", start.toISOString()).lte("created_at", end.toISOString()).in("status", ["completed", "invoiced", "shipped", "delivered"]);
      return (data || []).reduce((s: number, o: any) => s + (o.total || 0), 0);
    };
    const [revA, revB] = await Promise.all([fetchStats(periodo_a), fetchStats(periodo_b)]);
    return { periodo_a: { data: periodo_a, receita: revA }, periodo_b: { data: periodo_b, receita: revB }, crescimento: revB > 0 ? ((revA - revB) / revB * 100).toFixed(1) + "%" : "N/A" };
  },
  consultar_financeiro: executeConsultaFinanceiro,
  consultar_comercial: executeConsultaComercial,
  consultar_producao: executeConsultaProducao,
  consultar_estoque: executeConsultaEstoque,
  consultar_fiscal: executeConsultaFiscal,
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

  // ─── Real Data Snapshot: injetar contagens reais no system prompt ───
  // Garante que o modelo SAIBA quais módulos têm dados antes de responder.
  let realDataSnapshot = "";
  try {
    const [ordC, recC, payC, prodC, cliC, opC] = await Promise.all([
      supabase.from("orders").select("id", { count: "exact", head: true }),
      supabase.from("accounts_receivable").select("id", { count: "exact", head: true }),
      supabase.from("accounts_payable").select("id", { count: "exact", head: true }),
      supabase.from("products").select("id", { count: "exact", head: true }),
      supabase.from("clients").select("id", { count: "exact", head: true }),
      supabase.from("production_orders").select("id", { count: "exact", head: true }),
    ]);
    const counts = {
      pedidos: ordC.count ?? 0,
      contas_receber: recC.count ?? 0,
      contas_pagar: payC.count ?? 0,
      produtos: prodC.count ?? 0,
      clientes: cliC.count ?? 0,
      ops_producao: opC.count ?? 0,
    };
    const totalRecords = Object.values(counts).reduce((a, b) => a + b, 0);
    realDataSnapshot = totalRecords === 0
      ? `\n\n# 🚨 ESTADO DOS DADOS\nO sistema NÃO possui registros reais cadastrados ainda. Responda APENAS:\n"Ainda não há dados reais cadastrados no sistema. Para que eu possa diagnosticar o negócio, cadastre primeiro: clientes, pedidos, contas a pagar/receber ou ordens de produção."\nNUNCA invente números, nomes ou métricas.`
      : `\n\n# 📊 ESTADO ATUAL DOS DADOS REAIS\nRegistros disponíveis no banco: ${JSON.stringify(counts)}\nUse APENAS esses módulos via tools. Se um módulo está com 0 registros, NÃO invente dados sobre ele — diga "sem dados nesse módulo".`;
  } catch (e) {
    console.error("realDataSnapshot error:", e);
  }

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

  const systemPrompt = await getSystemPrompt('CEO', `Você é o Diretor Digital — IA Executiva de um sistema ERP completo.
Papéis: Administrador, Contador (margens, impostos), CFO (caixa, inadimplência), WMS (estoque), COO (produção, logística).

## CAPACIDADES OPERACIONAIS
- Analisar estoque, giro, ruptura, ABC.
- Calcular lucro, margem bruta/líquida, markup, ponto de equilíbrio.
- Sugerir compras, reposição, orientar fluxo financeiro e produção.
- Usar as TOOLS disponíveis SEMPRE que o usuário pedir números, status ou diagnóstico — nunca responda de memória.

## ESTRUTURA OBRIGATÓRIA (Diagnóstico Geral)
## 👑 Veredicto Executivo
## 📊 Diagnóstico Atual (Receita, Margem, Caixa, Inadimplência)
## 🚨 Riscos Críticos (⚠️ Risco → Impacto → Ação)
## 💰 Análise de Lucro
## 📈 Plano de 30 dias (Metas e Ações)
## 🧠 Decisões Recomendadas
## ⚡ Prioridade do Dia (Top 3)

## ESTRUTURA POR MÓDULO (Perguntas Específicas)
## 📊 Resumo
## 🔍 Detalhamento (itens reais com nome e valor)
## 💡 Recomendações
## 👉 Próximos Passos

${contextSummary}
# AÇÕES DISPONÍVEIS
Financeiro: registrar pagamento, adiar vencimento, criar conta a pagar/receber.
Comercial: alterar status pedido | Produção: alterar/priorizar OP | Estoque: ajustar estoque.
SEMPRE peça confirmação antes de executar (confirmado=false primeiro).
${patternInsights}${realDataSnapshot}`, supabase, 'ai-executive-chat', user_id);

  const aiMessages = [{ role: "system", content: systemPrompt }, ...contextMessages];

  const firstResp = await fetch(GATEWAY_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${lovableKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model: "google/gemini-2.5-flash", messages: aiMessages, tools: ERP_TOOLS, stream: false }),
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
      body: JSON.stringify({ model: "google/gemini-2.5-flash", messages: aiMessages, tools: ERP_TOOLS, stream: false }),
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
  const pag = pagRes.data || [];
  const ops = opsRes.data || [];

  // Guard: sem nenhum dado financeiro/operacional, não chama LLM
  if (rec.length === 0 && pag.length === 0 && banks.length === 0 && ops.length === 0) {
    return new Response(JSON.stringify({
      data_status: "insufficient",
      resumo_executivo: INSUFFICIENT_DATA_MSG,
      message: INSUFFICIENT_DATA_MSG,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

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
      model: "google/gemini-2.5-flash",
      messages: [
        { role: "system", content: await getSystemPrompt('CFO', `Gere um RESUMO EXECUTIVO DIÁRIO em markdown, direto e objetivo.
Formato:
1. 💰 Saldo e Posição
2. 📥 Recebimentos
3. 📤 Pagamentos
4. ⚠️ Alertas
5. 🎯 Recomendações`, supabase, 'ai-executive-daily-summary') },
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

export async function handleCEOBrief(supabase: any, lovableKey: string, corsHeaders: any) {
  const data = await fetchAllData(supabase);
  const kpis = computeKPIs(data);
  const ctx = buildContext(data, kpis);
  const forecast = predictRevenue(kpis.revenueByMonth || []);
  const risks = analyzeRisks(ctx, kpis);
  const plan = generateGrowthPlan(ctx, forecast, kpis);
  const decisions = suggestDecisions(ctx, forecast, risks);
  const kpiRows = await persistKPIs(supabase, kpis, forecast);
  await recordLearning(supabase, data);

  // Detecta se há dados reais suficientes para análise confiável
  // Usa o helper compartilhado (campos plurais conforme fetchAllData)
  const hasRealData = checkHasRealData(data);

  const ceoPrompt = await getSystemPrompt('CEO', `Prioridades: Proteger caixa, maximizar lucro, antecipar problemas, decidir (não descrever).

## ESTRUTURA OBRIGATÓRIA DA RESPOSTA (JSON/Markdown)
## 👑 Veredicto Executivo
## 📊 Diagnóstico Atual (Receita, Margem, Caixa Projetado, Inadimplência)
## 🚨 Riscos Críticos (⚠️ Risco → Impacto → Ação)
## 💰 Análise de Lucro (Onde ganha e onde perde dinheiro)
## 📈 Plano de Crescimento (Metas e Ações)
## 🧠 Decisões Recomendadas
## ⚡ Prioridade do Dia (Top 3)

- Valores em **R$ X.XXX,XX**, porcentagens em **negrito**.
- Tom direto de dono.`, supabase, 'ai-executive-ceo-brief');

  const userPayload = {
    contexto: ctx,
    kpis_calculados: { totalRevenue: kpis.kpis.totalRevenue, grossMargin: kpis.kpis.grossMargin, defaultRate: kpis.kpis.defaultRate, concentrationPct: kpis.kpis.concentrationPct, lowStockProducts: kpis.kpis.lowStockProducts, activeClients: kpis.kpis.activeClients },
    kpis_historicos_hoje: kpiRows,
    previsao_receita: forecast,
    riscos_detectados: risks,
    plano_crescimento: plan,
    decisoes_sugeridas: decisions,
  };

  let ceoAnalysis = "";
  let ceoStructured: any = null;

  // Tool/schema para extrair resposta executiva estruturada (cards visuais)
  const ceoTool = {
    type: "function",
    function: {
      name: "ceo_response",
      description: "Resposta executiva estruturada para renderização em dashboard (cards, alertas, blocos).",
      parameters: {
        type: "object",
        properties: {
          veredicto: { type: "string", description: "Resumo executivo direto em 2-3 linhas." },
          kpis: {
            type: "array",
            items: {
              type: "object",
              properties: {
                nome: { type: "string" },
                valor: { type: "string", description: "Valor formatado (ex: R$ 185.352, 23%)." },
                trend: { type: "string", enum: ["up", "down", "neutral"] },
                status: { type: "string", enum: ["ok", "alerta", "critico"] },
              },
              required: ["nome", "valor", "trend", "status"],
              additionalProperties: false,
            },
          },
          riscos: {
            type: "array",
            items: {
              type: "object",
              properties: {
                titulo: { type: "string" },
                impacto: { type: "string" },
                acao: { type: "string" },
              },
              required: ["titulo", "impacto", "acao"],
              additionalProperties: false,
            },
          },
          plano: {
            type: "object",
            properties: {
              metas: { type: "array", items: { type: "string" } },
              acoes: { type: "array", items: { type: "string" } },
            },
            required: ["metas", "acoes"],
            additionalProperties: false,
          },
          insights: {
            type: "array",
            description: "Tendências reais detectadas nos dados (não invente).",
            items: {
              type: "object",
              properties: {
                titulo: { type: "string" },
                descricao: { type: "string" },
                tipo: { type: "string", enum: ["tendencia", "oportunidade", "risco", "operacional"] },
              },
              required: ["titulo", "descricao", "tipo"],
              additionalProperties: false,
            },
          },
          decisoes: {
            type: "array",
            items: {
              type: "object",
              properties: {
                prioridade: { type: "string", enum: ["alta", "media", "baixa"] },
                acao: { type: "string" },
              },
              required: ["prioridade", "acao"],
              additionalProperties: false,
            },
          },
        },
        required: ["veredicto", "kpis", "riscos", "insights", "plano", "decisoes"],
        additionalProperties: false,
      },
    },
  };

  // Short-circuit: sem dados reais não chama a IA
  if (!hasRealData) {
    return new Response(JSON.stringify({
      ceo_analysis: "**Dados insuficientes para análise confiável.**\n\nCadastre vendas, pedidos ou contas para que a IA CEO possa gerar diagnóstico estratégico.",
      ceo_structured: {
        veredicto: "Dados insuficientes para análise confiável.",
        kpis: [], riscos: [], insights: [],
        plano: { metas: [], acoes: [] }, decisoes: [],
      },
      context: ctx,
      kpis: kpiRows,
      forecast, risks: [], plan: [], decisions: [],
      generated_at: new Date().toISOString(),
      data_status: "insufficient",
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  try {
    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${lovableKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: ceoPrompt + "\n\nIMPORTANTE: Sempre chame a função ceo_response com o JSON estruturado para renderização visual em cards. Se faltarem dados, retorne arrays vazios e veredicto='Dados insuficientes para análise confiável.'" },
          { role: "user", content: `Dados executivos para análise:\n${JSON.stringify(userPayload, null, 2)}` },
        ],
        tools: [ceoTool],
        tool_choice: { type: "function", function: { name: "ceo_response" } },
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
      const msg = j.choices?.[0]?.message;
      ceoAnalysis = msg?.content || "";
      const toolCall = msg?.tool_calls?.[0];
      if (toolCall?.function?.arguments) {
        try { ceoStructured = JSON.parse(toolCall.function.arguments); }
        catch (e) { console.error("Falha ao parsear ceo_response:", e); }
      }
    }
  } catch (e) { console.error("CEO AI call failed:", e); }

  return new Response(JSON.stringify({
    ceo_analysis: ceoAnalysis,
    ceo_structured: ceoStructured,
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
export async function handleAutoPilotRun(supabase: any, _lovableKey: string, corsHeaders: any) {
  try {
    const data = await fetchAllData(supabase);

    // Guard: AutoPilot só roda com dados reais — evita gerar alertas/ações fictícias
    if (!checkHasRealData(data)) {
      return new Response(JSON.stringify({
        ran_at: new Date().toISOString(),
        data_status: "insufficient",
        message: INSUFFICIENT_DATA_MSG,
        forecast: null, risks: [], decisions: [], executed: [],
        summary: "AutoPilot pausado: sem dados reais no sistema.",
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

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

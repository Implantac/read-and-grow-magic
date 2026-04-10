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

    // Default: return current dashboard data
    return await handleDashboardData(supabase, corsHeaders);
  } catch (e) {
    console.error("ai-executive error:", e);
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

async function handleDashboardData(supabase: any, corsHeaders: any) {
  // Aggregate cross-module data in parallel
  const [
    ordersRes, receivableRes, payableRes, productsRes,
    clientsRes, productionRes, insightsRes, alertsRes, scenariosRes,
    salesRes, cashFlowRes
  ] = await Promise.all([
    supabase.from("orders").select("id, total, status, created_at, client_name, discount, subtotal").order("created_at", { ascending: false }).limit(500),
    supabase.from("accounts_receivable").select("id, amount, status, due_date, paid_amount, open_amount, client_name").limit(500),
    supabase.from("accounts_payable").select("id, amount, status, due_date, paid_amount, open_amount, supplier, category").limit(500),
    supabase.from("products").select("id, name, price, cost, stock_current, stock_min, status").limit(500),
    supabase.from("clients").select("id, name, total_purchases, last_purchase_date, status, credit_limit, current_balance, segment, region").limit(500),
    supabase.from("production_orders").select("id, status, planned_quantity, produced_quantity, created_at").limit(200),
    supabase.from("ai_executive_insights").select("*").eq("status", "active").order("created_at", { ascending: false }).limit(20),
    supabase.from("ai_executive_alerts").select("*").eq("status", "active").order("created_at", { ascending: false }).limit(10),
    supabase.from("ai_executive_scenarios").select("*").order("created_at", { ascending: false }).limit(3),
    supabase.from("sales").select("id, total, status, created_at, client_name").limit(500),
    supabase.from("cash_flow_entries").select("id, amount, type, date, category").order("date", { ascending: false }).limit(200),
  ]);

  const orders = ordersRes.data || [];
  const receivables = receivableRes.data || [];
  const payables = payableRes.data || [];
  const products = productsRes.data || [];
  const clients = clientsRes.data || [];
  const production = productionRes.data || [];
  const sales = salesRes.data || [];
  const cashFlow = cashFlowRes.data || [];

  // KPIs
  const totalRevenue = orders.filter((o: any) => ['completed', 'invoiced', 'shipped', 'delivered'].includes(o.status)).reduce((s: number, o: any) => s + (o.total || 0), 0);
  const totalCosts = payables.filter((p: any) => p.status === 'paid').reduce((s: number, p: any) => s + (p.amount || 0), 0);
  const grossProfit = totalRevenue - totalCosts;
  const grossMargin = totalRevenue > 0 ? (grossProfit / totalRevenue * 100) : 0;

  const overdueReceivable = receivables.filter((r: any) => r.status === 'overdue' || (r.status === 'pending' && new Date(r.due_date) < new Date())).reduce((s: number, r: any) => s + (r.open_amount || r.amount || 0), 0);
  const overduePayable = payables.filter((p: any) => p.status === 'overdue' || (p.status === 'pending' && new Date(p.due_date) < new Date())).reduce((s: number, p: any) => s + (p.open_amount || p.amount || 0), 0);
  const totalReceivable = receivables.filter((r: any) => r.status === 'pending').reduce((s: number, r: any) => s + (r.open_amount || r.amount || 0), 0);
  const totalPayable = payables.filter((p: any) => p.status === 'pending').reduce((s: number, p: any) => s + (p.open_amount || p.amount || 0), 0);

  const activeClients = clients.filter((c: any) => c.status === 'active').length;
  const lowStockProducts = products.filter((p: any) => p.stock_current <= p.stock_min && p.status === 'active').length;
  const defaultRate = totalReceivable > 0 ? (overdueReceivable / (totalReceivable + overdueReceivable) * 100) : 0;

  // Revenue by month (last 6 months)
  const now = new Date();
  const revenueByMonth: any[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthOrders = orders.filter((o: any) => {
      const od = new Date(o.created_at);
      return od.getMonth() === d.getMonth() && od.getFullYear() === d.getFullYear() && ['completed', 'invoiced', 'shipped', 'delivered'].includes(o.status);
    });
    revenueByMonth.push({
      month: d.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }),
      revenue: monthOrders.reduce((s: number, o: any) => s + (o.total || 0), 0),
    });
  }

  // Top clients by revenue
  const clientRevenue: Record<string, number> = {};
  orders.forEach((o: any) => {
    if (['completed', 'invoiced', 'shipped', 'delivered'].includes(o.status)) {
      clientRevenue[o.client_name] = (clientRevenue[o.client_name] || 0) + (o.total || 0);
    }
  });
  const topClients = Object.entries(clientRevenue)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, revenue]) => ({ name, revenue }));

  // Concentration risk
  const totalClientRevenue = Object.values(clientRevenue).reduce((a, b) => a + b, 0);
  const top3Revenue = topClients.slice(0, 3).reduce((s, c) => s + c.revenue, 0);
  const concentrationPct = totalClientRevenue > 0 ? (top3Revenue / totalClientRevenue * 100) : 0;

  // Expense breakdown
  const expenseByCategory: Record<string, number> = {};
  payables.forEach((p: any) => {
    expenseByCategory[p.category || 'Outros'] = (expenseByCategory[p.category || 'Outros'] || 0) + (p.amount || 0);
  });

  return new Response(JSON.stringify({
    kpis: {
      totalRevenue,
      totalCosts,
      grossProfit,
      grossMargin: +grossMargin.toFixed(1),
      overdueReceivable,
      overduePayable,
      totalReceivable,
      totalPayable,
      netPosition: totalReceivable - totalPayable,
      activeClients,
      lowStockProducts,
      defaultRate: +defaultRate.toFixed(1),
      concentrationPct: +concentrationPct.toFixed(1),
    },
    revenueByMonth,
    topClients,
    expenseByCategory,
    insights: insightsRes.data || [],
    alerts: alertsRes.data || [],
    scenarios: scenariosRes.data || [],
    summary: {
      totalOrders: orders.length,
      totalProducts: products.length,
      totalClients: clients.length,
      productionOrders: production.length,
    },
  }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function handleGenerateInsights(supabase: any, lovableKey: string, corsHeaders: any) {
  // Fetch aggregated data for AI analysis
  const dashRes = await handleDashboardData(supabase, corsHeaders);
  const dashData = await dashRes.json();

  const systemPrompt = `Você é um Diretor Executivo Digital (CEO AI) de uma empresa brasileira. Analise os dados abaixo e gere insights estratégicos acionáveis.

REGRAS:
- Responda APENAS com JSON válido
- Gere entre 3-6 insights
- Cada insight deve ter: type (revenue|profit|cost|risk|operational|commercial), severity (critical|high|medium|low), title, description, explanation, impact_estimate, recommended_actions (array de strings)
- Foque em problemas reais e ações concretas
- Use dados reais dos KPIs fornecidos
- Seja direto e objetivo`;

  const userPrompt = `DADOS DA EMPRESA:
${JSON.stringify(dashData.kpis, null, 2)}

RECEITA POR MÊS:
${JSON.stringify(dashData.revenueByMonth, null, 2)}

TOP CLIENTES:
${JSON.stringify(dashData.topClients, null, 2)}

DESPESAS POR CATEGORIA:
${JSON.stringify(dashData.expenseByCategory, null, 2)}

RESUMO:
${JSON.stringify(dashData.summary, null, 2)}

Gere insights estratégicos em formato JSON: { "insights": [...] }`;

  const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
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
      response_format: { type: "json_object" },
    }),
  });

  if (!aiResp.ok) {
    const errText = await aiResp.text();
    console.error("AI error:", aiResp.status, errText);
    return new Response(JSON.stringify({ error: "AI analysis failed", status: aiResp.status }), {
      status: aiResp.status === 429 ? 429 : aiResp.status === 402 ? 402 : 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const aiData = await aiResp.json();
  const content = aiData.choices?.[0]?.message?.content || "{}";
  let parsed: any;
  try {
    parsed = JSON.parse(content);
  } catch {
    parsed = { insights: [] };
  }

  const insights = parsed.insights || [];

  // Store insights in DB
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
      module: ins.type,
    });
  }

  return new Response(JSON.stringify({ insights, generated: insights.length }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function handleChat(messages: any[], supabase: any, lovableKey: string, corsHeaders: any) {
  // Get dashboard data for context
  const dashRes = await handleDashboardData(supabase, corsHeaders);
  const dashData = await dashRes.json();

  const systemPrompt = `Você é o CEO AI, um diretor executivo digital de uma empresa brasileira. Você tem acesso total aos dados da empresa e responde perguntas estratégicas com dados reais.

DADOS ATUAIS DA EMPRESA:
- Receita Total: R$ ${(dashData.kpis?.totalRevenue || 0).toLocaleString('pt-BR')}
- Lucro Bruto: R$ ${(dashData.kpis?.grossProfit || 0).toLocaleString('pt-BR')}
- Margem: ${dashData.kpis?.grossMargin || 0}%
- Inadimplência: R$ ${(dashData.kpis?.overdueReceivable || 0).toLocaleString('pt-BR')} (${dashData.kpis?.defaultRate || 0}%)
- A Receber: R$ ${(dashData.kpis?.totalReceivable || 0).toLocaleString('pt-BR')}
- A Pagar: R$ ${(dashData.kpis?.totalPayable || 0).toLocaleString('pt-BR')}
- Posição Líquida: R$ ${(dashData.kpis?.netPosition || 0).toLocaleString('pt-BR')}
- Clientes Ativos: ${dashData.kpis?.activeClients || 0}
- Concentração Top3: ${dashData.kpis?.concentrationPct || 0}%
- Produtos c/ Estoque Baixo: ${dashData.kpis?.lowStockProducts || 0}

TOP CLIENTES: ${JSON.stringify(dashData.topClients || [])}
RECEITA MENSAL: ${JSON.stringify(dashData.revenueByMonth || [])}

REGRAS:
- Responda em português
- Use dados reais acima
- Seja direto e estratégico
- Sugira ações concretas
- Use formatação markdown`;

  const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${lovableKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-3-flash-preview",
      messages: [
        { role: "system", content: systemPrompt },
        ...messages,
      ],
      stream: true,
    }),
  });

  if (!resp.ok) {
    if (resp.status === 429) {
      return new Response(JSON.stringify({ error: "Rate limit exceeded" }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    if (resp.status === 402) {
      return new Response(JSON.stringify({ error: "Payment required" }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    return new Response(JSON.stringify({ error: "AI error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  return new Response(resp.body, {
    headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
  });
}

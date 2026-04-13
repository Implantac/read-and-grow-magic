import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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
      description: "Executa ações no ERP como criar pedido, registrar pagamento, alterar status. SEMPRE confirmar com usuário antes.",
      parameters: {
        type: "object",
        properties: {
          modulo: { type: "string", enum: ["financeiro", "comercial", "producao", "estoque"], description: "Módulo da ação" },
          acao: { type: "string", enum: ["registrar_pagamento", "criar_conta_pagar", "criar_conta_receber", "alterar_status_pedido", "alterar_status_op"], description: "Ação a executar" },
          parametros: { type: "object", description: "Parâmetros da ação" },
          confirmado: { type: "boolean", description: "Se o usuário já confirmou a ação" },
        },
        required: ["modulo", "acao", "parametros"],
      },
    },
  },
];

// ─── Tool Execution ──────────────────────────────────────────────

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
      const rec = recRes.data || [];
      const pag = pagRes.data || [];
      const banks = bankRes.data || [];
      const saldoBancario = banks.reduce((s: number, b: any) => s + (b.balance || 0), 0);
      const totalReceber = rec.filter((r: any) => r.status === "pending").reduce((s: number, r: any) => s + (r.open_amount || r.amount || 0), 0);
      const totalPagar = pag.filter((p: any) => p.status === "pending").reduce((s: number, p: any) => s + (p.open_amount || p.amount || 0), 0);
      const atrasadosRec = rec.filter((r: any) => (r.status === "overdue" || (r.status === "pending" && r.due_date < today)));
      const atrasadosPag = pag.filter((p: any) => (p.status === "overdue" || (p.status === "pending" && p.due_date < today)));
      return {
        saldo_bancario: saldoBancario,
        contas_bancarias: banks.map((b: any) => ({ nome: b.name, saldo: b.balance })),
        total_a_receber: totalReceber,
        total_a_pagar: totalPagar,
        posicao_liquida: totalReceber - totalPagar,
        inadimplencia: { total: atrasadosRec.reduce((s: number, r: any) => s + (r.open_amount || r.amount || 0), 0), quantidade: atrasadosRec.length },
        contas_atrasadas_pagar: { total: atrasadosPag.reduce((s: number, p: any) => s + (p.open_amount || p.amount || 0), 0), quantidade: atrasadosPag.length },
      };
    }
    case "vencimentos_hoje": {
      const [recHoje, pagHoje] = await Promise.all([
        supabase.from("accounts_receivable").select("id, client_name, amount, open_amount, status").eq("due_date", today).eq("status", "pending"),
        supabase.from("accounts_payable").select("id, supplier, amount, open_amount, status, description").eq("due_date", today).eq("status", "pending"),
      ]);
      return {
        data: today,
        receber_hoje: { total: (recHoje.data || []).reduce((s: number, r: any) => s + (r.open_amount || r.amount || 0), 0), itens: recHoje.data || [] },
        pagar_hoje: { total: (pagHoje.data || []).reduce((s: number, p: any) => s + (p.open_amount || p.amount || 0), 0), itens: pagHoje.data || [] },
      };
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
    default:
      return { erro: "Tipo de consulta não reconhecido" };
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
      const clients = clRes.data || [];
      const orders = ordRes.data || [];
      const funnel = funRes.data || [];
      return {
        clientes_ativos: clients.filter((c: any) => c.status === "active").length,
        total_clientes: clients.length,
        pedidos_recentes_30d: orders.filter((o: any) => new Date(o.created_at) > new Date(Date.now() - 30 * 86400000)).length,
        valor_pipeline: funnel.filter((f: any) => f.status === "active" || !f.status).reduce((s: number, f: any) => s + (f.value || 0), 0),
        oportunidades_ativas: funnel.filter((f: any) => f.status === "active" || !f.status).length,
      };
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
      return { total_meta: totalMeta, total_atingido: totalAtingido, percentual: totalMeta > 0 ? +((totalAtingido / totalMeta) * 100).toFixed(1) : 0, detalhes: targets };
    }
    case "funil": {
      const { data } = await supabase.from("sales_funnel").select("id, client_name, stage, value, probability, status").eq("status", "active").order("value", { ascending: false }).limit(limite);
      return { oportunidades: data || [] };
    }
    default:
      return { clientes_ativos: 0 };
  }
}

async function executeConsultaProducao(supabase: any, args: any) {
  const today = new Date().toISOString().split("T")[0];
  switch (args.tipo) {
    case "resumo": {
      const { data } = await supabase.from("production_orders").select("id, status, planned_quantity, produced_quantity, due_date").limit(500);
      const ops = data || [];
      return {
        total_ordens: ops.length,
        em_producao: ops.filter((o: any) => o.status === "in_progress").length,
        planejadas: ops.filter((o: any) => o.status === "planned" || o.status === "pending").length,
        concluidas: ops.filter((o: any) => o.status === "completed").length,
        atrasadas: ops.filter((o: any) => o.due_date && o.due_date < today && !["completed", "cancelled"].includes(o.status)).length,
      };
    }
    case "ordens_ativas": {
      const { data } = await supabase.from("production_orders").select("id, order_number, product_name, status, quantity, produced_quantity, due_date, priority").in("status", ["in_progress", "planned", "pending"]).order("priority").limit(20);
      return { ordens_ativas: data || [] };
    }
    case "atrasadas": {
      const { data } = await supabase.from("production_orders").select("id, order_number, product_name, status, due_date, quantity, produced_quantity").lt("due_date", today).not("status", "in", '("completed","cancelled")').order("due_date").limit(20);
      return { ordens_atrasadas: data || [] };
    }
    case "concluidas_recentes": {
      const { data } = await supabase.from("production_orders").select("id, order_number, product_name, produced_quantity, end_date").eq("status", "completed").order("end_date", { ascending: false }).limit(10);
      return { concluidas: data || [] };
    }
    case "eficiencia": {
      const { data } = await supabase.from("production_orders").select("planned_quantity, produced_quantity").eq("status", "completed").limit(200);
      const ops = data || [];
      const planned = ops.reduce((s: number, o: any) => s + (o.planned_quantity || 0), 0);
      const produced = ops.reduce((s: number, o: any) => s + (o.produced_quantity || 0), 0);
      return { eficiencia_geral: planned > 0 ? +((produced / planned) * 100).toFixed(1) : 0, ordens_analisadas: ops.length };
    }
    default:
      return { resumo: "Dados não encontrados" };
  }
}

async function executeConsultaEstoque(supabase: any, args: any) {
  switch (args.tipo) {
    case "resumo": {
      const { data } = await supabase.from("products").select("id, stock_current, stock_min, price, cost, status").eq("status", "active").limit(500);
      const prods = data || [];
      const abaixoMin = prods.filter((p: any) => p.stock_current <= p.stock_min);
      const valorEstoque = prods.reduce((s: number, p: any) => s + ((p.stock_current || 0) * (p.cost || p.price || 0)), 0);
      return { total_produtos: prods.length, abaixo_minimo: abaixoMin.length, valor_estoque_total: +valorEstoque.toFixed(2) };
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
    default:
      return { resumo: "Dados não encontrados" };
  }
}

async function executeAcao(supabase: any, args: any) {
  if (!args.confirmado) {
    return {
      status: "aguardando_confirmacao",
      mensagem: `⚠️ Ação pendente de confirmação: ${args.acao} no módulo ${args.modulo}`,
      detalhes: args.parametros,
      instrucao: "Confirme dizendo 'sim, confirmo' para executar esta ação.",
    };
  }

  const params = args.parametros || {};

  switch (args.acao) {
    case "registrar_pagamento": {
      if (!params.id) return { erro: "ID da conta não informado" };
      const table = args.modulo === "financeiro" && params.tipo === "receber" ? "accounts_receivable" : "accounts_payable";
      const { error } = await supabase.from(table).update({
        status: "paid",
        payment_date: new Date().toISOString().split("T")[0],
        paid_amount: params.valor,
      }).eq("id", params.id);
      if (error) return { erro: error.message };
      return { status: "sucesso", mensagem: `✅ Pagamento registrado com sucesso.` };
    }
    case "alterar_status_pedido": {
      if (!params.id || !params.novo_status) return { erro: "ID e novo status são obrigatórios" };
      const { error } = await supabase.from("orders").update({ status: params.novo_status }).eq("id", params.id);
      if (error) return { erro: error.message };
      return { status: "sucesso", mensagem: `✅ Pedido atualizado para ${params.novo_status}.` };
    }
    case "alterar_status_op": {
      if (!params.id || !params.novo_status) return { erro: "ID e novo status são obrigatórios" };
      const { error } = await supabase.from("production_orders").update({ status: params.novo_status }).eq("id", params.id);
      if (error) return { erro: error.message };
      return { status: "sucesso", mensagem: `✅ Ordem de produção atualizada para ${params.novo_status}.` };
    }
    default:
      return { erro: "Ação não implementada" };
  }
}

const TOOL_EXECUTORS: Record<string, (supabase: any, args: any) => Promise<any>> = {
  consultar_financeiro: executeConsultaFinanceiro,
  consultar_comercial: executeConsultaComercial,
  consultar_producao: executeConsultaProducao,
  consultar_estoque: executeConsultaEstoque,
  executar_acao: executeAcao,
};

// ─── Chat Handler with Tool Calling ──────────────────────────────

async function handleChat(messages: any[], supabase: any, lovableKey: string, corsHeaders: any) {
  const systemPrompt = `Você é o **Assistente ERP Inteligente** da empresa — um sistema autônomo de nível executivo.

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

FORMATO DE RESPOSTA:
- Use markdown para organizar
- Tabelas quando houver múltiplos registros
- Destaque valores críticos em negrito
- Inclua recomendações proativas quando relevante

Quando o usuário fizer uma pergunta, use as tools disponíveis para buscar dados reais e responder com precisão.`;

  const aiMessages = [
    { role: "system", content: systemPrompt },
    ...messages,
  ];

  // First call — may return tool_calls
  const firstResp = await fetch(GATEWAY_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${lovableKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-3-flash-preview",
      messages: aiMessages,
      tools: ERP_TOOLS,
      stream: false,
    }),
  });

  if (!firstResp.ok) {
    const status = firstResp.status;
    const body = await firstResp.text();
    console.error("AI gateway error:", status, body);
    if (status === 429) return new Response(JSON.stringify({ error: "Rate limit excedido. Tente novamente." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    if (status === 402) return new Response(JSON.stringify({ error: "Créditos insuficientes." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    return new Response(JSON.stringify({ error: "Erro no processamento de IA" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  let result = await firstResp.json();
  let choice = result.choices?.[0];

  // Process tool calls iteratively (max 5 rounds)
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
        if (executor) {
          toolResult = await executor(supabase, args);
        } else {
          toolResult = { erro: `Função ${fn.name} não encontrada` };
        }
      } catch (e) {
        toolResult = { erro: `Erro ao executar ${fn.name}: ${e.message}` };
      }

      aiMessages.push({
        role: "tool",
        tool_call_id: toolCall.id,
        content: JSON.stringify(toolResult),
      });
    }

    // Call AI again with tool results
    const nextResp = await fetch(GATEWAY_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: aiMessages,
        tools: ERP_TOOLS,
        stream: false,
      }),
    });

    if (!nextResp.ok) {
      const body = await nextResp.text();
      console.error("AI follow-up error:", nextResp.status, body);
      break;
    }

    result = await nextResp.json();
    choice = result.choices?.[0];
  }

  const content = choice?.message?.content || "Não foi possível processar sua solicitação.";

  // Log the interaction
  try {
    await supabase.from("ai_executive_chat").insert({
      role: "assistant",
      content: content.substring(0, 5000),
      metadata: { source: "erp-assistant", tool_rounds: rounds },
    });
  } catch { /* ignore logging errors */ }

  return new Response(JSON.stringify({ content }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// ─── Daily Summary Generator ────────────────────────────────────

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

  const rec = recRes.data || [];
  const pag = pagRes.data || [];
  const banks = bankRes.data || [];
  const recebHoje = recHoje.data || [];
  const pagarHoje = pagHoje.data || [];
  const ops = opsRes.data || [];

  const saldoBancario = banks.reduce((s: number, b: any) => s + (b.balance || 0), 0);
  const totalReceberHoje = recebHoje.reduce((s: number, r: any) => s + (r.open_amount || r.amount || 0), 0);
  const totalPagarHoje = pagarHoje.reduce((s: number, p: any) => s + (p.open_amount || p.amount || 0), 0);
  const atrasadosRec = rec.filter((r: any) => (r.status === "overdue" || (r.status === "pending" && r.due_date < today)));
  const totalInadimplencia = atrasadosRec.reduce((s: number, r: any) => s + (r.open_amount || r.amount || 0), 0);
  const opsAtrasadas = ops.filter((o: any) => o.due_date && o.due_date < today);

  const summary = {
    data: today,
    saldo_bancario: saldoBancario,
    contas_bancarias: banks,
    receber_hoje: { total: totalReceberHoje, quantidade: recebHoje.length, detalhes: recebHoje.slice(0, 5) },
    pagar_hoje: { total: totalPagarHoje, quantidade: pagarHoje.length, detalhes: pagarHoje.slice(0, 5) },
    saldo_previsto: saldoBancario + totalReceberHoje - totalPagarHoje,
    inadimplencia: { total: totalInadimplencia, quantidade: atrasadosRec.length, top5: atrasadosRec.slice(0, 5) },
    producao_atrasada: opsAtrasadas.length,
  };

  // Generate AI summary
  const aiResp = await fetch(GATEWAY_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${lovableKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "google/gemini-3-flash-preview",
      messages: [
        {
          role: "system",
          content: `Você é o CFO Digital. Gere um RESUMO EXECUTIVO DIÁRIO formatado em markdown, direto e objetivo.
Use emojis para categorias. Destaque riscos em negrito. Formato:
1. 💰 Saldo e Posição do Dia
2. 📥 Recebimentos do Dia  
3. 📤 Pagamentos do Dia
4. ⚠️ Alertas e Riscos
5. 🎯 Recomendações
Valores em R$ formatados. Seja conciso e executivo.`,
        },
        { role: "user", content: `Dados financeiros de hoje (${today}):\n${JSON.stringify(summary, null, 2)}` },
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

// ─── Main Handler ────────────────────────────────────────────────

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const lovableKey = Deno.env.get("LOVABLE_API_KEY");
    if (!lovableKey) throw new Error("LOVABLE_API_KEY is not configured");

    const supabase = createClient(supabaseUrl, supabaseKey);
    const { action, messages } = await req.json();

    switch (action) {
      case "chat":
        return await handleChat(messages || [], supabase, lovableKey, corsHeaders);
      case "daily_summary":
        return await handleDailySummary(supabase, lovableKey, corsHeaders);
      default:
        return new Response(JSON.stringify({ error: "Ação inválida" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }
  } catch (e) {
    console.error("ai-erp-assistant error:", e);
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
